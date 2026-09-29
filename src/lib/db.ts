import {
  Campaign,
  Lead,
  LeadStatus,
  MessageTemplate,
  OutreachEvent,
  SenderAccount,
  DiscoveryRun,
  MonthlyBudgetStatus
} from '@/types';
import { supabaseServer, isSupabaseConfigured } from './supabase';
import { DEFAULT_TEMPLATES } from './messaging';
import { BUDGET_CONFIG } from './cost-control';

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-creator-researchers',
    name: 'Creator Researchers',
    description: 'High-priority creator-operators who save Reels for content ideas, hooks, scripts, and research frameworks.',
    target_min_followers: 1000,
    target_max_followers: 20000,
    daily_limit: 60,
    max_raw_profiles: 150,
    keywords: [
      'content creator save this',
      'content creator content ideas',
      'content creator hooks',
      'content creator research',
      'content strategist',
      'content strategy',
      'social media manager',
      'content marketing',
      'UGC creator'
    ],
    role_keywords: ['content creator', 'content strategist', 'social media manager', 'UGC creator', 'creator educator'],
    research_keywords: ['save this', 'save this reel', 'content ideas', 'hooks', 'scripts', 'swipe file', 'research', 'framework'],
    niche_keywords: ['content marketing', 'creator economy', 'personal branding', 'social media'],
    excluded_keywords: ['meme', 'fan page', 'giveaway', 'repost', 'entertainment'],
    language: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'camp-ai-tech',
    name: 'AI / Tech Creators',
    description: 'Knowledge creators sharing generative AI workflows, ChatGPT prompts, automation, and SaaS tools.',
    target_min_followers: 1000,
    target_max_followers: 20000,
    daily_limit: 60,
    max_raw_profiles: 150,
    keywords: [
      'AI creator',
      'AI tools creator',
      'AI educator',
      'ChatGPT creator',
      'AI workflow',
      'AI automation',
      'SaaS creator',
      'startup creator',
      'technology educator'
    ],
    role_keywords: ['educator', 'creator', 'consultant', 'founder'],
    research_keywords: ['save this', 'prompts', 'tools', 'workflow', 'resources', 'templates', 'breakdown'],
    niche_keywords: ['AI', 'artificial intelligence', 'ChatGPT', 'Claude', 'automation', 'SaaS', 'technology'],
    excluded_keywords: ['crypto pump', 'meme', 'giveaway', 'bot'],
    language: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'camp-marketing-growth',
    name: 'Marketing / Growth Creators',
    description: 'Marketing strategists, copywriters, and growth operators publishing teardowns and frameworks.',
    target_min_followers: 1000,
    target_max_followers: 20000,
    daily_limit: 60,
    max_raw_profiles: 150,
    keywords: [
      'marketing creator',
      'growth marketer',
      'marketing strategist',
      'copywriter',
      'brand strategist',
      'content marketer',
      'social media strategist',
      'marketing consultant'
    ],
    role_keywords: ['marketing strategist', 'growth marketer', 'copywriter', 'brand strategist', 'consultant'],
    research_keywords: ['save this post', 'swipe file', 'breakdown', 'case study', 'examples', 'frameworks'],
    niche_keywords: ['marketing', 'growth', 'sales', 'copywriting', 'branding', 'b2b'],
    excluded_keywords: ['dropshipping store', 'casino', 'giveaway'],
    language: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'camp-founder-business',
    name: 'Founder / Business Creators',
    description: 'Startup founders and solopreneurs building in public and teaching business systems.',
    target_min_followers: 1000,
    target_max_followers: 20000,
    daily_limit: 60,
    max_raw_profiles: 150,
    keywords: [
      'startup founder',
      'founder creator',
      'entrepreneur creator',
      'solopreneur',
      'business educator',
      'business coach',
      'personal brand founder'
    ],
    role_keywords: ['founder', 'co-founder', 'solopreneur', 'entrepreneur'],
    research_keywords: ['save this', 'framework', 'lessons', 'learnings', 'systems', 'tools'],
    niche_keywords: ['startup', 'business', 'entrepreneurship', 'saas', 'productivity'],
    excluded_keywords: ['forex signals', 'crypto pump', 'meme'],
    language: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'camp-knowledge-creators',
    name: 'Knowledge Creators',
    description: 'Productivity coaches, career educators, design thinkers, and UX creators.',
    target_min_followers: 1000,
    target_max_followers: 20000,
    daily_limit: 60,
    max_raw_profiles: 150,
    keywords: [
      'productivity creator',
      'career educator',
      'design educator',
      'UX creator',
      'copywriting educator',
      'writing creator',
      'online educator'
    ],
    role_keywords: ['educator', 'designer', 'writer', 'consultant'],
    research_keywords: ['notes', 'framework', 'resources', 'templates', 'save this', 'learning'],
    niche_keywords: ['productivity', 'design', 'ux', 'writing', 'career', 'education'],
    excluded_keywords: ['meme', 'fan page', 'quotes daily'],
    language: 'en',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const DEFAULT_SENDER: SenderAccount = {
  id: 'sender-primary',
  name: 'Paritosh (Vault Founder)',
  instagram_username: 'vault.moment',
  instagram_profile_url: 'https://instagram.com/vault.moment',
  display_name: 'Paritosh',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// In-Memory Storage container for local development or until Supabase is linked
class MemoryStore {
  campaigns: Campaign[] = [...DEFAULT_CAMPAIGNS];
  leads: Lead[] = [];
  templates: MessageTemplate[] = DEFAULT_TEMPLATES.map((t, idx) => ({
    id: `tpl-${idx + 1}`,
    ...t,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  sender: SenderAccount = { ...DEFAULT_SENDER };
  events: OutreachEvent[] = [];
  runs: DiscoveryRun[] = [];
  monthlyUsageUsd: number = 0.0;
  todayQualifiedCount: number = 0;

  constructor() {
    // No mock data: starts completely empty for production use
    this.leads = [];
    this.todayQualifiedCount = 0;
  }
}

// Global singleton memory store
const memoryStore = new MemoryStore();

export async function getCampaigns(): Promise<Campaign[]> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from('campaigns').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data as Campaign[];
    } catch (e) {
      console.warn('[DB] Supabase query failed, using in-memory campaigns fallback', e);
    }
  }
  return memoryStore.campaigns;
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const all = await getCampaigns();
  return all.find(c => c.id === id) || null;
}

export async function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
  const newCamp: Campaign = {
    ...campaign,
    id: `camp-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer.from('campaigns').insert(newCamp).select().single();
      if (!error && data) return data as Campaign;
    } catch (e) {
      console.warn('[DB] Supabase insert failed, saving to memory', e);
    }
  }

  memoryStore.campaigns.unshift(newCamp);
  return newCamp;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  const now = new Date().toISOString();
  const { id: _id, created_at: _created, ...safeUpdates } = updates as any;

  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('campaigns')
        .update({ ...safeUpdates, updated_at: now })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const idx = memoryStore.campaigns.findIndex(c => c.id === id);
        if (idx !== -1) {
          memoryStore.campaigns[idx] = data as Campaign;
        }
        return data as Campaign;
      }
    } catch (e) {
      console.warn('[DB] Supabase campaign update failed, updating memory', e);
    }
  }

  const idx = memoryStore.campaigns.findIndex(c => c.id === id);
  if (idx !== -1) {
    memoryStore.campaigns[idx] = {
      ...memoryStore.campaigns[idx],
      ...safeUpdates,
      updated_at: now
    };
    return memoryStore.campaigns[idx];
  }

  return null;
}

export async function getLeads(filters?: {
  status?: LeadStatus | 'ALL';
  tier?: string;
  campaignId?: string;
  search?: string;
  minScore?: number;
  limit?: number;
}): Promise<Lead[]> {
  // Auto-unsnooze: move expired SNOOZED leads back to QUEUED
  const now = new Date().toISOString();
  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer
        .from('leads')
        .update({ status: 'QUEUED', snoozed_until: null, updated_at: now })
        .eq('status', 'SNOOZED')
        .lt('snoozed_until', now);
    } catch (e) {
      // best-effort
    }
  }
  // Also unsnooze in memory
  for (const ml of memoryStore.leads) {
    if (ml.status === 'SNOOZED' && ml.snoozed_until && ml.snoozed_until < now) {
      ml.status = 'QUEUED';
      ml.snoozed_until = null;
      ml.updated_at = now;
    }
  }

  let supabaseLeads: Lead[] = [];
  let supabaseQueried = false;

  if (isSupabaseConfigured && supabaseServer) {
    try {
      let query = supabaseServer.from('leads').select('*');
      if (filters?.status && filters.status !== 'ALL') query = query.eq('status', filters.status);
      if (filters?.tier && filters.tier !== 'ALL') query = query.eq('lead_tier', filters.tier);
      if (filters?.campaignId && filters.campaignId !== 'ALL') query = query.eq('campaign_id', filters.campaignId);
      if (filters?.minScore) query = query.gte('lead_score', filters.minScore);
      if (filters?.search) query = query.ilike('instagram_username', `%${filters.search}%`);

      const { data, error } = await query
        .order('lead_score', { ascending: false })
        .limit(filters?.limit || 100);

      if (!error && data) {
        supabaseLeads = data as Lead[];
        supabaseQueried = true;
      } else if (error) {
        console.warn('[DB] Supabase getLeads error, fallback to memory:', error.message);
      }
    } catch (e) {
      console.warn('[DB] Supabase getLeads exception, fallback to memory', e);
    }
  }

  let memResults = [...memoryStore.leads];

  if (filters?.status && filters.status !== 'ALL') {
    memResults = memResults.filter(l => l.status === filters.status);
  }
  if (filters?.tier && filters.tier !== 'ALL') {
    memResults = memResults.filter(l => l.lead_tier === filters.tier);
  }
  if (filters?.campaignId && filters.campaignId !== 'ALL') {
    memResults = memResults.filter(l => l.campaign_id === filters.campaignId);
  }
  if (filters?.minScore) {
    memResults = memResults.filter(l => l.lead_score >= filters.minScore!);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    memResults = memResults.filter(
      l =>
        l.instagram_username.toLowerCase().includes(q) ||
        (l.display_name && l.display_name.toLowerCase().includes(q)) ||
        (l.bio && l.bio.toLowerCase().includes(q))
    );
  }

  // If Supabase returned data, merge with any in-memory leads not yet in Supabase
  if (supabaseQueried && supabaseLeads.length > 0) {
    const knownHandles = new Set(supabaseLeads.map(l => l.instagram_username.toLowerCase()));
    const uncommittedMem = memResults.filter(l => !knownHandles.has(l.instagram_username.toLowerCase()));
    const combined = [...supabaseLeads, ...uncommittedMem];
    combined.sort((a, b) => b.lead_score - a.lead_score);
    return combined.slice(0, filters?.limit || 100);
  }

  // If Supabase returned 0 leads (e.g. table is empty or RLS prevented write) but memoryStore has leads,
  // return memoryStore leads so prospects are never hidden from the user
  if (memResults.length > 0) {
    memResults.sort((a, b) => b.lead_score - a.lead_score);
    return memResults.slice(0, filters?.limit || 100);
  }

  return supabaseLeads.slice(0, filters?.limit || 100);
}


export async function getLeadById(id: string): Promise<Lead | null> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer.from('leads').select('*').eq('id', id).single();
      if (data) return data as Lead;
    } catch (e) {
      // fallback
    }
  }
  return memoryStore.leads.find(l => l.id === id) || null;
}

export async function getLeadByUsername(username: string): Promise<Lead | null> {
  const clean = username.replace(/^@/, '').toLowerCase().trim();
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer.from('leads').select('*').eq('instagram_username', clean).single();
      if (data) return data as Lead;
    } catch (e) {
      // fallback
    }
  }
  return memoryStore.leads.find(l => l.instagram_username.toLowerCase() === clean) || null;
}

export async function upsertLead(lead: Partial<Lead> & { instagram_username: string }): Promise<Lead> {
  const cleanUsername = lead.instagram_username.replace(/^@/, '').toLowerCase().trim();
  const existing = await getLeadByUsername(cleanUsername);

  const now = new Date().toISOString();
  const leadData: Lead = {
    id: existing?.id || lead.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    instagram_username: cleanUsername,
    instagram_url: lead.instagram_url || `https://instagram.com/${cleanUsername}`,
    display_name: lead.display_name || existing?.display_name || '',
    bio: lead.bio || existing?.bio || '',
    followers: lead.followers ?? existing?.followers ?? 0,
    following: lead.following ?? existing?.following ?? 0,
    posts_count: lead.posts_count ?? existing?.posts_count ?? 0,
    profile_image_url: lead.profile_image_url || existing?.profile_image_url || '',
    account_category: lead.account_category || existing?.account_category || '',
    is_verified: lead.is_verified ?? existing?.is_verified ?? false,
    is_private: lead.is_private ?? existing?.is_private ?? false,
    source: lead.source || existing?.source || 'Instagram Discovery',
    raw_metadata: lead.raw_metadata || existing?.raw_metadata,
    lead_score: lead.lead_score ?? existing?.lead_score ?? 0,
    lead_tier: lead.lead_tier || existing?.lead_tier || 'Tier B',
    qualification_reason: lead.qualification_reason || existing?.qualification_reason || '',
    matched_roles: lead.matched_roles || existing?.matched_roles || [],
    matched_research: lead.matched_research || existing?.matched_research || [],
    matched_niches: lead.matched_niches || existing?.matched_niches || [],
    status: lead.status || existing?.status || 'QUEUED',
    prepared_message: lead.prepared_message || existing?.prepared_message,
    template_name: lead.template_name || existing?.template_name,
    campaign_id: lead.campaign_id || existing?.campaign_id,
    notes: lead.notes || existing?.notes,
    snoozed_until: lead.snoozed_until ?? existing?.snoozed_until ?? null,
    first_seen_at: existing?.first_seen_at || now,
    last_seen_at: now,
    contacted_at: lead.contacted_at ?? existing?.contacted_at ?? null,
    replied_at: lead.replied_at ?? existing?.replied_at ?? null,
    created_at: existing?.created_at || now,
    updated_at: now
  };

  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('leads')
        .upsert(leadData, { onConflict: 'instagram_username' })
        .select()
        .single();
      if (!error && data) {
        const idx = memoryStore.leads.findIndex(l => l.instagram_username.toLowerCase() === cleanUsername);
        if (idx >= 0) memoryStore.leads[idx] = data as Lead;
        else memoryStore.leads.unshift(data as Lead);
        return data as Lead;
      }
      if (error) {
        console.warn(`[DB] Supabase upsert error for @${cleanUsername}:`, error.message, error.code);
      }
    } catch (e) {
      console.warn('[DB] Supabase upsert exception, falling back to memory', e);
    }
  }

  const idx = memoryStore.leads.findIndex(l => l.instagram_username.toLowerCase() === cleanUsername);
  if (idx >= 0) {
    memoryStore.leads[idx] = leadData;
  } else {
    memoryStore.leads.unshift(leadData);
    memoryStore.todayQualifiedCount += 1;
  }

  return leadData;
}

export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  metadata?: Record<string, any>
): Promise<Lead | null> {
  const lead = await getLeadById(leadId);
  if (!lead) return null;

  const now = new Date().toISOString();
  const updates: Partial<Lead> = {
    status: newStatus,
    updated_at: now
  };

  if (newStatus === 'CONTACTED') {
    updates.contacted_at = now;
  } else if (newStatus === 'REPLIED') {
    updates.replied_at = now;
  }

  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('leads').update(updates).eq('id', leadId);
    } catch (e) {
      console.warn('[DB] Supabase status update error', e);
    }
  }

  const idx = memoryStore.leads.findIndex(l => l.id === leadId);
  if (idx >= 0) {
    memoryStore.leads[idx] = { ...memoryStore.leads[idx], ...updates };
  }

  await recordOutreachEvent(leadId, newStatus as any, metadata, lead.campaign_id);
  return { ...lead, ...updates };
}

export async function updateLeadNotes(leadId: string, notes: string): Promise<boolean> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('leads').update({ notes, updated_at: new Date().toISOString() }).eq('id', leadId);
    } catch (e) {
      // fallback
    }
  }
  const idx = memoryStore.leads.findIndex(l => l.id === leadId);
  if (idx >= 0) {
    memoryStore.leads[idx].notes = notes;
    memoryStore.leads[idx].updated_at = new Date().toISOString();
  }
  await recordOutreachEvent(leadId, 'NOTE_ADDED', { notes });
  return true;
}

export async function snoozeLead(leadId: string, days: number = 3): Promise<boolean> {
  const snoozeUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer
        .from('leads')
        .update({ status: 'SNOOZED', snoozed_until: snoozeUntil, updated_at: new Date().toISOString() })
        .eq('id', leadId);
    } catch (e) {
      // fallback
    }
  }
  const idx = memoryStore.leads.findIndex(l => l.id === leadId);
  if (idx >= 0) {
    memoryStore.leads[idx].status = 'SNOOZED';
    memoryStore.leads[idx].snoozed_until = snoozeUntil;
  }
  await recordOutreachEvent(leadId, 'SNOOZED', { days, snoozeUntil });
  return true;
}

export async function recordOutreachEvent(
  leadId: string,
  eventType: OutreachEvent['event_type'],
  metadata?: Record<string, any>,
  campaignId?: string
): Promise<void> {
  const event: OutreachEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    lead_id: leadId,
    campaign_id: campaignId,
    event_type: eventType,
    metadata,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('outreach_events').insert(event);
    } catch (e) {
      // fallback
    }
  }
  memoryStore.events.unshift(event);
}

export async function getOutreachEvents(leadId: string): Promise<OutreachEvent[]> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer
        .from('outreach_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (data) return data as OutreachEvent[];
    } catch (e) {
      // fallback
    }
  }
  return memoryStore.events.filter(e => e.lead_id === leadId);
}

export async function getMessageTemplates(): Promise<MessageTemplate[]> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer.from('message_templates').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) return data as MessageTemplate[];
    } catch (e) {
      // fallback
    }
  }
  return memoryStore.templates;
}

export async function getSenderAccount(): Promise<SenderAccount> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer.from('sender_accounts').select('*').limit(1).single();
      if (data) return data as SenderAccount;
    } catch (e) {
      // fallback
    }
  }
  return memoryStore.sender;
}

export async function updateSenderAccount(updates: Partial<SenderAccount>): Promise<SenderAccount> {
  const updated = {
    ...memoryStore.sender,
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('sender_accounts').upsert(updated);
    } catch (e) {
      // fallback
    }
  }

  memoryStore.sender = updated;
  return updated;
}

export async function getMonthlyUsageStatus(): Promise<MonthlyBudgetStatus> {
  const budget = BUDGET_CONFIG.monthlyBudgetUsd;
  const monthKey = getMonthKey();

  // Try to read persisted usage from Supabase first
  let persistedUsage = memoryStore.monthlyUsageUsd;
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data } = await supabaseServer
        .from('usage_tracking')
        .select('estimated_cost_usd, qualified_leads_count')
        .eq('id', monthKey)
        .single();
      if (data) {
        persistedUsage = parseFloat(data.estimated_cost_usd) || 0;
        // Sync in-memory with persisted value (highest wins to avoid under-counting)
        memoryStore.monthlyUsageUsd = Math.max(memoryStore.monthlyUsageUsd, persistedUsage);
      }
    } catch (e) {
      // First month or table empty — use in-memory
    }
  }

  const usage = memoryStore.monthlyUsageUsd;
  const remaining = Math.max(0, budget - usage);

  return {
    monthly_budget_usd: budget,
    estimated_usage_usd: parseFloat(usage.toFixed(4)),
    remaining_budget_usd: parseFloat(remaining.toFixed(4)),
    is_budget_exceeded: usage >= budget,
    days_elapsed: new Date().getDate(),
    total_qualified_leads_month: memoryStore.leads.filter(l => l.lead_tier !== 'Disqualified').length,
    today_qualified_leads: memoryStore.todayQualifiedCount,
    max_daily_qualified_leads: BUDGET_CONFIG.maxDailyQualifiedLeads
  };
}

/** Returns 'YYYY-MM' key for the current month */
function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function recordRunUsage(costUsd: number, qualifiedCount: number): Promise<void> {
  memoryStore.monthlyUsageUsd += costUsd;
  memoryStore.todayQualifiedCount += qualifiedCount;

  // Persist to Supabase so budget survives server restarts / Cloud Run cold starts
  if (isSupabaseConfigured && supabaseServer) {
    const monthKey = getMonthKey();
    try {
      // Upsert: increment existing row or create new one
      const { data: existing } = await supabaseServer
        .from('usage_tracking')
        .select('estimated_cost_usd, qualified_leads_count')
        .eq('id', monthKey)
        .single();

      if (existing) {
        const newCost = parseFloat(existing.estimated_cost_usd) + costUsd;
        const newCount = (existing.qualified_leads_count || 0) + qualifiedCount;
        await supabaseServer
          .from('usage_tracking')
          .update({
            estimated_cost_usd: parseFloat(newCost.toFixed(4)),
            qualified_leads_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', monthKey);
      } else {
        await supabaseServer
          .from('usage_tracking')
          .insert({
            id: monthKey,
            month_str: monthKey,
            estimated_cost_usd: parseFloat(costUsd.toFixed(4)),
            budget_limit_usd: BUDGET_CONFIG.monthlyBudgetUsd,
            qualified_leads_count: qualifiedCount,
            updated_at: new Date().toISOString()
          });
      }
    } catch (e) {
      console.warn('[DB] Failed to persist usage to Supabase:', e);
    }
  }
}

export async function getDiscoveryRuns(): Promise<DiscoveryRun[]> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('discovery_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      if (!error && data && data.length > 0) return data as DiscoveryRun[];
    } catch (e) {
      console.warn('[DB] Supabase getDiscoveryRuns error', e);
    }
  }
  return memoryStore.runs;
}

export async function saveDiscoveryRun(run: DiscoveryRun): Promise<void> {
  if (isSupabaseConfigured && supabaseServer) {
    try {
      await supabaseServer.from('discovery_runs').insert(run);
    } catch (e) {
      console.warn('[DB] Supabase saveDiscoveryRun error', e);
    }
  }
  memoryStore.runs.unshift(run);
}

export async function getAnalyticsSummary(): Promise<{
  leadsDiscovered: number;
  qualifiedLeads: number;
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
  messagesSent: number;
  replies: number;
  responseRatePercent: number;
  usedVaultCount: number;
  secondReelCount: number;
  paidCount: number;
  skipped: number;
  snoozed: number;
  repliesByNiche: { niche: string; count: number }[];
  repliesByTemplate: { templateName: string; count: number }[];
  avgScoreReplied: number;
}> {
  const allLeads = await getLeads({ status: 'ALL', limit: 10000 });

  const qualified = allLeads.filter(l => l.lead_tier !== 'Disqualified');
  const tierA = allLeads.filter(l => l.lead_tier === 'Tier A').length;
  const tierB = allLeads.filter(l => l.lead_tier === 'Tier B').length;
  const tierC = allLeads.filter(l => l.lead_tier === 'Tier C').length;

  const sent = allLeads.filter(
    l => ['CONTACTED', 'REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)
  ).length;

  const replied = allLeads.filter(
    l => ['REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)
  );

  const usedVault = allLeads.filter(l => ['USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)).length;
  const secondReel = allLeads.filter(l => ['SENT_SECOND_REEL', 'PAID'].includes(l.status)).length;
  const paid = allLeads.filter(l => l.status === 'PAID').length;

  const skipped = allLeads.filter(l => l.status === 'SKIPPED').length;
  const snoozed = allLeads.filter(l => l.status === 'SNOOZED').length;

  const responseRate = sent > 0 ? (replied.length / sent) * 100 : 0;

  // Niche breakdown
  const nicheMap: Record<string, number> = {};
  for (const r of replied) {
    const n = r.matched_niches?.[0] || 'general';
    nicheMap[n] = (nicheMap[n] || 0) + 1;
  }
  const repliesByNiche = Object.entries(nicheMap).map(([niche, count]) => ({ niche, count }));

  // Real template breakdown from lead data
  const templateMap: Record<string, number> = {};
  for (const r of replied) {
    const tplName = r.template_name || 'Unknown template';
    templateMap[tplName] = (templateMap[tplName] || 0) + 1;
  }
  const repliesByTemplate = Object.entries(templateMap).map(([templateName, count]) => ({ templateName, count }));

  // Score of replied leads
  const avgScoreReplied =
    replied.length > 0
      ? Math.round(replied.reduce((acc, l) => acc + (l.lead_score || 0), 0) / replied.length)
      : 0;

  return {
    leadsDiscovered: allLeads.length,
    qualifiedLeads: qualified.length,
    tierACount: tierA,
    tierBCount: tierB,
    tierCCount: tierC,
    messagesSent: sent,
    replies: replied.length,
    responseRatePercent: parseFloat(responseRate.toFixed(1)),
    usedVaultCount: usedVault,
    secondReelCount: secondReel,
    paidCount: paid,
    skipped,
    snoozed,
    repliesByNiche: repliesByNiche.length > 0 ? repliesByNiche : [],
    repliesByTemplate: repliesByTemplate.length > 0 ? repliesByTemplate : [],
    avgScoreReplied
  };
}
