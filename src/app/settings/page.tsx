'use client';

import React, { useEffect, useState } from 'react';
import {
  Globe,

  DollarSign,
  ShieldCheck,
  Copy,
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info
} from 'lucide-react';
import { SenderAccount } from '@/types';

export default function SettingsPage() {
  const [sender, setSender] = useState<SenderAccount | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<{
    configured: boolean;
    canRead: boolean;
    canWrite: boolean;
    keyRole: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.sender) {
            setSender(data.sender);
            setDisplayName(data.sender.display_name || 'Paritosh');
            setUsername(data.sender.instagram_username || 'vault.moment');
          }
          if (data.databaseStatus) {
            setDatabaseStatus(data.databaseStatus);
          }
        }
      });
  }, []);


  const handleSaveSender = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          instagram_username: username
        })
      });
      const data = await res.json();
      if (data.success) {
        setSender(data.sender);
        setSavedNotice('Sender account settings updated.');
        setTimeout(() => setSavedNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
      {/* Toast Notice */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xl border border-zinc-800 animate-in fade-in duration-150">
          {savedNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <h1 className="text-lg font-medium tracking-tight text-zinc-900">System Settings &amp; Integrations</h1>
        <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed font-normal">
          Configure sender profile for Vault, review cost controls, and connect Meta reply webhook.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* 1. Sender Profile */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-zinc-100 pb-3.5">
            <div>
              <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-zinc-700" />
                <span>Founder Sender Account</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed font-normal">
                Used to interpolate &#123;&#123;sender_name&#125;&#125; and &#123;&#123;vault_username&#125;&#125; in outreach messages.
              </p>
            </div>
            <span className="self-start sm:self-center inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 shrink-0 whitespace-nowrap">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Zero Credentials Stored</span>
            </span>
          </div>

          <form onSubmit={handleSaveSender} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-medium text-zinc-600">Your First Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-medium text-zinc-600">Vault Instagram Handle</label>
              <div className="mt-1 flex items-center rounded-lg bg-zinc-50/60 border border-zinc-300 px-2.5">
                <span className="text-zinc-400 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-transparent p-2 text-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-zinc-400 font-normal">
                You will manually send each message in the official Instagram web interface.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="btn-insta rounded-xl px-4 py-2.5 text-xs font-medium text-white transition shadow-xs cursor-pointer w-full sm:w-auto"
              >
                {saving ? 'Saving...' : 'Save Sender Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Meta Instagram Messaging Webhook Setup (Auto Reply Tracking) */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-zinc-100 pb-3.5">
            <div>
              <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span>Meta Official Messaging Webhook (Auto Reply Detection)</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed font-normal">
                Connect your Instagram Professional account via Meta Webhooks to detect replies automatically without sharing login credentials.
              </p>
            </div>
            <span className="self-start sm:self-center inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600 border border-zinc-200/80 shrink-0 whitespace-nowrap">
              Official Meta Graph API
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80 shadow-2xs">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Webhook Callback URL</div>
              <div className="mt-1 flex items-center justify-between font-mono text-zinc-800">
                <span className="truncate pr-2">https://&lt;your-app-domain&gt;/api/webhooks/instagram</span>
                <button
                  onClick={() => copyToClipboard('webhook', 'https://your-domain.com/api/webhooks/instagram')}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80 shadow-2xs">
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Webhook Verify Token (META_VERIFY_TOKEN)</div>
              <div className="mt-1 flex items-center justify-between font-mono text-zinc-800">
                <span>vault_outreach_meta_token_2026</span>
                <button
                  onClick={() => copyToClipboard('token', 'vault_outreach_meta_token_2026')}
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 leading-relaxed font-normal">
              <strong className="font-medium text-zinc-700">Workflow:</strong> When a prospect DMs your account, Meta pushes an event to <code className="text-zinc-900 font-mono bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200">/api/webhooks/instagram</code>, matching their Instagram handle and advancing their status from <strong>CONTACTED</strong> to <strong>REPLIED</strong> automatically.
            </div>
          </div>
        </div>

        {/* 3. Cost Controls & Guardrails */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-1.5 border-b border-zinc-100 pb-3">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Server-Enforced Cost Guardrails ($0 Out-of-Pocket Target)</span>
          </h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
              <div className="text-zinc-500 font-normal">Monthly Budget Ceiling</div>
              <div className="mt-1 font-mono text-base font-semibold text-zinc-900">$4.50 USD</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Stops runs if ceiling is met</div>
            </div>

            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
              <div className="text-zinc-500 font-normal">Daily Qualified Lead Cap</div>
              <div className="mt-1 font-mono text-base font-semibold text-zinc-900">60 Leads / Day</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Enforces human focus</div>
            </div>

            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
              <div className="text-zinc-500 font-normal">Max Raw Profiles Scraped</div>
              <div className="mt-1 font-mono text-base font-semibold text-zinc-900">150 / Run</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Prevents runaway scrape jobs</div>
            </div>
          </div>
        </div>

        {/* 4. Supabase Database & Persistence Status */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-zinc-100 pb-3">
            <h2 className="text-sm font-medium text-zinc-900 flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-600" />
              <span>Database & Cloud Persistence</span>
            </h2>
            <span className={`self-start sm:self-center inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium border shrink-0 whitespace-nowrap ${
              databaseStatus?.canWrite
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : databaseStatus?.configured
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
            }`}>
              {databaseStatus?.canWrite ? 'Connected & Writable' : databaseStatus?.configured ? 'RLS Protected (Memory Fallback Active)' : 'In-Memory Only'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
              <div className="text-zinc-500 font-medium">Supabase URL</div>
              <div className="mt-1 font-mono text-xs font-bold text-zinc-900 truncate">
                {databaseStatus?.configured ? 'Connected' : 'Not configured'}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">PostgreSQL cloud instance</div>
            </div>

            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
              <div className="text-zinc-500 font-medium">Server Key Role</div>
              <div className="mt-1 font-mono text-xs font-bold text-zinc-900">
                {databaseStatus?.keyRole === 'service_role' ? 'service_role (Secret)' : databaseStatus?.keyRole === 'anon' ? 'anon (Public Key)' : 'Unknown'}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">Determines RLS bypass authority</div>
            </div>

            <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
              <div className="text-zinc-500 font-medium">Write Permission</div>
              <div className="mt-1 font-mono text-xs font-bold flex items-center gap-1">
                {databaseStatus?.canWrite ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> RLS Blocked
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {databaseStatus?.canWrite ? 'All writes save directly to PostgreSQL' : 'Writes fallback to in-memory store'}
              </div>
            </div>
          </div>

          {databaseStatus?.configured && !databaseStatus.canWrite && (
            <div className="mt-4 rounded-xl bg-amber-50/80 p-4 border border-amber-200/80 text-xs">
              <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Fix Supabase Write Access (30 Seconds)</span>
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed text-[11px]">
                Your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">SUPABASE_SERVICE_ROLE_KEY</code> is currently set to an <code className="font-semibold">anon</code> key, so Supabase blocks direct writes. To permanently store leads in Supabase:
              </p>
              <div className="mt-2.5 rounded-lg bg-zinc-900 p-2.5 font-mono text-[11px] text-zinc-100 flex items-center justify-between">
                <span className="truncate pr-2">ALTER TABLE leads DISABLE ROW LEVEL SECURITY; ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;</span>
                <button
                  onClick={() => copyToClipboard('rls_sql', 'ALTER TABLE leads DISABLE ROW LEVEL SECURITY; ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY; ALTER TABLE campaign_leads DISABLE ROW LEVEL SECURITY; ALTER TABLE message_templates DISABLE ROW LEVEL SECURITY; ALTER TABLE sender_accounts DISABLE ROW LEVEL SECURITY; ALTER TABLE outreach_events DISABLE ROW LEVEL SECURITY; ALTER TABLE discovery_runs DISABLE ROW LEVEL SECURITY; ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY; ALTER TABLE auth_lockouts DISABLE ROW LEVEL SECURITY;')}
                  className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-1 text-[10px] font-semibold text-zinc-200 shrink-0 cursor-pointer"
                >
                  {copiedKey === 'rls_sql' ? 'Copied SQL!' : 'Copy SQL'}
                </button>
              </div>
              <div className="mt-2 text-[10px] text-amber-700">
                Run this SQL in your Supabase Dashboard &rarr; <strong>SQL Editor</strong>, or copy the secret <strong>service_role</strong> key from Supabase Project Settings &rarr; API into Cloud Run.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
