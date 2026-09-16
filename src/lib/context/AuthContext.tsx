'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient, isSupabaseConfigured } from '../supabase/client';
import { User } from '@supabase/supabase-js';
import { isValidUUID } from '../utils/uuid';

export { isValidUUID };

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  client_name?: string;
  color?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'archived';
  created_at?: string;
}

export interface MeetingSummaryItem {
  id: string;
  user_id?: string;
  project_id?: string | null;
  title: string;
  meeting_date: string;
  file_name?: string;
  raw_transcript?: string;
  summary_markdown: string;
  executive_summary?: string;
  who_said_what?: any[];
  action_items?: any[];
  key_decisions?: string[];
  key_blockers?: string[];
  participants?: string[];
  created_at?: string;
}

export interface MonthlyReportItem {
  id: string;
  user_id?: string;
  project_id: string;
  title: string;
  month_year: string;
  source_type: 'uploaded_txts' | 'meeting_summaries';
  source_summary_ids?: string[];
  generated_report_markdown: string;
  executive_summary?: string;
  health_status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  milestones_achieved?: any[];
  in_progress_items?: any[];
  risks_blockers?: any[];
  decisions_log?: any[];
  contributor_highlights?: any[];
  next_month_goals?: string[];
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  projects: Project[];
  activeProject: Project | null;
  meetingSummaries: MeetingSummaryItem[];
  unassignedMeetings: MeetingSummaryItem[];
  monthlyReports: MonthlyReportItem[];
  setActiveProject: (project: Project | null) => void;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  saveMeetingSummary: (summary: Omit<MeetingSummaryItem, 'id' | 'created_at'>) => Promise<MeetingSummaryItem>;
  updateMeetingSummary: (summaryId: string, updates: Partial<MeetingSummaryItem>) => Promise<MeetingSummaryItem | null>;
  deleteMeetingSummary: (summaryId: string) => Promise<boolean>;
  saveMonthlyReport: (report: Omit<MonthlyReportItem, 'id' | 'created_at'>) => Promise<MonthlyReportItem>;
  deleteMonthlyReport: (reportId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [meetingSummaries, setMeetingSummaries] = useState<MeetingSummaryItem[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportItem[]>([]);

  const supabase = createClient();

  const loadInitialData = async (
    currentUser: User | null,
    options?: { resetActiveProject?: boolean }
  ) => {
    const resetActiveProject = options?.resetActiveProject !== false;
    try {
      if (currentUser) {
        // Fetch real Supabase data for authenticated user
        const { data: projData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!projError && projData) {
          setProjects(projData);
          if (resetActiveProject) {
            setActiveProject(projData.length > 0 ? projData[0] : null);
          } else {
            setActiveProject((prev) => {
              if (prev && projData.some((p) => p.id === prev.id)) return prev;
              return projData[0] || null;
            });
          }
        } else {
          setProjects([]);
          if (resetActiveProject) setActiveProject(null);
        }

        const { data: meetingData } = await supabase
          .from('meeting_summaries')
          .select('*')
          .order('meeting_date', { ascending: false });

        if (meetingData) setMeetingSummaries(meetingData);
        else setMeetingSummaries([]);

        const { data: reportData } = await supabase
          .from('monthly_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (reportData) setMonthlyReports(reportData);
        else setMonthlyReports([]);
      } else {
        // Unauthenticated visitor fallback to local storage
        const savedProjects = localStorage.getItem('hexavia_projects');
        const savedMeetings = localStorage.getItem('hexavia_meetings');
        const savedReports = localStorage.getItem('hexavia_reports');

        if (savedProjects) {
          try {
            const parsed = JSON.parse(savedProjects);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
              setActiveProject(parsed[0] || null);
            } else {
              setProjects([]);
              setActiveProject(null);
            }
          } catch {
            setProjects([]);
            setActiveProject(null);
          }
        } else {
          setProjects([]);
          setActiveProject(null);
        }

        if (savedMeetings) {
          try {
            setMeetingSummaries(JSON.parse(savedMeetings));
          } catch {
            setMeetingSummaries([]);
          }
        } else {
          setMeetingSummaries([]);
        }

        if (savedReports) {
          try {
            setMonthlyReports(JSON.parse(savedReports));
          } catch {
            setMonthlyReports([]);
          }
        } else {
          setMonthlyReports([]);
        }
      }
    } catch (err) {
      console.warn('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active Supabase session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await loadInitialData(currentUser);
      } catch (err) {
        console.warn('Supabase auth session check:', err);
        await loadInitialData(null);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await loadInitialData(currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    const newProj: Project = {
      id: crypto.randomUUID(),
      user_id: user?.id,
      name: projectData.name || 'New Project',
      description: projectData.description || '',
      client_name: projectData.client_name || '',
      color: projectData.color || '#6366f1',
      status: projectData.status || 'active',
      created_at: new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: newProj.name,
            description: newProj.description,
            client_name: newProj.client_name,
            color: newProj.color,
            status: newProj.status,
          })
          .select()
          .single();

        if (!error && data) {
          newProj.id = data.id;
        }
      } catch (e) {
        console.warn('Supabase project insert failed, fallback to local', e);
      }
    }

    const updated = [newProj, ...projects];
    setProjects(updated);
    setActiveProject(newProj);
    localStorage.setItem('hexavia_projects', JSON.stringify(updated));
    return newProj;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>): Promise<Project | null> => {
    let updatedProj: Project | null = null;
    if (user && isValidUUID(projectId)) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update({
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.client_name !== undefined && { client_name: updates.client_name }),
            ...(updates.color !== undefined && { color: updates.color }),
            ...(updates.status !== undefined && { status: updates.status }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .select()
          .single();

        if (!error && data) {
          updatedProj = data;
        }
      } catch (e) {
        console.warn('Supabase update project error:', e);
      }
    }

    const updatedList = projects.map((p) => {
      if (p.id === projectId) {
        const merged = { ...p, ...updates };
        if (!updatedProj) updatedProj = merged;
        return merged;
      }
      return p;
    });

    setProjects(updatedList);
    if (activeProject?.id === projectId && updatedProj) {
      setActiveProject(updatedProj);
    }
    localStorage.setItem('hexavia_projects', JSON.stringify(updatedList));
    return updatedProj;
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    if (user && isValidUUID(projectId)) {
      try {
        await supabase.from('projects').delete().eq('id', projectId);
      } catch (e) {
        console.warn('Supabase delete project error:', e);
      }
    }

    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    if (activeProject?.id === projectId) {
      setActiveProject(updated[0] || null);
    }
    localStorage.setItem('hexavia_projects', JSON.stringify(updated));
    return true;
  };

  const saveMeetingSummary = async (
    summary: Omit<MeetingSummaryItem, 'id' | 'created_at'>
  ): Promise<MeetingSummaryItem> => {
    const supabaseProjectId = isValidUUID(summary.project_id) ? summary.project_id : null;

    const matchesExisting = (item: MeetingSummaryItem) => {
      if (summary.file_name && item.file_name === summary.file_name) return true;
      if (summary.raw_transcript && item.raw_transcript === summary.raw_transcript) return true;
      return false;
    };

    let existingId = meetingSummaries.find(matchesExisting)?.id;

    if (user) {
      try {
        if (summary.file_name) {
          const { data: byFile } = await supabase
            .from('meeting_summaries')
            .select('id')
            .eq('user_id', user.id)
            .eq('file_name', summary.file_name)
            .maybeSingle();
          if (byFile?.id) existingId = byFile.id;
        }

        if (!existingId && summary.raw_transcript) {
          const { data: byTranscript } = await supabase
            .from('meeting_summaries')
            .select('id')
            .eq('user_id', user.id)
            .eq('raw_transcript', summary.raw_transcript)
            .maybeSingle();
          if (byTranscript?.id) existingId = byTranscript.id;
        }
      } catch (e) {
        console.warn('Supabase meeting lookup error:', e);
      }
    }

    if (existingId) {
      const payload: Record<string, unknown> = {
        title: summary.title,
        meeting_date: summary.meeting_date,
        file_name: summary.file_name,
        raw_transcript: summary.raw_transcript,
        summary_markdown: summary.summary_markdown,
        executive_summary: summary.executive_summary,
        who_said_what: summary.who_said_what,
        action_items: summary.action_items,
        key_decisions: summary.key_decisions,
        key_blockers: summary.key_blockers,
        participants: summary.participants,
        project_id: supabaseProjectId,
        updated_at: new Date().toISOString(),
      };

      let merged: MeetingSummaryItem = {
        ...summary,
        id: existingId,
        user_id: user?.id,
        project_id: supabaseProjectId,
        created_at: meetingSummaries.find((m) => m.id === existingId)?.created_at,
      };

      if (user && isValidUUID(existingId)) {
        try {
          const { data, error } = await supabase
            .from('meeting_summaries')
            .update(payload)
            .eq('id', existingId)
            .select()
            .single();
          if (!error && data) merged = data;
        } catch (e) {
          console.warn('Supabase meeting upsert update error:', e);
        }
      }

      const updatedList = meetingSummaries.map((m) => (m.id === existingId ? merged : m));
      setMeetingSummaries(updatedList);
      localStorage.setItem('hexavia_meetings', JSON.stringify(updatedList));
      return merged;
    }

    const newItem: MeetingSummaryItem = {
      ...summary,
      project_id: supabaseProjectId,
      id: crypto.randomUUID(),
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('meeting_summaries')
          .insert({
            user_id: user.id,
            project_id: supabaseProjectId,
            title: newItem.title,
            meeting_date: newItem.meeting_date,
            file_name: newItem.file_name,
            raw_transcript: newItem.raw_transcript,
            summary_markdown: newItem.summary_markdown,
            executive_summary: newItem.executive_summary,
            who_said_what: newItem.who_said_what,
            action_items: newItem.action_items,
            key_decisions: newItem.key_decisions,
            key_blockers: newItem.key_blockers,
            participants: newItem.participants,
          })
          .select()
          .single();

        if (!error && data) {
          newItem.id = data.id;
          if (data.project_id) {
            newItem.project_id = data.project_id;
          }
        }
      } catch (e) {
        console.warn('Supabase meeting insert fallback to local', e);
      }
    }

    const updated = [newItem, ...meetingSummaries.filter((m) => m.id !== newItem.id)];
    setMeetingSummaries(updated);
    localStorage.setItem('hexavia_meetings', JSON.stringify(updated));
    return newItem;
  };

  const updateMeetingSummary = async (
    summaryId: string,
    updates: Partial<MeetingSummaryItem>
  ): Promise<MeetingSummaryItem | null> => {
    let updatedItem: MeetingSummaryItem | null = null;

    if (user && isValidUUID(summaryId)) {
      try {
        const payload: any = {
          updated_at: new Date().toISOString(),
        };
        if (updates.project_id !== undefined) {
          payload.project_id = isValidUUID(updates.project_id) ? updates.project_id : null;
        }
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.meeting_date !== undefined) payload.meeting_date = updates.meeting_date;
        if (updates.executive_summary !== undefined) payload.executive_summary = updates.executive_summary;
        if (updates.summary_markdown !== undefined) payload.summary_markdown = updates.summary_markdown;
        if (updates.action_items !== undefined) payload.action_items = updates.action_items;
        if (updates.key_decisions !== undefined) payload.key_decisions = updates.key_decisions;
        if (updates.key_blockers !== undefined) payload.key_blockers = updates.key_blockers;
        if (updates.who_said_what !== undefined) payload.who_said_what = updates.who_said_what;
        if (updates.participants !== undefined) payload.participants = updates.participants;

        const { data, error } = await supabase
          .from('meeting_summaries')
          .update(payload)
          .eq('id', summaryId)
          .select()
          .single();

        if (!error && data) {
          updatedItem = data;
        }
      } catch (e) {
        console.warn('Supabase update meeting error:', e);
      }
    }

    const updatedList = meetingSummaries.map((m) => {
      if (m.id === summaryId) {
        const merged = { ...m, ...updates };
        if (!updatedItem) updatedItem = merged;
        return merged;
      }
      return m;
    });

    setMeetingSummaries(updatedList);
    localStorage.setItem('hexavia_meetings', JSON.stringify(updatedList));
    return updatedItem;
  };

  const deleteMeetingSummary = async (summaryId: string): Promise<boolean> => {
    if (user && isValidUUID(summaryId)) {
      try {
        await supabase.from('meeting_summaries').delete().eq('id', summaryId);
      } catch (e) {
        console.warn('Supabase delete meeting error:', e);
      }
    }

    const updated = meetingSummaries.filter((m) => m.id !== summaryId);
    setMeetingSummaries(updated);
    localStorage.setItem('hexavia_meetings', JSON.stringify(updated));
    return true;
  };

  const unassignedMeetings = useMemo(() => {
    return meetingSummaries.filter((m) => !m.project_id);
  }, [meetingSummaries]);

  const saveMonthlyReport = async (
    report: Omit<MonthlyReportItem, 'id' | 'created_at'>
  ): Promise<MonthlyReportItem> => {
    // monthly_reports requires a valid project_id
    let validProjectId = isValidUUID(report.project_id) ? report.project_id : activeProject?.id;
    if (!isValidUUID(validProjectId) && projects.length > 0) {
      validProjectId = projects[0].id;
    }

    const newItem: MonthlyReportItem = {
      ...report,
      project_id: validProjectId || crypto.randomUUID(),
      id: crypto.randomUUID(),
      user_id: user?.id,
      created_at: new Date().toISOString(),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('monthly_reports')
          .insert({
            user_id: user.id,
            project_id: newItem.project_id,
            title: newItem.title,
            month_year: newItem.month_year,
            source_type: newItem.source_type,
            source_summary_ids: (newItem.source_summary_ids || []).filter(isValidUUID),
            generated_report_markdown: newItem.generated_report_markdown,
            executive_summary: newItem.executive_summary,
            health_status: newItem.health_status,
            milestones_achieved: newItem.milestones_achieved,
            in_progress_items: newItem.in_progress_items,
            risks_blockers: newItem.risks_blockers,
            decisions_log: newItem.decisions_log,
            contributor_highlights: newItem.contributor_highlights,
            next_month_goals: newItem.next_month_goals,
          })
          .select()
          .single();

        if (!error && data) {
          newItem.id = data.id;
        }
      } catch (e) {
        console.warn('Supabase report insert fallback to local', e);
      }
    }

    const updated = [newItem, ...monthlyReports.filter((r) => r.id !== newItem.id)];
    setMonthlyReports(updated);
    localStorage.setItem('hexavia_reports', JSON.stringify(updated));
    return newItem;
  };

  const deleteMonthlyReport = async (reportId: string): Promise<boolean> => {
    if (user && isValidUUID(reportId)) {
      try {
        await supabase.from('monthly_reports').delete().eq('id', reportId);
      } catch (e) {
        console.warn('Supabase delete report error:', e);
      }
    }

    const updated = monthlyReports.filter((r) => r.id !== reportId);
    setMonthlyReports(updated);
    localStorage.setItem('hexavia_reports', JSON.stringify(updated));
    return true;
  };

  const refreshData = async () => {
    await loadInitialData(user, { resetActiveProject: false });
  };

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel(`meeting_summaries:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_summaries',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const incoming = (payload.new || payload.old) as MeetingSummaryItem | undefined;
          if (!incoming?.id && payload.eventType !== 'DELETE') return;

          if (payload.eventType === 'INSERT' && payload.new) {
            const row = payload.new as MeetingSummaryItem;
            setMeetingSummaries((prev) => {
              const withoutDup = prev.filter(
                (m) =>
                  m.id !== row.id &&
                  !(row.file_name && m.file_name === row.file_name)
              );
              return [row, ...withoutDup];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const row = payload.new as MeetingSummaryItem;
            setMeetingSummaries((prev) => {
              const exists = prev.some((m) => m.id === row.id);
              if (!exists) return [row, ...prev];
              return prev.map((m) => (m.id === row.id ? { ...m, ...row } : m));
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const removedId = (payload.old as { id?: string }).id;
            if (removedId) {
              setMeetingSummaries((prev) => prev.filter((m) => m.id !== removedId));
            }
          }
        }
      )
      .subscribe();

    const refreshQuietly = () => {
      if (document.visibilityState === 'visible') {
        loadInitialData(user, { resetActiveProject: false });
      }
    };

    window.addEventListener('focus', refreshQuietly);
    document.addEventListener('visibilitychange', refreshQuietly);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', refreshQuietly);
      document.removeEventListener('visibilitychange', refreshQuietly);
    };
  }, [user, supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.warn('Sign out error', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        projects,
        activeProject,
        meetingSummaries,
        unassignedMeetings,
        monthlyReports,
        setActiveProject,
        createProject,
        updateProject,
        deleteProject,
        saveMeetingSummary,
        updateMeetingSummary,
        deleteMeetingSummary,
        saveMonthlyReport,
        deleteMonthlyReport,
        refreshData,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
