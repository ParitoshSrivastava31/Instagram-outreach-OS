'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  ChevronRight,
  Send,
  X,
  ExternalLink
} from 'lucide-react';
import { Lead } from '@/types';

export default function LeadsDatabasePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minScore, setMinScore] = useState<number>(0);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
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

  const handleBulkQueue = async () => {
    if (selectedLeadIds.length === 0) return;
    for (const id of selectedLeadIds) {
      await fetch(`/api/leads/${id}/queue`, { method: 'POST' });
    }
    setBulkNotice(`Added ${selectedLeadIds.length} leads to Today's Queue!`);
    setSelectedLeadIds([]);
    fetchLeads();
    setTimeout(() => setBulkNotice(null), 3000);
  };

  const handleSingleQueue = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/queue`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBulkNotice('Lead added to Today\'s Queue!');
        if (activeLead && activeLead.id === leadId) {
          setActiveLead({ ...activeLead, status: 'QUEUED' });
        }
        fetchLeads();
        setTimeout(() => setBulkNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
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
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xl border border-zinc-800 animate-in fade-in duration-150">
          {bulkNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium tracking-tight text-zinc-900">Lead Database</h1>
            <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed font-normal">
              Filterable registry of discovered creators, qualification reasons, lead scores, and outreach statuses.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-medium text-white hover:bg-black transition shadow-2xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open Outreach Queue</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search handle, name, bio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg bg-zinc-50/60 pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none shadow-2xs transition font-normal"
            />
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-2">
            {/* Tier filter */}
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="rounded-lg bg-zinc-50/60 px-2 sm:px-3 py-1.5 text-xs text-zinc-700 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none cursor-pointer font-normal"
            >
              <option value="ALL">All Tiers</option>
              <option value="Tier A">Tier A</option>
              <option value="Tier B">Tier B</option>
              <option value="Tier C">Tier C</option>
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="rounded-lg bg-zinc-50/60 px-2 sm:px-3 py-1.5 text-xs text-zinc-700 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none cursor-pointer font-normal"
            >
              <option value="ALL">All Status</option>
              <option value="QUEUED">Queued</option>
              <option value="OPENED">Opened</option>
              <option value="CONTACTED">Sent</option>
              <option value="REPLIED">Replied</option>
              <option value="USED_VAULT">Used Vault</option>
              <option value="SENT_SECOND_REEL">2nd Reel</option>
              <option value="PAID">Paid</option>
              <option value="SKIPPED">Skipped</option>
              <option value="SNOOZED">Snoozed</option>
            </select>

            {/* Min Score filter */}
            <select
              value={minScore}
              onChange={e => setMinScore(parseInt(e.target.value, 10))}
              className="rounded-lg bg-zinc-50/60 px-2 sm:px-3 py-1.5 text-xs text-zinc-700 border border-zinc-200 focus:border-zinc-800 focus:bg-white focus:outline-none cursor-pointer font-normal"
            >
              <option value={0}>Score</option>
              <option value={50}>≥ 50 pts</option>
              <option value={70}>≥ 70 pts</option>
              <option value={80}>≥ 80 pts</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedLeadIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200 w-full sm:w-auto">
            <span className="text-xs font-medium text-zinc-800">
              {selectedLeadIds.length} selected
            </span>
            <button
              onClick={handleBulkQueue}
              className="rounded bg-zinc-950 hover:bg-black px-2.5 py-1 text-[11px] font-medium text-white transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Send className="h-3 w-3" />
              <span>Queue</span>
            </button>
            <button
              onClick={handleBulkSkip}
              className="rounded bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-medium text-rose-700 border border-rose-200 transition cursor-pointer"
            >
              Skip
            </button>
            <button
              onClick={() => handleBulkSnooze(3)}
              className="rounded bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800 border border-amber-200 transition cursor-pointer"
            >
              Snooze
            </button>
          </div>
        )}
      </div>

      {/* Mobile Prospects Cards List (< md) */}
      <div className="md:hidden mt-4 space-y-2.5">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 text-center text-xs text-zinc-400">
            Loading prospects...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 text-center text-xs text-zinc-400">
            No leads found matching your criteria.
          </div>
        ) : (
          leads.map(lead => {
            const isSelected = selectedLeadIds.includes(lead.id);
            return (
              <div
                key={lead.id}
                onClick={() => setActiveLead(lead)}
                className="rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs hover:border-zinc-300 transition cursor-pointer text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-0 mr-1"
                      />
                    </div>
                    {lead.profile_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={lead.profile_image_url}
                        alt={lead.instagram_username}
                        className="h-8 w-8 rounded-full object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 border border-zinc-200">
                        {lead.instagram_username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-900 text-xs truncate">
                        @{lead.instagram_username}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate font-normal">
                        {lead.display_name || 'Creator'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 whitespace-nowrap ${
                        lead.lead_tier === 'Tier A'
                          ? 'badge-tier-a'
                          : lead.lead_tier === 'Tier B'
                          ? 'badge-tier-b'
                          : 'badge-tier-c'
                      }`}
                    >
                      {lead.lead_tier}
                    </span>
                    <span className="font-mono text-[10px] font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0 whitespace-nowrap">
                      {lead.lead_score} pts
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100">
                  <div className="text-zinc-500 font-mono text-[10px] font-normal">
                    {lead.followers ? `${(lead.followers / 1000).toFixed(1)}k followers` : '< 1k'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-medium uppercase shrink-0 whitespace-nowrap ${
                        lead.status === 'CONTACTED'
                          ? 'badge-status-contacted'
                          : lead.status === 'REPLIED'
                          ? 'badge-status-replied'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {lead.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Leads Table (md+) */}
      <div className="hidden md:block mt-4 overflow-x-auto rounded-2xl border border-zinc-200/90 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-zinc-700">
          <thead className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="p-3.5 w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                />
              </th>
              <th className="p-3.5 font-medium">Creator / Profile</th>
              <th className="p-3.5 font-medium">Tier</th>
              <th className="p-3.5 font-medium">Score</th>
              <th className="p-3.5 font-medium">Followers</th>
              <th className="p-3.5 font-medium">Matched Signals</th>
              <th className="p-3.5 font-medium">Status</th>
              <th className="p-3.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-zinc-400 font-normal">
                  Loading prospects...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-zinc-400 font-normal">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              leads.map(lead => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-zinc-50/70 transition cursor-pointer"
                    onClick={() => setActiveLead(lead)}
                  >
                    <td className="p-3.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                      />
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        {lead.profile_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={lead.profile_image_url}
                            alt={lead.instagram_username}
                            className="h-8 w-8 rounded-full object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-700 border border-zinc-200 shrink-0">
                            {lead.instagram_username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-zinc-900">@{lead.instagram_username}</div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-40 font-normal">
                            {lead.display_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0 whitespace-nowrap ${
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
                    <td className="p-3.5 font-mono font-medium text-zinc-800">
                      {lead.lead_score} pts
                    </td>
                    <td className="p-3.5 font-mono text-zinc-700 font-normal">
                      {lead.followers ? lead.followers.toLocaleString() : '—'}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-55">
                        {lead.matched_research.slice(0, 2).map(r => (
                          <span key={r} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-normal text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
                            {r}
                          </span>
                        ))}
                        {lead.matched_niches.slice(0, 1).map(n => (
                          <span key={n} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-normal text-indigo-700 border border-indigo-200 shrink-0 whitespace-nowrap">
                            {n}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase shrink-0 whitespace-nowrap ${
                          lead.status === 'CONTACTED'
                            ? 'badge-status-contacted'
                            : lead.status === 'REPLIED'
                            ? 'badge-status-replied'
                            : lead.status === 'USED_VAULT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : lead.status === 'SENT_SECOND_REEL'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 font-medium'
                            : lead.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveLead(lead)}
                        className="rounded-md p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition cursor-pointer"
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

      {/* Lead Details Drawer */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl border-l border-zinc-200 overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-zinc-900">@{activeLead.instagram_username}</h3>
                <span className="badge-tier-a text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 whitespace-nowrap">
                  {activeLead.lead_tier}
                </span>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Bio</div>
                <p className="mt-1 bg-zinc-50/70 p-3 rounded-xl border border-zinc-200/80 text-zinc-800 whitespace-pre-wrap leading-relaxed font-normal">
                  {activeLead.bio || 'No bio'}
                </p>
              </div>

              <div>
                <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Qualification Breakdown</div>
                <div className="mt-1 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-950 font-normal leading-relaxed">
                  {activeLead.qualification_reason}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Prepared Personalized Outreach</div>
                <p className="mt-1 bg-zinc-50/70 p-3 rounded-xl border border-zinc-200/80 text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed font-normal">
                  {activeLead.prepared_message}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {activeLead.status !== 'QUEUED' && (
                  <button
                    onClick={() => handleSingleQueue(activeLead.id)}
                    className="w-full btn-insta flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-medium text-white transition shadow-2xs cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Lead to Today&apos;s Outreach Queue</span>
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <a
                    href={activeLead.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-2.5 font-medium transition shadow-2xs border border-zinc-200/80"
                  >
                    <span>Open Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`https://ig.me/m/${activeLead.instagram_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 py-2.5 font-medium text-indigo-700 border border-indigo-200 transition"
                  >
                    <span>Open Instagram DM</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
