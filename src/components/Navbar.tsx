'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Send,
  Users,
  Layers,
  FileText,
  BarChart3,
  Settings,
  Command,
  Lock,
} from 'lucide-react';
import { MonthlyBudgetStatus } from '@/types';
import Tooltip from './Tooltip';
import ShortcutsModal from './ShortcutsModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [budgetStatus, setBudgetStatus] = useState<MonthlyBudgetStatus | null>(null);
  const [providerInfo, setProviderInfo] = useState<{ id: string; name: string; isMock: boolean } | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    if (pathname === '/login') return;
    fetch('/api/discovery/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBudgetStatus(data.budgetStatus);
          setProviderInfo(data.provider);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const primaryNav = [
    { label: 'Queue', href: '/', icon: Send },
    { label: 'Discovery', href: '/discovery', icon: Compass },
    { label: 'Database', href: '/leads', icon: Users },
    { label: 'Campaigns', href: '/campaigns', icon: Layers },
  ];

  if (pathname === '/login') return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-xs group-hover:bg-zinc-800 transition">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="m14.5 9.5 2-2" />
                  <path d="m7.5 16.5 2-2" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight text-zinc-900">
                <span>Vault</span>
                <span className="text-zinc-300 font-normal">/</span>
                <span className="text-zinc-500 font-normal">Outreach</span>
                <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200/60 hidden sm:inline-block">
                  @vault.moment
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Sleek Segmented Primary Tabs */}
          <nav className="flex items-center gap-0.5 rounded-lg bg-zinc-100/70 p-0.5 border border-zinc-200/50">
            {primaryNav.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? 'bg-white text-zinc-950 font-semibold shadow-2xs border border-zinc-200/60'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Icon Utilities + Budget Telemetry */}
          <div className="flex items-center gap-1.5">
            {/* Secondary Tools as Clean Icon Buttons with Hover Tooltips */}
            <Tooltip label="Message Templates">
              <Link
                href="/templates"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                  pathname === '/templates'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
              </Link>
            </Tooltip>

            <Tooltip label="Outreach & Funnel Analytics">
              <Link
                href="/analytics"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                  pathname === '/analytics'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Link>
            </Tooltip>

            <Tooltip label="Settings & Webhook Config">
              <Link
                href="/settings"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                  pathname === '/settings'
                    ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-2xs'
                    : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </Tooltip>

            <Tooltip label="Lock Workspace (Sign Out)">
              <button
                onClick={handleLogout}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
            </Tooltip>

            <Tooltip label="Keyboard Shortcuts (?)">
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              >
                <Command className="h-3.5 w-3.5" />
              </button>
            </Tooltip>

            <div className="h-3.5 w-px bg-zinc-200/80 mx-0.5" />

            {/* Provider Status Indicator */}
            <Tooltip
              label={
                providerInfo?.isMock
                  ? 'Sandbox Mode (Mock Apify). Set APIFY_API_TOKEN in .env.local to activate Live Apify.'
                  : 'Live Apify Provider Active'
              }
            >
              <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-mono bg-zinc-50 border border-zinc-200/70 text-zinc-600 hover:bg-zinc-100 transition cursor-default">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      providerInfo?.isMock ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      providerInfo?.isMock ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </span>
                <span className="text-[10px] hidden sm:inline-block">
                  {providerInfo?.isMock ? 'Sandbox' : 'Live'}
                </span>
              </div>
            </Tooltip>

            {/* Monthly Budget Guard */}
            <Tooltip
              label={`Apify Monthly Budget: $${
                budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'
              } of $${
                budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'
              } hard limit used`}
            >
              <div className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 text-[11px] border border-zinc-200/70 font-mono hover:bg-zinc-100 transition cursor-default">
                <span className="text-zinc-400">$</span>
                <span
                  className={`font-semibold ${
                    budgetStatus?.is_budget_exceeded ? 'text-rose-600' : 'text-zinc-900'
                  }`}
                >
                  {budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'}
                </span>
                <span className="text-zinc-300">/</span>
                <span className="text-zinc-500 font-normal">
                  {budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}
