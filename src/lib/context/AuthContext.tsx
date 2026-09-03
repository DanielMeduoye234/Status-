'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../supabase/client';
import { User } from '@supabase/supabase-js';

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
  monthlyReports: MonthlyReportItem[];
  setActiveProject: (project: Project | null) => void;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<boolean>;
  saveMeetingSummary: (summary: Omit<MeetingSummaryItem, 'id' | 'created_at'>) => Promise<MeetingSummaryItem>;
  deleteMeetingSummary: (summaryId: string) => Promise<boolean>;
  saveMonthlyReport: (report: Omit<MonthlyReportItem, 'id' | 'created_at'>) => Promise<MonthlyReportItem>;
  deleteMonthlyReport: (reportId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Initial Default Projects for rapid test drive with valid UUIDs
const DEFAULT_PROJECTS: Project[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Hexavia Core Platform 2.0',
    description: 'Next-gen enterprise status and reporting infrastructure',
    client_name: 'Hexavia Enterprise',
    color: '#6366f1',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Mobile App Revamp',
    description: 'iOS & Android mobile native experience overhaul',
    client_name: 'Apex Retail',
    color: '#10b981',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Cloud Infrastructure & Security',
    description: 'SOC2 Type II compliance and database clustering',
    client_name: 'Internal Ops',
    color: '#f59e0b',
    status: 'active',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project | null>(DEFAULT_PROJECTS[0]);
  const [meetingSummaries, setMeetingSummaries] = useState<MeetingSummaryItem[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportItem[]>([]);

  const supabase = createClient();

  const loadInitialData = async (currentUser: User | null) => {
    try {
      if (currentUser) {
        // Fetch real Supabase data
        const { data: projData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (!projError && projData && projData.length > 0) {
          setProjects(projData);
          setActiveProject(projData[0]);
        } else {
          // If user has no projects yet in Supabase, seed the primary default project
          try {
            const { data: seeded, error: seedError } = await supabase
              .from('projects')
              .insert({
                user_id: currentUser.id,
                name: DEFAULT_PROJECTS[0].name,
                description: DEFAULT_PROJECTS[0].description,
                client_name: DEFAULT_PROJECTS[0].client_name,
                color: DEFAULT_PROJECTS[0].color,
                status: DEFAULT_PROJECTS[0].status,
              })
              .select()
              .single();

            if (!seedError && seeded) {
              setProjects([seeded]);
              setActiveProject(seeded);
            } else {
              setProjects(DEFAULT_PROJECTS);
              setActiveProject(DEFAULT_PROJECTS[0]);
            }
          } catch {
            setProjects(DEFAULT_PROJECTS);
            setActiveProject(DEFAULT_PROJECTS[0]);
          }
        }

        const { data: meetingData } = await supabase
          .from('meeting_summaries')
          .select('*')
          .order('meeting_date', { ascending: false });

        if (meetingData) setMeetingSummaries(meetingData);

        const { data: reportData } = await supabase
          .from('monthly_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (reportData) setMonthlyReports(reportData);
      } else {
        // Fallback to local storage or defaults for instant usability
        const savedProjects = localStorage.getItem('hexavia_projects');
        const savedMeetings = localStorage.getItem('hexavia_meetings');
        const savedReports = localStorage.getItem('hexavia_reports');

        if (savedProjects) {
          try {
            const parsed = JSON.parse(savedProjects);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
              setActiveProject(parsed[0] || DEFAULT_PROJECTS[0]);
            } else {
              setProjects(DEFAULT_PROJECTS);
              setActiveProject(DEFAULT_PROJECTS[0]);
            }
          } catch (e) {
            setProjects(DEFAULT_PROJECTS);
            setActiveProject(DEFAULT_PROJECTS[0]);
          }
        }

        if (savedMeetings) {
          try {
            setMeetingSummaries(JSON.parse(savedMeetings));
          } catch (e) {}
        }

        if (savedReports) {
          try {
            setMonthlyReports(JSON.parse(savedReports));
          } catch (e) {}
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
    const validProjectId = isValidUUID(summary.project_id) ? summary.project_id : null;

    const newItem: MeetingSummaryItem = {
      ...summary,
      project_id: validProjectId,
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
            project_id: newItem.project_id,
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
    await loadInitialData(user);
  };

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
        monthlyReports,
        setActiveProject,
        createProject,
        deleteProject,
        saveMeetingSummary,
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
