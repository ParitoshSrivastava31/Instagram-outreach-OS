'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Copy,
  Check,
  Search,
  CheckCircle2,
  FileEdit,
  ArrowUpRight,
  Inbox,
  Sparkles,
  MessageSquare,
  ChevronRight,
  SlidersHorizontal,
  BookmarkCheck,
  Send,
  Zap,
  Shield,
  Layers,
  Users
} from 'lucide-react';
import { Lead, LeadStatus, MessageTemplate } from '@/types';
import Tooltip from '@/components/Tooltip';

export default function OutreachPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'QUEUED' | 'TIER_A' | 'CONTACTED' | 'REPLIED' | 'ALL'>('QUEUED');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [noteModalLead, setNoteModalLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads?limit=200');
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (e) {
      console.error('Failed to fetch leads', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchTemplates();
  }, [fetchLeads, fetchTemplates]);

  // Filter leads based on selected tab and search query
  const filteredLeads = leads.filter(lead => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        lead.instagram_username.toLowerCase().includes(q) ||
        (lead.display_name && lead.display_name.toLowerCase().includes(q)) ||
        (lead.bio && lead.bio.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterTab === 'QUEUED') return lead.status === 'QUEUED' || lead.status === 'OPENED';
    if (filterTab === 'TIER_A') return lead.lead_tier === 'Tier A' && (lead.status === 'QUEUED' || lead.status === 'OPENED');
    if (filterTab === 'CONTACTED') return lead.status === 'CONTACTED';
    if (filterTab === 'REPLIED') return ['REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(lead.status);
    return true;
  });

  const currentLead = filteredLeads[selectedIndex] || null;

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Open & Copy Handler (Section 23)
  const handleOpenAndCopy = async (lead: Lead) => {
    const textToCopy = lead.prepared_message || '';

    // 1. Copy to clipboard
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(lead.id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      console.warn('Clipboard write error', err);
    }

    // 2. Open Instagram profile in new browser tab
    window.open(lead.instagram_url, '_blank', 'noopener,noreferrer');

    // 3. Record OPENED event on backend
    try {
      await fetch(`/api/leads/${lead.id}/open`, { method: 'POST' });
      setLeads(prev =>
        prev.map(l => (l.id === lead.id && l.status === 'QUEUED' ? { ...l, status: 'OPENED' } : l))
      );
      showNotification(`Copied message for @${lead.instagram_username} & opened tab`);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Sent Handler
  const handleMarkSent = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/contacted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_account: 'vault.moment' })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => (l.id === leadId ? data.lead : l)));
        showNotification('Marked as Contacted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark Replied Handler
  const handleMarkReplied = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/reply`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => (l.id === leadId ? data.lead : l)));
        showNotification('Marked as Replied! 🎉');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Funnel Advance
  const handleFunnelAdvance = async (leadId: string, status: LeadStatus) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/funnel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => (l.id === leadId ? data.lead : l)));
        showNotification(`Funnel updated: ${status.replace(/_/g, ' ')}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Skip Lead
  const handleSkip = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/skip`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        showNotification('Lead skipped');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Snooze Lead
  const handleSnooze = async (leadId: string, days = 3) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
        showNotification(`Lead snoozed for ${days} days`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Note
  const handleSaveNote = async () => {
    if (!noteModalLead) return;
    try {
      await fetch(`/api/leads/${noteModalLead.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText })
      });
      setLeads(prev =>
        prev.map(l => (l.id === noteModalLead.id ? { ...l, notes: noteText } : l))
      );
      setNoteModalLead(null);
      setNoteText('');
      showNotification('Note saved');
    } catch (e) {
      console.error(e);
    }
  };

  // Quick sandbox test discovery run to populate 5 test leads on demand
  const handleRunSandboxTest = async () => {
    setIsTestLoading(true);
    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'camp-creator-researchers',
          forceMock: true,
          maxProfiles: 25
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
        showNotification(`Loaded ${data.qualifiedCount} test prospects into queue`);
      } else {
        showNotification(data.error || 'Failed to run test discovery');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTestLoading(false);
    }
  };

  // Dynamic template change
  const handleTemplateChange = (templateText: string) => {
    if (!currentLead) return;
    const firstName = currentLead.display_name?.split(' ')[0] || currentLead.instagram_username;
    const rendered = templateText
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{username\}\}/g, currentLead.instagram_username)
      .replace(/\{\{niche\}\}/g, currentLead.matched_niches[0] || 'your content')
      .replace(/\{\{followers\}\}/g, currentLead.followers.toLocaleString())
      .replace(/\{\{sender_name\}\}/g, 'Paritosh')
      .replace(/\{\{vault_username\}\}/g, 'vault.moment');

    setLeads(prev =>
      prev.map(l => (l.id === currentLead.id ? { ...l, prepared_message: rendered } : l))
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (!currentLead) return;

      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        handleOpenAndCopy(currentLead);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleMarkSent(currentLead.id);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleMarkReplied(currentLead.id);
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleSkip(currentLead.id);
      } else if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        handleSnooze(currentLead.id, 3);
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredLeads.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLead, filteredLeads.length]);

  // Aggregates
  const queuedCount = leads.filter(l => l.status === 'QUEUED' || l.status === 'OPENED').length;
  const contactedCount = leads.filter(l =>
    ['CONTACTED', 'REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)
  ).length;
  const repliedCount = leads.filter(l =>
    ['REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)
  ).length;
  const usedVaultCount = leads.filter(l => ['USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-16 right-6 z-50 flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white shadow-xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header & Integrated Metric Strip */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Today&apos;s Queue</h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-600 border border-zinc-200/60">
              Manual Send Workflow
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed">
            Review verified Reels save signals, preview deterministic DM, and execute 20-second manual outreach in Instagram web.
          </p>
        </div>

        {/* Integrated Linear-style Stat Strip + Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-lg bg-white border border-zinc-200/80 divide-x divide-zinc-100 shadow-2xs">
            <div className="px-3 py-1.5 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                <span>Queued</span>
              </div>
              <div className="text-xs font-semibold text-zinc-900 font-mono mt-0.5">{queuedCount}</div>
            </div>

            <div className="px-3 py-1.5 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Contacted</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 font-mono mt-0.5">{contactedCount}</div>
            </div>

            <div className="px-3 py-1.5 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>Replied</span>
              </div>
              <div className="text-xs font-semibold text-rose-700 font-mono mt-0.5">{repliedCount}</div>
            </div>

            <div className="px-3 py-1.5 text-left">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>Tried Vault</span>
              </div>
              <div className="text-xs font-semibold text-indigo-700 font-mono mt-0.5">{usedVaultCount}</div>
            </div>
          </div>

          <Link
            href="/discovery"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-black px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Run Discovery</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-0.5 rounded-lg bg-zinc-100/70 p-0.5 border border-zinc-200/60">
          <button
            onClick={() => {
              setFilterTab('QUEUED');
              setSelectedIndex(0);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
              filterTab === 'QUEUED'
                ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Queue ({queuedCount})
          </button>
          <button
            onClick={() => {
              setFilterTab('TIER_A');
              setSelectedIndex(0);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
              filterTab === 'TIER_A'
                ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Tier A Focus
          </button>
          <button
            onClick={() => {
              setFilterTab('CONTACTED');
              setSelectedIndex(0);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
              filterTab === 'CONTACTED'
                ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Contacted ({contactedCount})
          </button>
          <button
            onClick={() => {
              setFilterTab('REPLIED');
              setSelectedIndex(0);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
              filterTab === 'REPLIED'
                ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Replied ({repliedCount})
          </button>
          <button
            onClick={() => {
              setFilterTab('ALL');
              setSelectedIndex(0);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/60'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            All ({leads.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search handle or bio..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full rounded-lg bg-white pl-8 pr-8 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-800 focus:outline-none shadow-2xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Execution Workbench */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Prospect Queue List (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>PROSPECTS ({filteredLeads.length})</span>
            <span className="text-[10px] font-normal text-zinc-400 lowercase font-mono">
              Keys: [J / K] to navigate
            </span>
          </div>

          <div className="max-h-[calc(100vh-250px)] overflow-y-auto space-y-1.5 pr-1">
            {filteredLeads.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200/80 p-8 text-center bg-white shadow-2xs">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-200/80 text-zinc-400 shadow-2xs">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="mt-3.5 text-sm font-semibold text-zinc-950">
                  {leads.length > 0 ? 'No leads in this filter' : 'Queue is clear'}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {leads.length > 0 ? (
                    <>
                      You have <span className="font-semibold text-zinc-900 font-mono">{leads.length}</span> total leads registered in your database ({contactedCount} contacted, {repliedCount} replied), but none currently match the <span className="font-medium text-zinc-800">&quot;{filterTab}&quot;</span> tab.
                    </>
                  ) : (
                    'No prospects are pending in the queue. Launch discovery to scan for creators who save Reels for research, or load sandbox test leads to preview the workflow.'
                  )}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  {leads.length > 0 ? (
                    <>
                      <button
                        onClick={() => {
                          setFilterTab('ALL');
                          setSelectedIndex(0);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black transition shadow-xs cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>View All Leads ({leads.length})</span>
                      </button>
                      <Link
                        href="/leads"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-200 transition cursor-pointer"
                      >
                        <span>Database View</span>
                      </Link>
                      <Link
                        href="/discovery"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-200 transition cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Scan Fresh Leads</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/discovery"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black transition shadow-xs cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Launch Discovery</span>
                      </Link>

                      <button
                        onClick={handleRunSandboxTest}
                        disabled={isTestLoading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 border border-zinc-200 transition cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span>{isTestLoading ? 'Loading Leads...' : 'Test Sandbox Scan'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (

              filteredLeads.map((lead, idx) => {
                const isSelected = idx === selectedIndex;
                const isTierA = lead.lead_tier === 'Tier A';
                const isTierB = lead.lead_tier === 'Tier B';

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`group cursor-pointer rounded-xl p-3 transition border text-left ${
                      isSelected
                        ? 'bg-zinc-50/90 border-zinc-950/80 shadow-xs border-l-3 border-l-zinc-950'
                        : 'bg-white border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/50 shadow-2xs'
                    }`}
                  >
                    {/* Line 1: Avatar + Handle + Tier + Score */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {lead.profile_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={lead.profile_image_url}
                            alt={lead.instagram_username}
                            className="h-7 w-7 rounded-full object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-700 border border-zinc-200">
                            {lead.instagram_username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-zinc-900 truncate">
                          @{lead.instagram_username}
                        </span>
                        {lead.is_verified && (
                          <span className="text-[10px] text-blue-500 shrink-0">✓</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isTierA ? 'badge-tier-a' : isTierB ? 'badge-tier-b' : 'badge-tier-c'
                          }`}
                        >
                          {lead.lead_tier}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                          {lead.lead_score} pts
                        </span>
                      </div>
                    </div>

                    {/* Line 2: Display name / followers / niche */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500 truncate">
                      <span className="font-medium text-zinc-700 truncate">
                        {lead.display_name || lead.account_category || 'Creator'}
                      </span>
                      <span>•</span>
                      <span className="shrink-0 font-mono">
                        {lead.followers ? `${(lead.followers / 1000).toFixed(1)}k followers` : '< 1k'}
                      </span>
                      {lead.matched_niches?.[0] && (
                        <>
                          <span>•</span>
                          <span className="capitalize text-zinc-600 truncate">{lead.matched_niches[0]}</span>
                        </>
                      )}
                    </div>

                    {/* Line 3: Research signal chip & Status */}
                    <div className="mt-2 flex items-center justify-between text-[10px] border-t border-zinc-100 pt-1.5">
                      <span className="text-zinc-500 font-mono truncate max-w-50">
                        {lead.matched_research?.[0] ? `Signal: "${lead.matched_research[0]}"` : 'Role matched'}
                      </span>

                      <span
                        className={`font-semibold uppercase tracking-wider text-[9px] ${
                          lead.status === 'CONTACTED'
                            ? 'text-emerald-700'
                            : lead.status === 'REPLIED'
                            ? 'text-rose-700'
                            : lead.status === 'OPENED'
                            ? 'text-amber-700'
                            : 'text-zinc-400'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Lead Execution Card (7 columns) */}
        <div className="lg:col-span-7">
          {currentLead ? (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs">
              {/* Creator Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  {currentLead.profile_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentLead.profile_image_url}
                      alt={currentLead.instagram_username}
                      className="h-11 w-11 rounded-full object-cover border border-zinc-200 shadow-2xs"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-700 border border-zinc-200">
                      {currentLead.instagram_username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
                        @{currentLead.instagram_username}
                      </h2>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          currentLead.lead_tier === 'Tier A' ? 'badge-tier-a' : 'badge-tier-b'
                        }`}
                      >
                        {currentLead.lead_tier}
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {currentLead.lead_score} Lead Score
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {currentLead.display_name} •{' '}
                      <span className="font-mono">{currentLead.followers.toLocaleString()}</span> followers •{' '}
                      <span className="font-mono">{currentLead.posts_count}</span> posts
                    </div>
                  </div>
                </div>

                {/* Direct External Links */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={currentLead.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 transition font-medium border border-zinc-200"
                  >
                    <span>Profile</span>
                    <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                  </a>
                  <a
                    href={`https://ig.me/m/${currentLead.instagram_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md bg-zinc-50 hover:bg-zinc-100 px-2.5 py-1 text-xs text-indigo-700 transition font-medium border border-zinc-200"
                  >
                    <span>Direct DM</span>
                    <ExternalLink className="h-3 w-3 text-indigo-500" />
                  </a>
                </div>
              </div>

              {/* Qualification Signals (Clean 3-Attribute Row) */}
              <div className="mt-4 rounded-xl bg-zinc-50/70 border border-zinc-200/70 p-3.5">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                  Qualification Signals
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">ROLE</span>
                    <span className="font-semibold text-zinc-900 truncate block">
                      {currentLead.matched_roles?.[0] || 'Creator-Operator'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">RESEARCH SIGNAL</span>
                    <span className="font-semibold text-indigo-700 truncate block">
                      {currentLead.matched_research?.[0] ? `"${currentLead.matched_research[0]}"` : 'Content Research'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-medium">NICHE</span>
                    <span className="font-semibold text-zinc-900 capitalize truncate block">
                      {currentLead.matched_niches?.[0] || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Bio */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">CREATOR BIO</div>
                <p className="text-xs text-zinc-700 bg-zinc-50/40 p-3 rounded-xl border border-zinc-200/70 leading-relaxed whitespace-pre-wrap font-sans">
                  {currentLead.bio || 'No public bio text'}
                </p>
              </div>

              {/* Prepared Personalized Outreach */}
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileEdit className="h-3.5 w-3.5 text-zinc-800" />
                    <span>PREPARED PERSONALIZED MESSAGE</span>
                  </label>
                  {/* Template Switcher */}
                  <select
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 border border-zinc-200 focus:outline-none focus:border-zinc-400 cursor-pointer"
                  >
                    <option value="">Switch Template...</option>
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.template}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 relative">
                  <textarea
                    rows={6}
                    value={currentLead.prepared_message || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setLeads(prev =>
                        prev.map(l => (l.id === currentLead.id ? { ...l, prepared_message: val } : l))
                      );
                    }}
                    className="w-full rounded-xl bg-zinc-50/40 p-3 text-xs text-zinc-900 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none leading-relaxed font-sans shadow-2xs transition"
                  />
                  <div className="text-[10px] text-zinc-400 text-right mt-1 font-mono">
                    Deterministic template interpolated with objective facts. No AI hallucinations.
                  </div>
                </div>

                {/* Primary Action Button Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {/* OPEN & COPY (PRIMARY) */}
                  <button
                    onClick={() => handleOpenAndCopy(currentLead)}
                    className="flex-1 min-w-50 flex items-center justify-center gap-2 rounded-xl bg-zinc-950 hover:bg-black px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition active:scale-[0.98] cursor-pointer"
                  >

                    {copiedId === currentLead.id ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>COPIED &amp; OPENED!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>OPEN &amp; COPY (Press O)</span>
                      </>
                    )}
                  </button>

                  {/* Mark Sent */}
                  <button
                    onClick={() => handleMarkSent(currentLead.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-emerald-50/60 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 transition active:scale-[0.98] cursor-pointer border border-emerald-300 shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>SENT (S)</span>
                  </button>

                  {/* Mark Replied */}
                  <button
                    onClick={() => handleMarkReplied(currentLead.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-rose-50/60 px-3.5 py-2.5 text-xs font-semibold text-rose-700 transition active:scale-[0.98] cursor-pointer border border-rose-300 shadow-2xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>REPLIED (R)</span>
                  </button>
                </div>

                {/* Product Funnel & Secondary Actions */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Vault Funnel:</span>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'USED_VAULT')}
                      className="rounded-md bg-zinc-50 hover:bg-zinc-100 px-2 py-0.5 text-[11px] text-indigo-700 border border-zinc-200 font-medium transition cursor-pointer"
                    >
                      Used Vault (1st Reel)
                    </button>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'SENT_SECOND_REEL')}
                      className="rounded-md bg-amber-50 hover:bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800 border border-amber-200 font-semibold transition cursor-pointer"
                    >
                      Sent 2nd Reel ★
                    </button>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'PAID')}
                      className="rounded-md bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-800 border border-emerald-200 font-semibold transition cursor-pointer"
                    >
                      Paid
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setNoteModalLead(currentLead);
                        setNoteText(currentLead.notes || '');
                      }}
                      className="rounded-md bg-zinc-50 hover:bg-zinc-100 px-2.5 py-0.5 text-[11px] text-zinc-600 border border-zinc-200 transition cursor-pointer font-medium"
                    >
                      {currentLead.notes ? 'Edit Note' : 'Add Note'}
                    </button>
                    <button
                      onClick={() => handleSnooze(currentLead.id, 3)}
                      className="rounded-md bg-zinc-50 hover:bg-amber-50 px-2.5 py-0.5 text-[11px] text-zinc-600 hover:text-amber-800 border border-zinc-200 transition cursor-pointer font-medium"
                    >
                      Snooze 3d (Z)
                    </button>
                    <button
                      onClick={() => handleSkip(currentLead.id)}
                      className="rounded-md bg-zinc-50 hover:bg-rose-50 px-2.5 py-0.5 text-[11px] text-zinc-600 hover:text-rose-700 border border-zinc-200 transition cursor-pointer font-medium"
                    >
                      Skip (X)
                    </button>
                  </div>
                </div>

                {/* Notes Display */}
                {currentLead.notes && (
                  <div className="mt-3 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-700 border border-zinc-200">
                    <span className="font-semibold text-zinc-900">Note: </span>
                    {currentLead.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Linear-style Workflow Blueprint Blueprint Card when queue is empty or no lead selected */
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-7 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 tracking-tight">
                <BookmarkCheck className="h-4 w-4 text-zinc-950" />
                <span>Vault Outreach Operating Blueprint</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                Deterministic outreach engine for Vault (@vault.moment). Designed for maximum signal quality and zero account risk.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl bg-zinc-50/70 border border-zinc-200/70 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white text-[11px] font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-950">Deterministic Qualification</h4>
                    <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                      Scrapes public creator bios for explicit save behaviors (&quot;save this post&quot;, hooks, swipe file). Profiles scoring &ge;60 pts are queued into Tier A or Tier B. Zero AI text hallucinations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-zinc-50/70 border border-zinc-200/70 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white text-[11px] font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-950">15–30s Manual DM Workflow</h4>
                    <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                      Hit <kbd>O</kbd> to copy the fact-interpolated DM and open their profile. You paste and send manually in Instagram web. Zero private API hacks, zero session cookie risk, zero ban liability.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-zinc-50/70 border border-zinc-200/70 p-3.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white text-[11px] font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-950">Meta Webhook Auto-Detection</h4>
                    <p className="mt-0.5 text-[11px] text-zinc-500 leading-relaxed">
                      When a creator sends a DM back to @vault.moment, the official Meta Webhook automatically detects the reply and advances their status in your funnel to Replied.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 text-[11px]">Ready to begin outreach?</span>
                <Link
                  href="/discovery"
                  className="flex items-center gap-1 font-semibold text-zinc-900 hover:text-black transition"
                >
                  <span>Launch a discovery run</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Ergonomics Bar (Bottom Dock) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full bg-zinc-950/90 text-white px-4 py-1.5 backdrop-blur-md border border-zinc-800 shadow-xl text-xs">
        <span className="text-[11px] font-medium text-zinc-400 hidden sm:inline-block">Workflow:</span>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="flex items-center gap-1">
            <kbd className="bg-zinc-800 border-zinc-700 text-zinc-300">O</kbd>
            <span className="text-zinc-300">Open &amp; Copy</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-zinc-800 border-zinc-700 text-zinc-300">S</kbd>
            <span className="text-zinc-300">Sent</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-zinc-800 border-zinc-700 text-zinc-300">R</kbd>
            <span className="text-zinc-300">Replied</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-zinc-800 border-zinc-700 text-zinc-300">X</kbd>
            <span className="text-zinc-300">Skip</span>
          </span>
          <span className="text-zinc-700">•</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-zinc-800 border-zinc-700 text-zinc-300">J/K</kbd>
            <span className="text-zinc-300">Nav</span>
          </span>
        </div>
      </div>

      {/* Add Note Modal */}
      {noteModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 border border-zinc-200 shadow-xl">
            <h3 className="text-sm font-semibold text-zinc-900">Add Note for @{noteModalLead.instagram_username}</h3>
            <p className="mt-1 text-xs text-zinc-500">Private observations on topics, response, or DM conversations.</p>
            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="e.g. loves talking about ChatGPT prompts; responded asking for pricing..."
              className="mt-3 w-full rounded-xl bg-zinc-50 p-3 text-xs text-zinc-900 border border-zinc-200 focus:border-zinc-800 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setNoteModalLead(null)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-200 font-medium border border-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
