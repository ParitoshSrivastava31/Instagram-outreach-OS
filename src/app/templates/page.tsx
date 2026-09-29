'use client';

import React, { useEffect, useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
  UserCheck
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
      <div className="border-b border-[#262938] pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-white">Deterministic Message Templates</h1>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Zero AI • 100% Authentic
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Tailored templates specifically matched to creator behaviors (e.g. telling people to &apos;save this&apos; or publishing AI workflows).
        </p>
      </div>

      {/* Variables & Personalization Guide (Prompt Section 19 & 20) */}
      <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>Objective Profile Variables</span>
        </div>
        <p className="mt-1 text-gray-300">
          Personalization is strictly populated from public facts detected in the creator&apos;s bio or captions. No hallucinated observations.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px]">
          <span className="rounded bg-[#0f111a] px-2 py-1 text-indigo-200 border border-[#2b2e40]">&#123;&#123;first_name&#125;&#125;</span>
          <span className="rounded bg-[#0f111a] px-2 py-1 text-indigo-200 border border-[#2b2e40]">&#123;&#123;username&#125;&#125;</span>
          <span className="rounded bg-[#0f111a] px-2 py-1 text-indigo-200 border border-[#2b2e40]">&#123;&#123;niche&#125;&#125;</span>
          <span className="rounded bg-[#0f111a] px-2 py-1 text-indigo-200 border border-[#2b2e40]">&#123;&#123;followers&#125;&#125;</span>
          <span className="rounded bg-[#0f111a] px-2 py-1 text-indigo-200 border border-[#2b2e40]">&#123;&#123;sender_name&#125;&#125;</span>
          <span className="rounded bg-[#0f111a] px-2 py-1 text-indigo-200 border border-[#2b2e40]">&#123;&#123;vault_username&#125;&#125;</span>
        </div>
      </div>

      {/* Test Preview Simulator Inputs */}
      <div className="mt-6 rounded-xl border border-[#262938] bg-[#141620] p-4 text-xs">
        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
          Live Interpolation Simulator
        </span>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-gray-400">First Name</span>
            <input
              type="text"
              value={testFirstName}
              onChange={e => setTestFirstName(e.target.value)}
              className="mt-1 w-full rounded bg-[#0e1017] p-1.5 text-xs text-white border border-[#262938]"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400">Username</span>
            <input
              type="text"
              value={testUsername}
              onChange={e => setTestUsername(e.target.value)}
              className="mt-1 w-full rounded bg-[#0e1017] p-1.5 text-xs text-white border border-[#262938]"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400">Niche</span>
            <input
              type="text"
              value={testNiche}
              onChange={e => setTestNiche(e.target.value)}
              className="mt-1 w-full rounded bg-[#0e1017] p-1.5 text-xs text-white border border-[#262938]"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-400">Followers</span>
            <input
              type="text"
              value={testFollowers}
              onChange={e => setTestFollowers(e.target.value)}
              className="mt-1 w-full rounded bg-[#0e1017] p-1.5 text-xs text-white border border-[#262938]"
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
              className="rounded-xl border border-[#262938] bg-[#141620] p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#222533] pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                  <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                    {tpl.target_tier || 'Tier A'}
                  </span>
                </div>
                <button
                  onClick={() => copyTemplate(tpl.id, previewText)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
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
                <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">
                  Rendered Output for Prospect:
                </div>
                <p className="bg-[#0e1017] p-3.5 rounded-lg border border-[#262938] text-xs text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {previewText}
                </p>
              </div>

              {/* Raw Template */}
              <div className="mt-3">
                <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1">
                  Raw Template String:
                </div>
                <pre className="bg-[#0b0c13] p-2.5 rounded text-[11px] text-gray-400 font-mono whitespace-pre-wrap">
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
