'use client';

import React from 'react';
import { 
  X, 
  Bot, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Trash2, 
  Plus,
  Play
} from 'lucide-react';
import { BotSession, detectMeetingPlatform } from '@/lib/bot/mockBotService';

interface BotSessionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: BotSession[];
  onSelectSession: (session: BotSession) => void;
  onNewBotInvite: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function BotSessionsDrawer({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onNewBotInvite,
  onDeleteSession,
}: BotSessionsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in">
      <div className="h-full w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Notetaker Sessions</h3>
              <p className="text-xs text-slate-500">History of dispatched meeting bots</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {sessions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">No Bot Sessions Yet</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] mx-auto">
                  Invite an AI bot to your Google Meet, Zoom, or Teams call to transcribe dialog automatically.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNewBotInvite();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Invite New Bot</span>
              </button>
            </div>
          ) : (
            sessions.map((session) => {
              const platformInfo = detectMeetingPlatform(session.meetingUrl);
              const isLive = session.status === 'in_meeting' || session.status === 'waiting_room';

              return (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isLive 
                      ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-500/10' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-1.5 ${platformInfo.badgeBg} ${platformInfo.badgeText}`}>
                        {platformInfo.label}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {session.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Delete session record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectSession(session);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700 transition-colors"
                      >
                        <span>Open Session</span>
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Bottom CTA */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            onClick={() => {
              onClose();
              onNewBotInvite();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Invite AI Bot to Another Meeting</span>
          </button>
        </div>

      </div>
    </div>
  );
}
