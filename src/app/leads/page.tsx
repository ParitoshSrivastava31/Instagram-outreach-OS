'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  Send,
  X,
  FileText
} from 'lucide-react';
import { Lead, LeadTier, LeadStatus, OutreachEvent } from '@/types';

export default function LeadsDatabasePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [leadEvents, setLeadEvents] = useState<OutreachEvent[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTier !== 'ALL') params.set('tier', selectedTier);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (minScore > 0) params.set('minScore', minScore.toString());
      if (search) params.set('search', search);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedTier, selectedStatus, minScore, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const viewLeadDrawer = async (lead: Lead) => {
    setActiveLead(lead);
    // Fetch events history for this lead
    try {
      const res = await fetch(`/api/leads?search=${lead.instagram_username}`);
      // Events are tracked; let's show status timeline
    } catch (e) {}
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map(l => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkSkip = async () => {
    if (selectedLeadIds.length === 0) return;
    for (const id of selectedLeadIds) {
      await fetch(`/api/leads/${id}/skip`, { method: 'POST' });
    }
    setBulkNotice(`Skipped ${selectedLeadIds.length} leads.`);
    setSelectedLeadIds([]);
    fetchLeads();
    setTimeout(() => setBulkNotice(null), 3000);
  };

  const handleBulkSnooze = async (days: number = 3) => {
    if (selectedLeadIds.length === 0) return;
    for (const id of selectedLeadIds) {
      await fetch(`/api/leads/${id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
    }
    setBulkNotice(`Snoozed ${selectedLeadIds.length} leads for ${days} days.`);
    setSelectedLeadIds([]);
    fetchLeads();
    setTimeout(() => setBulkNotice(null), 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      {/* Toast Notice */}
      {bulkNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xl">
          {bulkNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#262938] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Lead Database</h1>
            <p className="mt-1 text-xs text-gray-400">
              Filterable registry of discovered creators, qualification reasons, lead scores, and outreach statuses.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open Outreach Queue</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-[#141620] p-3 rounded-xl border border-[#262938]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search username, bio, name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg bg-[#0e1017] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 border border-[#262938] focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Tier filter */}
          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value)}
            className="rounded-lg bg-[#0e1017] px-3 py-1.5 text-xs text-white border border-[#262938] focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Tiers</option>
            <option value="Tier A">Tier A (Creator-Operators)</option>
            <option value="Tier B">Tier B (Knowledge Creators)</option>
            <option value="Tier C">Tier C (Niche Experts)</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="rounded-lg bg-[#0e1017] px-3 py-1.5 text-xs text-white border border-[#262938] focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="OPENED">Opened</option>
            <option value="CONTACTED">Contacted (Sent)</option>
            <option value="REPLIED">Replied</option>
            <option value="USED_VAULT">Used Vault</option>
            <option value="SENT_SECOND_REEL">Sent 2nd Reel ★</option>
            <option value="PAID">Paid</option>
            <option value="SKIPPED">Skipped</option>
            <option value="SNOOZED">Snoozed</option>
          </select>

          {/* Min Score filter */}
          <select
            value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value, 10))}
            className="rounded-lg bg-[#0e1017] px-3 py-1.5 text-xs text-white border border-[#262938] focus:border-indigo-500 focus:outline-none"
          >
            <option value={0}>Any Score</option>
            <option value={50}>Score ≥ 50</option>
            <option value={70}>Score ≥ 70</option>
            <option value={80}>Score ≥ 80</option>
          </select>
        </div>

        {/* Bulk Action Controls (Prompt Section 25: Bulk Skip, Bulk Snooze. Strictly NO bulk send) */}
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2 bg-[#1b1e2b] px-3 py-1.5 rounded-lg border border-[#363b50]">
            <span className="text-xs font-semibold text-indigo-300">
              {selectedLeadIds.length} selected
            </span>
            <button
              onClick={handleBulkSkip}
              className="rounded bg-red-950/60 hover:bg-red-900 px-2.5 py-1 text-[11px] font-medium text-red-300 border border-red-800/40"
            >
              Bulk Skip
            </button>
            <button
              onClick={() => handleBulkSnooze(3)}
              className="rounded bg-amber-950/60 hover:bg-amber-900 px-2.5 py-1 text-[11px] font-medium text-amber-300 border border-amber-800/40"
            >
              Bulk Snooze (3d)
            </button>
            <span className="text-[10px] text-gray-500 italic">(Manual send required for safety)</span>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-[#262938] bg-[#141620]">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="border-b border-[#262938] bg-[#0f1118] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length}
                  className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-0"
                />
              </th>
              <th className="p-3">Creator / Profile</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Score</th>
              <th className="p-3">Followers</th>
              <th className="p-3">Matched Signals</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e212f]">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-gray-500">
                  Loading prospects...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-gray-500">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              leads.map(lead => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-[#181a26] transition cursor-pointer"
                    onClick={() => viewLeadDrawer(lead)}
                  >
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {lead.profile_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={lead.profile_image_url}
                            alt={lead.instagram_username}
                            className="h-8 w-8 rounded-full object-cover border border-[#363b50]"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-950 text-xs font-bold text-indigo-300">
                            {lead.instagram_username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">@{lead.instagram_username}</div>
                          <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                            {lead.display_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          lead.lead_tier === 'Tier A'
                            ? 'badge-tier-a'
                            : lead.lead_tier === 'Tier B'
                            ? 'badge-tier-b'
                            : 'badge-tier-c'
                        }`}
                      >
                        {lead.lead_tier}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-gray-200">
                      {lead.lead_score} pts
                    </td>
                    <td className="p-3 font-mono text-gray-300">
                      {lead.followers ? lead.followers.toLocaleString() : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {lead.matched_research.slice(0, 2).map(r => (
                          <span key={r} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300 border border-emerald-500/20">
                            {r}
                          </span>
                        ))}
                        {lead.matched_niches.slice(0, 1).map(n => (
                          <span key={n} className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[9px] text-indigo-300 border border-indigo-500/20">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          lead.status === 'CONTACTED'
                            ? 'badge-status-contacted'
                            : lead.status === 'REPLIED'
                            ? 'badge-status-replied'
                            : lead.status === 'USED_VAULT'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : lead.status === 'SENT_SECOND_REEL'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : lead.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-gray-800 text-gray-300 border border-gray-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => viewLeadDrawer(lead)}
                        className="rounded p-1 text-gray-400 hover:text-white hover:bg-[#262938]"
                        title="View Full Profile & History"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Lead Details Drawer / Slide-Over */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg bg-[#141622] p-6 shadow-2xl border-l border-[#262938] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262938] pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">@{activeLead.instagram_username}</h3>
                <span className="badge-tier-a text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {activeLead.lead_tier}
                </span>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="rounded p-1 text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase">Bio</div>
                <p className="mt-1 bg-[#0d0f17] p-3 rounded-lg border border-[#222533] text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {activeLead.bio || 'No bio'}
                </p>
              </div>

              <div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase">Qualification Breakdown</div>
                <div className="mt-1 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-200">
                  {activeLead.qualification_reason}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase">Prepared Personalized Outreach</div>
                <p className="mt-1 bg-[#0d0f17] p-3 rounded-lg border border-[#222533] text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {activeLead.prepared_message}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={activeLead.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 font-bold text-white transition"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://ig.me/m/${activeLead.instagram_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#1e2130] hover:bg-[#282c40] py-2.5 font-bold text-indigo-300 border border-[#363b50] transition"
                >
                  <span>Open Instagram DM</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
