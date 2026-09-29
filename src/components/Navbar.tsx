'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Send,
  Users,
  Layers,
  FileText,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';
import { MonthlyBudgetStatus } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const [budgetStatus, setBudgetStatus] = useState<MonthlyBudgetStatus | null>(null);
  const [providerInfo, setProviderInfo] = useState<{ id: string; name: string; isMock: boolean } | null>(null);

  useEffect(() => {
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

  const navItems = [
    { label: "Today's Outreach", href: '/', icon: Send },
    { label: 'Run Discovery', href: '/discovery', icon: Compass },
    { label: 'Lead Database', href: '/leads', icon: Users },
    { label: 'Campaigns', href: '/campaigns', icon: Layers },
    { label: 'Templates', href: '/templates', icon: FileText },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white shadow-xs group-hover:bg-black transition">
              <span className="text-xs font-bold tracking-tighter">V</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-zinc-900">Instagram Outreach OS</span>
              <span className="text-[11px] text-zinc-400 font-mono">/ @vault.moment</span>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side live budget & telemetry */}
        <div className="flex items-center gap-2">
          {/* Provider status badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-zinc-50 px-2.5 py-0.5 text-[11px] border border-zinc-200 text-zinc-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                providerInfo?.isMock ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="font-medium">
              {providerInfo?.isMock ? 'Sandbox Mode' : 'Apify Live'}
            </span>
          </div>

          {/* Monthly Budget Guard */}
          <div className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 text-[11px] border border-zinc-200 font-mono">
            <span className="text-zinc-400">Budget:</span>
            <span
              className={`font-semibold ${
                budgetStatus?.is_budget_exceeded ? 'text-rose-600' : 'text-zinc-800'
              }`}
            >
              ${budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'} / $
              {budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'}
            </span>
          </div>

          {/* Daily Queue Count */}
          <div className="flex items-center gap-1 rounded-md bg-zinc-50 px-2 py-0.5 text-[11px] border border-zinc-200 font-mono">
            <span className="text-zinc-400">Queue:</span>
            <span className="font-semibold text-zinc-900">
              {budgetStatus?.today_qualified_leads ?? 0}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
