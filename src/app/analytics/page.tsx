'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  CheckCircle2
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
      <div className="border-b border-[#262938] pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">Outreach &amp; Conversion Analytics</h1>
        <p className="mt-1 text-xs text-gray-400">
          Tracking the core funnel: Qualified Leads → Sent → Replied → Tried Vault → Sent 2nd Reel → Paid.
        </p>
      </div>

      {loading ? (
        <div className="text-center text-xs text-gray-500 py-12">Loading analytics...</div>
      ) : stats ? (
        <div className="mt-6 space-y-6">
          {/* Funnel Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#262938] bg-[#141620] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 uppercase">Leads Discovered</div>
              <div className="mt-1 text-2xl font-bold font-mono text-white">{stats.leadsDiscovered}</div>
              <div className="mt-1 text-[11px] text-indigo-400">{stats.qualifiedLeads} qualified</div>
            </div>

            <div className="rounded-xl border border-[#262938] bg-[#141620] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 uppercase">Messages Sent</div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">{stats.messagesSent}</div>
              <div className="mt-1 text-[11px] text-gray-400">Manual founder sends</div>
            </div>

            <div className="rounded-xl border border-[#262938] bg-[#141620] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 uppercase">Replies Detected</div>
              <div className="mt-1 text-2xl font-bold font-mono text-pink-400">{stats.replies}</div>
              <div className="mt-1 text-[11px] text-gray-400 font-mono">
                {stats.responseRatePercent}% response rate
              </div>
            </div>

            <div className="rounded-xl border border-[#262938] bg-[#141620] p-4 shadow-sm">
              <div className="text-[11px] font-semibold text-gray-400 uppercase">Avg Replied Lead Score</div>
              <div className="mt-1 text-2xl font-bold font-mono text-amber-300">
                {stats.avgScoreReplied} <span className="text-xs text-gray-400">pts</span>
              </div>
              <div className="mt-1 text-[11px] text-gray-400">Strong correlation with Tier A</div>
            </div>
          </div>

          {/* Core Vault Product Adoption Funnel (Prompt Section 30) */}
          <div className="rounded-xl border border-[#262938] bg-[#141620] p-5 shadow-sm">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Vault Product Signal Funnel</span>
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              The true validation signal is whether a creator actually sent a Reel to @vault.moment, and then sent a 2nd Reel organically.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-lg bg-[#0e1017] p-3 border border-[#262938]">
                <div className="text-gray-400">1. Contacted</div>
                <div className="text-lg font-bold font-mono text-white mt-1">{stats.messagesSent}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">DMs Sent</div>
              </div>

              <div className="rounded-lg bg-[#0e1017] p-3 border border-[#262938]">
                <div className="text-pink-400 font-semibold">2. Replied</div>
                <div className="text-lg font-bold font-mono text-pink-300 mt-1">{stats.replies}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Engaged in DM</div>
              </div>

              <div className="rounded-lg bg-[#0e1017] p-3 border border-[#262938]">
                <div className="text-indigo-400 font-semibold">3. Tried Vault</div>
                <div className="text-lg font-bold font-mono text-indigo-300 mt-1">{stats.usedVaultCount}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Sent 1st Reel to Bot</div>
              </div>

              <div className="rounded-lg bg-[#0e1017] p-3 border border-amber-500/30 bg-amber-950/20">
                <div className="text-amber-400 font-bold flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  <span>4. Sent 2nd Reel ★</span>
                </div>
                <div className="text-lg font-bold font-mono text-amber-200 mt-1">{stats.secondReelCount}</div>
                <div className="text-[10px] text-amber-300/80 mt-0.5">Organic Retention Signal!</div>
              </div>
            </div>
          </div>

          {/* Sub-breakdowns: Replies by Niche & Template */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#262938] bg-[#141620] p-5 shadow-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Replies by Niche
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                {stats.repliesByNiche.map((item: any) => (
                  <div key={item.niche} className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-[#222533]">
                    <span className="capitalize text-gray-300 font-medium">{item.niche}</span>
                    <span className="font-mono text-indigo-400 font-bold">{item.count} replies</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#262938] bg-[#141620] p-5 shadow-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Replies by Template
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                {stats.repliesByTemplate.map((item: any) => (
                  <div key={item.templateName} className="flex items-center justify-between p-2 rounded bg-[#0e1017] border border-[#222533]">
                    <span className="text-gray-300 font-medium truncate max-w-[240px]">{item.templateName}</span>
                    <span className="font-mono text-pink-400 font-bold">{item.count} replies</span>
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
