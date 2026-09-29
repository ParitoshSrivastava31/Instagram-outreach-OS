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
    this.actorId = process.env.APIFY_ACTOR_ID || 'apify/instagram-profile-scraper';
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

    const inputPayload = {
      search: searchQueries.join(' '),
      searchType: 'user',
      resultsLimit: Math.min(maxResults, 150),
      searchLimit: Math.min(maxResults, 150),
      directUrls: searchQueries.filter(q => q.startsWith('https://instagram.com/')),
      expandStories: false,
      onlyPostsNewerThan: '60 days'
    };

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
        const username = item.username || item.ownerUsername || item.name || '';
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
            : typeof item.edge_followed_by?.count === 'number'
            ? item.edge_followed_by.count
            : parseInt(item.followers || '0', 10);

        return {
          username: username.replace(/^@/, '').toLowerCase().trim(),
          fullName: item.fullName || item.title || item.name || '',
          biography: item.biography || item.bio || item.description || '',
          followersCount: isNaN(followersCount) ? 0 : followersCount,
          followsCount: item.followsCount || item.edge_follow?.count || 0,
          postsCount: item.postsCount || item.edge_owner_to_timeline_media?.count || 0,
          profilePicUrl: item.profilePicUrl || item.profilePicUrlHD || item.profile_pic_url || '',
          isVerified: Boolean(item.isVerified || item.verified),
          isPrivate: Boolean(item.isPrivate || item.private),
          isBusinessAccount: Boolean(item.isBusinessAccount || item.is_business_account),
          businessCategoryName: item.businessCategoryName || item.category || '',
          externalUrl: item.externalUrl || item.website || '',
          latestPostsCaptions: latestCaptions,
          sourceUrl: `https://instagram.com/${username}`
        } as RawInstagramProfile;
      })
      .filter((p): p is RawInstagramProfile => p !== null);
  }
}
