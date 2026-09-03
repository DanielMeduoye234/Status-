'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/context/AuthContext';
import { 
  FolderKanban, 
  ChevronDown, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck,
  CheckCircle2,
  Settings
} from 'lucide-react';
import ProjectModal from './ProjectModal';

export default function Navbar() {
  const { user, projects, activeProject, setActiveProject, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900">STATUS</span>
            </div>
          </Link>

          <div className="hidden h-5 w-[1px] bg-slate-200 md:block" />

          {/* Project Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              <div 
                className="h-2.5 w-2.5 rounded-full" 
                style={{ backgroundColor: activeProject?.color || '#2563eb' }}
              />
              <span className="max-w-[140px] truncate sm:max-w-[200px]">
                {activeProject ? activeProject.name : 'Select Project'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Projects
                </div>
                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {projects.map((proj) => (
                    <button
                      key={proj.id}
                      onClick={() => setActiveProject(proj)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                        activeProject?.id === proj.id
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: proj.color || '#2563eb' }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>
                      {activeProject?.id === proj.id && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-1 border-t border-slate-100 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      setIsProjectModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side Profile & Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 pr-2.5 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">
                {user?.email ? user.email.slice(0, 2).toUpperCase() : 'PM'}
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate font-semibold">
                {user?.email ? user.email.split('@')[0] : 'Project Manager'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1"
                onClick={() => setUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.email || 'pm.lead@company.com'}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    Supabase Verified PM
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/projects"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <FolderKanban className="h-3.5 w-3.5 text-slate-400" />
                    Manage Projects
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    Account & Settings
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  {user ? (
                    <button
                      onClick={signOut}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      Sign In to Supabase
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </>
  );
}
