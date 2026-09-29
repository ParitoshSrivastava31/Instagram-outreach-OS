import { NextResponse } from 'next/server';
import {
  getCampaignById,
  getCampaigns,
  getMonthlyUsageStatus,
  recordRunUsage,
  saveDiscoveryRun,
  upsertLead,
  getSenderAccount,
  getMessageTemplates
} from '@/lib/db';
import { scoreInstagramProfile } from '@/lib/scorer';
import { selectBestTemplate, renderMessage } from '@/lib/messaging';
import { DiscoveryRun, Lead, RawInstagramProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const datasetId = body.datasetId || 'fTD2Mylgg28Tz1dTP';
    const campaignId = body.campaignId || 'camp-creator-researchers';
    const token = process.env.APIFY_API_TOKEN || '';

    let campaign = await getCampaignById(campaignId);
    if (!campaign) {
      const all = await getCampaigns();
      campaign = all[0];
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'No active campaign found' }, { status: 400 });
    }

    // Fetch items from Apify dataset
    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=1000`;
    const res = await fetch(datasetUrl);
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch dataset from Apify (HTTP ${res.status})` },
        { status: 500 }
      );
    }

    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items found in dataset' }, { status: 404 });
    }

    // Deduplicate and aggregate creators
    const creatorsMap = new Map<string, RawInstagramProfile>();

    for (const item of items) {
      const username = (
        item.ownerUsername ||
        item.username ||
        item.user?.username ||
        item.threadsNetProfile?.username ||
        ''
      )
        .replace(/^@/, '')
        .toLowerCase()
        .trim();

      if (!username || username === 'undefined' || username.length < 2) continue;

      const latestCaptions: string[] = [];
      if (item.caption) latestCaptions.push(item.caption);
      if (Array.isArray(item.latestPosts)) {
        for (const p of item.latestPosts) {
          if (p.caption && !latestCaptions.includes(p.caption)) latestCaptions.push(p.caption);
        }
      }

      const rawBio =
        item.biography ||
        item.bio ||
        item.threadsNetProfile?.biography ||
        item.description ||
        item.user?.biography ||
        '';

      const followersCount =
        typeof item.followersCount === 'number' && item.followersCount > 0
          ? item.followersCount
          : typeof item.followerCount === 'number' && item.followerCount > 0
          ? item.followerCount
          : typeof item.followers === 'number' && item.followers > 0
          ? item.followers
          : typeof item.edge_followed_by?.count === 'number' && item.edge_followed_by.count > 0
          ? item.edge_followed_by.count
          : typeof item.threadsNetProfile?.follower_count === 'number' && item.threadsNetProfile.follower_count > 0
          ? item.threadsNetProfile.follower_count
          : 0;

      const fullName =
        item.fullName ||
        item.displayName ||
        item.title ||
        item.ownerFullName ||
        item.threadsNetProfile?.full_name ||
        item.name ||
        username;

      if (!creatorsMap.has(username)) {
        creatorsMap.set(username, {
          username,
          fullName,
          biography: rawBio || (latestCaptions.length > 0 ? latestCaptions[0].slice(0, 300) : ''),
          followersCount,
          followsCount: item.followsCount || item.followingCount || 0,
          postsCount: item.postsCount || (item.caption ? 1 : 0),
          profilePicUrl: item.profilePicUrl || item.profilePicUrlHD || item.threadsNetProfile?.profile_pic_url || '',
          isVerified: Boolean(item.isVerified || item.verified),
          isPrivate: Boolean(item.private || item.isPrivate),
          isBusinessAccount: Boolean(item.isBusinessAccount || item.isBusiness),
          businessCategoryName: item.businessCategoryName || item.category || '',
          externalUrl: item.externalUrl || '',
          latestPostsCaptions: latestCaptions,
          sourceUrl: `https://instagram.com/${username}`
        });
      } else {
        const existing = creatorsMap.get(username)!;
        if (latestCaptions.length > 0) {
          for (const cap of latestCaptions) {
            if (!existing.latestPostsCaptions?.includes(cap)) {
              existing.latestPostsCaptions?.push(cap);
            }
          }
          if ((existing.biography?.length || 0) < 120 && latestCaptions[0]) {
            existing.biography = ((existing.biography || '') + ' ' + latestCaptions[0]).trim().slice(0, 500);
          }
        }
        if ((!existing.fullName || existing.fullName === username) && fullName && fullName !== username) {
          existing.fullName = fullName;
        }
        if (followersCount > 0 && existing.followersCount === 0) {
          existing.followersCount = followersCount;
        }
      }
    }

    const sender = await getSenderAccount();
    const availableTemplates = await getMessageTemplates();

    let rawCount = creatorsMap.size;
    let qualifiedCount = 0;
    let rejectedCount = 0;
    let tierACount = 0;
    let tierBCount = 0;
    let tierCCount = 0;

    const savedLeads: Lead[] = [];

    for (const [_, profile] of creatorsMap) {
      const scoring = scoreInstagramProfile(profile, campaign);

      if (!scoring.isQualified) {
        rejectedCount++;
        continue;
      }

      qualifiedCount++;
      if (scoring.tier === 'Tier A') tierACount++;
      else if (scoring.tier === 'Tier B') tierBCount++;
      else if (scoring.tier === 'Tier C') tierCCount++;

      const tempLead: Partial<Lead> = {
        instagram_username: profile.username,
        display_name: profile.fullName,
        followers: profile.followersCount || 2500,
        matched_roles: scoring.matchedRoles,
        matched_research: scoring.matchedResearch,
        matched_niches: scoring.matchedNiches,
        lead_tier: scoring.tier
      };

      const bestTemplate = selectBestTemplate(tempLead, availableTemplates);
      const preparedMessage = renderMessage(bestTemplate.template, tempLead, sender, sender.instagram_username || 'vault.moment');

      const savedLead = await upsertLead({
        instagram_username: profile.username,
        instagram_url: `https://instagram.com/${profile.username}`,
        display_name: profile.fullName || profile.username,
        bio: profile.biography || '',
        followers: profile.followersCount || 2500,
        following: profile.followsCount || 0,
        posts_count: profile.postsCount || (profile.latestPostsCaptions?.length || 0),
        profile_image_url: profile.profilePicUrl || '',
        account_category: profile.businessCategoryName || '',
        is_verified: profile.isVerified,
        is_private: profile.isPrivate,
        source: 'Apify Dataset Recovery (Run 6IDjvUetTAUrUEVwZ)',
        raw_metadata: {
          recoveredFromDataset: datasetId,
          latestCaptions: profile.latestPostsCaptions || [],
          businessAccount: profile.isBusinessAccount
        },
        lead_score: scoring.score,
        lead_tier: scoring.tier,
        qualification_reason: scoring.qualificationReason,
        matched_roles: scoring.matchedRoles,
        matched_research: scoring.matchedResearch,
        matched_niches: scoring.matchedNiches,
        status: 'QUEUED',
        prepared_message: preparedMessage,
        campaign_id: campaign.id
      });

      savedLeads.push(savedLead);

      if (savedLeads.length >= 60) {
        // Daily cap of 60 leads
        break;
      }
    }

    // Save discovery run record
    const runRecord: DiscoveryRun = {
      id: `run-recovery-${Date.now()}`,
      campaign_id: campaign.id,
      status: 'COMPLETED',
      raw_profiles_count: rawCount,
      qualified_count: qualifiedCount,
      rejected_count: rejectedCount,
      already_known_count: 0,
      tier_a_count: tierACount,
      tier_b_count: tierBCount,
      tier_c_count: tierCCount,
      estimated_cost_usd: 0.0, // Already accounted for in Apify usage
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    await saveDiscoveryRun(runRecord);
    await recordRunUsage(0.0, savedLeads.length);
    const updatedBudget = await getMonthlyUsageStatus();

    return NextResponse.json({
      success: true,
      recoveredCount: savedLeads.length,
      runSummary: {
        profilesDiscovered: rawCount,
        profilesRejected: rejectedCount,
        profilesQualified: qualifiedCount,
        tierACount,
        tierBCount,
        tierCCount,
        leadsAddedToQueue: savedLeads.length,
        estimatedUsageUsd: 0.0,
        remainingBudgetUsd: updatedBudget.remaining_budget_usd
      },
      leads: savedLeads
    });
  } catch (err: any) {
    console.error('[Recovery] Failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
