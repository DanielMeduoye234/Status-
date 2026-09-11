'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Sparkles, 
  Video, 
  Clock, 
  Calendar, 
  FolderKanban, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Languages, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  detectMeetingPlatform, 
  DEMO_MEETING_LINKS, 
  MeetingPlatform, 
  BotSession 
} from '@/lib/bot/mockBotService';

interface InviteBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatchBot: (botConfig: {
    meetingUrl: string;
    platform: MeetingPlatform;
    title: string;
    projectId?: string;
    botName: string;
    joinMode: 'now' | 'scheduled';
    scheduledTime?: string;
    postGreeting: boolean;
    language: string;
  }) => void;
  initialProjectId?: string;
}

export default function InviteBotModal({
  isOpen,
  onClose,
  onDispatchBot,
  initialProjectId,
}: InviteBotModalProps) {
  const { projects, activeProject } = useAuth();

  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || activeProject?.id || ''
  );
  const [botName, setBotName] = useState('Hexavia Notetaker');
  const [joinMode, setJoinMode] = useState<'now' | 'scheduled'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [postGreeting, setPostGreeting] = useState(true);
  const [language, setLanguage] = useState('en-US');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recallConfig, setRecallConfig] = useState<{
    configured: boolean;
    region?: string;
    checked: boolean;
  }>({ configured: false, checked: false });
  const [forceSimulation, setForceSimulation] = useState(false);

  // Check if Recall.ai is configured on the backend
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/bot/test-connection')
      .then((res) => res.json())
      .then((data) => {
        setRecallConfig({
          configured: Boolean(data.configured),
          region: data.region,
          checked: true,
        });
      })
      .catch(() => {
        setRecallConfig({ configured: false, checked: true });
      });
  }, [isOpen]);

  // Sync selected project with active project
  useEffect(() => {
    if (activeProject && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject, selectedProjectId]);

  if (!isOpen) return null;

  const platformInfo = detectMeetingPlatform(meetingUrl);

  const handleApplyDemo = (demo: typeof DEMO_MEETING_LINKS[0]) => {
    setMeetingUrl(demo.url);
    if (!meetingTitle) {
      setMeetingTitle(demo.title);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingUrl.trim()) return;

    setIsSubmitting(true);

    try {
      await onDispatchBot({
        meetingUrl: meetingUrl.trim(),
        platform: platformInfo.platform,
        title: meetingTitle.trim() || `${platformInfo.label} Sync Session`,
        projectId: selectedProjectId || undefined,
        botName: botName.trim() || 'Hexavia Notetaker',
        joinMode,
        scheduledTime: joinMode === 'scheduled' ? `${scheduledDate} ${scheduledTime}` : undefined,
        postGreeting,
        language,
      });
      onClose();
    } catch (err) {
      console.error('Dispatch failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header Bar with Gradient Glow */}
        <div className="relative border-b border-slate-100 bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-4 ring-blue-50">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">Invite AI Meeting Notetaker</h2>
                  {recallConfig.checked && (
                    recallConfig.configured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Recall.ai Live ({recallConfig.region || 'us-west-2'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                        <Sparkles className="h-2.5 w-2.5 text-amber-600" />
                        Simulation Mode
                      </span>
                    )
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {recallConfig.configured
                    ? 'Dispatches a live Recall.ai bot into your call to record, diarize speakers, and transcribe'
                    : 'Interactive simulation mode. Set RECALL_AI_API_KEY in .env.local to dispatch real bots'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Missing API Key Warning Banner */}
          {recallConfig.checked && !recallConfig.configured && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold text-amber-950">RECALL_AI_API_KEY is not configured on this server:</span>
                <p className="mt-0.5 text-amber-800">
                  Submitting will start an <strong>offline demo simulation</strong>. A real bot will <em>not</em> join your live call.
                </p>
                <p className="mt-1 text-[11px] text-amber-700">
                  To invite a real bot to your Google Meet or Zoom meeting, add <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-semibold">RECALL_AI_API_KEY</code> to your Vercel Environment Variables.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Meeting Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-blue-600" />
                Meeting Invitation Link
              </label>
              {meetingUrl && (
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${platformInfo.badgeBg} ${platformInfo.badgeText}`}>
                  <CheckCircle2 className="h-3 w-3" />
                  {platformInfo.label} Detected
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="url"
                required
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Paste Google Meet, Zoom, MS Teams, or Webex link..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
              />
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                Quick test with sample link:
              </span>
              {DEMO_MEETING_LINKS.map((demo) => (
                <button
                  key={demo.platform}
                  type="button"
                  onClick={() => handleApplyDemo(demo)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-colors shadow-2xs"
                >
                  {demo.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Meeting Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Meeting Title / Agenda
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Sprint 25 Sync & Architecture"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Default Project Destination</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="">-- Choose After Meeting Concludes --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                When the meeting ends, you will review the AI summary and can connect it to any project.
              </p>
            </div>
          </div>

          {/* Section 3: Bot Persona & Dialect */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Bot Display Name in Call
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="Hexavia Notetaker"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Name shown to other attendees in the video participant list
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Languages className="h-3 w-3 text-slate-500" />
                Primary Language / Dialect
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="en-US">English (United States)</option>
                <option value="en-GB">English (United Kingdom / International)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="fr-FR">French (Français)</option>
                <option value="de-DE">German (Deutsch)</option>
                <option value="pt-BR">Portuguese (Português)</option>
                <option value="ja-JP">Japanese (日本語)</option>
              </select>
            </div>
          </div>

          {/* Section 4: Dispatch Mode (Join Now vs Scheduled) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              When Should the Bot Join?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJoinMode('now')}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  joinMode === 'now'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                  joinMode === 'now' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Join Right Now</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Bot enters the waiting room immediately
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setJoinMode('scheduled')}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                  joinMode === 'scheduled'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                  joinMode === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Schedule for Later</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Enters call automatically at meeting start
                  </div>
                </div>
              </button>
            </div>

            {/* Scheduled date/time picker */}
            {joinMode === 'scheduled' && (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Preferences */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-xs font-semibold text-slate-800">In-Meeting Greeting</div>
                <div className="text-[11px] text-slate-500">
                  Bot announces in chat: &ldquo;Hello! I am {botName} recording for the PM.&rdquo;
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={postGreeting}
                onChange={(e) => setPostGreeting(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Admission Notice Tip */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 p-3 text-[11px] text-amber-900">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Host Admission Notice:</span> Once dispatched, the bot will appear in your meeting&apos;s waiting room. Remember to click <span className="font-semibold">&ldquo;Admit&rdquo;</span> so it can join and begin transcribing.
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !meetingUrl.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              <span>
                {isSubmitting
                  ? 'Dispatching Notetaker...'
                  : joinMode === 'now'
                  ? (recallConfig.configured ? 'Dispatch Recall.ai Bot' : 'Start Demo Simulation')
                  : 'Schedule AI Notetaker'}
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
