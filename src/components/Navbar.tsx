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
  ShieldAlert,
  Zap,
  CheckCircle2
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
    <header className="sticky top-0 z-50 border-b border-[#262938] bg-[#0d0f17]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-white text-sm">Instagram Outreach OS</span>
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
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
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#1d202d] text-white border border-[#363b50]'
                    : 'text-gray-400 hover:bg-[#161822] hover:text-gray-200'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side live budget & limit metrics */}
        <div className="flex items-center gap-2.5">
          {/* Provider status */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-[#161822] px-2.5 py-1 text-[11px] border border-[#262938]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                providerInfo?.isMock ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-gray-300">
              {providerInfo?.isMock ? 'Sandbox ($0 Cost)' : 'Apify Connected'}
            </span>
          </div>

          {/* Monthly Budget Guard */}
          <div className="flex items-center gap-1.5 rounded-md bg-[#161822] px-2.5 py-1 text-xs border border-[#262938]">
            <span className="text-gray-400 text-[11px]">Budget:</span>
            <span
              className={`font-mono text-[11px] font-medium ${
                budgetStatus?.is_budget_exceeded ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              ${budgetStatus ? budgetStatus.estimated_usage_usd.toFixed(2) : '0.00'} / $
              {budgetStatus ? budgetStatus.monthly_budget_usd.toFixed(2) : '4.50'}
            </span>
          </div>

          {/* Daily Queue Progress */}
          <div className="flex items-center gap-1.5 rounded-md bg-[#161822] px-2.5 py-1 text-xs border border-[#262938]">
            <span className="text-gray-400 text-[11px]">Today:</span>
            <span className="font-mono text-[11px] font-medium text-indigo-400">
              {budgetStatus?.today_qualified_leads ?? 0} / 60
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
