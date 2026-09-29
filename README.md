# Instagram Outreach OS (for Vault @vault.moment)

A production-quality internal founder web application to discover high-quality Instagram prospects for **Vault** (`@vault.moment`) and execute deterministic manual outreach in 15–30 seconds per lead.

---

## What is Vault?

Vault is an Instagram-native information vault. A user sends a Reel to `@vault.moment`. Vault extracts the useful information from the Reel and turns it into structured, searchable knowledge that the user can actually revisit later.

The most valuable prospects are **creator-operators, AI educators, and founders** who use Instagram as a *research and creation tool* (saving Reels for hooks, frameworks, workflows, tools, and ideas), rather than people who use Instagram purely for entertainment.

---

## Core Principles

1. **NOT an automation bot**:
   - Zero Instagram passwords or session cookies stored.
   - No unofficial private APIs or browser emulation bots.
   - Never automatically clicks Send or sends unsolicited DMs.
   - Final message is **always** manually reviewed and sent by the founder.
2. **Zero AI Text Generation**:
   - Message templates are 100% deterministic with objective public profile facts (`{{first_name}}`, `{{niche}}`, `{{followers}}`).
   - No hallucinated or robotic compliments.
3. **Cost Guardrails ($0 Out-of-Pocket Target)**:
   - Apify Free Tier ceiling strictly enforced server-side (`APIFY_MONTHLY_BUDGET_USD=4.50`).
   - Hard daily cap of `60` qualified leads.
   - Max `150` raw profiles per discovery run.
4. **Automatic Reply Detection via Meta Official Webhooks**:
   - Authorized professional Instagram account receives incoming DM webhook events.
   - Matches sender to prospect in database and automatically updates status to `REPLIED`.

---

## Intended Outreach Workflow

```
[Discover Profiles] 
       ↓
[Filter Exclusions (Memes, Repost, Fanpages)]
       ↓
[Qualify Roles, Research Signals & Niches]
       ↓
[Deduplicate & Lead Score]
       ↓
[Today's Outreach Queue]
       ↓
[Click "Open & Copy" (or press 'O')]
  → Message copied to clipboard
  → Instagram tab opens
       ↓
[Paste Message & Manually Press Send]
       ↓
[Click "Mark Sent" (or press 'S')]
       ↓
[Meta Webhook Detects Reply → REPLIED]
       ↓
[Track Vault Adoption: Used Vault → Sent 2nd Reel ★ → Paid]
```

---

## 16-Step Production Setup Guide

### 1. Create the Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project** and name it `vault-outreach-os`.
3. Choose a region close to your primary location (e.g. `us-east-1` or `eu-west-1`).
4. Set a strong database password and copy your project URL and keys.

### 2. Run Database Migrations
1. In the Supabase Dashboard, open the **SQL Editor**.
2. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Click **Run**.
4. This creates all tables (`campaigns`, `leads`, `campaign_leads`, `message_templates`, `sender_accounts`, `outreach_events`, `discovery_runs`, `usage_tracking`), enables Row Level Security (RLS), adds performance indexes, and seeds the 5 default campaigns and message templates.

### 3. Create the Apify Account
1. Sign up at [Apify](https://apify.com) on the Free Tier ($5 free platform credits/month).

### 4. Select / Configure the Instagram Discovery Actor
1. Go to the [Apify Store](https://apify.com/store).
2. Search for `instagram-profile-scraper` (or `apify/instagram-profile-scraper` or `shu8hvr/instagram-scraper`).
3. Set your chosen actor in your environment variables:
   ```env
   APIFY_ACTOR_ID=apify/instagram-profile-scraper
   ```

### 5. Create the Apify API Token
1. In Apify Console, navigate to **Settings** → **Integrations** → **API Tokens**.
2. Click **Add API Token**, name it `Vault Outreach OS`, and copy the token.

### 6. Configure the $4.50 Internal Monthly Budget
1. In `.env.local`, set:
   ```env
   APIFY_MONTHLY_BUDGET_USD=4.50
   ```
2. The server will reject runs and alert you if the estimated compute exceeds this budget, ensuring zero surprise bills.

### 7. Run the Application Locally
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Insta
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.
*(Note: If Apify or Supabase are not yet configured, the app automatically runs in built-in Sandbox Simulator mode so you can test immediately without error).*

### 8. Deploy the Backend to Google Cloud Run
1. Ensure the Google Cloud SDK (`gcloud`) and Docker are installed.
2. Authenticate and configure project:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
3. Build and deploy container:
   ```bash
   gcloud run deploy insta-outreach-os \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co",NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key",SUPABASE_SERVICE_ROLE_KEY="your_service_role_key",APIFY_API_TOKEN="your_apify_token",APIFY_MONTHLY_BUDGET_USD="4.50",META_VERIFY_TOKEN="vault_outreach_meta_token_2026"
   ```

### 9. Deploy the Frontend (Vercel or Cloud Run)
- **Option A (Google Cloud Run)**: The provided multi-stage `Dockerfile` serves both Next.js App Router frontend and API routes as a unified, standalone production service.
- **Option B (Vercel)**: Connect your GitHub repository to Vercel and input the environment variables from `.env.example`.

### 10. Configure All Environment Variables
Verify your `.env.local` or Cloud Run environment variables match the table below:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase Anon Key | `ey...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Server-side Supabase Key | `ey...` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `paritosh@example.com` |
| `APIFY_API_TOKEN` | Apify personal API access token | `apify_api_...` |
| `APIFY_ACTOR_ID` | Instagram scraping actor ID | `apify/instagram-profile-scraper` |
| `APIFY_MONTHLY_BUDGET_USD` | Monthly cost guardrail | `4.50` |
| `MAX_DAILY_QUALIFIED_LEADS`| Daily qualified lead ceiling | `60` |
| `MAX_RAW_PROFILES_PER_RUN` | Raw profile ceiling per run | `150` |
| `MAX_FOLLOWERS` | Follower ceiling for prospects | `20000` |
| `META_VERIFY_TOKEN` | Meta Graph Webhook verify token | `vault_outreach_meta_token_2026` |

### 11. Create or Select the First Campaign
1. Open the **Campaigns** tab (`/campaigns`).
2. The system comes pre-seeded with 5 targeted campaigns:
   - **Creator Researchers** (1K–20K followers, highest priority)
   - **AI / Tech Creators** (1K–20K followers)
   - **Marketing / Growth Creators** (1K–20K followers)
   - **Founder / Business Creators** (1K–20K followers)
   - **Knowledge Creators** (1K–20K followers)
3. You can click **Create Custom Campaign** to define custom search terms and follower limits.

### 12. Run the First Discovery
1. Go to the **Run Discovery** page (`/discovery`).
2. Review the pre-flight checks: follower range, keyword taxonomy, budget status, and provider.
3. Click **Run Discovery Now**.
4. The system executes the search, filters out generic entertainment/meme accounts, scores candidate profiles deterministically, deduplicates against existing records, interpolates personalized outreach templates, and adds the top leads to your queue.

### 13. Review the First Qualified Leads
1. Check the post-run report showing:
   - Profiles discovered
   - Filtered/rejected accounts
   - Tier A / Tier B / Tier C distribution
   - Total leads added to queue.
2. Click **Process Leads in Outreach Queue**.

### 14. Process the First Outreach Queue
1. Open **Today's Outreach** (`/`).
2. Select the first prospect card.
3. Click **Open & Copy** (or press shortcut key <kbd>O</kbd>).
4. The application automatically:
   - Copies the prepared deterministic message to your clipboard.
   - Opens the prospect's Instagram profile in a new browser tab.
   - Records an `OPENED` outreach event.
5. In Instagram, paste the message into their DM and press send.
6. Return to the dashboard and click **Mark Sent** (or press shortcut key <kbd>S</kbd>).

### 15. Record Replies (Manual or Meta Webhook)
- **Automatic via Meta Webhook**: When a prospect DMs your professional Instagram account, Meta pushes the event to `POST /api/webhooks/instagram`. The system matches the sender and automatically transitions the lead to **REPLIED** with a timestamp!
- **Manual**: Click **Mark Replied** (or press <kbd>R</kbd>).
- Track subsequent Vault product adoption:
  - `Used Vault (1st Reel)`
  - `Sent Second Reel (High Value Retention Signal!)`
  - `Paid`

### 16. Monitor Monthly Data Usage & Cost Protection
1. View the live budget indicator in the top navbar: e.g. `$0.15 / $4.50`.
2. Inspect the **Analytics** page (`/analytics`) to view your response rate, replies by niche, replies by template, and average score of replied leads.

---

## Keyboard Shortcuts Quick Reference

| Key | Action |
| :--- | :--- |
| <kbd>O</kbd> | **Open & Copy** (Copies message, opens IG profile, logs OPENED) |
| <kbd>S</kbd> | **Mark Sent** (Advances status to CONTACTED) |
| <kbd>R</kbd> | **Mark Replied** (Advances status to REPLIED) |
| <kbd>X</kbd> | **Skip Lead** |
| <kbd>Z</kbd> | **Snooze Lead (3 Days)** |
| <kbd>J</kbd> / <kbd>↓</kbd> | Next prospect |
| <kbd>K</kbd> / <kbd>↑</kbd> | Previous prospect |

---

## Meta Webhook Subscription Details

To enable automatic reply tracking:
1. In [developers.facebook.com](https://developers.facebook.com), open your app with Instagram Graph API.
2. Under **Instagram** → **Webhooks**, set:
   - **Callback URL**: `https://<YOUR-DEPLOYED-URL>/api/webhooks/instagram`
   - **Verify Token**: `vault_outreach_meta_token_2026` (or custom `META_VERIFY_TOKEN`)
3. Subscribe to the `messages` event.
4. When incoming DMs arrive, Meta verifies with your server and automatically updates the prospect's status in Outreach OS.
