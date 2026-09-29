'use client';

import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'O', label: 'Open profile in new tab & copy personalized DM' },
    { key: 'S', label: 'Mark lead as Contacted' },
    { key: 'R', label: 'Mark lead as Replied' },
    { key: 'X', label: 'Skip lead (remove from active queue)' },
    { key: 'Z', label: 'Snooze lead for 3 days' },
    { key: 'J / ↓', label: 'Navigate to next lead in queue' },
    { key: 'K / ↑', label: 'Navigate to previous lead in queue' },
    { key: '?', label: 'Open / close this shortcuts modal' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 border border-zinc-200/90 shadow-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
              <Command className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2.5 text-xs text-zinc-500 leading-relaxed">
          Designed for maximum human execution speed. Complete a manual send workflow in 15–30 seconds without touching your mouse.
        </p>

        <div className="mt-4 space-y-2 divide-y divide-zinc-100">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between pt-2 text-xs">
              <span className="text-zinc-600">{sc.label}</span>
              <kbd className="font-mono text-[11px] font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300/80 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-zinc-100 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-black transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
