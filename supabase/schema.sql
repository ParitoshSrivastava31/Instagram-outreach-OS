-- ==============================================================================
-- Instagram Outreach OS - Production Database Schema & RLS Policies
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY DEFAULT ('camp-' || substr(md5(random()::text), 1, 12)),
  name TEXT NOT NULL,
  description TEXT,
  target_min_followers INTEGER NOT NULL DEFAULT 1000,
  target_max_followers INTEGER NOT NULL DEFAULT 20000,
  daily_limit INTEGER NOT NULL DEFAULT 60,
  max_raw_profiles INTEGER NOT NULL DEFAULT 150,
  keywords TEXT[] DEFAULT '{}',
  role_keywords TEXT[] DEFAULT '{}',
  research_keywords TEXT[] DEFAULT '{}',
  niche_keywords TEXT[] DEFAULT '{}',
  excluded_keywords TEXT[] DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'en',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT ('lead-' || substr(md5(random()::text), 1, 12)),
  instagram_username TEXT UNIQUE NOT NULL,
  instagram_url TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  followers INTEGER NOT NULL DEFAULT 0,
  following INTEGER NOT NULL DEFAULT 0,
  posts_count INTEGER NOT NULL DEFAULT 0,
  profile_image_url TEXT,
  account_category TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  source TEXT DEFAULT 'Instagram Discovery',
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  lead_score INTEGER NOT NULL DEFAULT 0,
  lead_tier TEXT NOT NULL DEFAULT 'Tier B', -- 'Tier A', 'Tier B', 'Tier C', 'Disqualified'
  qualification_reason TEXT,
  matched_roles TEXT[] DEFAULT '{}',
  matched_research TEXT[] DEFAULT '{}',
  matched_niches TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'OPENED', 'CONTACTED', 'REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID', 'SKIPPED', 'SNOOZED'
  prepared_message TEXT,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  notes TEXT,
  snoozed_until TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  contacted_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Campaign Leads Junction Table
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  message_template_id TEXT,
  prepared_message TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  opened_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_campaign_lead UNIQUE (campaign_id, lead_id)
);

-- 5. Message Templates Table
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY DEFAULT ('tpl-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  niche TEXT DEFAULT 'general',
  target_tier TEXT DEFAULT 'Tier A',
  template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Sender Accounts Table (NEVER store passwords or session cookies)
CREATE TABLE IF NOT EXISTS sender_accounts (
  id TEXT PRIMARY KEY DEFAULT ('sender-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  instagram_profile_url TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Outreach Events Log
CREATE TABLE IF NOT EXISTS outreach_events (
  id TEXT PRIMARY KEY DEFAULT ('ev-' || substr(md5(random()::text), 1, 10)),
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- DISCOVERED, QUALIFIED, FILTERED, QUEUED, OPENED, MESSAGE_COPIED, CONTACTED, REPLIED, INTERESTED, USED_VAULT, SENT_SECOND_REEL, PAID, SKIPPED, SNOOZED, NOTE_ADDED
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Discovery Runs Log & Cost Accounting
CREATE TABLE IF NOT EXISTS discovery_runs (
  id TEXT PRIMARY KEY DEFAULT ('run-' || substr(md5(random()::text), 1, 10)),
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  raw_profiles_count INTEGER NOT NULL DEFAULT 0,
  qualified_count INTEGER NOT NULL DEFAULT 0,
  rejected_count INTEGER NOT NULL DEFAULT 0,
  already_known_count INTEGER NOT NULL DEFAULT 0,
  tier_a_count INTEGER NOT NULL DEFAULT 0,
  tier_b_count INTEGER NOT NULL DEFAULT 0,
  tier_c_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 9. Monthly Usage & Budget Guard Table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY, -- e.g. '2026-09'
  month_str TEXT NOT NULL,
  estimated_cost_usd NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
  budget_limit_usd NUMERIC(8,2) NOT NULL DEFAULT 4.50,
  qualified_leads_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_username ON leads(instagram_username);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_tier ON leads(lead_tier);
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_lead_id ON outreach_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON outreach_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON outreach_events(created_at DESC);

-- 11. Row Level Security (RLS)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sender_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create policy allowing authenticated and anon users access (and service role full access)
CREATE POLICY "Allow authenticated read/write on campaigns" ON campaigns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on campaigns" ON campaigns
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on leads" ON leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on leads" ON leads
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on campaign_leads" ON campaign_leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on campaign_leads" ON campaign_leads
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on message_templates" ON message_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on message_templates" ON message_templates
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on sender_accounts" ON sender_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on sender_accounts" ON sender_accounts
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on outreach_events" ON outreach_events
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on outreach_events" ON outreach_events
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on discovery_runs" ON discovery_runs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on discovery_runs" ON discovery_runs
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read/write on usage_tracking" ON usage_tracking
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write on usage_tracking" ON usage_tracking
  FOR ALL TO anon USING (true) WITH CHECK (true);


-- 12. Seed Default Campaigns
INSERT INTO campaigns (id, name, description, target_min_followers, target_max_followers, daily_limit, max_raw_profiles, keywords, role_keywords, research_keywords, niche_keywords, excluded_keywords)
VALUES 
(
  'camp-creator-researchers',
  'Creator Researchers',
  'High-priority creator-operators who save Reels for content ideas, hooks, scripts, and research frameworks.',
  1000,
  20000,
  60,
  150,
  ARRAY['content creator save this', 'content creator content ideas', 'content creator hooks', 'content creator research', 'content strategist', 'social media manager'],
  ARRAY['content creator', 'content strategist', 'social media manager', 'UGC creator', 'creator educator'],
  ARRAY['save this', 'save this reel', 'content ideas', 'hooks', 'scripts', 'swipe file', 'research', 'framework'],
  ARRAY['content marketing', 'creator economy', 'personal branding', 'social media'],
  ARRAY['meme', 'fan page', 'giveaway', 'repost', 'entertainment']
),
(
  'camp-ai-tech',
  'AI / Tech Creators',
  'Knowledge creators sharing generative AI workflows, ChatGPT prompts, automation, and SaaS tools.',
  1000,
  20000,
  60,
  150,
  ARRAY['AI creator', 'AI tools creator', 'AI educator', 'ChatGPT creator', 'AI workflow', 'AI automation', 'SaaS creator', 'technology educator'],
  ARRAY['educator', 'creator', 'consultant', 'founder'],
  ARRAY['save this', 'prompts', 'tools', 'workflow', 'resources', 'templates', 'breakdown'],
  ARRAY['AI', 'artificial intelligence', 'ChatGPT', 'Claude', 'automation', 'SaaS', 'technology'],
  ARRAY['crypto pump', 'meme', 'giveaway', 'bot']
),
(
  'camp-marketing-growth',
  'Marketing / Growth Creators',
  'Marketing strategists, copywriters, and growth operators publishing teardowns and frameworks.',
  1000,
  20000,
  60,
  150,
  ARRAY['marketing creator', 'growth marketer', 'marketing strategist', 'copywriter', 'brand strategist', 'social media strategist'],
  ARRAY['marketing strategist', 'growth marketer', 'copywriter', 'brand strategist', 'consultant'],
  ARRAY['save this post', 'swipe file', 'breakdown', 'case study', 'examples', 'frameworks'],
  ARRAY['marketing', 'growth', 'sales', 'copywriting', 'branding', 'b2b'],
  ARRAY['dropshipping store', 'casino', 'giveaway']
),
(
  'camp-founder-business',
  'Founder / Business Creators',
  'Startup founders and solopreneurs building in public and teaching business systems.',
  1000,
  20000,
  60,
  150,
  ARRAY['startup founder', 'founder creator', 'entrepreneur creator', 'solopreneur', 'business educator', 'business coach'],
  ARRAY['founder', 'co-founder', 'solopreneur', 'entrepreneur'],
  ARRAY['save this', 'framework', 'lessons', 'learnings', 'systems', 'tools'],
  ARRAY['startup', 'business', 'entrepreneurship', 'saas', 'productivity'],
  ARRAY['forex signals', 'crypto pump', 'meme']
),
(
  'camp-knowledge-creators',
  'Knowledge Creators',
  'Productivity coaches, career educators, design thinkers, and UX creators.',
  1000,
  20000,
  60,
  150,
  ARRAY['productivity creator', 'career educator', 'design educator', 'UX creator', 'copywriting educator', 'online educator'],
  ARRAY['educator', 'designer', 'writer', 'consultant'],
  ARRAY['notes', 'framework', 'resources', 'templates', 'save this', 'learning'],
  ARRAY['productivity', 'design', 'ux', 'writing', 'career', 'education'],
  ARRAY['meme', 'fan page', 'quotes daily']
)
ON CONFLICT (id) DO NOTHING;

-- 13. Seed Message Templates
INSERT INTO message_templates (id, name, niche, target_tier, template)
VALUES
(
  'tpl-savethis',
  'Creator who uses "save this"',
  'general',
  'Tier A',
  'Hey {{first_name}}, you literally tell people to save your Reels, which is basically the problem I’ve spent the last few weeks thinking about.

People save useful things constantly, but Instagram gives them almost no useful way to revisit or actually use those saves.

I built something around that called Vault.

You just send a Reel to @{{vault_username}} and it turns it into searchable knowledge you can actually use.

Would genuinely love to know what you think.'
),
(
  'tpl-ai-business',
  'AI / business creator',
  'ai',
  'Tier A',
  'Hey {{first_name}}, I’m building Vault around something I keep noticing with AI/business content.

People save useful Reels constantly because they want to try the tools, workflows, ideas, or frameworks later.

Then their saved folder becomes impossible to use.

Vault is a really simple experiment around that. You send a Reel to @{{vault_username}} and it turns the useful part into something you can actually come back to.

Would love for you to test it with one.'
),
(
  'tpl-founder',
  'Founder / Solopreneur',
  'startup',
  'Tier A',
  'Hey {{first_name}}, founder here.

I came across your content and you’re unusually close to the problem I’m building around.

People increasingly use Instagram as a research feed, but all that information ends up trapped inside a saved folder.

I built Vault to test a different workflow.

You send a Reel to @{{vault_username}} and it extracts what’s actually worth remembering.

Would love to hear what you think after trying one.'
),
(
  'tpl-creator-operator',
  'Creator-Operator',
  'creator-economy',
  'Tier A',
  'Hey {{first_name}}, I’m building something called Vault around a problem I think you might relate to.

You create the kind of content people save with the intention of coming back to later. I’ve been thinking a lot about what actually happens to those saves.

I built a really simple experiment around it. You send a Reel to @{{vault_username}} and it turns the useful part into something you can actually find and use later.

Would love for you to try it with one Reel.'
),
(
  'tpl-personal-obs',
  'Personal creator observation',
  'general',
  'Tier B',
  'Hey {{first_name}}, saw your content around {{niche}}.

It’s actually the kind of stuff I would normally save, which is slightly ironic because that’s exactly the problem I’ve been building around.

I have hundreds of useful Reels sitting in my saves that I’ll probably never open again.

So I built Vault. You send a Reel to @{{vault_username}} and it turns it into something you can actually come back to.

Would love for you to try one.'
)
ON CONFLICT (id) DO NOTHING;

-- 14. Seed Primary Sender Account
INSERT INTO sender_accounts (id, name, instagram_username, instagram_profile_url, display_name)
VALUES (
  'sender-primary',
  'Paritosh (Vault Founder)',
  'vault.moment',
  'https://instagram.com/vault.moment',
  'Paritosh'
)
ON CONFLICT (id) DO NOTHING;

-- 15. Auth Rate Limiting & IP Lockout Table
CREATE TABLE IF NOT EXISTS auth_lockouts (
  ip TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE auth_lockouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role all on auth_lockouts" ON auth_lockouts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on auth_lockouts" ON auth_lockouts FOR ALL TO anon USING (true) WITH CHECK (true);

