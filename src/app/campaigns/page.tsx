'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Users,
  Compass,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Campaign } from '@/types';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMinFollowers, setNewMinFollowers] = useState(1000);
  const [newMaxFollowers, setNewMaxFollowers] = useState(20000);
  const [newKeywords, setNewKeywords] = useState('content creator hooks, UGC creator framework');
  const [createNotice, setCreateNotice] = useState<string | null>(null);

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
          keywords: newKeywords.split(',').map(s => s.trim()),
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
        setCreateNotice('Campaign created successfully!');
        setTimeout(() => setCreateNotice(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Toast Notice */}
      {createNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xl border border-zinc-800 animate-in fade-in duration-150">
          {createNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-950">Campaign Groups</h1>
            <p className="mt-1 text-xs text-zinc-500 max-w-xl leading-relaxed">
              Each campaign targets a specific segment of information-heavy creators to test which audience converts highest.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-950 hover:bg-black px-3.5 py-2 text-xs font-semibold text-white transition shadow-2xs cursor-pointer"
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
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                {/* Follower Range & Limits */}
                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50/70 p-2.5 text-xs border border-zinc-200/80">
                  <div>
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase">Followers</span>
                    <div className="font-mono font-bold text-zinc-800">
                      {camp.target_min_followers / 1000}k – {camp.target_max_followers / 1000}k
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
                      {camp.research_keywords.slice(0, 4).map(k => (
                        <span key={k} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                          &quot;{k}&quot;
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-zinc-600">Roles: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {camp.role_keywords.slice(0, 3).map(k => (
                        <span key={k} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 border border-zinc-200">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-zinc-100 pt-3 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-mono">ID: {camp.id}</span>
                <Link
                  href={`/discovery?campaignId=${camp.id}`}
                  className="flex items-center gap-1 rounded-lg bg-zinc-50 hover:bg-zinc-950 hover:text-white px-3 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200 transition shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Launch Discovery</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Custom Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <form onSubmit={handleCreateCampaign} className="w-full max-w-lg rounded-2xl bg-white p-6 border border-zinc-200 shadow-2xl">
            <h3 className="text-base font-semibold text-zinc-950">Create Custom Prospect Campaign</h3>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed">Define search queries and audience boundaries for Vault.</p>

            <div className="mt-4 space-y-3 text-xs">
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
                    value={newMinFollowers}
                    onChange={e => setNewMinFollowers(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700">Max Followers</label>
                  <input
                    type="number"
                    value={newMaxFollowers}
                    onChange={e => setNewMaxFollowers(parseInt(e.target.value, 10))}
                    className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700">Search Queries (comma separated)</label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={e => setNewKeywords(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-50/60 p-2 text-zinc-900 border border-zinc-300 focus:border-zinc-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-200 font-medium border border-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-zinc-950 px-4 py-1.5 text-xs font-semibold text-white hover:bg-black cursor-pointer"
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
