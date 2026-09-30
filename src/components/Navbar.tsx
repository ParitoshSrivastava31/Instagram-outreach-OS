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
          {/* Left: Brand Identity with Instagram Squircle Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-linear-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-xs shadow-pink-500/25 group-hover:scale-105 transition-all">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="5" />
                  <circle cx="12" cy="12" r="3.8" />
                  <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
                </svg>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium tracking-tight text-zinc-900">
                <span>Vault</span>
                <span className="text-zinc-300 font-normal">/</span>
                <span className="text-zinc-500 font-normal">Outreach</span>
                <span className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200/60 hidden sm:inline-block shrink-0 whitespace-nowrap">
                  @vault.moment
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Sleek Segmented Primary Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-0.5 rounded-lg bg-zinc-100/70 p-0.5 border border-zinc-200/50">
            {primaryNav.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/60'
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
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            {/* Secondary Tools as Clean Icon Buttons with Hover Tooltips (hidden on very small phones, accessible via bottom nav) */}
            <div className="hidden sm:flex items-center gap-1">
              <Tooltip label="Message Templates">
                <Link
                  href="/templates"
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                    pathname === '/templates'
                      ? 'bg-zinc-100 text-zinc-900 font-medium shadow-2xs'
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
                      ? 'bg-zinc-100 text-zinc-900 font-medium shadow-2xs'
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
                      ? 'bg-zinc-100 text-zinc-900 font-medium shadow-2xs'
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
            </div>

            {/* Provider Status Indicator */}
            <Tooltip
              label={
                budgetStatus?.is_budget_exceeded
                  ? `Apify Monthly Budget Exceeded ($${budgetStatus.estimated_usage_usd.toFixed(2)} / $${budgetStatus.monthly_budget_usd.toFixed(2)}). Live runs paused.`
                  : providerInfo?.isMock
                  ? 'Sandbox Mode (Mock Apify). Set APIFY_API_TOKEN in .env.local to activate Live Apify.'
                  : 'Live Apify Provider Active'
              }
            >
              <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-mono bg-zinc-50 border border-zinc-200/70 text-zinc-600 hover:bg-zinc-100 transition cursor-default shrink-0 whitespace-nowrap">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      budgetStatus?.is_budget_exceeded
                        ? 'bg-rose-400'
                        : providerInfo?.isMock
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                      budgetStatus?.is_budget_exceeded
                        ? 'bg-rose-500'
                        : providerInfo?.isMock
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </span>
                <span className={`text-[10px] hidden xs:inline-block ${budgetStatus?.is_budget_exceeded ? 'text-rose-600 font-semibold' : ''}`}>
                  {budgetStatus?.is_budget_exceeded ? 'Budget Limit' : providerInfo?.isMock ? 'Sandbox' : 'Live'}
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
              <div className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 border border-zinc-200/70 font-mono hover:bg-zinc-100 transition cursor-default text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap">
                <span className="text-zinc-400">$</span>
                <span
                  className={`font-medium ${
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

      {/* Mobile Bottom Navigation Bar (< md) - Instagram Style Thumb Reach */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200/90 px-1 py-1 flex items-center justify-around shadow-lg shadow-zinc-950/10 pb-[calc(env(safe-area-inset-bottom,0px)+3px)]">
        {[
          { label: 'Queue', href: '/', icon: Send },
          { label: 'Discovery', href: '/discovery', icon: Compass },
          { label: 'Database', href: '/leads', icon: Users },
          { label: 'Campaigns', href: '/campaigns', icon: Layers },
          { label: 'Settings', href: '/settings', icon: Settings },
        ].map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-zinc-900 font-medium'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <div className="relative">
                <Icon className={`h-4.5 w-4.5 transition-transform ${isActive ? 'text-zinc-950 scale-105' : 'text-zinc-400'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-linear-to-r from-[#e1306c] to-[#fd1d1d]" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight ${isActive ? 'text-zinc-900 font-medium' : 'text-zinc-500 font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  );
}

