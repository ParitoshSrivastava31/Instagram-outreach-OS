'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Sparkles,
  Pencil,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { Campaign } from '@/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Create Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMinFollowers, setNewMinFollowers] = useState(1000);
  const [newMaxFollowers, setNewMaxFollowers] = useState(20000);
  const [newKeywords, setNewKeywords] = useState('content creator hooks, UGC creator framework');

  // Edit Campaign Modal State
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMinFollowers, setEditMinFollowers] = useState(1000);
  const [editMaxFollowers, setEditMaxFollowers] = useState(20000);
  const [editDailyLimit, setEditDailyLimit] = useState(60);
  const [editMaxRaw, setEditMaxRaw] = useState(150);
  const [editResearchKeywords, setEditResearchKeywords] = useState('');
  const [editRoleKeywords, setEditRoleKeywords] = useState('');
  const [editExcludedKeywords, setEditExcludedKeywords] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.campaigns);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  const formatFollowers = (n: number) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return n.toLocaleString();
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          target_min_followers: newMinFollowers,
          target_max_followers: newMaxFollowers,
          daily_limit: 60,
          max_raw_profiles: 150,
          keywords: newKeywords.split(',').map(s => s.trim()).filter(Boolean),
          role_keywords: ['content creator', 'strategist', 'founder'],
          research_keywords: ['save this', 'hooks', 'framework', 'swipe file'],
          niche_keywords: ['creator economy', 'saas', 'growth'],
          excluded_keywords: ['meme', 'giveaway', 'fan page'],
          language: 'en',
          is_active: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setCampaigns(prev => [data.campaign, ...prev]);
        setShowCreateModal(false);
        setNewName('');
        setNewDesc('');
        showToast('Campaign created successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (camp: Campaign) => {
    setEditingCampaign(camp);
    setEditName(camp.name);
    setEditDesc(camp.description || '');
    setEditMinFollowers(camp.target_min_followers);
    setEditMaxFollowers(camp.target_max_followers);
    setEditDailyLimit(camp.daily_limit);
    setEditMaxRaw(camp.max_raw_profiles);
    setEditResearchKeywords(camp.research_keywords?.join(', ') || '');
    setEditRoleKeywords(camp.role_keywords?.join(', ') || '');
    setEditExcludedKeywords(camp.excluded_keywords?.join(', ') || '');
    setEditIsActive(camp.is_active ?? true);
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    setSavingEdit(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCampaign.id,
          name: editName,
          description: editDesc,
          target_min_followers: Number(editMinFollowers),
          target_max_followers: Number(editMaxFollowers),
          daily_limit: Number(editDailyLimit),
          max_raw_profiles: Number(editMaxRaw),
          research_keywords: editResearchKeywords.split(',').map(s => s.trim()).filter(Boolean),
          role_keywords: editRoleKeywords.split(',').map(s => s.trim()).filter(Boolean),
          excluded_keywords: editExcludedKeywords.split(',').map(s => s.trim()).filter(Boolean),
          is_active: editIsActive
        })
      });

      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaigns(prev => prev.map(c => c.id === data.campaign.id ? data.campaign : c));
        setEditingCampaign(null);
        showToast(`Updated "${data.campaign.name}" successfully!`);
      } else {
        alert(data.error || 'Failed to update campaign');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while updating campaign');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xl border border-zinc-800 animate-in fade-in duration-150">
          {toastNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Campaign Groups</h1>
            <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed">
              Target specific creator niches with tailored follower thresholds (e.g. 5k–50k or 3k–27k), research signals, and daily goals.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-insta flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white transition shadow-2xs cursor-pointer w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Custom Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaign Cards Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-2 text-center text-xs text-zinc-400 py-12">
            Loading campaigns...
          </div>
        ) : (
          campaigns.map((camp, idx) => (
            <div
              key={camp.id}
              className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs hover:border-zinc-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-950">{camp.name}</h3>
                      {idx === 0 && (
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          Highest Priority
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                      {camp.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(camp)}
                      className="flex items-center gap-1 rounded-md bg-zinc-50 hover:bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600 border border-zinc-200/80 transition cursor-pointer"
                      title="Edit Campaign Settings"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        camp.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      {camp.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>

                {/* Follower Range & Limits */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50/70 p-2.5 text-xs border border-zinc-200/80">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Followers</span>
                    <div className="font-mono font-bold text-zinc-800">
                      {formatFollowers(camp.target_min_followers)} – {formatFollowers(camp.target_max_followers)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Daily Goal</span>
                    <div className="font-mono font-bold text-zinc-900">
                      {camp.daily_limit} qualified
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Max Raw</span>
                    <div className="font-mono font-bold text-zinc-700">
                      {camp.max_raw_profiles} / run
                    </div>
                  </div>
                </div>

                {/* Keywords Preview */}
                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-600">Research Signals: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(camp.research_keywords || []).slice(0, 4).map(k => (
                        <span key={k} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                          &quot;{k}&quot;
                        </span>
                      ))}
                      {(camp.research_keywords?.length || 0) > 4 && (
                        <span className="text-[10px] text-zinc-400 self-center">
                          +{camp.research_keywords.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-zinc-600">Roles: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(camp.role_keywords || []).slice(0, 3).map(k => (
                        <span key={k} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 border border-zinc-200">
                          {k}
                        </span>
                      ))}
                      {(camp.role_keywords?.length || 0) > 3 && (
                        <span className="text-[10px] text-zinc-400 self-center">
                          +{camp.role_keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-zinc-100 pt-3 flex items-center justify-between">
                <button
                  onClick={() => openEditModal(camp)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition font-medium cursor-pointer"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Configure Thresholds</span>
                </button>
                <Link
                  href={`/discovery?campaignId=${camp.id}`}
                  className="btn-insta flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Launch Discovery</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT CAMPAIGN MODAL */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
          <form onSubmit={handleUpdateCampaign} className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 border border-zinc-200 shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Edit Campaign Settings</h3>
                <p className="mt-0.5 text-xs text-zinc-500">ID: <span className="font-mono">{editingCampaign.id}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="font-semibold text-zinc-700">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Follower Range (The user's key requirement: 5k-50k, 3k-27k, etc.) */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5">
                <span className="font-semibold text-zinc-900 block mb-2">Target Follower Thresholds</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-600">Min Followers</label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      required
                      value={editMinFollowers}
                      onChange={e => setEditMinFollowers(parseInt(e.target.value, 10) || 0)}
                      className="mt-1 w-full rounded-lg bg-white p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">Preview: {formatFollowers(editMinFollowers)}</span>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-600">Max Followers</label>
                    <input
                      type="number"
                      min={editMinFollowers || 500}
                      step={500}
                      required
                      value={editMaxFollowers}
                      onChange={e => setEditMaxFollowers(parseInt(e.target.value, 10) || 0)}
                      className="mt-1 w-full rounded-lg bg-white p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">Preview: {formatFollowers(editMaxFollowers)}</span>
                  </div>
                </div>
              </div>

              {/* Quotas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700">Daily Qualified Lead Cap</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={editDailyLimit}
                    onChange={e => setEditDailyLimit(parseInt(e.target.value, 10) || 60)}
                    className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700">Max Raw Profiles / Run</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={editMaxRaw}
                    onChange={e => setEditMaxRaw(parseInt(e.target.value, 10) || 150)}
                    className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Research Signals / Keywords (comma separated)</label>
                <input
                  type="text"
                  value={editResearchKeywords}
                  onChange={e => setEditResearchKeywords(e.target.value)}
                  placeholder="save this, hooks, framework, swipe file"
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
                <span className="text-[10px] text-zinc-400">Creators whose bio includes these signals score higher for Vault.</span>
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Role Keywords (comma separated)</label>
                <input
                  type="text"
                  value={editRoleKeywords}
                  onChange={e => setEditRoleKeywords(e.target.value)}
                  placeholder="content creator, strategist, educator"
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Excluded / Negative Keywords (comma separated)</label>
                <input
                  type="text"
                  value={editExcludedKeywords}
                  onChange={e => setEditExcludedKeywords(e.target.value)}
                  placeholder="meme, giveaway, fan page, repost"
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={e => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-900"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                  Campaign is Active (available for Discovery runs)
                </label>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingCampaign(null)}
                className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-200 font-medium border border-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-insta flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
              >
                {savingEdit ? (
                  <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE CUSTOM CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
          <form onSubmit={handleCreateCampaign} className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 border border-zinc-200 shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-950">Create Custom Prospect Campaign</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Define search queries and audience boundaries for Vault.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs overflow-y-auto pr-1">
              <div>
                <label className="font-semibold text-zinc-700">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design & UX Framework Creators"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Description</label>
                <input
                  type="text"
                  placeholder="e.g. UI designers and design thinkers who save Figma teardowns"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700">Min Followers</label>
                  <input
                    type="number"
                    min={100}
                    step={500}
                    value={newMinFollowers}
                    onChange={e => setNewMinFollowers(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700">Max Followers</label>
                  <input
                    type="number"
                    min={500}
                    step={1000}
                    value={newMaxFollowers}
                    onChange={e => setNewMaxFollowers(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Search Queries (comma separated)</label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={e => setNewKeywords(e.target.value)}
                  placeholder="content creator hooks, UGC creator framework"
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-200 font-medium border border-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-insta rounded-lg px-4 py-1.5 text-xs font-semibold text-white cursor-pointer shadow-xs active:scale-95"
              >
                Save Campaign
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
