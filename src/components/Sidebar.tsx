'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FileSpreadsheet, 
  FolderKanban, 
  Settings,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../lib/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { meetingSummaries, monthlyReports, projects } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Meeting Summaries',
      href: '/meeting-summary',
      icon: FileText,
      badge: meetingSummaries.length > 0 ? meetingSummaries.length : null,
    },
    {
      name: 'Monthly Reports',
      href: '/monthly-report',
      icon: FileSpreadsheet,
      badge: monthlyReports.length > 0 ? monthlyReports.length : null,
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      badge: projects.length > 0 ? projects.length : null,
    },
    {
      name: 'Settings & Config',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 justify-between h-[calc(100vh-4rem)] sticky top-16 shadow-[1px_0_3px_0_rgba(0,0,0,0.02)]">
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
          <nav className="space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Action Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs font-bold text-slate-900 mb-1">Quick Transcript Parser</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            Upload any Zoom meeting TXT to extract speaker dialog and action items.
          </p>
          <Link
            href="/meeting-summary"
            className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <span>Upload Meeting</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-slate-600">Status Platform</span>
          <span className="font-mono text-[10px]">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
