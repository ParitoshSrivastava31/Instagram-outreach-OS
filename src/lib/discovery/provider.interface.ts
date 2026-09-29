import { RawInstagramProfile } from '@/types';

export interface DiscoverySearchOptions {
  searchQueries: string[];
  maxResults: number;
  minFollowers?: number;
  maxFollowers?: number;
}

export interface ProviderUsage {
  computeUnits: number;
  estimatedCostUsd: number;
  providerRunId?: string;
}

export interface InstagramDiscoveryProvider {
  id: string;
  name: string;
  isMock: boolean;
  searchProfiles(options: DiscoverySearchOptions): Promise<{
    profiles: RawInstagramProfile[];
    usage: ProviderUsage;
  }>;
  getProfile(username: string): Promise<RawInstagramProfile | null>;
  getRunUsage(providerRunId: string): Promise<ProviderUsage>;
}
