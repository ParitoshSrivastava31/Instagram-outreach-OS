'use client';

import React, { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Info
} from 'lucide-react';
import { MessageTemplate } from '@/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testFirstName, setTestFirstName] = useState('Elena');
  const [testUsername, setTestUsername] = useState('elena.contentlab');
  const [testNiche, setTestNiche] = useState('AI content strategy');
  const [testFollowers, setTestFollowers] = useState('8.4K');

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.templates);
        }
      });
  }, []);

  const renderPreview = (templateText: string) => {
    return templateText
      .replace(/\{\{first_name\}\}/g, testFirstName)
      .replace(/\{\{username\}\}/g, testUsername)
      .replace(/\{\{niche\}\}/g, testNiche)
      .replace(/\{\{followers\}\}/g, testFollowers)
      .replace(/\{\{sender_name\}\}/g, 'Paritosh')
      .replace(/\{\{vault_username\}\}/g, 'vault.moment');
  };

  const copyTemplate = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Deterministic Message Templates</h1>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Zero AI • 100% Authentic
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Tailored templates specifically matched to creator behaviors (e.g. telling people to &apos;save this&apos; or publishing AI workflows).
        </p>
      </div>

      {/* Variables & Personalization Guide */}
      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-indigo-900">
          <Info className="h-4 w-4 text-indigo-600" />
          <span>Objective Profile Variables</span>
        </div>
        <p className="mt-1 text-slate-600">
          Personalization is strictly populated from public facts detected in the creator&apos;s bio or captions. No hallucinated observations.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
          <span className="rounded bg-white px-2 py-1 text-indigo-700 border border-indigo-200 shadow-2xs">&#123;&#123;first_name&#125;&#125;</span>
          <span className="rounded bg-white px-2 py-1 text-indigo-700 border border-indigo-200 shadow-2xs">&#123;&#123;username&#125;&#125;</span>
          <span className="rounded bg-white px-2 py-1 text-indigo-700 border border-indigo-200 shadow-2xs">&#123;&#123;niche&#125;&#125;</span>
          <span className="rounded bg-white px-2 py-1 text-indigo-700 border border-indigo-200 shadow-2xs">&#123;&#123;followers&#125;&#125;</span>
          <span className="rounded bg-white px-2 py-1 text-indigo-700 border border-indigo-200 shadow-2xs">&#123;&#123;sender_name&#125;&#125;</span>
          <span className="rounded bg-white px-2 py-1 text-indigo-700 border border-indigo-200 shadow-2xs">&#123;&#123;vault_username&#125;&#125;</span>
        </div>
      </div>

      {/* Test Preview Simulator Inputs */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Live Interpolation Simulator
        </span>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] font-semibold text-slate-500">First Name</span>
            <input
              type="text"
              value={testFirstName}
              onChange={e => setTestFirstName(e.target.value)}
              className="mt-1 w-full rounded bg-slate-50 p-1.5 text-xs text-slate-900 border border-slate-300 focus:border-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500">Username</span>
            <input
              type="text"
              value={testUsername}
              onChange={e => setTestUsername(e.target.value)}
              className="mt-1 w-full rounded bg-slate-50 p-1.5 text-xs text-slate-900 border border-slate-300 focus:border-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500">Niche</span>
            <input
              type="text"
              value={testNiche}
              onChange={e => setTestNiche(e.target.value)}
              className="mt-1 w-full rounded bg-slate-50 p-1.5 text-xs text-slate-900 border border-slate-300 focus:border-slate-800 focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500">Followers</span>
            <input
              type="text"
              value={testFollowers}
              onChange={e => setTestFollowers(e.target.value)}
              className="mt-1 w-full rounded bg-slate-50 p-1.5 text-xs text-slate-900 border border-slate-300 focus:border-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="mt-6 space-y-5">
        {templates.map(tpl => {
          const previewText = renderPreview(tpl.template);
          return (
            <div
              key={tpl.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                    {tpl.target_tier || 'Tier A'}
                  </span>
                </div>
                <button
                  onClick={() => copyTemplate(tpl.id, previewText)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition font-medium cursor-pointer"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Preview</span>
                    </>
                  )}
                </button>
              </div>

              {/* Rendered Preview */}
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Rendered Output for Prospect:
                </div>
                <p className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {previewText}
                </p>
              </div>

              {/* Raw Template */}
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Raw Template String:
                </div>
                <pre className="bg-slate-100/70 p-2.5 rounded text-[11px] text-slate-600 font-mono whitespace-pre-wrap border border-slate-200">
                  {tpl.template}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
