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
  Filter,
  Flame,
  CheckCircle2,
  FileEdit,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
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

  // Open & Copy Handler (Critical Flow: Prompt Section 23)
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

    // 2. Open Instagram in new browser tab
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
    // Replace with lead info
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

  // Global Keyboard Shortcuts (O, S, R, X, J, K, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
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
        <div className="fixed bottom-12 right-6 z-50 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-medium text-white shadow-xl shadow-indigo-600/30">
          <Sparkles className="h-4 w-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header & Execution Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#262938] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Today&apos;s Outreach Queue</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Manual Send Workflow
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Targeting creators &amp; operators who save Reels for research. Open profile, copy deterministic message, send manually in 15–30s.
          </p>
        </div>

        {/* Quick Funnel Counters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-[#161822] px-3 py-1.5 border border-[#262938]">
            <div className="text-[10px] text-gray-400 font-medium">QUEUED</div>
            <div className="text-base font-bold text-white font-mono">{queuedCount}</div>
          </div>
          <div className="rounded-lg bg-[#161822] px-3 py-1.5 border border-[#262938]">
            <div className="text-[10px] text-gray-400 font-medium">CONTACTED</div>
            <div className="text-base font-bold text-emerald-400 font-mono">{contactedCount}</div>
          </div>
          <div className="rounded-lg bg-[#161822] px-3 py-1.5 border border-[#262938]">
            <div className="text-[10px] text-gray-400 font-medium">REPLIED</div>
            <div className="text-base font-bold text-pink-400 font-mono">{repliedCount}</div>
          </div>
          <div className="rounded-lg bg-[#161822] px-3 py-1.5 border border-[#262938]">
            <div className="text-[10px] text-gray-400 font-medium">USED VAULT</div>
            <div className="text-base font-bold text-indigo-400 font-mono">{usedVaultCount}</div>
          </div>
          <Link
            href="/discovery"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Run Discovery</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-[#11131a] p-1 border border-[#262938]">
          <button
            onClick={() => { setFilterTab('QUEUED'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'QUEUED' ? 'bg-[#1d202d] text-white border border-[#363b50]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Queue ({queuedCount})
          </button>
          <button
            onClick={() => { setFilterTab('TIER_A'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'TIER_A' ? 'bg-[#1d202d] text-white border border-[#363b50]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Tier A Focus
          </button>
          <button
            onClick={() => { setFilterTab('CONTACTED'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'CONTACTED' ? 'bg-[#1d202d] text-white border border-[#363b50]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Contacted ({contactedCount})
          </button>
          <button
            onClick={() => { setFilterTab('REPLIED'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'REPLIED' ? 'bg-[#1d202d] text-white border border-[#363b50]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Replied ({repliedCount})
          </button>
          <button
            onClick={() => { setFilterTab('ALL'); setSelectedIndex(0); }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filterTab === 'ALL' ? 'bg-[#1d202d] text-white border border-[#363b50]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All ({leads.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search username, bio..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
            className="w-full rounded-lg bg-[#161822] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 border border-[#262938] focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main 2-Column Execution Workspace */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Dense Queue List (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 text-xs font-medium text-gray-400">
            <span>PROSPECTS ({filteredLeads.length})</span>
            <span className="text-[11px] text-gray-500">Keys: [J / K] to navigate</span>
          </div>

          <div className="max-h-[calc(100vh-270px)] overflow-y-auto space-y-2 pr-1">
            {filteredLeads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#262938] p-8 text-center bg-[#11131a]">
                <CheckCircle2 className="mx-auto h-8 w-8 text-indigo-400" />
                <h3 className="mt-2 text-sm font-semibold text-white">Queue is empty</h3>
                <p className="mt-1 text-xs text-gray-400">No leads match the active filter or search.</p>
                <Link
                  href="/discovery"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition"
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
                        ? 'bg-[#1a1d29] border-indigo-500/80 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/40'
                        : 'bg-[#14161f] border-[#222533] hover:border-[#363b50] hover:bg-[#161824]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {lead.profile_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={lead.profile_image_url}
                            alt={lead.instagram_username}
                            className="h-9 w-9 rounded-full object-cover border border-[#363b50]"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-950 text-xs font-bold text-indigo-300 border border-indigo-700/50">
                            {lead.instagram_username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">@{lead.instagram_username}</span>
                            {lead.is_verified && (
                              <span className="text-[10px] text-blue-400">✓</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
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
                        <span className="font-mono text-[11px] text-gray-400 font-semibold">
                          {lead.lead_score} pts
                        </span>
                      </div>
                    </div>

                    {/* Followers & Qualification summary */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400 border-t border-[#222533] pt-2">
                      <span className="font-medium text-gray-300">
                        {lead.followers ? `${(lead.followers / 1000).toFixed(1)}k followers` : '< 1k'}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase ${
                        lead.status === 'CONTACTED' ? 'text-emerald-400' :
                        lead.status === 'REPLIED' ? 'text-pink-400' :
                        lead.status === 'OPENED' ? 'text-amber-400' : 'text-gray-400'
                      }`}>
                        {lead.status}
                      </span>
                    </div>

                    {/* Qualification reason snippet */}
                    <div className="mt-1 text-[11px] text-indigo-300/80 truncate">
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
            <div className="rounded-xl border border-[#262938] bg-[#141620] p-5 shadow-lg">
              {/* Lead Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#262938] pb-4">
                <div className="flex items-center gap-3">
                  {currentLead.profile_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={currentLead.profile_image_url}
                      alt={currentLead.instagram_username}
                      className="h-12 w-12 rounded-full object-cover border-2 border-indigo-500/40"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-950 text-sm font-bold text-indigo-300 border border-indigo-700">
                      {currentLead.instagram_username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">@{currentLead.instagram_username}</h2>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        currentLead.lead_tier === 'Tier A' ? 'badge-tier-a' : 'badge-tier-b'
                      }`}>
                        {currentLead.lead_tier}
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {currentLead.lead_score} Lead Score
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
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
                    className="flex items-center gap-1 rounded-md bg-[#1d202d] px-2.5 py-1 text-xs text-gray-300 hover:text-white border border-[#363b50] transition"
                  >
                    <span>Profile</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                  <a
                    href={`https://ig.me/m/${currentLead.instagram_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md bg-[#1d202d] px-2.5 py-1 text-xs text-indigo-300 hover:text-white border border-indigo-500/30 transition"
                  >
                    <span>Direct DM</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Qualification Reason Badge */}
              <div className="mt-4 rounded-lg bg-indigo-950/30 border border-indigo-500/30 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  <span>Why This Lead Qualified</span>
                </div>
                <div className="mt-1 text-xs text-indigo-200 font-medium">
                  {currentLead.qualification_reason}
                </div>
              </div>

              {/* Bio & Matched Signals */}
              <div className="mt-4 space-y-2">
                <div className="text-xs font-medium text-gray-400">INSTAGRAM BIO</div>
                <p className="text-xs text-gray-200 bg-[#10121a] p-3 rounded-lg border border-[#222533] leading-relaxed whitespace-pre-wrap">
                  {currentLead.bio || 'No public bio text'}
                </p>

                {/* Matched Tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {currentLead.matched_roles.map(r => (
                    <span key={r} className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-500/20">
                      Role: {r}
                    </span>
                  ))}
                  {currentLead.matched_research.map(r => (
                    <span key={r} className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/20">
                      Signal: &quot;{r}&quot;
                    </span>
                  ))}
                  {currentLead.matched_niches.map(n => (
                    <span key={n} className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/20">
                      Niche: {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prepared Message Section */}
              <div className="mt-5 border-t border-[#262938] pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <FileEdit className="h-3.5 w-3.5 text-indigo-400" />
                    <span>PREPARED PERSONALIZED MESSAGE</span>
                  </label>
                  {/* Template Switcher */}
                  <select
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="rounded bg-[#1d202d] px-2 py-1 text-[11px] text-gray-300 border border-[#363b50] focus:outline-none"
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
                    className="w-full rounded-lg bg-[#0e1017] p-3 text-xs text-gray-200 border border-[#2a2d3e] focus:border-indigo-500 focus:outline-none leading-relaxed font-sans"
                  />
                  <div className="text-[10px] text-gray-500 text-right mt-1">
                    Deterministic template interpolated with objective profile facts. (No AI generated text).
                  </div>
                </div>

                {/* Primary Action Button Bar */}
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {/* OPEN & COPY (PRIMARY PROMPT SECTION 23) */}
                  <button
                    onClick={() => handleOpenAndCopy(currentLead)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition transform active:scale-95"
                  >
                    {copiedId === currentLead.id ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-300" />
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
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white transition active:scale-95 border border-emerald-500/30"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>MARK SENT (S)</span>
                  </button>

                  {/* Mark Replied */}
                  <button
                    onClick={() => handleMarkReplied(currentLead.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-pink-700/80 hover:bg-pink-600 px-3.5 py-2.5 text-xs font-bold text-white transition active:scale-95 border border-pink-500/30"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>REPLIED (R)</span>
                  </button>
                </div>

                {/* Secondary Actions & Product Milestones */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#222533] pt-3">
                  <div className="flex items-center gap-1.5">
                    {/* Funnel Milestone Drops */}
                    <span className="text-[11px] text-gray-500 font-medium">Vault Funnel:</span>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'USED_VAULT')}
                      className="rounded bg-[#1a1d28] hover:bg-[#222638] px-2 py-1 text-[11px] text-indigo-300 border border-[#2f3348] transition"
                    >
                      Used Vault (1st Reel)
                    </button>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'SENT_SECOND_REEL')}
                      className="rounded bg-[#1a1d28] hover:bg-[#222638] px-2 py-1 text-[11px] text-amber-300 border border-[#2f3348] transition"
                    >
                      Sent 2nd Reel ★
                    </button>
                    <button
                      onClick={() => handleFunnelAdvance(currentLead.id, 'PAID')}
                      className="rounded bg-[#1a1d28] hover:bg-[#222638] px-2 py-1 text-[11px] text-emerald-300 border border-[#2f3348] transition"
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
                      className="rounded bg-[#1a1d28] hover:bg-[#222638] px-2.5 py-1 text-[11px] text-gray-300 border border-[#2f3348] transition"
                    >
                      {currentLead.notes ? 'Edit Note' : 'Add Note'}
                    </button>
                    <button
                      onClick={() => handleSnooze(currentLead.id, 3)}
                      className="rounded bg-[#1a1d28] hover:bg-[#222638] px-2.5 py-1 text-[11px] text-amber-400 border border-[#2f3348] transition"
                    >
                      Snooze 3d (Z)
                    </button>
                    <button
                      onClick={() => handleSkip(currentLead.id)}
                      className="rounded bg-[#1a1d28] hover:bg-[#222638] px-2.5 py-1 text-[11px] text-red-400 border border-[#2f3348] transition"
                    >
                      Skip (X)
                    </button>
                  </div>
                </div>

                {/* Existing Notes Display */}
                {currentLead.notes && (
                  <div className="mt-3 rounded bg-[#10121a] p-2 text-xs text-gray-300 border border-[#262938]">
                    <span className="font-semibold text-gray-400">Note: </span>
                    {currentLead.notes}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#262938] text-gray-400 text-xs">
              Select a lead from the list to view profile and outreach actions
            </div>
          )}
        </div>
      </div>

      {/* Floating Keyboard Shortcuts Bar (Prompt Section 41 Ergonomics) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#262938] bg-[#0d0f17]/95 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-300">Keyboard Workflow:</span>
            <span><kbd className="rounded bg-[#1d202d] px-1.5 py-0.5 font-mono text-white border border-[#363b50]">O</kbd> Open &amp; Copy</span>
            <span><kbd className="rounded bg-[#1d202d] px-1.5 py-0.5 font-mono text-white border border-[#363b50]">S</kbd> Mark Sent</span>
            <span><kbd className="rounded bg-[#1d202d] px-1.5 py-0.5 font-mono text-white border border-[#363b50]">R</kbd> Mark Replied</span>
            <span><kbd className="rounded bg-[#1d202d] px-1.5 py-0.5 font-mono text-white border border-[#363b50]">X</kbd> Skip</span>
            <span><kbd className="rounded bg-[#1d202d] px-1.5 py-0.5 font-mono text-white border border-[#363b50]">Z</kbd> Snooze</span>
            <span><kbd className="rounded bg-[#1d202d] px-1.5 py-0.5 font-mono text-white border border-[#363b50]">J / K</kbd> Next/Prev</span>
          </div>
          <div className="hidden sm:block text-gray-500">
            Founder manually sends DM in Instagram • Target: 15–30s per lead
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {noteModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#141622] p-5 border border-[#363b50] shadow-2xl">
            <h3 className="text-sm font-bold text-white">Add Note for @{noteModalLead.instagram_username}</h3>
            <p className="mt-1 text-xs text-gray-400">Keep private notes on their content, topics they like, or DM conversation.</p>
            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="e.g. loves talking about ChatGPT prompts; responded asking for pricing..."
              className="mt-3 w-full rounded-lg bg-[#0e1017] p-3 text-xs text-white border border-[#2a2d3e] focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setNoteModalLead(null)}
                className="rounded-lg bg-[#1d202d] px-3 py-1.5 text-xs text-gray-300 hover:text-white border border-[#363b50]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
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
