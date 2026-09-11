import jsPDF from 'jspdf';

export interface MeetingPDFData {
  title: string;
  meeting_date?: string;
  projectName?: string;
  file_name?: string;
  executive_summary?: string;
  participants?: string[];
  action_items?: Array<{
    task?: string;
    item?: string;
    assignee?: string;
    owner?: string;
    deadline?: string;
    due_date?: string;
    priority?: string;
    status?: string;
  }>;
  key_decisions?: string[];
  key_blockers?: string[];
  who_said_what?: Array<{
    speaker?: string;
    participant?: string;
    main_points?: string[];
    commitments?: string[];
    points?: string[] | string;
    discussion?: string;
    summary?: string;
    sentiment?: string;
  }>;
  summary_markdown?: string;
}

export interface MonthlyReportPDFData {
  title: string;
  month_year?: string;
  projectName?: string;
  health_status?: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  executive_summary?: string;
  milestones_achieved?: Array<{
    milestone?: string;
    title?: string;
    date_achieved?: string;
    impact?: string;
    lead?: string;
  } | string>;
  in_progress_items?: Array<{
    deliverable?: string;
    title?: string;
    owner?: string;
    expected_completion?: string;
  } | string>;
  risks_blockers?: Array<{
    risk?: string;
    severity?: string;
    mitigation_plan?: string;
  } | string>;
  decisions_log?: Array<{
    decision?: string;
    date?: string;
    rationale?: string;
    stakeholders?: string;
  } | string>;
  contributor_highlights?: Array<{
    contributor?: string;
    name?: string;
    highlight?: string;
    key_contributions?: string;
  } | string>;
  next_month_goals?: string[];
  generated_report_markdown?: string;
}

/**
 * Sanitizes a filename for download
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Sanitizes a string for clean PDF rendering in helvetica font
 */
function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/[\u2700-\u27BF\uE000-\uF8FF\uD83C-\uDBFF\uDC00-\uDFFF]/g, '');
}

/**
 * Primary Engine: Export Meeting Summary via native vector jsPDF
 * Direct vector generation ensures 100% reliable output with crisp text,
 * zero blank page bugs, exact pagination, and instant performance.
 */
export async function exportMeetingSummaryPDF(data: MeetingPDFData): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  return exportMeetingSummaryDirectPDF(data);
}

/**
 * Primary Engine: Export Monthly Status Report via native vector jsPDF
 */
export async function exportMonthlyReportPDF(data: MonthlyReportPDFData): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  return exportMonthlyReportDirectPDF(data);
}

/**
 * High-Fidelity Vector jsPDF Generator for Meeting Summaries
 */
export async function exportMeetingSummaryDirectPDF(data: MeetingPDFData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 45;

  let y = margin;
  const docTitle = data.title || 'Executive Meeting Intelligence Report';

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${sanitizeText(docTitle).slice(0, 45)} - Hexavia Status Records`, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 24;
    }
  };

  // 1. TOP BRANDING BANNER
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('HEXAVIA STATUS', margin + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const subtitle = 'EXECUTIVE MEETING INTELLIGENCE REPORT';
  doc.text(subtitle, pageWidth - margin - 12 - doc.getTextWidth(subtitle), y + 18);

  y += 42;

  // 2. MEETING TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const cleanTitle = sanitizeText(docTitle);
  const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  let metaX = margin + 12;
  const metaY = y + 21;

  const dateStr = `Date: ${data.meeting_date || 'N/A'}`;
  doc.text(dateStr, metaX, metaY);
  metaX += doc.getTextWidth(dateStr) + 16;

  if (data.projectName) {
    const projStr = `Project: ${sanitizeText(data.projectName)}`;
    doc.text(projStr, metaX, metaY);
    metaX += doc.getTextWidth(projStr) + 16;
  }

  if (data.file_name) {
    const fileStr = `Source: ${sanitizeText(data.file_name)}`;
    doc.text(fileStr, metaX, metaY);
  }

  y += 44;

  // 3. ATTENDEES
  if (data.participants && data.participants.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('ATTENDEES / PARTICIPANTS', margin, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const participantsText = sanitizeText(data.participants.join(', '));
    const partLines = doc.splitTextToSize(participantsText, contentWidth);
    doc.text(partLines, margin, y);
    y += partLines.length * 11 + 14;
  }

  // 4. EXECUTIVE SUMMARY
  const summaryText = data.executive_summary || data.summary_markdown || '';
  if (summaryText) {
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text('EXECUTIVE SUMMARY', margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const cleanSummary = sanitizeText(summaryText.replace(/#{1,6}\s+/g, '').trim());
    const execLines = doc.splitTextToSize(cleanSummary, contentWidth - 20);
    const boxHeight = execLines.length * 13 + 18;
    checkPageBreak(boxHeight);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

    // Left blue accent bar
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, y, 3, boxHeight, 'F');

    doc.text(execLines, margin + 12, y + 14);
    y += boxHeight + 16;
  }

  // 5. ACTION ITEMS TABLE
  if (data.action_items && data.action_items.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`ACTION ITEMS & COMMITMENTS (${data.action_items.length})`, margin, y);
    y += 12;

    // Header Row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('DELIVERABLE / ACTION ITEM', margin + 6, y + 12);
    doc.text('OWNER', margin + 330, y + 12);
    doc.text('DEADLINE', margin + 440, y + 12);
    y += 20;

    data.action_items.forEach((item) => {
      const taskText = typeof item === 'string' ? item : (item.task || item.item || (item as any).description || JSON.stringify(item));
      const ownerText = (typeof item === 'object' && item && (item.assignee || item.owner)) 
        ? String(item.assignee || item.owner) 
        : 'Team';
      const deadlineVal = typeof item === 'object' && item ? (item.deadline || item.due_date) : undefined;
      const deadlineText = deadlineVal ? String(deadlineVal) : 'TBD';

      const cleanTask = sanitizeText(taskText);
      const cleanOwner = sanitizeText(ownerText);
      const cleanDeadline = sanitizeText(deadlineText);

      const taskLines = doc.splitTextToSize(`[ ] ${cleanTask}`, 315);
      const deadlineLines = doc.splitTextToSize(cleanDeadline, 85);
      const rowHeight = Math.max(taskLines.length * 11 + 8, deadlineLines.length * 11 + 8, 20);

      checkPageBreak(rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(taskLines, margin + 6, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(cleanOwner.slice(0, 18), margin + 330, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(deadlineLines, margin + 440, y + 10);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + rowHeight - 2, margin + contentWidth, y + rowHeight - 2);

      y += rowHeight;
    });

    y += 14;
  }

  // 6. KEY DECISIONS
  if (data.key_decisions && data.key_decisions.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(`KEY DECISIONS AGREED UPON (${data.key_decisions.length})`, margin, y);
    y += 12;

    data.key_decisions.forEach((dec) => {
      const decText = typeof dec === 'string' ? dec : ((dec as any).decision || (dec as any).text || JSON.stringify(dec));
      const cleanDec = sanitizeText(decText);
      const decLines = doc.splitTextToSize(`* ${cleanDec}`, contentWidth - 12);
      const itemHeight = decLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(decLines, margin + 6, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 7. KEY BLOCKERS
  if (data.key_blockers && data.key_blockers.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(225, 29, 72);
    doc.text(`BLOCKERS & RISKS IDENTIFIED (${data.key_blockers.length})`, margin, y);
    y += 12;

    data.key_blockers.forEach((blk) => {
      const blkText = typeof blk === 'string' ? blk : ((blk as any).blocker || (blk as any).risk || (blk as any).text || JSON.stringify(blk));
      const cleanBlk = sanitizeText(blkText);
      const blkLines = doc.splitTextToSize(`! ${cleanBlk}`, contentWidth - 12);
      const itemHeight = blkLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(159, 18, 57);
      doc.text(blkLines, margin + 6, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 8. WHO SAID WHAT
  if (data.who_said_what && data.who_said_what.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('SPEAKER BREAKDOWN ("WHO SAID WHAT")', margin, y);
    y += 14;

    data.who_said_what.forEach((item) => {
      const speaker = item.speaker || item.participant || (item as any).name || 'Speaker';
      const pointsList: string[] = [];

      if (Array.isArray(item.main_points) && item.main_points.length > 0) {
        pointsList.push(...item.main_points);
      } else if (Array.isArray(item.points) && item.points.length > 0) {
        pointsList.push(...item.points);
      } else if (item.points) {
        pointsList.push(String(item.points));
      } else if (item.discussion) {
        pointsList.push(item.discussion);
      } else if (item.summary) {
        pointsList.push(item.summary);
      }

      if (Array.isArray(item.commitments) && item.commitments.length > 0) {
        pointsList.push(`Commitments: ${item.commitments.join('; ')}`);
      }

      const formattedDiscussion = pointsList.length > 0 ? pointsList.join('\n- ') : 'Contributed to meeting proceedings.';
      const cleanDisc = sanitizeText(formattedDiscussion);
      const discLines = doc.splitTextToSize(`- ${cleanDisc}`, contentWidth - 20);
      const cardHeight = discLines.length * 11 + 26;

      checkPageBreak(cardHeight);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235);
      doc.text(sanitizeText(speaker), margin + 10, y + 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(discLines, margin + 10, y + 24);

      y += cardHeight + 8;
    });
  }

  // 9. FALLBACK: RAW NOTES (If no structured summary exists)
  if (!summaryText && (!data.action_items || data.action_items.length === 0) && data.summary_markdown) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text('MEETING NOTES & SYNTHESIS', margin, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const cleanNotes = sanitizeText(data.summary_markdown);
    const rawLines = doc.splitTextToSize(cleanNotes, contentWidth);
    
    for (const line of rawLines) {
      checkPageBreak(14);
      doc.text(line, margin, y);
      y += 13;
    }
    y += 14;
  }

  // 10. FOOTERS WITH PAGE NUMBERS
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
    doc.text('Hexavia Status - Automated Executive PM Intelligence', margin, pageHeight - 16);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 16);
  }

  const cleanName = sanitizeFileName(docTitle);
  const dateSuffix = data.meeting_date ? `_${data.meeting_date}` : '';
  doc.save(`meeting_summary_${cleanName}${dateSuffix}.pdf`);
}

/**
 * High-Fidelity Vector jsPDF Generator for Monthly Status Reports
 */
export async function exportMonthlyReportDirectPDF(data: MonthlyReportPDFData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 45;

  let y = margin;
  const docTitle = data.title || 'Executive Monthly Status Report';

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${sanitizeText(docTitle).slice(0, 45)} - Hexavia Status Reports`, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 24;
    }
  };

  // Top Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('HEXAVIA STATUS', margin + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const subtitle = `MONTHLY STATUS - ${(data.health_status || 'ON TRACK').toUpperCase()}`;
  doc.text(subtitle, pageWidth - margin - 12 - doc.getTextWidth(subtitle), y + 18);

  y += 42;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(sanitizeText(docTitle), contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 8;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  let metaX = margin + 12;
  const metaY = y + 21;

  const periodStr = `Period: ${data.month_year || 'N/A'}`;
  doc.text(periodStr, metaX, metaY);
  metaX += doc.getTextWidth(periodStr) + 16;

  if (data.projectName) {
    const projStr = `Project: ${sanitizeText(data.projectName)}`;
    doc.text(projStr, metaX, metaY);
    metaX += doc.getTextWidth(projStr) + 16;
  }

  y += 44;

  // Executive Summary
  const summaryText = data.executive_summary || data.generated_report_markdown || '';
  if (summaryText) {
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text('EXECUTIVE SYNTHESIS & OVERVIEW', margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const cleanSummary = sanitizeText(summaryText.replace(/#{1,6}\s+/g, '').trim());
    const execLines = doc.splitTextToSize(cleanSummary, contentWidth - 20);
    const boxHeight = execLines.length * 13 + 18;
    checkPageBreak(boxHeight);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y, 3, boxHeight, 'F');

    doc.text(execLines, margin + 12, y + 14);
    y += boxHeight + 16;
  }

  // Milestones Achieved
  if (data.milestones_achieved && data.milestones_achieved.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`MILESTONES ACHIEVED (${data.milestones_achieved.length})`, margin, y);
    y += 12;

    data.milestones_achieved.forEach((m) => {
      const title = typeof m === 'string' ? m : (m.milestone || m.title || JSON.stringify(m));
      const mLines = doc.splitTextToSize(`* ${sanitizeText(title)}`, contentWidth - 12);
      const itemHeight = mLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(mLines, margin + 6, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // In Progress Items
  if (data.in_progress_items && data.in_progress_items.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text(`IN PROGRESS DELIVERABLES (${data.in_progress_items.length})`, margin, y);
    y += 12;

    data.in_progress_items.forEach((p) => {
      const task = typeof p === 'string' ? p : (p.deliverable || p.title || JSON.stringify(p));
      const owner = typeof p === 'object' && p.owner ? ` (Owner: ${p.owner})` : '';
      const pLines = doc.splitTextToSize(`- ${sanitizeText(task)}${sanitizeText(owner)}`, contentWidth - 12);
      const itemHeight = pLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(pLines, margin + 6, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // Risks & Blockers
  if (data.risks_blockers && data.risks_blockers.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(225, 29, 72);
    doc.text(`RISKS & MITIGATION (${data.risks_blockers.length})`, margin, y);
    y += 12;

    data.risks_blockers.forEach((r) => {
      const riskText = typeof r === 'string' ? r : (r.risk || (r as any).title || JSON.stringify(r));
      const mitigation = typeof r === 'object' && r.mitigation_plan ? ` | Mitigation: ${r.mitigation_plan}` : '';
      const rLines = doc.splitTextToSize(`! ${sanitizeText(riskText)}${sanitizeText(mitigation)}`, contentWidth - 12);
      const itemHeight = rLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(159, 18, 57);
      doc.text(rLines, margin + 6, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // Next Month Goals
  if (data.next_month_goals && data.next_month_goals.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text(`UPCOMING GOALS & TARGETS (${data.next_month_goals.length})`, margin, y);
    y += 12;

    data.next_month_goals.forEach((g) => {
      const gLines = doc.splitTextToSize(`> ${sanitizeText(g)}`, contentWidth - 12);
      const itemHeight = gLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(gLines, margin + 6, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // Footers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
    doc.text('Hexavia Status - Enterprise Monthly Status Report', margin, pageHeight - 16);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 16);
  }

  const cleanName = sanitizeFileName(docTitle);
  const dateSuffix = data.month_year ? `_${data.month_year}` : '';
  doc.save(`monthly_report_${cleanName}${dateSuffix}.pdf`);
}

