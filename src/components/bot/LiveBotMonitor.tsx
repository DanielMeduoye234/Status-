'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  Users, 
  Radio, 
  Square, 
  Play, 
  FastForward, 
  FileText, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Volume2,
  CheckCircle2,
  RefreshCw,
  Zap,
  X
} from 'lucide-react';
import { 
  BotSession, 
  BotStatus, 
  TranscriptChunk, 
  detectMeetingPlatform,
  SIMULATED_TRANSCRIPT_DIALOGS
} from '@/lib/bot/mockBotService';

interface LiveBotMonitorProps {
  session: BotSession;
  onUpdateSession: (updatedSession: BotSession) => void;
  onImportTranscript: (fullTranscript: string, title: string, projectId?: string) => void;
  onDismiss: () => void;
}

export default function LiveBotMonitor({
  session,
  onUpdateSession,
  onImportTranscript,
  onDismiss,
}: LiveBotMonitorProps) {
  const [copied, setCopied] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const platformInfo = detectMeetingPlatform(session.meetingUrl);

  // Format seconds into HH:MM:SS or MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Auto-scroll transcript container as new lines arrive
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.transcriptChunks]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulation timer and duration counter
  useEffect(() => {
    if (session.status === 'completed' || session.status === 'error') {
      return;
    }

    const timer = setInterval(() => {
      onUpdateSession({
        ...session,
        durationSeconds: session.durationSeconds + 1,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, onUpdateSession]);

  // Live polling for real Recall.ai bot sessions
  useEffect(() => {
    if (!session.isRealBot || !session.recallBotId) {
      return;
    }
    if (session.status === 'completed' || session.status === 'error') {
      return;
    }

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bot/${session.recallBotId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        const updatedChunks = (data.transcriptChunks && data.transcriptChunks.length > 0)
          ? data.transcriptChunks
          : session.transcriptChunks;

        const updatedTranscript = data.fullTranscript || session.fullTranscript;

        onUpdateSession({
          ...session,
          status: data.status,
          recallStatus: data.recallStatusCode,
          participants: data.participants?.length > 0 ? data.participants : session.participants,
          activeSpeaker: data.activeSpeaker || session.activeSpeaker,
          transcriptChunks: updatedChunks,
          fullTranscript: updatedTranscript,
        });
      } catch (err) {
        console.error('Error polling Recall.ai bot status:', err);
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [session, onUpdateSession]);

  // Manual refresh for Recall.ai status and transcript
  const handleManualRefresh = async () => {
    if (!session.isRealBot || !session.recallBotId) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/bot/${session.recallBotId}/status`);
      if (res.ok) {
        const data = await res.json();
        onUpdateSession({
          ...session,
          status: data.status,
          recallStatus: data.recallStatusCode,
          participants: data.participants?.length > 0 ? data.participants : session.participants,
          activeSpeaker: data.activeSpeaker || session.activeSpeaker,
          transcriptChunks: data.transcriptChunks?.length > 0 ? data.transcriptChunks : session.transcriptChunks,
          fullTranscript: data.fullTranscript || session.fullTranscript,
        });
      }
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle host admission from waiting room
  const handleHostAdmit = () => {
    if (session.isRealBot && session.recallBotId) {
      handleManualRefresh();
      return;
    }

    const script = SIMULATED_TRANSCRIPT_DIALOGS[session.platform] || SIMULATED_TRANSCRIPT_DIALOGS.other;
    const firstSpeaker = script[0]?.speaker;

    onUpdateSession({
      ...session,
      status: 'in_meeting',
      activeSpeaker: firstSpeaker,
      transcriptChunks: script.slice(0, 1),
      fullTranscript: `${script[0].timestamp} ${script[0].speaker}: ${script[0].text}\n`,
      participants: Array.from(new Set(script.map((s) => s.speaker))),
    });
  };

  // Next speech chunk simulation or fast-forward
  const handleAddNextSpeech = () => {
    const script = SIMULATED_TRANSCRIPT_DIALOGS[session.platform] || SIMULATED_TRANSCRIPT_DIALOGS.other;
    const currentIndex = session.transcriptChunks.length;

    if (currentIndex < script.length) {
      const nextChunk = script[currentIndex];
      const newChunks = [...session.transcriptChunks, nextChunk];
      const fullText = newChunks.map((c) => `${c.timestamp} ${c.speaker}: ${c.text}`).join('\n\n');

      onUpdateSession({
        ...session,
        activeSpeaker: nextChunk.speaker,
        transcriptChunks: newChunks,
        fullTranscript: fullText,
        status: currentIndex + 1 === script.length ? 'completed' : 'in_meeting',
      });
    } else {
      handleCompleteMeeting();
    }
  };

  // Fast forward simulation to completion
  const handleFastForward = () => {
    const script = SIMULATED_TRANSCRIPT_DIALOGS[session.platform] || SIMULATED_TRANSCRIPT_DIALOGS.other;
    const fullText = script.map((c) => `${c.timestamp} ${c.speaker}: ${c.text}`).join('\n\n');

    onUpdateSession({
      ...session,
      status: 'completed',
      durationSeconds: Math.max(session.durationSeconds, 420), // 7 mins
      transcriptChunks: script,
      fullTranscript: fullText,
      activeSpeaker: undefined,
      participants: Array.from(new Set(script.map((s) => s.speaker))),
    });
  };

  // Stop / End meeting and leave call
  const handleCompleteMeeting = async () => {
    if (session.isRealBot && session.recallBotId) {
      try {
        await fetch(`/api/bot/${session.recallBotId}/leave`, { method: 'POST' });
      } catch (leaveErr) {
        console.error('Error ejecting Recall.ai bot:', leaveErr);
      }
    }

    const script = SIMULATED_TRANSCRIPT_DIALOGS[session.platform] || SIMULATED_TRANSCRIPT_DIALOGS.other;
    const currentChunks = session.transcriptChunks.length > 0 ? session.transcriptChunks : script;
    const fullText = currentChunks.map((c) => `${c.timestamp} ${c.speaker}: ${c.text}`).join('\n\n');

    onUpdateSession({
      ...session,
      status: 'completed',
      transcriptChunks: currentChunks,
      fullTranscript: fullText,
      activeSpeaker: undefined,
    });
  };

  // Copy transcript to clipboard
  const handleCopyTranscript = () => {
    if (!session.fullTranscript) return;
    navigator.clipboard.writeText(session.fullTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render status badge
  const renderStatusBadge = () => {
    switch (session.status) {
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {session.isRealBot ? 'Recall.ai: Connecting Bot...' : `Connecting to ${platformInfo.label}...`}
          </span>
        );
      case 'waiting_room':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 border border-orange-200">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
            {session.isRealBot ? 'In Waiting Room (Admit in call)' : 'In Waiting Room (Knocking)'}
          </span>
        );
      case 'in_meeting':
      case 'transcribing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {session.isRealBot ? 'LIVE • Recall.ai Transcribing' : 'LIVE • Transcribing Audio'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            Call Finished &bull; Transcript Ready
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            Bot Connection Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden transition-all">
      
      {/* Top Banner Header */}
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm ring-4 ring-blue-50">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  {session.title || 'Live Meeting Session'}
                </h3>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${platformInfo.badgeBg} ${platformInfo.badgeText}`}>
                  {platformInfo.label}
                </span>
                {session.isRealBot && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                    <Zap className="h-2.5 w-2.5 text-indigo-600" />
                    Recall.ai Live Bot
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>Bot: <strong className="text-slate-700">{session.botName}</strong></span>
                {session.projectName && (
                  <>
                    <span>&bull;</span>
                    <span>Project: <strong className="text-slate-700">{session.projectName}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {renderStatusBadge()}

            <button
              onClick={onDismiss}
              title="Close session monitor"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Meeting Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-3.5 bg-white border-b border-slate-100 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Duration</span>
          <div className="flex items-center gap-1.5 text-slate-900 font-mono font-bold text-sm mt-0.5">
            <Clock className="h-3.5 w-3.5 text-blue-600" />
            {formatTime(session.durationSeconds)}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Platform</span>
          <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
            {platformInfo.label}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Participants</span>
          <div className="flex items-center gap-1 text-slate-800 font-semibold text-xs mt-0.5">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            {session.participants.length > 0 ? `${session.participants.length} detected` : 'Detecting...'}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Transcript Lines</span>
          <span className="font-bold text-blue-600 text-xs mt-0.5 block">
            {session.transcriptChunks.length} dialog turns
          </span>
        </div>
      </div>

      {/* Waiting Room Prompt Alert */}
      {session.status === 'waiting_room' && (
        <div className="m-4 rounded-xl border border-orange-200 bg-orange-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 shrink-0 mt-0.5">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-orange-900">
                &ldquo;{session.botName}&rdquo; is in the {platformInfo.label} waiting room
              </h4>
              <p className="text-[11px] text-orange-700 mt-0.5">
                {session.isRealBot
                  ? `Switch to your ${platformInfo.label} window and click "Admit" to let Recall.ai join and start transcribing.`
                  : `The meeting host needs to click "Admit" in ${platformInfo.label} to let the bot in and start transcribing.`}
              </p>
            </div>
          </div>

          {session.isRealBot ? (
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Checking Status...' : 'Check Waiting Room Status'}</span>
            </button>
          ) : (
            <button
              onClick={handleHostAdmit}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-700 transition-colors shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Simulate Host Admit</span>
            </button>
          )}
        </div>
      )}

      {/* Audio Waveform & Active Speaker (when live in meeting) */}
      {session.status === 'in_meeting' && (
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-bold text-red-400 tracking-wide uppercase">REC</span>
            </div>

            {session.activeSpeaker ? (
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-200">
                  Active Speaker: <strong className="text-white">{session.activeSpeaker}</strong>
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Listening to conversation...</span>
            )}
          </div>

          {/* Soundwave Bars Visualizer Animation */}
          <div className="flex items-center gap-1 h-5">
            <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s] h-3" />
            <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.3s] h-5" />
            <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s] h-4" />
            <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s] h-2" />
            <span className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.15s] h-4" />
          </div>
        </div>
      )}

      {/* Live Transcript Viewer */}
      <div className="p-5 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            Live Dialogue Stream
          </label>
          <div className="flex items-center gap-2">
            {session.isRealBot ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync Transcript'}</span>
                </button>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Recall.ai Live Stream
                </span>
              </div>
            ) : (
              session.status === 'in_meeting' && (
                <button
                  type="button"
                  onClick={handleAddNextSpeech}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                >
                  + Stream Next Speech Turn
                </button>
              )
            )}
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 space-y-3 font-sans text-xs">
          {session.transcriptChunks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Bot className="h-8 w-8 mx-auto text-slate-300 animate-bounce" />
              <p className="text-xs font-medium">Waiting for conversation audio to stream...</p>
            </div>
          ) : (
            session.transcriptChunks.map((chunk, idx) => (
              <div key={idx} className="flex items-start gap-3 group animate-in fade-in slide-in-from-bottom-1">
                {/* Speaker Avatar Badge */}
                <div 
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: chunk.avatarColor || '#3b82f6' }}
                >
                  {chunk.speaker.charAt(0)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{chunk.speaker}</span>
                    {chunk.role && (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {chunk.role}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">{chunk.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{chunk.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* Footer Controls & Handoff Action */}
      <div className="border-t border-slate-100 bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left Side: Live Control Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {session.status === 'in_meeting' && (
            <>
              <button
                type="button"
                onClick={handleCompleteMeeting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>{session.isRealBot ? 'Disconnect Recall Bot' : 'End & Leave Call'}</span>
              </button>

              {!session.isRealBot && (
                <button
                  type="button"
                  onClick={handleFastForward}
                  title="Fast forward simulated meeting to completion"
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <FastForward className="h-3.5 w-3.5 text-blue-600" />
                  <span>Fast Forward</span>
                </button>
              )}
            </>
          )}

          {session.status === 'completed' && (
            <button
              type="button"
              onClick={handleCopyTranscript}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Transcript' : 'Copy Transcript'}</span>
            </button>
          )}
        </div>

        {/* Right Side: High-converting Generate Summary Handoff Button */}
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (!session.fullTranscript && !session.isRealBot) {
                handleFastForward();
              }
              onImportTranscript(
                session.fullTranscript || '',
                session.title,
                session.projectId
              );
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate Meeting Summary</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
