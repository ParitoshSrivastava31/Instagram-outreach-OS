'use client';

import React, { ReactNode } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

export default function Tooltip({ label, children, side = 'bottom', className = '' }: TooltipProps) {
  return (
    <div className={`relative group inline-flex items-center ${className}`}>
      {children}
      <div
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 hidden group-hover:flex flex-col items-center transition-all duration-150 animate-in fade-in zoom-in-95 ${
          side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
        }`}
      >
        {side === 'bottom' && (
          <div className="w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-zinc-900 -mb-px" />
        )}
        <div className="rounded-md bg-zinc-950 px-2 py-1 text-[11px] font-medium text-zinc-100 shadow-md whitespace-nowrap border border-zinc-800 tracking-tight">
          {label}
        </div>
        {side === 'top' && (
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-900 -mt-px" />
        )}
      </div>
    </div>
  );
}
