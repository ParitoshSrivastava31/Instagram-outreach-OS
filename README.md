# Instagram Outreach OS

> **A high-precision, cost-conscious, anti-ban founder outreach operating system.**  
> Discover high-signal creator-operators on Instagram, qualify them deterministically, and execute personalized manual outreach in **15–30 seconds per lead** — engineered for **$0 out-of-pocket costs**.

Originally built for **Vault** ([@vault.moment](https://instagram.com/vault.moment)), but architected to be completely white-labeled and adapted for any startup, SaaS, creator, or agency in minutes.

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [How It Works (System Architecture & Pipeline)](#how-it-works-system-architecture--pipeline)
3. [Engineered for $0 Out-of-Pocket (Cost-Friendliness Decisions)](#engineered-for-0-out-of-pocket-cost-friendliness-decisions)
4. [Quickstart (Try It in 60 Seconds — Zero Setup)](#quickstart-try-it-in-60-seconds--zero-setup)
5. [Complete Production Setup Guide](#complete-production-setup-guide)
   - [Step 1: Database Setup (Supabase)](#step-1-database-setup-supabase)
   - [Step 2: Scraper Setup (Apify Free Tier)](#step-2-scraper-setup-apify-free-tier)
   - [Step 3: Environment Configuration](#step-3-environment-configuration)
   - [Step 4: Cloud Run Deployment (Web Console)](#step-4-cloud-run-deployment-web-console)
   - [Step 5: Meta Webhook Subscription](#step-5-meta-webhook-subscription)
6. [White-Labeling / Adapting for Your Product](#white-labeling--adapting-for-your-product)
7. [Daily Outreach Workflow & Keyboard Shortcuts](#daily-outreach-workflow--keyboard-shortcuts)
8. [Environment Variables Reference](#environment-variables-reference)
9. [API Routes Reference](#api-routes-reference)
10. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Overview & Philosophy

### What is Vault? (The Reference Implementation)

Vault is an Instagram-native knowledge engine. When users come across high-value Reels (frameworks, hooks, workflows, tools, or tutorials), they DM the Reel to `@vault.moment`. Vault extracts the actionable insights, scripts, and links, saving them into a structured, searchable personal knowledge base.

Because Vault solves the problem of *"saving Reels you never revisit"*, the best prospects are **creator-operators, educators, and founders** who actively share research frameworks, swipe files, and tell their audience to *"save this Reel"*.

### The Problem with Existing Outreach Tools

| Approach | Typical Pitfall | How Outreach OS Solves It |
| :--- | :--- | :--- |
| **Mass-DM Automation Bots** | Instagram flags browser automation, rate limits, or bans the founder's account. | **Zero bot automation.** Deep links open Instagram in a new tab; founder sends manually. |
| **AI LLM Message Generation** | Generic AI flattery ("Loved your recent post!"), high API token bills, hallucinated facts. | **Zero AI text generation.** 100% deterministic templates interpolated with real profile facts. |
| **Commercial Cold Outreach SaaS** | $50–$300/mo subscriptions with bloated features and complex setup. | **100% Free / $0 out-of-pocket.** Runs on free tiers of Supabase, Apify, and Google Cloud Run. |
| **Fully Manual Instagram Outreach** | 5+ minutes per lead researching bios, drafting copy, and finding links. | **15–30 seconds per lead** via single-key shortcuts (<kbd>O</kbd> to copy & open profile). |

---

## How It Works (System Architecture & Pipeline)

Instagram Outreach OS automates research and qualification while keeping message sending firmly in the founder's hands.

```
                      ┌────────────────────────────────────────┐
                      │          Targeted Discovery            │
                      │  Apify Scraper OR Built-in $0 Sandbox  │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    Heuristic Exclusion & Filtering     │
                      │ Rejects Memes, Repost, Bots, <300 Flw  │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │   Deterministic Lead Scoring Engine    │
                      │  Roles (+30), Research (+35), Niches   │
                      │       Tiers: Tier A, Tier B, Tier C    │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │  Deduplication & Dual Storage Engine   │
                      │  Supabase PostgreSQL OR In-Memory Store│
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │ Zero-AI Deterministic Message Renderer │
                      │ {{first_name}}, {{niche}}, {{username}}│
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │     Today's High-Velocity Queue        │
                      │  [O] Copy & Open  →  [S] Mark Sent     │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │   Automatic Reply Tracking & Funnel    │
                      │  Official Meta Webhook → REPLIED       │
                      │  Track: Used Vault → 2nd Reel → Paid   │
                      └────────────────────────────────────────┘
```

### The 7-Stage Pipeline

1. **Targeted Discovery Engine**:
   - Searches Instagram creator bios, category names, and captions using targeted keyword taxonomies (Creator Researchers, AI / Tech Creators, Marketing / Growth, Founders, Knowledge Creators).
   - Powered by Apify or the built-in Sandbox Simulator.
2. **Heuristic Exclusion & Filtering Layer**:
   - Instantly filters out spam, memes, repost aggregators, giveaway accounts, fan pages, crypto pumps, dropshipping stores, and private accounts.
   - Enforces a follower threshold (minimum 300 to eliminate inactive bots; default ceiling of 20,000 to focus on responsive micro-creators).
3. **Deterministic Lead Scoring & Tiering Engine**:
   - Analyzes profile bio, business categories, username, and recent captions using regex word-boundary matching (preventing false matches like "ai" matching "email").
   - Computes an objective qualification score:
     - **Role Keywords** (+30 pts): "content creator", "strategist", "founder", "educator"
     - **Research Signals** (+35 pts): "save this reel", "swipe file", "framework", "content ideas"
     - **Niche Keywords** (+20 pts): "creator economy", "growth", "saas", "productivity"
     - **Negative Signals** (-50 pts): Disqualifiers
   - Assigns unambiguous tiers:
     - **Tier A (Score 80+)**: Primary targets with active research signals.
     - **Tier B (Score 60–79)**: Strong niche creators.
     - **Tier C (Score 40–59)**: Viable niche experts.
4. **Cross-Campaign Deduplication & Storage**:
   - Checks historical database records to ensure the same Instagram account is never queued or messaged twice across campaigns.
   - Persists leads to Supabase PostgreSQL (or in-memory store during local testing).
5. **Zero-AI Deterministic Message Personalization**:
   - Selects the best template matching the lead's tier and niche.
   - Interpolates verified public facts into human copy (`{{first_name}}`, `{{niche}}`, `{{followers}}`, `{{vault_username}}`).
   - Zero hallucinated compliments, zero robotic AI phrases.
6. **High-Velocity Outreach Queue (15–30s per lead)**:
   - Founder opens Today's Queue (`/`).
   - Presses <kbd>O</kbd> ("Open & Copy"): the personalized message is copied to the clipboard and the creator's Instagram profile opens in a new tab.
   - Founder pastes message into Instagram DM and presses Send.
   - Founder presses <kbd>S</kbd> ("Mark Sent") to advance status to `CONTACTED`.
7. **Official Meta Webhook & Funnel Analytics**:
   - When a prospect replies, Meta pushes a webhook event to `POST /api/webhooks/instagram`.
   - The system matches the sender and automatically marks the lead as `REPLIED`.
   - Funnel stages track adoption: `CONTACTED` &rarr; `REPLIED` &rarr; `Used Vault (1st Reel)` &rarr; `Sent 2nd Reel (Retention Signal)` &rarr; `Paid`.

---

## Engineered for $0 Out-of-Pocket (Cost-Friendliness Decisions)

A central design requirement was ensuring that a solo founder or bootstrap team can run this system indefinitely with **$0 out-of-pocket costs**. Here are the deliberate architectural decisions that make that possible:

### 1. Zero AI / LLM API Fees ($0.00 Token Bills)
Most modern outreach tools make OpenAI GPT-4 or Claude API calls for every scraped bio to evaluate and generate text, costing $0.02 to $0.08 per prospect. Scraping 1,000 accounts burns $20–$80 every single run.
- **Our Decision**: Replaced LLMs with a high-speed, deterministic regex word-boundary keyword taxonomy and rule-based template engine.
- **Monthly Cost**: **$0.00** (Zero token expenses, zero API rate limits, instantaneous evaluation).

### 2. Apify Free Tier Ceiling & Pre-Flight Cost Guardrails
Apify grants every free account **$5.00/month** in platform compute credits. Without safeguards, an unconstrained crawler can easily run up overage charges.
- **Our Decision**:
  - Enforced a hard server-side budget ceiling: `APIFY_MONTHLY_BUDGET_USD=4.50` (leaving a $0.50 safety margin).
  - Hard limit of `MAX_RAW_PROFILES_PER_RUN=150` profiles per run.
  - Daily qualification ceiling of `MAX_DAILY_QUALIFIED_LEADS=60` leads.
  - **Pre-flight evaluation**: Every run calculates estimated compute costs *before* execution. If projected usage exceeds $4.50, the run is blocked before any credits are billed.
- **Monthly Cost**: **$0.00** (Strictly bounded within Apify's recurring free tier).

### 3. Built-in $0 Sandbox Simulator
Anyone can clone this repository and test the complete end-to-end application without an Apify account, credit card, or third-party service.
- **Our Decision**: When `APIFY_API_TOKEN` is unset or empty, the system automatically activates `MockInstagramProvider`. It simulates realistic creator discovery runs, scores profiles against campaigns, and populates the outreach queue at zero cost.
- **Monthly Cost**: **$0.00**.

### 4. Supabase Free Tier + Dual In-Memory Database Fallback
- **Our Decision**:
  - Leverages Supabase's Free Tier (500MB PostgreSQL database, unlimited API requests, and up to 50,000 monthly active users).
  - Built an automatic **In-Memory Store Fallback (`MemoryStore`)**: if Supabase credentials are missing or temporarily unreachable, the app automatically switches to in-memory state. You can develop, test, and demo locally without spinning up a database.
- **Monthly Cost**: **$0.00**.

### 5. Serverless Scale-to-Zero Deployment (Google Cloud Run)
Running an always-on VPS or cloud virtual machine costs $7–$25/month even when idle.
- **Our Decision**:
  - Package the Next.js app in a lightweight multi-stage Docker container deployed to **Google Cloud Run** with `min-instances: 0`.
  - Google Cloud Run includes **2,000,000 free requests/month**, 360,000 GB-seconds of memory, and 180,000 vCPU-seconds free per month.
  - When you are not using the app, instances scale to zero and cost nothing.
- **Monthly Cost**: **$0.00**.

### 6. Meta Official Graph API Webhook (vs. Paid DM Scrapers)
Third-party DM automation platforms (ManyChat, PhantomBuster, IG automation services) charge $29 to $99/month and often violate platform terms.
- **Our Decision**: Outreach OS subscribes directly to the official Meta Graph API Messaging Webhook (`/api/webhooks/instagram`). Meta notifies your server directly when a prospect DMs your professional Instagram account.
- **Monthly Cost**: **$0.00** (Official, free Meta developer feature).

### 7. Historical Cross-Campaign Deduplication
Scraping duplicate accounts across multiple days or campaigns wastes free tier compute units.
- **Our Decision**: Scraped profiles are deduplicated against existing database records before scoring or processing. Once an account is discovered, it is indexed and never re-scraped across future runs.
- **Efficiency**: Preserves compute credits for purely new, uncontacted prospects.

### 8. Anti-Ban Human Execution (Preserving Account Value)
Automated browser bots that click "Send" on Instagram inevitably trigger account suspensions, shadowbans, or permanent bans. Recovering or rebuilding a founder's Instagram account has massive hidden costs.
- **Our Decision**: Decouple automated research from manual sending. The system organizes leads, copies copy to clipboard, and deep-links directly to the profile. The founder clicks Send with their own hands.
- **Compliance**: 100% compliant with Instagram Terms of Service; 0% ban risk.

---

## Quickstart (Try It in 60 Seconds — Zero Setup)

You can run the full application locally right now **without any API keys, databases, or credit cards**:

```bash
# 1. Clone the repository
git clone https://github.com/ParitoshSrivastava31/Instagram-outreach-OS.git
cd Instagram-outreach-OS

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Enter the default master passcode: `vault2026`.
3. Go to **Discovery** (`/discovery`) &rarr; Click **Run Discovery Now**.  
   *(The built-in Sandbox Simulator instantly discovers, filters, scores, and populates your queue with realistic creator leads!)*
4. Go to **Today's Outreach** (`/`) &rarr; Press <kbd>O</kbd> to copy message and open profile.

---

## Complete Production Setup Guide

Follow these steps to connect your real Supabase database, Apify scraper, and deploy to Google Cloud Run.

### Step 1: Database Setup (Supabase)

1. Create a free account at [Supabase](https://supabase.com) and click **New Project** (e.g. `vault-outreach-os`).
2. Go to **Project Settings** &rarr; **API** and copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key**
   - **service_role secret key**
3. In the Supabase Dashboard, open the **SQL Editor**.
4. Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
5. This creates all tables (`campaigns`, `leads`, `campaign_leads`, `message_templates`, `sender_accounts`, `outreach_events`, `discovery_runs`, `usage_tracking`), enables RLS, sets up indexes, and seeds default campaigns and message templates.

### Step 2: Scraper Setup (Apify Free Tier)

1. Sign up for a free account at [Apify](https://apify.com) ($5.00 recurring free monthly credits).
2. Go to **Settings** &rarr; **Integrations** &rarr; **API Tokens**.
3. Create a new token (e.g., `Vault Outreach OS`) and copy it.
4. The default actor used is **`apify/instagram-scraper`** (fast and cost-effective).

### Step 3: Environment Configuration

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in your production values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# Admin Master Passcode
ADMIN_PASSWORD=your_custom_secure_passcode

# Apify Scraper
APIFY_API_TOKEN=apify_api_...
APIFY_ACTOR_ID=apify/instagram-scraper
APIFY_MONTHLY_BUDGET_USD=4.50

# Safety Guardrails
MAX_DAILY_QUALIFIED_LEADS=60
MAX_RAW_PROFILES_PER_RUN=150
MAX_FOLLOWERS=20000

# Meta Webhook
META_VERIFY_TOKEN=your_meta_verify_token_here
```

### Step 4: Cloud Run Deployment (Web Console)

Deploy the standalone Next.js container directly from the Google Cloud Console:

1. **Enable APIs** in [Google Cloud Console](https://console.cloud.google.com):
   - Cloud Run Admin API
   - Cloud Build API
   - Artifact Registry API
2. **Create Service** in Cloud Run:
   - Select **"Continuously deploy from a repository"** &rarr; Connect GitHub repository.
   - Branch: `^main$` | Build Type: **Dockerfile** | Source: `/Dockerfile`.
3. **Service Settings**:
   - **Service Name**: `instagram-outreach-os`
   - **Authentication**: **"Allow unauthenticated invocations"** (required for web access and Meta webhook receiver).
   - **Container Port**: `8080`.
   - **Memory**: `512 MiB` or `1 GiB` | **CPU**: `1 vCPU`.
   - **Min Instances**: `0` (scales to zero when idle for $0 cost).
   - **Max Instances**: `5`.
4. **Environment Variables**: Add your production variables matching `.env.local`.
5. Click **Create**. Once Cloud Build finishes, your live URL will be ready (e.g. `https://instagram-outreach-os-xxxxxxxx-uc.a.run.app`).

### Step 5: Meta Webhook Subscription

To enable automatic incoming DM reply tracking:

1. In the [Meta App Dashboard](https://developers.facebook.com), open your app linked to your professional Instagram account.
2. Under **Instagram** &rarr; **Webhooks**:
   - **Callback URL**: `https://<YOUR-CLOUD-RUN-URL>/api/webhooks/instagram`
   - **Verify Token**: Matching `META_VERIFY_TOKEN` (e.g. `your_meta_verify_token_here`).
3. Click **Verify and Save**.
4. Subscribe to the `messages` event.
5. When prospects reply to your Instagram DM, Meta posts the event to your server, automatically advancing their status to `REPLIED`.

---

## White-Labeling / Adapting for Your Product

Want to use Outreach OS for your own product, SaaS, or agency? You can reconfigure it in 3 minutes without touching core code:

1. **Update Sender Identity** (`/settings`):
   - Set your name, display name, and your Instagram username.
2. **Configure Custom Campaigns** (`/campaigns`):
   - Click **Create Custom Campaign**.
   - Set your target niche, follower ranges (e.g. 1k–15k), and positive keywords (e.g. `fitness coach`, `shopify founder`, `b2b copywriter`).
   - Add negative keywords to filter unwanted accounts.
3. **Customize Deterministic Templates** (`/templates`):
   - Edit or add message templates.
   - Available interpolation variables:
     - `{{first_name}}` &rarr; Prospect's first name (falls back to username)
     - `{{vault_username}}` / `{{sender_username}}` &rarr; Your Instagram handle
     - `{{niche}}` &rarr; Matched primary niche
     - `{{followers}}` &rarr; Formatted follower count (e.g. `4.2k`)
4. **Set Your Passcode** (`.env.local`):
   - Set `ADMIN_PASSWORD=your_passcode` to secure your dashboard.

---

## Daily Outreach Workflow & Keyboard Shortcuts

Target execution speed: **15–30 seconds per prospect**.

```
[Review Profile Signals]  ──>  Press 'O'  ──>  Paste & Send DM  ──>  Press 'S'
```

### Keyboard Shortcuts Reference

| Key | Action | Description |
| :--- | :--- | :--- |
| <kbd>O</kbd> | **Open & Copy** | Copies deterministic message to clipboard and opens Instagram profile in a new tab. Logs `OPENED`. |
| <kbd>S</kbd> | **Mark Sent** | Advances lead status to `CONTACTED` and stamps outreach timestamp. |
| <kbd>R</kbd> | **Mark Replied** | Advances lead status to `REPLIED` (if not already handled automatically via Meta Webhook). |
| <kbd>X</kbd> | **Skip Lead** | Dismisses lead from today's active queue without contacting. |
| <kbd>Z</kbd> | **Snooze Lead** | Snoozes prospect for 3 days before returning to queue. |
| <kbd>J</kbd> / <kbd>&darr;</kbd> | **Next Lead** | Highlights the next prospect card. |
| <kbd>K</kbd> / <kbd>&uarr;</kbd> | **Previous Lead** | Highlights the previous prospect card. |

---

## Environment Variables Reference

| Variable | Description | Default / Example | Required in Production |
| :--- | :--- | :--- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyz.supabase.co` | Yes (for persistent DB) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | `ey...` | Yes (for client reads) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret service role key | `ey...` | Yes (bypasses RLS on server) |
| `ADMIN_PASSWORD` | Master password to unlock dashboard | `vault2026` | Recommended |
| `ADMIN_EMAILS` | Comma-separated admin email allowlist | `paritosh@example.com` | Optional |
| `APIFY_API_TOKEN` | Apify personal API access token | `apify_api_...` | Optional (runs Sandbox if unset) |
| `APIFY_ACTOR_ID` | Instagram scraping actor ID | `apify/instagram-scraper` | Optional |
| `APIFY_MONTHLY_BUDGET_USD` | Monthly scrape cost ceiling | `4.50` | Optional (default: `4.50`) |
| `MAX_DAILY_QUALIFIED_LEADS` | Daily qualified leads ceiling | `60` | Optional (default: `60`) |
| `MAX_RAW_PROFILES_PER_RUN` | Max raw profiles scraped per run | `150` | Optional (default: `150`) |
| `MAX_FOLLOWERS` | Follower ceiling for micro-creators | `20000` | Optional (default: `20000`) |
| `META_VERIFY_TOKEN` | Meta Graph Webhook verification token | `your_meta_verify_token_here` | Yes (for reply webhooks) |

---

## API Routes Reference

| Route | Method | Description |
| :--- | :--- | :--- |
| `/api/discovery/run` | `POST` | Triggers a discovery run (checks budget, scores candidates, populates queue). |
| `/api/discovery/status` | `GET` | Fetches current monthly budget usage and daily lead limits. |
| `/api/discovery/reset-budget`| `POST` | Resets monthly usage counters. |
| `/api/leads` | `GET`, `POST` | Lists all leads with filters or creates a new prospect manually. |
| `/api/leads/[id]/queue` | `POST` | Adds a lead to Today's Outreach queue. |
| `/api/leads/[id]/open` | `POST` | Records an `OPENED` event when copying copy and opening IG. |
| `/api/leads/[id]/contacted`| `POST` | Transitions lead status to `CONTACTED`. |
| `/api/leads/[id]/reply` | `POST` | Transitions lead status to `REPLIED`. |
| `/api/leads/[id]/funnel` | `POST` | Updates product adoption stage (`USED_VAULT`, `SENT_SECOND_REEL`, `PAID`). |
| `/api/leads/[id]/skip` | `POST` | Marks lead as `SKIPPED`. |
| `/api/leads/[id]/snooze` | `POST` | Snoozes lead for a specified number of days. |
| `/api/campaigns` | `GET`, `POST` | Lists or creates targeted outreach campaigns. |
| `/api/templates` | `GET`, `POST` | Lists or updates message templates. |
| `/api/settings` | `GET`, `POST` | Checks database health and updates sender account profile. |
| `/api/webhooks/instagram` | `GET`, `POST` | Meta Graph API webhook verification (GET) and incoming DM receiver (POST). |
| `/api/auth/login` | `POST` | Validates master passcode and issues session cookie. |
| `/api/auth/logout` | `POST` | Clears authentication session. |

---

## Troubleshooting & FAQ

### 1. I am prompted for a password at `/login`. What is it?
If you haven't set `ADMIN_PASSWORD` in your `.env.local`, the default passcode is:
```
vault2026
```
You can change this anytime by setting `ADMIN_PASSWORD=your_new_passcode` in `.env.local`.

### 2. Can I use this without Supabase?
**Yes.** If Supabase credentials are missing or invalid, the app automatically falls back to an in-memory database store (`MemoryStore`). You can test discovery runs, queue management, templates, and settings right away. *(Note: in-memory data resets when the Node process restarts).*

### 3. Can I use this without an Apify API key?
**Yes.** If `APIFY_API_TOKEN` is blank or unset, the discovery engine automatically uses the built-in **Sandbox Mock Provider**. It simulates profile scraping and scoring against your active campaigns with realistic creator accounts at **$0 cost**.

### 4. Supabase error: "Row Level Security (RLS) is blocking database writes"
Ensure you ran [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase SQL editor. The schema includes the required RLS policies and public/service grants. For server-side operations, ensure `SUPABASE_SERVICE_ROLE_KEY` is provided in `.env.local`.

### 5. Meta Webhook returns "Forbidden (403)" during setup
Make sure the **Verify Token** entered in the Meta App Dashboard exactly matches the value of `META_VERIFY_TOKEN` in your environment variables (`your_meta_verify_token_here`). Also ensure your Cloud Run service has **"Allow unauthenticated invocations"** enabled so Meta can reach the GET endpoint.

---

## License

MIT License. Free to fork, modify, and deploy for personal or commercial outreach.
