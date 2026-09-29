import { RawInstagramProfile } from '@/types';
import { DiscoverySearchOptions, InstagramDiscoveryProvider, ProviderUsage } from './provider.interface';
import { estimateRunCost } from '../cost-control';

export class ApifyInstagramProvider implements InstagramDiscoveryProvider {
  id = 'apify';
  name = 'Apify Instagram Discovery Provider';
  isMock = false;

  private apiToken: string;
  private actorId: string;

  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN || '';
    this.actorId = process.env.APIFY_ACTOR_ID || 'apify/instagram-scraper';
  }

  async searchProfiles(options: DiscoverySearchOptions): Promise<{
    profiles: RawInstagramProfile[];
    usage: ProviderUsage;
  }> {
    if (!this.apiToken) {
      throw new Error(
        'APIFY_API_TOKEN is missing. Please provide your token in environment variables or switch to Sandbox mode.'
      );
    }

    const { searchQueries, maxResults } = options;

    // Trigger Apify actor run via standard Apify REST API
    // Using https://api.apify.com/v2/acts/{actorId}/runs
    const encodedActorId = encodeURIComponent(this.actorId);
    const startUrl = `https://api.apify.com/v2/acts/${encodedActorId}/runs?token=${this.apiToken}&waitForFinish=120`;

    const isProfileActor = this.actorId.includes('profile-scraper');

    // Extract potential usernames or profile URLs from queries
    const extractedUsernames = searchQueries
      .map(q => q.trim())
      .map(q => q.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '').split('/')[0].split('?')[0])
      .filter(q => q.length > 0 && !q.includes(' '));

    const inputPayload: Record<string, any> = {
      resultsLimit: Math.min(maxResults, 150),
      searchLimit: Math.min(maxResults, 150),
      expandStories: false,
    };

    if (isProfileActor) {
      // Profile scraper strictly requires 'usernames'
      inputPayload.usernames = extractedUsernames.length > 0 ? extractedUsernames : ['vault.moment'];
    } else {
      // General instagram-scraper handles keyword search
      // Clean and pass the top 2-3 concise search keywords (comma-separated), not a 25-word run-on sentence
      const conciseQueries = searchQueries
        .slice(0, 3)
        .map(q => q.replace(/save this|save this reel|for later/gi, '').trim())
        .filter(q => q.length > 2);

      const searchTerm = conciseQueries.length > 0 ? conciseQueries.join(', ') : 'content creator';
      inputPayload.search = searchTerm;
      inputPayload.searchType = 'user';
      // Note: Do not pass resultsType: 'details' as that requires direct URLs and breaks keyword search
      if (extractedUsernames.length > 0) {
        inputPayload.usernames = extractedUsernames;
      }
    }

    let runData: any;
    try {
      const response = await fetch(startUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inputPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Apify run failed (HTTP ${response.status}): ${errorText}`);
      }

      runData = await response.json();
    } catch (err: any) {
      console.error('[ApifyProvider] Network or API error:', err.message);
      throw new Error(`Failed to execute Apify Instagram Actor: ${err.message}`);
    }

    const runId = runData?.data?.id;
    const defaultDatasetId = runData?.data?.defaultDatasetId;

    if (!defaultDatasetId) {
      throw new Error(`Apify did not return a dataset ID. Run status: ${runData?.data?.status}`);
    }

    // Fetch dataset items
    const datasetUrl = `https://api.apify.com/v2/datasets/${defaultDatasetId}/items?token=${this.apiToken}&limit=${maxResults}`;
    const datasetRes = await fetch(datasetUrl);
    if (!datasetRes.ok) {
      throw new Error(`Failed to fetch Apify dataset items (HTTP ${datasetRes.status})`);
    }

    const rawItems = await datasetRes.json();
    const profiles = this.normalizeApifyItems(rawItems);

    const computeUnits = runData?.data?.stats?.computeUnits || (profiles.length * 0.0001);
    const estimatedCostUsd = estimateRunCost(profiles.length);

    return {
      profiles,
      usage: {
        computeUnits,
        estimatedCostUsd,
        providerRunId: runId
      }
    };
  }

  async getProfile(username: string): Promise<RawInstagramProfile | null> {
    const searchRes = await this.searchProfiles({
      searchQueries: [`https://instagram.com/${username}`],
      maxResults: 1
    });
    return searchRes.profiles[0] || null;
  }

  async getRunUsage(providerRunId: string): Promise<ProviderUsage> {
    if (!this.apiToken || !providerRunId) {
      return { computeUnits: 0, estimatedCostUsd: 0 };
    }

    try {
      const res = await fetch(`https://api.apify.com/v2/actor-runs/${providerRunId}?token=${this.apiToken}`);
      if (res.ok) {
        const data = await res.json();
        const computeUnits = data?.data?.stats?.computeUnits || 0;
        return {
          computeUnits,
          estimatedCostUsd: parseFloat((computeUnits * 0.25).toFixed(4)), // Apify standard compute rate ~$0.25/CU
          providerRunId
        };
      }
    } catch (e) {
      // Fallback
    }

    return { computeUnits: 0, estimatedCostUsd: 0, providerRunId };
  }

  /**
   * Normalizes disparate fields from varying Apify Instagram actors into unified RawInstagramProfile
   */
  private normalizeApifyItems(items: any[]): RawInstagramProfile[] {
    if (!Array.isArray(items)) return [];

    return items
      .map(item => {
        const username =
          item.username ||
          item.ownerUsername ||
          item.user?.username ||
          (typeof item.name === 'string' && !item.name.includes(' ') ? item.name : '') ||
          '';
        if (!username) return null;

        const latestCaptions: string[] = [];
        if (Array.isArray(item.latestPosts)) {
          for (const post of item.latestPosts) {
            if (post.caption) latestCaptions.push(post.caption);
          }
        } else if (Array.isArray(item.posts)) {
          for (const post of item.posts) {
            if (post.caption) latestCaptions.push(post.caption);
          }
        }

        const followersCount =
          typeof item.followersCount === 'number'
            ? item.followersCount
            : typeof item.followerCount === 'number'
            ? item.followerCount
            : typeof item.followers === 'number'
            ? item.followers
            : typeof item.edge_followed_by?.count === 'number'
            ? item.edge_followed_by.count
            : typeof item.user?.follower_count === 'number'
            ? item.user.follower_count
            : parseInt(item.followers || item.followerCount || '0', 10);

        return {
          username: username.replace(/^@/, '').toLowerCase().trim(),
          fullName: item.fullName || item.displayName || item.title || item.user?.full_name || item.name || '',
          biography: item.biography || item.bio || item.description || item.user?.biography || '',
          followersCount: isNaN(followersCount) ? 0 : followersCount,
          followsCount: item.followsCount || item.followingCount || item.edge_follow?.count || 0,
          postsCount: item.postsCount || item.mediaCount || item.edge_owner_to_timeline_media?.count || 0,
          profilePicUrl: item.profilePicUrl || item.profilePicUrlHD || item.profile_pic_url || item.user?.profile_pic_url || '',
          isVerified: Boolean(item.isVerified || item.verified || item.user?.is_verified),
          isPrivate: Boolean(item.isPrivate || item.private || item.user?.is_private),
          isBusinessAccount: Boolean(item.isBusinessAccount || item.is_business_account || item.isBusiness),
          businessCategoryName: item.businessCategoryName || item.category || '',
          externalUrl: item.externalUrl || item.website || '',
          latestPostsCaptions: latestCaptions,
          sourceUrl: `https://instagram.com/${username}`
        } as RawInstagramProfile;
      })
      .filter((p): p is RawInstagramProfile => p !== null);
  }
}
