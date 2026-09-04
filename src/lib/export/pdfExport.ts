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
    owner?: string;
    deadline?: string;
    due_date?: string;
    status?: string;
  }>;
  key_decisions?: string[];
  key_blockers?: string[];
  who_said_what?: Array<{
    speaker?: string;
    participant?: string;
    points?: string[] | string;
    discussion?: string;
    summary?: string;
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
  } | string>;
  contributor_highlights?: Array<{
    contributor?: string;
    name?: string;
    highlight?: string;
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
 * Export Meeting Summary directly as a crisp, executive PDF document
 */
export async function exportMeetingSummaryPDF(data: MeetingPDFData): Promise<void> {
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
  const docTitle = data.title || 'Meeting Summary';

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      // Running header
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${docTitle.slice(0, 45)} • Hexavia Status Records`, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 24;
    }
  };

  // 1. TOP BRANDING BAR
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 26, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('HEXAVIA STATUS', margin + 10, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const subtitle = 'EXECUTIVE MEETING INTELLIGENCE REPORT';
  doc.text(subtitle, pageWidth - margin - 10 - doc.getTextWidth(subtitle), y + 16);

  y += 38;

  // 2. MEETING TITLE & METADATA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(docTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 6;

  // Metadata Card
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 36, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  let metaX = margin + 12;
  const metaY = y + 18;

  // Meeting Date
  const dateStr = `Date: ${data.meeting_date || 'N/A'}`;
  doc.text(dateStr, metaX, metaY);
  metaX += doc.getTextWidth(dateStr) + 16;

  // Project Name
  if (data.projectName) {
    const projStr = `Project: ${data.projectName}`;
    doc.text(projStr, metaX, metaY);
    metaX += doc.getTextWidth(projStr) + 16;
  }

  // File Name
  if (data.file_name) {
    const fileStr = `Source: ${data.file_name}`;
    doc.text(fileStr, metaX, metaY);
  }

  y += 48;

  // 3. ATTENDEES CHIPS
  if (data.participants && data.participants.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('ATTENDEES / PARTICIPANTS', margin, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const participantsText = data.participants.join(', ');
    const partLines = doc.splitTextToSize(participantsText, contentWidth);
    doc.text(partLines, margin, y);
    y += partLines.length * 12 + 14;
  }

  // 4. EXECUTIVE SUMMARY
  if (data.executive_summary) {
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('EXECUTIVE SUMMARY', margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const execLines = doc.splitTextToSize(data.executive_summary, contentWidth - 16);

    const boxHeight = execLines.length * 13 + 16;
    checkPageBreak(boxHeight);

    doc.setFillColor(241, 245, 249); // slate-100
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

    doc.text(execLines, margin + 8, y + 14);
    y += boxHeight + 16;
  }

  // 5. ACTION ITEMS / DELIVERABLES MATRIX
  if (data.action_items && data.action_items.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`ACTION ITEMS & COMMITMENTS (${data.action_items.length})`, margin, y);
    y += 14;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('DELIVERABLE / ACTION ITEM', margin + 6, y + 12);
    doc.text('OWNER', margin + 350, y + 12);
    doc.text('DEADLINE', margin + 440, y + 12);
    y += 20;

    data.action_items.forEach((item) => {
      const taskText = typeof item === 'string' ? item : (item.task || item.item || JSON.stringify(item));
      const ownerText: string = (typeof item === 'object' && item && item.owner) ? String(item.owner) : 'Unassigned';
      const deadlineVal = typeof item === 'object' && item ? (item.deadline || item.due_date) : undefined;
      const deadlineText: string = deadlineVal ? String(deadlineVal) : '-';

      const taskLines = doc.splitTextToSize(`• ${taskText}`, 330);
      const rowHeight = Math.max(taskLines.length * 12 + 8, 20);

      checkPageBreak(rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(taskLines, margin + 6, y + 10);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(ownerText.slice(0, 16), margin + 350, y + 10);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(deadlineText.slice(0, 16), margin + 440, y + 10);

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
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text(`KEY DECISIONS AGREED UPON (${data.key_decisions.length})`, margin, y);
    y += 14;

    data.key_decisions.forEach((dec) => {
      const decText = typeof dec === 'string' ? dec : JSON.stringify(dec);
      const decLines = doc.splitTextToSize(`✓ ${decText}`, contentWidth - 10);
      const itemHeight = decLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(decLines, margin + 4, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 7. KEY BLOCKERS
  if (data.key_blockers && data.key_blockers.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`BLOCKERS & RISKS IDENTIFIED (${data.key_blockers.length})`, margin, y);
    y += 14;

    data.key_blockers.forEach((blk) => {
      const blkText = typeof blk === 'string' ? blk : JSON.stringify(blk);
      const blkLines = doc.splitTextToSize(`⚠ ${blkText}`, contentWidth - 10);
      const itemHeight = blkLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(159, 18, 57);
      doc.text(blkLines, margin + 4, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 8. WHO SAID WHAT (SPEAKER BREAKDOWN)
  if (data.who_said_what && data.who_said_what.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('SPEAKER BREAKDOWN ("WHO SAID WHAT")', margin, y);
    y += 14;

    data.who_said_what.forEach((item) => {
      const speaker = item.speaker || item.participant || 'Speaker';
      let discussion = '';
      if (Array.isArray(item.points)) {
        discussion = item.points.join(' • ');
      } else if (item.points) {
        discussion = String(item.points);
      } else if (item.discussion) {
        discussion = item.discussion;
      } else if (item.summary) {
        discussion = item.summary;
      }

      const discLines = doc.splitTextToSize(discussion, contentWidth - 16);
      const cardHeight = discLines.length * 12 + 24;

      checkPageBreak(cardHeight);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(speaker, margin + 8, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(discLines, margin + 8, y + 24);

      y += cardHeight + 8;
    });
  }

  // 9. FOOTERS (PAGE NUMBERS ON ALL PAGES)
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
    doc.text('Hexavia Status • Automated Executive PM Intelligence', margin, pageHeight - 16);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 16);
  }

  // Trigger download
  const cleanName = sanitizeFileName(docTitle);
  const dateSuffix = data.meeting_date ? `_${data.meeting_date}` : '';
  doc.save(`meeting_summary_${cleanName}${dateSuffix}.pdf`);
}

/**
 * Export Monthly Status Report directly as a clean PDF document
 */
export async function exportMonthlyReportPDF(data: MonthlyReportPDFData): Promise<void> {
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
  const docTitle = data.title || 'Monthly Status Report';

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${docTitle.slice(0, 45)} • Hexavia Status Reports`, margin, y);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 4, pageWidth - margin, y + 4);
      y += 24;
    }
  };

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 26, 4, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('HEXAVIA STATUS', margin + 10, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const subtitle = 'MONTHLY EXECUTIVE STATUS REPORT';
  doc.text(subtitle, pageWidth - margin - 10 - doc.getTextWidth(subtitle), y + 16);

  y += 38;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(docTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 20 + 6;

  // Metadata Card with Health Status
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 36, 4, 4, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  let metaX = margin + 12;
  const metaY = y + 18;

  // Period
  const periodStr = `Period: ${data.month_year || 'N/A'}`;
  doc.text(periodStr, metaX, metaY);
  metaX += doc.getTextWidth(periodStr) + 16;

  // Project Name
  if (data.projectName) {
    const projStr = `Project: ${data.projectName}`;
    doc.text(projStr, metaX, metaY);
    metaX += doc.getTextWidth(projStr) + 16;
  }

  // Health Status Badge
  const health = data.health_status || 'on_track';
  const healthLabel = `Health: ${health.replace('_', ' ').toUpperCase()}`;
  if (health === 'on_track') {
    doc.setTextColor(5, 150, 105);
  } else if (health === 'at_risk') {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(225, 29, 72);
  }
  doc.setFont('helvetica', 'bold');
  doc.text(healthLabel, metaX, metaY);

  y += 48;

  // 1. EXECUTIVE SUMMARY
  if (data.executive_summary) {
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text('EXECUTIVE SUMMARY', margin, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const execLines = doc.splitTextToSize(data.executive_summary, contentWidth - 16);

    const boxHeight = execLines.length * 13 + 16;
    checkPageBreak(boxHeight);

    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD');

    doc.text(execLines, margin + 8, y + 14);
    y += boxHeight + 16;
  }

  // 2. MILESTONES ACHIEVED
  if (data.milestones_achieved && data.milestones_achieved.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(`KEY MILESTONES ACHIEVED (${data.milestones_achieved.length})`, margin, y);
    y += 14;

    data.milestones_achieved.forEach((m) => {
      let mText = '';
      if (typeof m === 'string') {
        mText = m;
      } else {
        mText = m.milestone || m.title || JSON.stringify(m);
        if (m.date_achieved) mText += ` (Completed: ${m.date_achieved})`;
        if (m.impact) mText += ` — Impact: ${m.impact}`;
      }

      const mLines = doc.splitTextToSize(`✓ ${mText}`, contentWidth - 10);
      const itemHeight = mLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(mLines, margin + 4, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 3. IN-PROGRESS DELIVERABLES
  if (data.in_progress_items && data.in_progress_items.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(`IN-PROGRESS INITIATIVES (${data.in_progress_items.length})`, margin, y);
    y += 14;

    data.in_progress_items.forEach((item) => {
      let text = '';
      if (typeof item === 'string') {
        text = item;
      } else {
        text = item.deliverable || item.title || JSON.stringify(item);
        if (item.owner) text += ` [Owner: ${item.owner}]`;
        if (item.expected_completion) text += ` (Target: ${item.expected_completion})`;
      }

      const lines = doc.splitTextToSize(`• ${text}`, contentWidth - 10);
      const itemHeight = lines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(lines, margin + 4, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 4. RISKS & MITIGATIONS
  if (data.risks_blockers && data.risks_blockers.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(225, 29, 72);
    doc.text(`RISK & BLOCKER MATRIX (${data.risks_blockers.length})`, margin, y);
    y += 14;

    data.risks_blockers.forEach((r) => {
      let rText = '';
      if (typeof r === 'string') {
        rText = r;
      } else {
        rText = r.risk || JSON.stringify(r);
        if (r.severity) rText = `[${r.severity.toUpperCase()}] ${rText}`;
        if (r.mitigation_plan) rText += ` — Mitigation: ${r.mitigation_plan}`;
      }

      const rLines = doc.splitTextToSize(`⚠ ${rText}`, contentWidth - 10);
      const itemHeight = rLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(159, 18, 57);
      doc.text(rLines, margin + 4, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 5. DECISIONS LOG
  if (data.decisions_log && data.decisions_log.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`KEY DECISIONS LOG (${data.decisions_log.length})`, margin, y);
    y += 14;

    data.decisions_log.forEach((d) => {
      let dText = '';
      if (typeof d === 'string') {
        dText = d;
      } else {
        dText = d.decision || JSON.stringify(d);
        if (d.date) dText += ` (${d.date})`;
        if (d.rationale) dText += ` — Rationale: ${d.rationale}`;
      }

      const dLines = doc.splitTextToSize(`• ${dText}`, contentWidth - 10);
      const itemHeight = dLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(dLines, margin + 4, y + 8);
      y += itemHeight;
    });

    y += 12;
  }

  // 6. NEXT MONTH GOALS
  if (data.next_month_goals && data.next_month_goals.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text('NEXT MONTH OBJECTIVES', margin, y);
    y += 14;

    data.next_month_goals.forEach((goal) => {
      const gLines = doc.splitTextToSize(`→ ${goal}`, contentWidth - 10);
      const itemHeight = gLines.length * 12 + 6;

      checkPageBreak(itemHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(gLines, margin + 4, y + 8);
      y += itemHeight;
    });
  }

  // Footers on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
    doc.text('Hexavia Status • Monthly Executive PM Report', margin, pageHeight - 16);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 16);
  }

  // Trigger download
  const cleanName = sanitizeFileName(docTitle);
  const periodSuffix = data.month_year ? `_${data.month_year}` : '';
  doc.save(`monthly_report_${cleanName}${periodSuffix}.pdf`);
}
