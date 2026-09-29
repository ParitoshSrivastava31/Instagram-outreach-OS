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
  Zap
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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-slate-900 text-sm">Instagram Outreach OS</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                  for @vault.moment
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side live budget & limit metrics */}
        <div className="flex items-center gap-2.5">
          {/* Provider status */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] border border-slate-200 text-slate-600">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                providerInfo?.isMock ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span>
              {providerInfo?.isMock ? 'Sandbox Mode' : 'Apify Live'}
            </span>
          </div>

          {/* Monthly Budget Guard */}
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs border border-slate-200">
            <span className="text-slate-500 text-[11px]">Budget:</span>
            <span
              className={`font-mono text-[11px] font-semibold ${
                budgetStatus?.is_budget_exceeded ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              ${budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'} / $
              {budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'}
            </span>
          </div>

          {/* Daily Queue Progress */}
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs border border-slate-200">
            <span className="text-slate-500 text-[11px]">Today:</span>
            <span className="font-mono text-[11px] font-semibold text-slate-900">
              {budgetStatus?.today_qualified_leads ?? 0} / 60
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
