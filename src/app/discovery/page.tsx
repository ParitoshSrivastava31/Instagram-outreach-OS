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
  Info,
  ExternalLink,
  X,
  KeyRound,
  RotateCcw,
  Loader2,
  Radio,
  Search,
  Filter
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

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRunning) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const discoveryPhases = [
    {
      title: 'Connecting to Scraper API...',
      subtitle: forceMock ? 'Accessing zero-cost sandbox database' : 'Initializing Apify Instagram Scraper actor & proxy grid',
      icon: Radio,
    },
    {
      title: 'Crawling Creator Keywords & Hashtags...',
      subtitle: `Scanning target keywords (${activeCampaign?.keywords?.slice(0, 3).join(', ') || 'creators'})`,
      icon: Search,
    },
    {
      title: 'Extracting Bios & Engagement Metrics...',
      subtitle: 'Gathering follower counts, bios, and latest Reels captions',
      icon: Users,
    },
    {
      title: 'Scoring Profiles & Role Taxonomy...',
      subtitle: 'Filtering exclusions and evaluating Tier A/B/C lead thresholds',
      icon: Filter,
    },
    {
      title: 'Preparing Personalized Vault DMs...',
      subtitle: 'Interpolating objective research signals into DM templates',
      icon: Sparkles,
    },
  ];

  const currentPhaseIndex = Math.min(
    Math.floor(elapsedSeconds / 8),
    discoveryPhases.length - 1
  );

  const currentPhase = discoveryPhases[currentPhaseIndex];

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

  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  const handleRecoverRun = async () => {
    setIsRecovering(true);
    setRunError(null);
    setRecoveryNotice(null);
    try {
      const res = await fetch('/api/discovery/recover-last-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaignId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRunError(data.error || 'Failed to sync paid run dataset');
      } else {
        setRunResult({
          provider: 'Apify Dataset Recovery',
          isMock: false,
          runSummary: data.runSummary
        });
        setRecoveryNotice(`Successfully synced ${data.recoveredCount} verified creators from paid Apify run into your Queue!`);
        setTimeout(() => setRecoveryNotice(null), 6000);
      }
    } catch (e: any) {
      setRunError(e.message || 'Error syncing dataset');
    } finally {
      setIsRecovering(false);
    }
  };

  const [isResettingBudget, setIsResettingBudget] = useState(false);

  const handleResetBudget = async () => {
    setIsResettingBudget(true);
    try {
      const res = await fetch('/api/discovery/reset-budget', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.budgetStatus) {
        setBudgetStatus(data.budgetStatus);
        setRecoveryNotice('Budget counter reset to $0.00 for your fresh Apify account.');
        setTimeout(() => setRecoveryNotice(null), 5000);
      }
    } catch {
      // fallback
    } finally {
      setIsResettingBudget(false);
    }
  };

  const isBudgetBlocked = budgetStatus?.is_budget_exceeded || false;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-medium tracking-tight text-zinc-900">Run Prospect Discovery</h1>
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600 border border-zinc-200/70 shrink-0 whitespace-nowrap">
                Deterministic Search Pipeline
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed font-normal">
              Scrapes public Instagram profiles, filters exclusions, calculates lead score, and prepares personalized messages for Vault.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50 transition shadow-2xs w-full sm:w-auto"
          >
            <span>View Today&apos;s Outreach Queue</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Monthly Budget Warning Banner if Budget Reached */}
      {isBudgetBlocked && (
        <div className="mt-6 rounded-2xl border border-rose-200/90 bg-linear-to-b from-rose-50/90 via-rose-50/50 to-white p-4 sm:p-5 shadow-xs transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-2xs mt-0.5">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-rose-950 tracking-tight">
                    Monthly Discovery Budget Limit Reached
                  </h3>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-700 border border-rose-200">
                    COST CEILING ENFORCED
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-900/80 leading-relaxed font-normal">
                  To guarantee zero unexpected out-of-pocket costs, further live discovery runs are paused until the next monthly billing cycle resets.
                </p>

                <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="rounded-xl bg-white/90 p-2.5 border border-rose-100 shadow-2xs">
                    <div className="text-[10px] text-zinc-400 font-sans uppercase">Ceiling</div>
                    <div className="font-semibold text-zinc-900 mt-0.5">${budgetStatus?.monthly_budget_usd.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl bg-white/90 p-2.5 border border-rose-100 shadow-2xs">
                    <div className="text-[10px] text-zinc-400 font-sans uppercase">Estimated Usage</div>
                    <div className="font-semibold text-rose-600 mt-0.5">${budgetStatus?.estimated_usage_usd.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl bg-white/90 p-2.5 border border-rose-100 shadow-2xs">
                    <div className="text-[10px] text-zinc-400 font-sans uppercase">Remaining</div>
                    <div className="font-semibold text-emerald-700 mt-0.5">${budgetStatus?.remaining_budget_usd.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl bg-white/90 p-2.5 border border-rose-100 shadow-2xs">
                    <div className="text-[10px] text-zinc-400 font-sans uppercase">Billing Cycle</div>
                    <div className="font-semibold text-zinc-800 mt-0.5">Day {budgetStatus?.days_elapsed} / 30</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:self-start shrink-0">
              <button
                onClick={handleResetBudget}
                disabled={isResettingBudget}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-white border border-rose-200 px-3.5 py-2 text-xs font-medium text-rose-800 hover:bg-rose-50 transition shadow-2xs cursor-pointer active:scale-95"
              >
                <RotateCcw className={`h-3.5 w-3.5 text-rose-600 ${isResettingBudget ? 'animate-spin' : ''}`} />
                <span>{isResettingBudget ? 'Resetting...' : 'Reset Counter ($0.00)'}</span>
              </button>

              <button
                onClick={() => setForceMock(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition shadow-xs cursor-pointer active:scale-95"
              >
                <span>Use Sandbox Mode ($0)</span>
                <ArrowRight className="h-3 w-3 text-zinc-400" />
              </button>
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
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-500" />
              <span>Target Campaign</span>
            </label>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {campaigns.map(camp => (
                <button
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`text-left p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                    selectedCampaignId === camp.id
                      ? 'bg-zinc-50 border-zinc-900 text-zinc-900 shadow-2xs ring-1 ring-zinc-900/10'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50/60 hover:border-zinc-300'
                  }`}
                >
                  <div className="font-medium text-zinc-900">{camp.name}</div>
                  <div className="mt-1 text-[11px] text-zinc-500 font-normal line-clamp-2 leading-relaxed">{camp.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Follower Range Configuration */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span>Follower Thresholds</span>
              </label>
              <span className="text-xs font-mono font-medium text-zinc-700">
                {minFollowers.toLocaleString()} – {maxFollowers.toLocaleString()} followers
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 font-normal leading-relaxed">
              Default is 1K to 20K. Focuses on emerging creator-operators where direct founder response is highest.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-medium text-zinc-600">Minimum Followers</span>
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
            <h3 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Cost &amp; Run Limits</span>
            </h3>

            <div className="mt-3 space-y-2.5 divide-y divide-zinc-100 text-xs">
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500 font-normal">Monthly Budget Ceiling:</span>
                <span className="font-mono font-medium text-zinc-900">
                  ${budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500 font-normal">Estimated Usage to Date:</span>
                <span className="font-mono font-medium text-zinc-700">
                  ${budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500 font-normal">Remaining Budget:</span>
                <span className="font-mono font-medium text-emerald-700">
                  ${budgetStatus ? budgetStatus.remaining_budget_usd.toFixed(2) : '4.50'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500 font-normal">Max Raw Profiles / Run:</span>
                <span className="font-mono text-zinc-700 font-normal">150 profiles</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500 font-normal">Daily Qualified Lead Cap:</span>
                <span className="font-mono text-zinc-800 font-medium">60 leads / day</span>
              </div>
            </div>

            {/* Provider Switcher / Sandbox Mode */}
            <div className="mt-4 rounded-xl bg-zinc-50 p-3.5 border border-zinc-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-zinc-900">
                    {providerInfo?.isMock ? 'Sandbox Simulator' : 'Apify Live Actor'}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
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
              <div className="mt-2 text-[10px] text-zinc-500 leading-normal font-normal">
                Toggle Sandbox mode on to test the full pipeline and scoring without consuming Apify credits.
              </div>
            </div>

            {/* Execute Run Button with animated shimmer & dynamic states */}
            <button
              onClick={handleRunDiscovery}
              disabled={isRunning || (isBudgetBlocked && !forceMock)}
              className={`relative mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-4 text-xs font-semibold shadow-xs transition-all duration-300 cursor-pointer overflow-hidden ${
                isBudgetBlocked && !forceMock
                  ? 'bg-zinc-200 cursor-not-allowed text-zinc-400'
                  : isRunning
                  ? 'btn-discovery-running text-white cursor-wait select-none'
                  : 'btn-insta active:scale-[0.98]'
              }`}
            >
              {/* Shimmer sweep reflection on top of button while running */}
              {isRunning && (
                <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmerSweep_2.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent" />
              )}

              {isRunning ? (
                <div className="relative flex items-center justify-between w-full">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                    <span className="truncate tracking-tight font-medium text-[11px] sm:text-xs">
                      {currentPhase.title}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] font-semibold bg-white/20 rounded-md px-1.5 py-0.5 ml-2 shrink-0 backdrop-blur-xs text-white">
                    {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}s
                  </span>
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{forceMock ? 'Run Sandbox Discovery ($0)' : 'Run Discovery Now'}</span>
                </>
              )}
            </button>

            {/* Live Pipeline Monitor HUD Card when running */}
            {isRunning && (
              <div className="mt-3.5 rounded-2xl border border-pink-200/90 bg-linear-to-b from-pink-50/80 via-rose-50/40 to-white p-4 shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                {/* HUD Header */}
                <div className="flex items-center justify-between border-b border-pink-100/90 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-600" />
                    </span>
                    <span className="text-[11px] font-semibold text-zinc-900 tracking-tight">
                      Live Discovery Pipeline
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-100/90 px-2 py-0.5 text-[9px] font-mono font-medium text-pink-700 border border-pink-200/80">
                    ACTIVE SCRAPE
                  </span>
                </div>

                {/* Animated Gradient Progress Track */}
                <div className="mt-3">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-pink-100/80">
                    <div className="progress-beam absolute inset-0 w-1/2 rounded-full bg-linear-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] shadow-xs shadow-pink-500/50" />
                  </div>
                </div>

                {/* Current Stage Spotlight Card */}
                <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-white p-2.5 border border-pink-100/90 shadow-2xs">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-[#f09433] to-[#dc2743] text-white shadow-2xs mt-0.5">
                    {React.createElement(currentPhase.icon, { className: 'h-3.5 w-3.5 animate-pulse' })}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-zinc-900 leading-tight">
                      {currentPhase.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-normal leading-normal truncate">
                      {currentPhase.subtitle}
                    </div>
                  </div>
                </div>

                {/* Live Step Checklist */}
                <div className="mt-3 space-y-1 text-[10px]">
                  {discoveryPhases.map((phase, idx) => {
                    const isDone = idx < currentPhaseIndex;
                    const isCurrent = idx === currentPhaseIndex;
                    return (
                      <div
                        key={phase.title}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                          isCurrent
                            ? 'bg-white font-medium text-zinc-900 shadow-2xs border border-pink-100'
                            : isDone
                            ? 'text-emerald-700 font-normal'
                            : 'text-zinc-400 font-normal opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 className="h-3 w-3 text-pink-600 animate-spin shrink-0" />
                          ) : (
                            <div className="h-3 w-3 rounded-full border border-zinc-300 shrink-0" />
                          )}
                          <span className="truncate">{phase.title}</span>
                        </div>
                        <span className="font-mono text-[9px] uppercase tracking-wider shrink-0 text-zinc-400">
                          {isDone ? 'DONE' : isCurrent ? 'RUNNING' : 'QUEUED'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 text-[10px] text-zinc-400 text-center font-normal">
                  Apify Instagram crawler active. Leads will appear automatically when complete.
                </div>
              </div>
            )}

            {/* Re-sync / Recover previous run button */}
            <button
              onClick={handleRecoverRun}
              disabled={isRecovering || isRunning}
              className="mt-2.5 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>{isRecovering ? 'Syncing Paid Dataset...' : 'Sync Leads from Paid Apify Run'}</span>
            </button>
          </div>

          {/* Recovery Success Notification */}
          {recoveryNotice && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-2xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{recoveryNotice}</span>
            </div>
          )}

          {/* Enhanced Mobile-Responsive Error Display */}
          {runError && (
            <div className="rounded-2xl border border-rose-200/90 bg-linear-to-b from-rose-50/90 via-rose-50/40 to-white p-4 sm:p-5 shadow-xs transition-all duration-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-2xs mt-0.5">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-rose-950 tracking-tight">
                        {runError.includes('Usage Limit') || runError.includes('402') || runError.includes('credit')
                          ? 'Apify Monthly Allowance Reached'
                          : 'Discovery Execution Notice'}
                      </h4>
                      <span className="rounded-full bg-rose-100/90 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-700 border border-rose-200/80 shrink-0">
                        {runError.includes('Usage Limit') || runError.includes('402') ? 'QUOTA CAP ($5.00)' : 'API ERROR'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-rose-900/85 leading-relaxed font-normal break-words">
                      {runError}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setRunError(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer shrink-0"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Actionable guidance if this is an Apify budget / credit limit error */}
              {(runError.includes('Usage Limit') || runError.includes('Apify') || runError.includes('credit') || runError.includes('402')) && (
                <div className="mt-4 pt-3.5 border-t border-rose-200/60">
                  <div className="text-[10px] font-semibold text-rose-900 uppercase tracking-wider mb-2">
                    Quick Resolution Options:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <a
                      href="https://console.apify.com/billing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-rose-200/90 hover:border-rose-300 hover:bg-rose-50/50 transition text-zinc-900 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span className="font-medium text-[11px]">Top Up Apify Credits</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                    </a>

                    <Link
                      href="/settings"
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-rose-200/90 hover:border-rose-300 hover:bg-rose-50/50 transition text-zinc-900 group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                        <span className="font-medium text-[11px]">Update API Token</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                    </Link>
                  </div>

                  <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-white/80 p-2.5 border border-rose-200/70 text-[11px]">
                    <span className="text-zinc-600">Want to test the full pipeline and scoring without any Apify credits?</span>
                    <button
                      onClick={() => {
                        setForceMock(true);
                        setRunError(null);
                      }}
                      className="self-start sm:self-center font-semibold text-rose-700 hover:text-rose-900 underline underline-offset-2 cursor-pointer shrink-0"
                    >
                      Switch to Sandbox Mode ($0 Cost) &rarr;
                    </button>
                  </div>
                </div>
              )}
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
