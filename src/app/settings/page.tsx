'use client';

import React, { useEffect, useState } from 'react';
import {
  Globe,
  DollarSign,
  ShieldCheck,
  Copy
} from 'lucide-react';
import { SenderAccount } from '@/types';

export default function SettingsPage() {
  const [sender, setSender] = useState<SenderAccount | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sender) {
          setSender(data.sender);
          setDisplayName(data.sender.display_name || 'Paritosh');
          setUsername(data.sender.instagram_username || 'vault.moment');
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
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl">
          {savedNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">System Settings &amp; Integrations</h1>
        <p className="mt-1 text-xs text-slate-500">
          Configure sender profile for Vault, review cost controls, and connect Meta reply webhook.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {/* 1. Sender Profile */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-indigo-600" />
                <span>Founder Sender Account</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Used to interpolate &#123;&#123;sender_name&#125;&#125; and &#123;&#123;vault_username&#125;&#125; in outreach messages.
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Zero Credentials Stored</span>
            </span>
          </div>

          <form onSubmit={handleSaveSender} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Your First Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg bg-slate-50 p-2 text-slate-900 border border-slate-300 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Vault Instagram Handle</label>
              <div className="mt-1 flex items-center rounded-lg bg-slate-50 border border-slate-300 px-2.5">
                <span className="text-slate-400 font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-transparent p-2 text-slate-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400 italic">
                You will manually send each message in the official Instagram web interface.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-900 hover:bg-black px-4 py-2 text-xs font-semibold text-white transition shadow-2xs cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Sender Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Meta Instagram Messaging Webhook Setup (Auto Reply Tracking) */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Meta Official Messaging Webhook (Auto Reply Detection)</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Connect your Instagram Professional account via Meta Webhooks to detect replies automatically without sharing login credentials.
              </p>
            </div>
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
              Official Meta Graph API
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-lg bg-white p-3 border border-rose-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Webhook Callback URL</div>
              <div className="mt-1 flex items-center justify-between font-mono text-slate-800">
                <span className="truncate">https://&lt;your-app-domain&gt;/api/webhooks/instagram</span>
                <button
                  onClick={() => copyToClipboard('webhook', 'https://your-domain.com/api/webhooks/instagram')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-white p-3 border border-rose-200 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Webhook Verify Token (META_VERIFY_TOKEN)</div>
              <div className="mt-1 flex items-center justify-between font-mono text-slate-800">
                <span>vault_outreach_meta_token_2026</span>
                <button
                  onClick={() => copyToClipboard('token', 'vault_outreach_meta_token_2026')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Workflow:</strong> When a prospect DMs your account, Meta pushes an event to <code className="text-rose-700 font-mono bg-rose-100/60 px-1 py-0.5 rounded">/api/webhooks/instagram</code>, matching their Instagram handle and advancing their status from <strong>CONTACTED</strong> to <strong>REPLIED</strong> automatically!
            </div>
          </div>
        </div>

        {/* 3. Cost Controls & Guardrails */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Server-Enforced Cost Guardrails ($0 Out-of-Pocket Target)</span>
          </h2>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="text-slate-500 font-medium">Monthly Budget Ceiling</div>
              <div className="mt-1 font-mono text-base font-bold text-emerald-700">$4.50 USD</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Stops runs if ceiling is met</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="text-slate-500 font-medium">Daily Qualified Lead Cap</div>
              <div className="mt-1 font-mono text-base font-bold text-indigo-700">60 Leads / Day</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Enforces human focus</div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
              <div className="text-slate-500 font-medium">Max Raw Profiles Scraped</div>
              <div className="mt-1 font-mono text-base font-bold text-slate-800">150 / Run</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Prevents runaway scrape jobs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
