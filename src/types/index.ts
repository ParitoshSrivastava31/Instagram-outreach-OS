export type LeadTier = 'Tier A' | 'Tier B' | 'Tier C' | 'Disqualified';

export type LeadStatus =
  | 'QUEUED'
  | 'OPENED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'USED_VAULT'
  | 'SENT_SECOND_REEL'
  | 'PAID'
  | 'SKIPPED'
  | 'SNOOZED';

export type OutreachEventType =
  | 'DISCOVERED'
  | 'QUALIFIED'
  | 'FILTERED'
  | 'QUEUED'
  | 'OPENED'
  | 'MESSAGE_COPIED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'INTERESTED'
  | 'USED_VAULT'
  | 'SENT_SECOND_REEL'
  | 'PAID'
  | 'SKIPPED'
  | 'SNOOZED'
  | 'NOTE_ADDED';

export interface Lead {
  id: string;
  instagram_username: string;
  instagram_url: string;
  display_name: string;
  bio: string;
  followers: number;
  following: number;
  posts_count: number;
  profile_image_url: string;
  account_category: string;
  is_verified: boolean;
  is_private: boolean;
  source: string;
  raw_metadata?: Record<string, any>;
  lead_score: number;
  lead_tier: LeadTier;
  qualification_reason: string;
  matched_roles: string[];
  matched_research: string[];
  matched_niches: string[];
  status: LeadStatus;
  prepared_message?: string;
  template_name?: string;
  campaign_id?: string;
  notes?: string;
  snoozed_until?: string | null;
  first_seen_at: string;
  last_seen_at: string;
  contacted_at?: string | null;
  replied_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  target_min_followers: number;
  target_max_followers: number;
  daily_limit: number;
  max_raw_profiles: number;
  keywords: string[];
  role_keywords: string[];
  research_keywords: string[];
  niche_keywords: string[];
  excluded_keywords: string[];
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  niche?: string;
  target_tier?: LeadTier;
  template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SenderAccount {
  id: string;
  name: string;
  instagram_username: string;
  instagram_profile_url: string;
  display_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutreachEvent {
  id: string;
  lead_id: string;
  campaign_id?: string;
  event_type: OutreachEventType;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DiscoveryRun {
  id: string;
  campaign_id: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BUDGET_EXCEEDED';
  raw_profiles_count: number;
  qualified_count: number;
  rejected_count: number;
  already_known_count: number;
  tier_a_count: number;
  tier_b_count: number;
  tier_c_count: number;
  estimated_cost_usd: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface MonthlyBudgetStatus {
  monthly_budget_usd: number;
  estimated_usage_usd: number;
  remaining_budget_usd: number;
  is_budget_exceeded: boolean;
  days_elapsed: number;
  total_qualified_leads_month: number;
  today_qualified_leads: number;
  max_daily_qualified_leads: number;
}

export interface RawInstagramProfile {
  username: string;
  fullName?: string;
  biography?: string;
  followersCount: number;
  followsCount?: number;
  postsCount?: number;
  profilePicUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  isBusinessAccount?: boolean;
  businessCategoryName?: string;
  externalUrl?: string;
  latestPostsCaptions?: string[];
  latestPostTimestamp?: string;
  sourceUrl?: string;
}
