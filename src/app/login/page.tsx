'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLocked) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || 'Incorrect master passcode');
        if (data.isLocked) {
          setIsLocked(true);
        }
      }
    } catch {
      setError('Unable to verify passcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm relative z-10">
      {/* Brand identity badge */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-12 w-12 rounded-[14px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-lg shadow-pink-500/20 mb-4 transition-transform hover:scale-105">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="5" />
            <circle cx="12" cy="12" r="3.8" />
            <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Vault Outreach OS
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Enter master passcode to unlock founder workspace
        </p>
      </div>

      {/* Lock Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="passcode"
              className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2"
            >
              Master Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="passcode"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLocked}
                autoFocus
                placeholder={isLocked ? "Access locked for 24 hours" : "Enter passcode..."}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 disabled:opacity-50 disabled:bg-zinc-100 transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200/70 text-rose-700 text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim() || isLocked}
            className="w-full btn-insta flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs cursor-pointer active:scale-98"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isLocked ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>IP Address Locked (24h)</span>
              </>
            ) : (
              <>
                <span>Unlock Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            End-to-end Protected
          </span>
          <span className="font-mono">v1.0 • @vault.moment</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-zinc-400 mt-6">
        Set <code className="font-mono text-zinc-600">ADMIN_PASSWORD</code> in your environment variables to change this passcode anytime.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 -mt-10">
      <div className="absolute inset-0 bg-radial from-zinc-100/60 to-transparent pointer-events-none" />
      <Suspense
        fallback={
          <div className="w-full max-w-sm h-64 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
