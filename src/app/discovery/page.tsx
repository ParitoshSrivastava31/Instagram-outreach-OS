'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Users,
  CheckCircle2,
  XCircle,
  ArrowRight,
  DollarSign,
  Info
} from 'lucide-react';

import { Campaign, MonthlyBudgetStatus } from '@/types';

export default function DiscoveryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('camp-creator-researchers');
  const [budgetStatus, setBudgetStatus] = useState<MonthlyBudgetStatus | null>(null);
  const [providerInfo, setProviderInfo] = useState<{ id: string; name: string; isMock: boolean } | null>(null);
  const [forceMock, setForceMock] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<any | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [maxProfiles, setMaxProfiles] = useState(150);

  // Follower range configuration
  const [minFollowers, setMinFollowers] = useState(1000);
  const [maxFollowers, setMaxFollowers] = useState(20000);
  const [databaseStatus, setDatabaseStatus] = useState<{
    configured: boolean;
    canRead: boolean;
    canWrite: boolean;
    keyRole: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.campaigns.length > 0) {
          setCampaigns(data.campaigns);
        }
      });

    fetch('/api/discovery/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBudgetStatus(data.budgetStatus);
          setProviderInfo(data.provider);
          if (data.databaseStatus) setDatabaseStatus(data.databaseStatus);
          if (data.provider.isMock) setForceMock(true);
        }
      });
  }, []);


  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  const handleRunDiscovery = async () => {
    setIsRunning(true);
    setRunResult(null);
    setRunError(null);

    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          maxProfiles,
          forceMock
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRunError(data.error || 'Discovery run failed');
        if (data.budgetStatus) setBudgetStatus(data.budgetStatus);
      } else {
        setRunResult(data);
        const statusRes = await fetch('/api/discovery/status');
        const statusData = await statusRes.json();
        if (statusData.success) {
          setBudgetStatus(statusData.budgetStatus);
        }
      }
    } catch (err: any) {
      setRunError(err.message || 'Network error executing discovery run');
    } finally {
      setIsRunning(false);
    }
  };

  const isBudgetBlocked = budgetStatus?.is_budget_exceeded || false;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Run Prospect Discovery</h1>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 border border-zinc-200/60">
                Deterministic Search Pipeline
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed">
              Scrapes public Instagram profiles, filters exclusions, calculates lead score, and prepares personalized messages for Vault.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 border border-zinc-200 hover:bg-zinc-50 transition shadow-2xs"
          >
            <span>View Today&apos;s Outreach Queue</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Monthly Budget Warning Banner if Budget Reached */}
      {isBudgetBlocked && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">Monthly Discovery Budget Reached</h3>
              <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                To guarantee zero unexpected out-of-pocket costs, further discovery runs are prevented until the next monthly billing cycle.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono">
                <div className="text-zinc-700">Monthly Ceiling: <span className="font-bold text-zinc-900">${budgetStatus?.monthly_budget_usd.toFixed(2)}</span></div>
                <div className="text-rose-700">Estimated Usage: <span className="font-bold">${budgetStatus?.estimated_usage_usd.toFixed(2)}</span></div>
                <div className="text-emerald-700">Remaining: <span className="font-bold">${budgetStatus?.remaining_budget_usd.toFixed(2)}</span></div>
                <div className="text-zinc-700">Days Elapsed: <span className="font-bold">{budgetStatus?.days_elapsed} / 30</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Pre-Flight Configuration Grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pre-Flight Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Campaign Selection */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-zinc-900" />
              <span>Target Campaign</span>
            </label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {campaigns.map(camp => (
                <button
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                    selectedCampaignId === camp.id
                      ? 'bg-zinc-50 border-zinc-900 text-zinc-900 shadow-2xs ring-1 ring-zinc-900/10'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50/60 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-semibold text-zinc-950">{camp.name}</div>
                  <div className="mt-1 text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{camp.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Follower Range Configuration */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-4 w-4 text-zinc-900" />
                <span>Follower Thresholds</span>
              </label>
              <span className="text-xs font-mono font-semibold text-zinc-900">
                {minFollowers.toLocaleString()} – {maxFollowers.toLocaleString()} followers
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
              Default is 1K to 20K. Focuses on emerging creator-operators where direct founder response is highest.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-zinc-600">Minimum Followers</span>
                <select
                  value={minFollowers}
                  onChange={e => setMinFollowers(parseInt(e.target.value, 10))}
                  className="mt-1.5 w-full rounded-lg bg-zinc-50/50 p-2 text-xs text-zinc-900 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none shadow-2xs"
                >
                  <option value={500}>500</option>
                  <option value={1000}>1,000 (Default)</option>
                  <option value={2000}>2,000</option>
                  <option value={5000}>5,000</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-600">Maximum Followers</span>
                <select
                  value={maxFollowers}
                  onChange={e => setMaxFollowers(parseInt(e.target.value, 10))}
                  className="mt-1.5 w-full rounded-lg bg-zinc-50/50 p-2 text-xs text-zinc-900 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none shadow-2xs"
                >
                  <option value={10000}>10,000</option>
                  <option value={20000}>20,000 (Default)</option>
                  <option value={50000}>50,000</option>
                  <option value={100000}>100,000</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Keyword Taxonomy Breakdown */}
          {activeCampaign && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs space-y-3.5">
              <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Active Campaign Keyword Taxonomy
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-700">Role Keywords:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeCampaign.role_keywords.map(k => (
                    <span key={k} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 border border-zinc-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-700">Research &amp; Problem Signals:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeCampaign.research_keywords.map(k => (
                    <span key={k} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                      &quot;{k}&quot;
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-700">Niche Focus:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeCampaign.niche_keywords.map(k => (
                    <span key={k} className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-zinc-700">Excluded (Penalized -30pts):</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeCampaign.excluded_keywords.map(k => (
                    <span key={k} className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Cost Controls, Provider & Action (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pre-flight Budget & Limits Card */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Cost &amp; Run Limits</span>
            </h3>

            <div className="mt-3 space-y-2.5 divide-y divide-zinc-100 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500">Monthly Budget Ceiling:</span>
                <span className="font-mono font-bold text-zinc-900">
                  ${budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500">Estimated Usage to Date:</span>
                <span className="font-mono font-bold text-zinc-700">
                  ${budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500">Remaining Budget:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ${budgetStatus ? budgetStatus.remaining_budget_usd.toFixed(2) : '4.50'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500">Max Raw Profiles / Run:</span>
                <span className="font-mono text-zinc-700">150 profiles</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500">Daily Qualified Lead Cap:</span>
                <span className="font-mono text-zinc-900 font-semibold">60 leads / day</span>
              </div>
            </div>

            {/* Provider Switcher / Sandbox Mode */}
            <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-900">
                    {providerInfo?.isMock ? 'Sandbox Simulator' : 'Apify Live Actor'}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {forceMock ? 'Zero-cost test profiles' : 'Live public Instagram search'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceMock}
                    onChange={e => setForceMock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-950"></div>
                </label>
              </div>
              <div className="mt-2 text-[10px] text-zinc-500 leading-normal">
                Toggle Sandbox mode on to test the full pipeline and scoring without consuming Apify credits.
              </div>
            </div>

            {/* Execute Run Button */}
            <button
              onClick={handleRunDiscovery}
              disabled={isRunning || isBudgetBlocked}
              className={`mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 ${
                isBudgetBlocked
                  ? 'bg-zinc-200 cursor-not-allowed text-zinc-400'
                  : isRunning
                  ? 'bg-zinc-800 text-white cursor-wait'
                  : 'btn-insta'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{isRunning ? 'Discovering & Scoring Profiles...' : 'Run Discovery Now'}</span>
            </button>
          </div>

          {/* Run Error Display */}
          {runError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-800">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <XCircle className="h-4 w-4" />
                <span>Discovery Execution Error</span>
              </div>
              <p className="mt-1 leading-relaxed">{runError}</p>
            </div>
          )}

          {/* Supabase RLS Warning Banner */}
          {databaseStatus && !databaseStatus.canWrite && (
            <div className="rounded-2xl border border-amber-200/90 bg-amber-50/60 p-4 text-xs text-amber-900 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Supabase Persistence Notice</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                Row Level Security is enabled on Supabase while using an anon key, so writes are safely held in memory. For permanent cloud storage, run the disable RLS SQL in Supabase or set the service_role key.
              </p>
            </div>
          )}

          {/* Post-Run Results Summary */}
          {runResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Discovery Run Completed</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white p-2.5 border border-zinc-200">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase">PROFILES DISCOVERED</div>
                  <div className="text-base font-bold font-mono text-zinc-900">
                    {runResult.runSummary.profilesDiscovered}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-zinc-200">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase">FILTERED / REJECTED</div>
                  <div className="text-base font-bold font-mono text-rose-600">
                    {runResult.runSummary.profilesRejected}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-zinc-200">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase">ALREADY IN DATABASE</div>
                  <div className="text-base font-bold font-mono text-zinc-500">
                    {runResult.runSummary.profilesAlreadyKnown}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-zinc-200">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase">ADDED TO QUEUE</div>
                  <div className="text-base font-bold font-mono text-emerald-700">
                    +{runResult.runSummary.leadsAddedToQueue}
                  </div>
                </div>
              </div>

              {/* Tier breakdown */}
              <div className="mt-3 rounded-xl bg-white p-3 border border-zinc-200">
                <div className="text-[11px] font-semibold text-zinc-700 mb-1.5">Lead Quality Breakdown:</div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-indigo-700 font-semibold">Tier A: {runResult.runSummary.tierACount}</span>
                  <span className="text-sky-700 font-semibold">Tier B: {runResult.runSummary.tierBCount}</span>
                  <span className="text-amber-700 font-semibold">Tier C: {runResult.runSummary.tierCCount}</span>
                </div>
              </div>

              {/* Dynamic Actions based on whether new leads were added */}
              {runResult.runSummary.leadsAddedToQueue > 0 ? (
                <Link
                  href="/"
                  className="mt-4 btn-insta flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold text-white transition shadow-2xs"
                >
                  <span>Process {runResult.runSummary.leadsAddedToQueue} Leads in Outreach Queue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <div className="mt-3.5 space-y-2">
                  <div className="rounded-xl bg-white/90 p-2.5 border border-zinc-200/80 text-[11px] text-zinc-600 leading-relaxed">
                    <span className="font-semibold text-zinc-900">0 new leads added to queue. </span>
                    {runResult.runSummary.profilesAlreadyKnown > 0
                      ? `${runResult.runSummary.profilesAlreadyKnown} matching profiles were already saved in your database previously.`
                      : 'All discovered profiles were outside follower thresholds or disqualified.'}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/leads"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 hover:bg-black py-2.5 text-xs font-bold text-white transition shadow-2xs"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>View Database Leads</span>
                    </Link>
                    <Link
                      href="/"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200/90 py-2 text-xs font-semibold text-zinc-800 transition shadow-2xs"
                    >
                      <span>Open Queue</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
