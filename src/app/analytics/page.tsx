'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Flame,
  Award
} from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.analytics);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Outreach &amp; Conversion Analytics</h1>
        <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed">
          Tracking the core funnel: Qualified Leads → Sent → Replied → Tried Vault → Sent 2nd Reel → Paid.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-xs text-zinc-400 py-12">Loading analytics...</div>
      ) : stats ? (
        <div className="mt-6 space-y-6">
          {/* Funnel Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-4.5 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase">Leads Discovered</div>
              <div className="mt-1 text-2xl font-bold font-mono text-zinc-900">{stats.leadsDiscovered}</div>
              <div className="mt-1 text-[11px] text-zinc-600 font-medium">{stats.qualifiedLeads} qualified</div>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-4.5 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase">Messages Sent</div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">{stats.messagesSent}</div>
              <div className="mt-1 text-[11px] text-zinc-500">Manual founder sends</div>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-4.5 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase">Replies Detected</div>
              <div className="mt-1 text-2xl font-bold font-mono text-rose-700">{stats.replies}</div>
              <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                {stats.responseRatePercent}% response rate
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-4.5 shadow-xs">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase">Avg Replied Lead Score</div>
              <div className="mt-1 text-2xl font-bold font-mono text-zinc-900">
                {stats.avgScoreReplied} <span className="text-xs text-zinc-400 font-normal">pts</span>
              </div>
              <div className="mt-1 text-[11px] text-zinc-500">Strong correlation with Tier A</div>
            </div>
          </div>

          {/* Core Vault Product Adoption Funnel */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <span>Vault Product Signal Funnel</span>
            </h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              The true validation signal is whether a creator actually sent a Reel to @vault.moment, and then sent a 2nd Reel organically.
            </p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-zinc-50/70 p-3.5 border border-zinc-200/80">
                <div className="text-zinc-500 font-medium">1. Contacted</div>
                <div className="text-lg font-bold font-mono text-zinc-900 mt-1">{stats.messagesSent}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">DMs Sent</div>
              </div>

              <div className="rounded-xl bg-rose-50/50 p-3.5 border border-rose-200">
                <div className="text-rose-700 font-bold">2. Replied</div>
                <div className="text-lg font-bold font-mono text-rose-800 mt-1">{stats.replies}</div>
                <div className="text-[10px] text-rose-600/80 mt-0.5">Engaged in DM</div>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3.5 border border-indigo-200">
                <div className="text-indigo-700 font-bold">3. Tried Vault</div>
                <div className="text-lg font-bold font-mono text-indigo-900 mt-1">{stats.usedVaultCount}</div>
                <div className="text-[10px] text-indigo-600/80 mt-0.5">Sent 1st Reel to Bot</div>
              </div>

              <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200">
                <div className="text-amber-800 font-bold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-600" />
                  <span>4. Sent 2nd Reel ★</span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-900 mt-1">{stats.secondReelCount}</div>
                <div className="text-[10px] text-amber-700 font-medium mt-0.5">Organic Retention Signal!</div>
              </div>
            </div>
          </div>

          {/* Sub-breakdowns: Replies by Niche & Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Replies by Niche
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                {stats.repliesByNiche.map((item: any) => (
                  <div key={item.niche} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="capitalize text-zinc-700 font-medium">{item.niche}</span>
                    <span className="font-mono text-zinc-900 font-bold">{item.count} replies</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Replies by Template
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                {stats.repliesByTemplate.map((item: any) => (
                  <div key={item.templateName} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-zinc-700 font-medium truncate max-w-[240px]">{item.templateName}</span>
                    <span className="font-mono text-rose-700 font-bold">{item.count} replies</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
