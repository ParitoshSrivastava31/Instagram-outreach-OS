'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Copy,
  Check,
  Send,
  MessageSquare,
  Clock,
  XCircle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckCircle2,
  FileEdit,
  ArrowUpRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { Lead, LeadStatus, LeadTier, MessageTemplate } from '@/types';

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
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Open & Copy Handler (Prompt Section 23)
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
      showNotification(`Copied message for @${lead.instagram_username} & opened Instagram tab`);
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
        showNotification('Marked as Sent (CONTACTED)');
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

  // Advance Product Adoption Funnel (Used Vault, 2nd Reel, Paid)
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
        showNotification(`Milestone updated to: ${status}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Skip Lead Handler
  const handleSkip = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/skip`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => (l.id === leadId ? data.lead : l)));
        showNotification('Lead skipped');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Snooze Lead Handler
  const handleSnooze = async (leadId: string, days: number = 3) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev =>
          prev.map(l => (l.id === leadId ? { ...l, status: 'SNOOZED' } : l))
        );
        showNotification(`Lead snoozed for ${days} days`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Note Handler
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

  // Dynamic template change for selected lead
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

  // Global Keyboard Shortcuts (O, S, R, X, Z, J, K)
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

  // Metric aggregates
  const queuedCount = leads.filter(l => l.status === 'QUEUED' || l.status === 'OPENED').length;
  const contactedCount = leads.filter(l => ['CONTACTED', 'REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)).length;
  const repliedCount = leads.filter(l => ['REPLIED', 'INTERESTED', 'USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)).length;
  const usedVaultCount = leads.filter(l => ['USED_VAULT', 'SENT_SECOND_REEL', 'PAID'].includes(l.status)).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      {/* Toast Notification Banner */}
      {actionNotice && (
        <div className="fixed bottom-12 right-6 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header & Execution Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Today&apos;s Outreach Queue</h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Manual Send Workflow
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Targeting creators &amp; operators who save Reels for research. Open profile, copy deterministic message, send manually in 15–30s.
          </p>
        </div>

        {/* Quick Funnel Counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">QUEUED</div>
            <div className="text-base font-bold text-slate-900 font-mono">{queuedCount}</div>
          </div>
          <div className="rounded-lg bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">CONTACTED</div>
            <div className="text-base font-bold text-emerald-600 font-mono">{contactedCount}</div>
          </div>
          <div className="rounded-lg bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">REPLIED</div>
            <div className="text-base font-bold text-rose-600 font-mono">{repliedCount}</div>
          </div>
          <div className="rounded-lg bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">USED VAULT</div>
            <div className="text-base font-bold text-indigo-600 font-mono">{usedVaultCount}</div>
          </div>
          <Link
            href="/discovery"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Run Discovery</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-slate-200 shadow-2xs">
          <button
            onClick={() => { setFilterTab('QUEUED'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'QUEUED' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Queue ({queuedCount})
          </button>
          <button
            onClick={() => { setFilterTab('TIER_A'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'TIER_A' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tier A Focus
          </button>
          <button
            onClick={() => { setFilterTab('CONTACTED'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'CONTACTED' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contacted ({contactedCount})
          </button>
          <button
            onClick={() => { setFilterTab('REPLIED'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'REPLIED' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Replied ({repliedCount})
          </button>
          <button
            onClick={() => { setFilterTab('ALL'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'ALL' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({leads.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search username, bio..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
            className="w-full rounded-lg bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-slate-400 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Main 2-Column Execution Workspace */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Dense Queue List (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>PROSPECTS ({filteredLeads.length})</span>
            <span className="text-[11px] font-normal text-slate-400 lowercase">Keys: [J / K] to navigate</span>
          </div>

          <div className="max-h-[calc(100vh-270px)] overflow-y-auto space-y-2 pr-1">
            {filteredLeads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white">
                <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">Queue is empty</h3>
                <p className="mt-1 text-xs text-slate-500">No leads match the active filter or search.</p>
                <Link
                  href="/discovery"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Run Discovery to Refill
                </Link>
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
                    className={`cursor-pointer rounded-xl p-3.5 transition border ${
                      isSelected
                        ? 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {lead.profile_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={lead.profile_image_url}
                            alt={lead.instagram_username}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                            {lead.instagram_username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">@{lead.instagram_username}</span>
                            {lead.is_verified && (
                              <span className="text-[10px] text-blue-500">✓</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {lead.display_name || lead.account_category || 'Instagram Creator'}
                          </div>
                        </div>
                      </div>

                      {/* Tier & Score badges */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            isTierA
                              ? 'badge-tier-a'
                              : isTierB
                              ? 'badge-tier-b'
                              : 'badge-tier-c'
                          }`}
                        >
                          {lead.lead_tier}
                        </span>
                        <span className="font-mono text-[11px] text-slate-600 font-semibold">
                          {lead.lead_score} pts
                        </span>
                      </div>
                    </div>

                    {/* Followers & Qualification summary */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                      <span className="font-medium text-slate-700">
                        {lead.followers ? `${(lead.followers / 1000).toFixed(1)}k followers` : '< 1k'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${
                        lead.status === 'CONTACTED' ? 'text-emerald-700' :
                        lead.status === 'REPLIED' ? 'text-rose-700' :
                        lead.status === 'OPENED' ? 'text-amber-700' : 'text-slate-500'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    {/* Qualification reason snippet */}
                    <div className="mt-1 text-[11px] text-slate-600 truncate font-medium">
                      {lead.qualification_reason}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Lead Execution Card (7 columns) */}
        <div className="lg:col-span-7">
          {currentLead ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              {/* Lead Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {currentLead.profile_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentLead.profile_image_url}
                      alt={currentLead.instagram_username}
                      className="h-12 w-12 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">
                      {currentLead.instagram_username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">@{currentLead.instagram_username}</h2>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        currentLead.lead_tier === 'Tier A' ? 'badge-tier-a' : 'badge-tier-b'
                      }`}>
                        {currentLead.lead_tier}
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {currentLead.lead_score} Lead Score
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {currentLead.display_name} • {currentLead.followers.toLocaleString()} followers • {currentLead.posts_count} posts
                    </div>
                  </div>
                </div>

                {/* Direct External Links */}
                <div className="flex items-center gap-2">
                  <a
                    href={currentLead.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition font-medium border border-slate-200"
                  >
                    <span>Profile</span>
                    <ArrowUpRight className="h-3 w-3 text-slate-500" />
                  </a>
                  <a
                    href={`https://ig.me/m/${currentLead.instagram_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 transition font-medium border border-indigo-200"
                  >
                    <span>Direct DM</span>
                    <ExternalLink className="h-3 w-3 text-indigo-500" />
                  </a>
                </div>
              </div>

              {/* Qualification Reason Badge */}
              <div className="mt-4 rounded-lg bg-indigo-50/70 border border-indigo-100 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Why This Lead Qualified</span>
                </div>
                <div className="mt-1 text-xs text-indigo-950 font-medium">
                  {currentLead.qualification_reason}
                </div>
              </div>

              {/* Bio & Matched Signals */}
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">INSTAGRAM BIO</div>
                <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {currentLead.bio || 'No public bio text'}
                </p>

                {/* Matched Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {currentLead.matched_roles.map(r => (
                    <span key={r} className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 border border-indigo-200">
                      Role: {r}
                    </span>
                  ))}
                  {currentLead.matched_research.map(r => (
                    <span key={r} className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                      Signal: &quot;{r}&quot;
                    </span>
                  ))}
                  {currentLead.matched_niches.map(n => (
                    <span key={n} className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                      Niche: {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prepared Message Section */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <FileEdit className="h-3.5 w-3.5 text-indigo-600" />
                    <span>PREPARED PERSONALIZED MESSAGE</span>
                  </label>
                  {/* Template Switcher */}
                  <select
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="rounded-md bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 border border-slate-300 focus:outline-none focus:border-slate-500"
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
                    className="w-full rounded-lg bg-white p-3 text-xs text-slate-900 border border-slate-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none leading-relaxed font-sans shadow-2xs"
                  />
                  <div className="text-[10px] text-slate-500 text-right mt-1">
                    Deterministic template interpolated with objective profile facts. (No AI generated text).
                  </div>
                </div>

                {/* Primary Action Button Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {/* OPEN & COPY (PRIMARY) */}
                  <button
                    onClick={() => handleOpenAndCopy(currentLead)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-black px-4 py-2.5 text-xs font-bold text-white shadow-sm transition transform active:scale-95 cursor-pointer"
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
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>MARK SENT (S)</span>
                  </button>

                  {/* Mark Replied */}
                  <button
                    onClick={() => handleMarkReplied(currentLead.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-2.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>REPLIED (R)</span>
                  </button>
                </div>

                {/* Secondary Actions & Product Milestones */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    {/* Funnel Milestone Drops */}
                    <span className="text-[11px] text-slate-500 font-semibold">Vault Funnel:</span>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'USED_VAULT')}
                      className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] text-indigo-700 border border-slate-200 font-medium transition cursor-pointer"
                    >
                      Used Vault (1st Reel)
                    </button>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'SENT_SECOND_REEL')}
                      className="rounded bg-amber-50 hover:bg-amber-100 px-2 py-1 text-[11px] text-amber-800 border border-amber-200 font-semibold transition cursor-pointer"
                    >
                      Sent 2nd Reel ★
                    </button>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'PAID')}
                      className="rounded bg-emerald-50 hover:bg-emerald-100 px-2 py-1 text-[11px] text-emerald-800 border border-emerald-200 font-semibold transition cursor-pointer"
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
                      className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] text-slate-700 border border-slate-200 transition cursor-pointer font-medium"
                    >
                      {currentLead.notes ? 'Edit Note' : 'Add Note'}
                    </button>
                    <button
                      onClick={() => handleSnooze(currentLead.id, 3)}
                      className="rounded bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] text-amber-800 border border-amber-200 transition cursor-pointer font-medium"
                    >
                      Snooze 3d (Z)
                    </button>
                    <button
                      onClick={() => handleSkip(currentLead.id)}
                      className="rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 px-2.5 py-1 text-[11px] text-slate-600 border border-slate-200 transition cursor-pointer font-medium"
                    >
                      Skip (X)
                    </button>
                  </div>
                </div>

                {/* Existing Notes Display */}
                {currentLead.notes && (
                  <div className="mt-3 rounded bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-200">
                    <span className="font-semibold text-slate-900">Note: </span>
                    {currentLead.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs bg-white">
              Select a lead from the list to view profile and outreach actions
            </div>
          )}
        </div>
      </div>

      {/* Floating Keyboard Shortcuts Bar (Ergonomics) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">Keyboard Workflow:</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 border border-slate-300 shadow-2xs font-semibold">O</kbd> Open &amp; Copy</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 border border-slate-300 shadow-2xs font-semibold">S</kbd> Mark Sent</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 border border-slate-300 shadow-2xs font-semibold">R</kbd> Mark Replied</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 border border-slate-300 shadow-2xs font-semibold">X</kbd> Skip</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 border border-slate-300 shadow-2xs font-semibold">Z</kbd> Snooze</span>
            <span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-800 border border-slate-300 shadow-2xs font-semibold">J / K</kbd> Next/Prev</span>
          </div>
          <div className="hidden sm:block text-slate-400">
            Founder manually sends DM in Instagram • Target: 15–30s per lead
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {noteModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 border border-slate-200 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Add Note for @{noteModalLead.instagram_username}</h3>
            <p className="mt-1 text-xs text-slate-500">Keep private notes on their content, topics they like, or DM conversation.</p>
            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="e.g. loves talking about ChatGPT prompts; responded asking for pricing..."
              className="mt-3 w-full rounded-lg bg-slate-50 p-3 text-xs text-slate-900 border border-slate-300 focus:border-slate-800 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setNoteModalLead(null)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200 font-medium border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black"
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
