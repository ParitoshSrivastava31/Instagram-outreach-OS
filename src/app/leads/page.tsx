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
import { Lead, OutreachEvent } from '@/types';

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
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl">
          {bulkNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Lead Database</h1>
            <p className="mt-1 text-xs text-slate-500">
              Filterable registry of discovered creators, qualification reasons, lead scores, and outreach statuses.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-black transition shadow-2xs"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Open Outreach Queue</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search username, bio, name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Tier filter */}
          <select
            value={selectedTier}
            onChange={e => setSelectedTier(e.target.value)}
            className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-200 focus:border-slate-800 focus:outline-none"
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
            className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-200 focus:border-slate-800 focus:outline-none"
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
            className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-700 border border-slate-200 focus:border-slate-800 focus:outline-none"
          >
            <option value={0}>Any Score</option>
            <option value={50}>Score ≥ 50</option>
            <option value={70}>Score ≥ 70</option>
            <option value={80}>Score ≥ 80</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-800">
              {selectedLeadIds.length} selected
            </span>
            <button
              onClick={handleBulkSkip}
              className="rounded bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 transition cursor-pointer"
            >
              Bulk Skip
            </button>
            <button
              onClick={() => handleBulkSnooze(3)}
              className="rounded bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200 transition cursor-pointer"
            >
              Bulk Snooze (3d)
            </button>
            <span className="text-[10px] text-slate-400 italic">(Manual send required for safety)</span>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
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
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                  Loading prospects...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-xs text-slate-400">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              leads.map(lead => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setActiveLead(lead)}
                  >
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-0"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        {lead.profile_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={lead.profile_image_url}
                            alt={lead.instagram_username}
                            className="h-8 w-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                            {lead.instagram_username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">@{lead.instagram_username}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
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
                    <td className="p-3 font-mono font-semibold text-slate-800">
                      {lead.lead_score} pts
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {lead.followers ? lead.followers.toLocaleString() : '—'}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {lead.matched_research.slice(0, 2).map(r => (
                          <span key={r} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 border border-emerald-200">
                            {r}
                          </span>
                        ))}
                        {lead.matched_niches.slice(0, 1).map(n => (
                          <span key={n} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-700 border border-indigo-200">
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
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : lead.status === 'SENT_SECOND_REEL'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold'
                            : lead.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveLead(lead)}
                        className="rounded p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-2xs">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl border-l border-slate-200 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">@{activeLead.instagram_username}</h3>
                <span className="badge-tier-a text-[10px] px-1.5 py-0.5 rounded font-bold">
                  {activeLead.lead_tier}
                </span>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bio</div>
                <p className="mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeLead.bio || 'No bio'}
                </p>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qualification Breakdown</div>
                <div className="mt-1 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-950 font-medium">
                  {activeLead.qualification_reason}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prepared Personalized Outreach</div>
                <p className="mt-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {activeLead.prepared_message}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={activeLead.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-black py-2.5 font-bold text-white transition shadow-2xs"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={`https://ig.me/m/${activeLead.instagram_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 py-2.5 font-bold text-indigo-700 border border-indigo-200 transition"
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
