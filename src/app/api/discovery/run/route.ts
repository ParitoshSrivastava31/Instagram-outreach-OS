import { NextResponse } from 'next/server';
import {
  getCampaignById,
  getCampaigns,
  getMonthlyUsageStatus,
  recordRunUsage,
  saveDiscoveryRun,
  getLeadByUsername,
  upsertLead,
  getSenderAccount,
  getMessageTemplates
} from '@/lib/db';
import { getDiscoveryProvider } from '@/lib/discovery';
import { scoreInstagramProfile } from '@/lib/scorer';
import { selectBestTemplate, renderMessage } from '@/lib/messaging';
import { evaluateBudgetCheck, BUDGET_CONFIG } from '@/lib/cost-control';
import { DiscoveryRun, Lead } from '@/types';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const campaignId = body.campaignId || 'camp-creator-researchers';
    const forceMock = Boolean(body.forceMock);

    // 1. Fetch Campaign
    let campaign = await getCampaignById(campaignId);
    if (!campaign) {
      const all = await getCampaigns();
      campaign = all[0];
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'No active campaign found' }, { status: 400 });
    }

    // 2. Server-side Budget & Rate-limit Check (Cannot be bypassed by client)
    const budgetStatus = await getMonthlyUsageStatus();
    const budgetCheck = evaluateBudgetCheck(
      budgetStatus.estimated_usage_usd,
      budgetStatus.today_qualified_leads
    );

    if (!budgetCheck.canProceed) {
      return NextResponse.json(
        {
          success: false,
          error: budgetCheck.reason,
          budgetStatus: budgetCheck.status
        },
        { status: 429 }
      );
    }

    // 3. Instantiate Discovery Provider
    const provider = getDiscoveryProvider(forceMock);
    const runId = `run-${Date.now()}`;

    // Log run initiation (Never log tokens, passwords or secrets)
    console.log(`[Discovery] Initiating run with provider "${provider.name}" for campaign "${campaign.name}"`);

    // 4. Fetch Public Profiles from Provider
    const maxProfiles = Math.min(
      body.maxProfiles || campaign.max_raw_profiles || BUDGET_CONFIG.maxRawProfilesPerRun,
      BUDGET_CONFIG.maxRawProfilesPerRun
    );

    const searchQueries = campaign.keywords && campaign.keywords.length > 0
      ? campaign.keywords
      : ['content creator save this', 'content strategist hooks', 'UGC creator ideas'];

    const providerResult = await provider.searchProfiles({
      searchQueries,
      maxResults: maxProfiles,
      minFollowers: campaign.target_min_followers,
      maxFollowers: campaign.target_max_followers
    });

    const rawProfiles = providerResult.profiles;
    const providerUsage = providerResult.usage;

    // 5. Qualification, Scoring, Deduplication & Message Preparation Pipeline
    const sender = await getSenderAccount();
    const availableTemplates = await getMessageTemplates();

    let rawCount = rawProfiles.length;
    let qualifiedCount = 0;
    let rejectedCount = 0;
    let alreadyKnownCount = 0;
    let tierACount = 0;
    let tierBCount = 0;
    let tierCCount = 0;

    const qualifiedLeads: Lead[] = [];

    for (const raw of rawProfiles) {
      const username = raw.username.replace(/^@/, '').toLowerCase().trim();
      if (!username) {
        rejectedCount++;
        continue;
      }

      // Check if already in DB
      const existing = await getLeadByUsername(username);
      if (existing) {
        alreadyKnownCount++;
        // If already queued or contacted, don't overwrite
        if (existing.lead_tier !== 'Disqualified') {
          continue;
        }
      }

      // Run deterministic Lead Score model
      const scoring = scoreInstagramProfile(raw, campaign);

      if (!scoring.isQualified) {
        rejectedCount++;
        continue;
      }

      qualifiedCount++;
      if (scoring.tier === 'Tier A') tierACount++;
      else if (scoring.tier === 'Tier B') tierBCount++;
      else if (scoring.tier === 'Tier C') tierCCount++;

      // Pick deterministic personalized message template
      const tempLead: Partial<Lead> = {
        instagram_username: username,
        display_name: raw.fullName,
        followers: raw.followersCount,
        matched_roles: scoring.matchedRoles,
        matched_research: scoring.matchedResearch,
        matched_niches: scoring.matchedNiches,
        lead_tier: scoring.tier
      };

      const bestTemplate = selectBestTemplate(tempLead, availableTemplates);
      const preparedMessage = renderMessage(bestTemplate.template, tempLead, sender, sender.instagram_username || 'vault.moment');

      // Upsert lead into database/memory
      const savedLead = await upsertLead({
        instagram_username: username,
        instagram_url: `https://instagram.com/${username}`,
        display_name: raw.fullName || username,
        bio: raw.biography || '',
        followers: raw.followersCount || 0,
        following: raw.followsCount || 0,
        posts_count: raw.postsCount || 0,
        profile_image_url: raw.profilePicUrl || '',
        account_category: raw.businessCategoryName || '',
        is_verified: Boolean(raw.isVerified),
        is_private: Boolean(raw.isPrivate),
        source: provider.name,
        raw_metadata: {
          latestCaptions: raw.latestPostsCaptions || [],
          businessAccount: raw.isBusinessAccount
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

      qualifiedLeads.push(savedLead);

      // Stop once daily maximum qualified leads cap is reached
      if (qualifiedLeads.length >= BUDGET_CONFIG.maxDailyQualifiedLeads) {
        break;
      }
    }

    // 6. Record usage & run record
    const runRecord: DiscoveryRun = {
      id: runId,
      campaign_id: campaign.id,
      status: 'COMPLETED',
      raw_profiles_count: rawCount,
      qualified_count: qualifiedCount,
      rejected_count: rejectedCount,
      already_known_count: alreadyKnownCount,
      tier_a_count: tierACount,
      tier_b_count: tierBCount,
      tier_c_count: tierCCount,
      estimated_cost_usd: providerUsage.estimatedCostUsd,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    await saveDiscoveryRun(runRecord);
    await recordRunUsage(providerUsage.estimatedCostUsd, qualifiedLeads.length);

    const updatedBudget = await getMonthlyUsageStatus();

    return NextResponse.json({
      success: true,
      provider: provider.name,
      isMock: provider.isMock,
      runSummary: {
        profilesDiscovered: rawCount,
        profilesRejected: rejectedCount,
        profilesAlreadyKnown: alreadyKnownCount,
        profilesQualified: qualifiedCount,
        tierACount,
        tierBCount,
        tierCCount,
        leadsAddedToQueue: qualifiedLeads.length,
        estimatedUsageUsd: providerUsage.estimatedCostUsd,
        remainingBudgetUsd: updatedBudget.remaining_budget_usd
      },
      qualifiedLeads
    });
  } catch (error: any) {
    console.error('[Discovery] Run failed with error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
