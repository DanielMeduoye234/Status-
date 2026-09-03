import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { MEETING_SUMMARY_SYSTEM_PROMPT, MONTHLY_STATUS_REPORT_SYSTEM_PROMPT } from './prompts';
import { parseZoomTranscript, ParsedTranscript } from '../parsers/zoomTranscriptParser';

export interface MeetingSummaryResult {
  title: string;
  executive_summary: string;
  who_said_what: Array<{
    speaker: string;
    main_points: string[];
    commitments: string[];
    sentiment?: string;
  }>;
  action_items: Array<{
    task: string;
    assignee: string;
    deadline: string;
    priority: 'High' | 'Medium' | 'Low';
  }>;
  key_decisions: string[];
  key_blockers: string[];
  summary_markdown: string;
  participants: string[];
  provider?: 'gemini' | 'openai' | 'heuristic_mock';
  model?: string;
  warning?: string;
}

export interface MonthlyStatusReportResult {
  title: string;
  health_status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  executive_summary: string;
  milestones_achieved: Array<{
    milestone: string;
    impact: string;
    lead: string;
  }>;
  in_progress_items: Array<{
    deliverable: string;
    expected_completion: string;
    owner: string;
  }>;
  risks_blockers: Array<{
    risk: string;
    severity: 'High' | 'Medium' | 'Low';
    mitigation_plan: string;
  }>;
  decisions_log: Array<{
    decision: string;
    rationale: string;
    stakeholders: string;
  }>;
  contributor_highlights: Array<{
    contributor: string;
    key_contributions: string;
  }>;
  next_month_goals: string[];
  generated_report_markdown: string;
  provider?: 'gemini' | 'openai' | 'heuristic_mock';
  model?: string;
  warning?: string;
}

/**
 * Generate meeting summary from raw transcript text
 */
export async function generateMeetingSummary(
  rawTranscript: string,
  projectName?: string
): Promise<MeetingSummaryResult> {
  const parsed = parseZoomTranscript(rawTranscript);

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let failureWarning: string | undefined = undefined;

  const userPrompt = `
Analyze the following Zoom meeting transcript.
${projectName ? `Associated Project: ${projectName}` : ''}
Detected Participants: ${parsed.participants.join(', ')}

TRANSCRIPT:
${parsed.cleanedDialogue}
  `;

  // 1. Try Gemini with multi-model failover (3.7-flash -> 3.5-flash -> flash-lite)
  if (geminiKey && geminiKey.trim() !== '') {
    const genAI = new GoogleGenerativeAI(geminiKey.trim());
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const response = await model.generateContent([
          MEETING_SUMMARY_SYSTEM_PROMPT,
          userPrompt,
        ]);

        const text = response.response.text();
        const cleanJson = cleanJsonString(text);
        const data = JSON.parse(cleanJson);
        return {
          ...data,
          participants: parsed.participants,
          provider: 'gemini',
          model: modelName,
        };
      } catch (err: any) {
        failureWarning = `Gemini API attempt (${modelName}) failed: ${err.message || 'unknown'}.`;
        console.warn(`[Gemini Summary Attempt ${modelName} Failed]:`, err.message);
      }
    }
  }

  // 2. Try OpenAI
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const openai = new OpenAI({ apiKey: openaiKey.trim() });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MEETING_SUMMARY_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const data = JSON.parse(cleanJsonString(content));
      return {
        ...data,
        participants: parsed.participants,
        provider: 'openai',
        model: 'gpt-4o-mini',
      };
    } catch (err: any) {
      failureWarning = `OpenAI API attempt encountered an error (${err.message || 'unknown'}). Showing heuristic fallback.`;
      console.error('[OpenAI Summary API Error]:', err);
    }
  }

  // 3. Fallback Heuristic Generator (If no keys configured or offline)
  const result = generateIntelligentMockSummary(parsed, projectName);
  if (failureWarning) {
    result.warning = failureWarning;
  }
  return result;
}

/**
 * Generate monthly status report
 */
export async function generateMonthlyStatusReport(params: {
  projectName: string;
  monthYear: string;
  sourceType: 'uploaded_txts' | 'meeting_summaries';
  contentData: string; // Combined meeting summaries or batch transcripts
}): Promise<MonthlyStatusReportResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  let failureWarning: string | undefined = undefined;

  const userPrompt = `
Generate a comprehensive Monthly Executive Status Report for:
Project Name: ${params.projectName}
Month / Reporting Period: ${params.monthYear}
Source Type: ${params.sourceType === 'uploaded_txts' ? 'Multiple Uploaded Zoom Meeting Transcripts' : 'Synthesized from Previous Meeting Summaries'}

DATA:
${params.contentData}
  `;

  // 1. Try Gemini with multi-model failover (3.7-flash -> 3.5-flash -> flash-lite)
  if (geminiKey && geminiKey.trim() !== '') {
    const genAI = new GoogleGenerativeAI(geminiKey.trim());
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const response = await model.generateContent([
          MONTHLY_STATUS_REPORT_SYSTEM_PROMPT,
          userPrompt,
        ]);

        const text = response.response.text();
        const cleanJson = cleanJsonString(text);
        const data = JSON.parse(cleanJson);
        return {
          ...data,
          provider: 'gemini',
          model: modelName,
        };
      } catch (err: any) {
        failureWarning = `Gemini API attempt (${modelName}) failed: ${err.message || 'unknown'}.`;
        console.warn(`[Gemini Monthly Report Attempt ${modelName} Failed]:`, err.message);
      }
    }
  }

  // 2. Try OpenAI
  if (openaiKey && openaiKey.trim() !== '') {
    try {
      const openai = new OpenAI({ apiKey: openaiKey.trim() });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: MONTHLY_STATUS_REPORT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const data = JSON.parse(cleanJsonString(content));
      return {
        ...data,
        provider: 'openai',
        model: 'gpt-4o-mini',
      };
    } catch (err: any) {
      failureWarning = `OpenAI API attempt encountered an error (${err.message || 'unknown'}). Showing heuristic fallback.`;
      console.error('[OpenAI Monthly Report API Error]:', err);
    }
  }

  // 3. Fallback Heuristic Generator
  const result = generateIntelligentMockMonthlyReport(params);
  if (failureWarning) {
    result.warning = failureWarning;
  }
  return result;
}

export function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  const codeFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch && codeFenceMatch[1]) {
    return codeFenceMatch[1].trim();
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1).trim();
  }
  return cleaned;
}

/**
 * Intelligent Mock fallback for testing & local development
 */
function generateIntelligentMockSummary(parsed: ParsedTranscript, projectName?: string): MeetingSummaryResult {
  const participants = parsed.participants.length > 0 ? parsed.participants : ['Alex Morgan', 'Sarah Chen', 'David Kim'];
  const title = `${projectName ? `${projectName} - ` : ''}Team Sync & Progress Review`;

  const who_said_what = participants.map((speaker, index) => {
    const speakerUtterances = parsed.utterances.filter((u) => u.speaker === speaker);
    const main_points = speakerUtterances.length > 0
      ? speakerUtterances.slice(0, 2).map((u) => u.text.slice(0, 100) + '...')
      : [
          `Discussed timeline deliverables and sprint blockers for ${speaker}`,
          `Confirmed API endpoint integration is currently 85% complete`,
        ];

    return {
      speaker,
      main_points,
      commitments: [`Deliver finalized specifications for next week review`],
      sentiment: index % 2 === 0 ? 'constructive' : 'supportive',
    };
  });

  const action_items = [
    {
      task: 'Finalize database schema migration script and review indexes',
      assignee: participants[0] || 'Lead Engineer',
      deadline: 'This Friday (EOD)',
      priority: 'High' as const,
    },
    {
      task: 'Conduct UI/UX walkthrough with product design team',
      assignee: participants[1] || 'Product Manager',
      deadline: 'Next Tuesday 2:00 PM',
      priority: 'Medium' as const,
    },
    {
      task: 'Prepare test fixtures and edge-case validation suites',
      assignee: participants[2] || 'QA Lead',
      deadline: 'Next Thursday',
      priority: 'Medium' as const,
    },
  ];

  const key_decisions = [
    'Approved modernizing the data pipeline architecture to support real-time aggregation.',
    'Agreed to freeze core API contracts 48 hours before staging deployment.',
  ];

  const key_blockers = [
    'Awaiting third-party authentication API credentials before production rollout.',
  ];

  const markdown = `
# ${title}

**Date:** ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}  
**Participants:** ${participants.join(', ')}  
**Project:** ${projectName || 'General / Unassigned'}

---

## 📌 Executive Summary
The team conducted a comprehensive review of the active sprint deliverables. Discussions centered on pipeline architecture, key milestones, and mitigating third-party authentication dependencies. All major workstreams are progressing steadily towards the upcoming milestone release.

---

## 🗣️ Who Said What (Speaker Breakdown)

${who_said_what
  .map(
    (w) => `### 👤 **${w.speaker}** *(Sentiment: ${w.sentiment})*
- **Key Points Raised:**
${w.main_points.map((p) => `  - ${p}`).join('\n')}
- **Commitments & Ownership:**
${w.commitments.map((c) => `  - ${c}`).join('\n')}
`
  )
  .join('\n')}

---

## ✅ Action Items

| Task | Assignee | Deadline | Priority |
| :--- | :--- | :--- | :--- |
${action_items.map((a) => `| ${a.task} | **${a.assignee}** | ${a.deadline} | \`${a.priority}\` |`).join('\n')}

---

## 🎯 Key Decisions Agreed Upon
${key_decisions.map((d) => `- ✅ ${d}`).join('\n')}

---

## ⚠️ Blockers & Risks
${key_blockers.map((b) => `- 🚨 ${b}`).join('\n')}
  `.trim();

  return {
    title,
    executive_summary: `The sync covered core development progress, cross-team handoffs, and target milestone timelines. All participants (${participants.join(', ')}) aligned on the key deliverables and assigned action items for the week ahead.`,
    who_said_what,
    action_items,
    key_decisions,
    key_blockers,
    summary_markdown: markdown,
    participants,
    provider: 'heuristic_mock',
    model: 'intelligent-heuristic',
  };
}

function generateIntelligentMockMonthlyReport(params: {
  projectName: string;
  monthYear: string;
  sourceType: string;
}): MonthlyStatusReportResult {
  const { projectName, monthYear } = params;

  const milestones = [
    {
      milestone: 'Core Architecture & Database Schema Deployment',
      impact: 'Reduced query latency by 42% and established unified data model',
      lead: 'Backend Architecture Team',
    },
    {
      milestone: 'UI/UX Redesign & Component Design System Rollout',
      impact: 'Streamlined user onboarding and PM dashboard workflows',
      lead: 'Design & Frontend Team',
    },
    {
      milestone: 'End-to-End Automated Testing Suite Integration',
      impact: 'Achieved 91% code coverage across critical service modules',
      lead: 'Quality Assurance',
    },
  ];

  const in_progress = [
    {
      deliverable: 'Real-time WebSocket notifications & event triggers',
      expected_completion: 'Mid next month',
      owner: 'Core Platform Team',
    },
    {
      deliverable: 'Role-based team permission scopes & audit log exporter',
      expected_completion: 'End of next sprint',
      owner: 'Security & Compliance',
    },
  ];

  const risks = [
    {
      risk: 'Third-party API rate limits during peak reporting aggregation',
      severity: 'Medium' as const,
      mitigation_plan: 'Implemented background worker queue with exponential backoff and caching layer.',
    },
    {
      risk: 'Tight timeline for staging environment security audit',
      severity: 'Low' as const,
      mitigation_plan: 'Pre-scheduled auditor walkthrough and pre-populated compliance matrices.',
    },
  ];

  const decisions = [
    {
      decision: 'Adopted Supabase PostgreSQL Row Level Security for strict project data isolation',
      rationale: 'Guarantees multi-tenant compliance and eliminates unauthorized cross-PM data leaks',
      stakeholders: 'Engineering Lead & Project Director',
    },
    {
      decision: 'Unified Zoom transcript ingestion pipeline with automated speaker attribution',
      rationale: 'Saves PMs an average of 4.5 hours per week in manual meeting documentation',
      stakeholders: 'Product Operations & PM Team',
    },
  ];

  const contributors = [
    {
      contributor: 'Engineering Team',
      key_contributions: 'Delivered schema migrations, API routes, and Zoom parser optimizations ahead of schedule.',
    },
    {
      contributor: 'Project Management Team',
      key_contributions: 'Standardized monthly reporting format and conducted stakeholder alignment sessions.',
    },
  ];

  const next_goals = [
    'Complete Staging QA sign-off and trigger production deployment checklist',
    'Integrate automated Slack / Email delivery for published monthly reports',
    'Onboard initial pilot PM cohorts for feedback gathering',
  ];

  const markdown = `
# 📊 Executive Monthly Status Report
**Project:** ${projectName}  
**Reporting Period:** ${monthYear}  
**Health Status:** 🟢 **ON TRACK**

---

## 📝 Executive Overview
During the period of ${monthYear}, the **${projectName}** initiative maintained strong momentum, achieving all targeted tier-1 milestones. Key architectural improvements and user workflow enhancements were completed. Cross-functional team velocity remained high with zero critical blockers.

---

## 🏆 Milestones Achieved

| Milestone | Impact | Lead |
| :--- | :--- | :--- |
${milestones.map((m) => `| **${m.milestone}** | ${m.impact} | \`${m.lead}\` |`).join('\n')}

---

## 🔄 In-Progress Deliverables

| Deliverable | Target Date | Owner |
| :--- | :--- | :--- |
${in_progress.map((p) => `| ${p.deliverable} | ${p.expected_completion} | **${p.owner}** |`).join('\n')}

---

## 🛡️ Risk & Roadblock Matrix

| Risk / Roadblock | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
${risks.map((r) => `| ${r.risk} | **${r.severity}** | ${r.mitigation_plan} |`).join('\n')}

---

## 🏛️ Strategic Decisions Log

| Decision | Rationale | Stakeholders |
| :--- | :--- | :--- |
${decisions.map((d) => `| **${d.decision}** | ${d.rationale} | \`${d.stakeholders}\` |`).join('\n')}

---

## 🌟 Contributor Highlights
${contributors.map((c) => `- **${c.contributor}:** ${c.key_contributions}`).join('\n')}

---

## 🚀 Next Month Strategic Objectives
${next_goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}
  `.trim();

  return {
    title: `Monthly Status Report - ${projectName} - ${monthYear}`,
    health_status: 'on_track',
    executive_summary: `During ${monthYear}, ${projectName} achieved all key deliverables with high sprint velocity. Core architecture, security, and UI integrations were completed with negligible risk indicators.`,
    milestones_achieved: milestones,
    in_progress_items: in_progress,
    risks_blockers: risks,
    decisions_log: decisions,
    contributor_highlights: contributors,
    next_month_goals: next_goals,
    generated_report_markdown: markdown,
    provider: 'heuristic_mock',
    model: 'intelligent-heuristic',
  };
}
