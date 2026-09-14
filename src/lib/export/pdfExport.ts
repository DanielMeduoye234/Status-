import jsPDF from 'jspdf';
import {
  HexaviaAttendanceGroup,
  HexaviaAttendee,
  HexaviaPreviousActionReview,
  HexaviaBusinessReview,
  HexaviaReviewSubsection,
  HexaviaPersonActionPoints,
} from '../ai/aiService';

export interface MeetingPDFData {
  title: string;
  meeting_date?: string;
  meeting_time?: string;
  projectName?: string;
  file_name?: string;
  executive_summary?: string;
  participants?: string[];
  in_attendance?: HexaviaAttendanceGroup[];
  agenda?: string[];
  meeting_objective?: string;
  opening_and_context?: string;
  review_of_previous_actions?: HexaviaPreviousActionReview[];
  business_development_reviews?: HexaviaBusinessReview[];
  action_points_by_person?: HexaviaPersonActionPoints[];
  closing_remarks?: string;
  minutes_prepared_by?: {
    name: string;
    role: string;
    organization: string;
  };
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
    .replace(/₦/g, 'NGN ')
    .replace(/[\u20A6]/g, 'NGN ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '*')
    .replace(/[\u2700-\u27BF\uE000-\uF8FF\uD83C-\uDBFF\uDC00-\uDFFF]/g, '');
}

/**
 * Extracts embedded Hexavia metadata if available
 */
function extractEmbeddedHexaviaMeta(markdown?: string): Record<string, any> {
  if (!markdown) return {};
  const match = markdown.match(/<!--\s*HEXAVIA_METADATA:\s*([\s\S]*?)\s*-->/);
  if (!match || !match[1]) return {};
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return {};
  }
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
 * High-Fidelity Vector jsPDF Generator for Hexavia Meeting Minutes & Strategic Reports
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
  const bottomMargin = 50;

  const embedded = extractEmbeddedHexaviaMeta(data.summary_markdown);

  const docTitle = data.title || embedded.title || 'Executive Meeting & Strategic Alignment Session';
  const meetingDate = data.meeting_date || embedded.meeting_date || '';
  const meetingTime = data.meeting_time || embedded.meeting_time || '';
  const inAttendance: HexaviaAttendanceGroup[] = (data.in_attendance || embedded.in_attendance || []) as HexaviaAttendanceGroup[];
  const agenda: string[] = (data.agenda || embedded.agenda || []) as string[];
  const meetingObjective = data.meeting_objective || embedded.meeting_objective || data.executive_summary || '';
  const openingAndContext = data.opening_and_context || embedded.opening_and_context || '';
  const reviewPreviousActions: HexaviaPreviousActionReview[] = (data.review_of_previous_actions || embedded.review_of_previous_actions || []) as HexaviaPreviousActionReview[];
  const businessDevelopmentReviews: HexaviaBusinessReview[] = (data.business_development_reviews || embedded.business_development_reviews || []) as HexaviaBusinessReview[];
  const actionPointsByPerson: HexaviaPersonActionPoints[] = (data.action_points_by_person || embedded.action_points_by_person || []) as HexaviaPersonActionPoints[];
  const closingRemarks = data.closing_remarks || embedded.closing_remarks || '';
  const minutesPreparedBy = data.minutes_prepared_by || embedded.minutes_prepared_by || {
    name: data.participants?.[0] || inAttendance?.[0]?.attendees?.[0]?.name || 'Project Lead',
    role: 'Project Manager / Facilitator',
    organization: inAttendance?.[0]?.organization || 'Project Team'
  };

  let y = margin;

  // Draws official Hexavia header box
  const drawHexaviaHeader = (isCover = false) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(2, 132, 199); // light blue border line
    doc.setLineWidth(1);
    doc.rect(margin, margin - 15, contentWidth, 54);

    // Left Hexavia icon mark
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(2.5);
    doc.line(margin + 16, margin - 3, margin + 16, margin + 27);
    doc.line(margin + 24, margin + 2, margin + 24, margin + 22);
    doc.line(margin + 32, margin - 3, margin + 32, margin + 27);

    // Hexavia Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Hexavia!', margin + 42, margin + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('L I M I T E D', margin + 44, margin + 24);

    // Address & Contact line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    const addr = '39A, Awudu Ekpegha Boulevard Street, Off Admiralty Road, Lekki Phase 1, Lagos | Hexavia.net | 08035202891 | @hexavia';
    doc.text(addr, margin + 12, margin + 34);

    // Cyan sub-strip
    doc.setFillColor(239, 246, 255);
    doc.rect(margin, margin + 39, contentWidth, 12, 'F');
    doc.setDrawColor(2, 132, 199);
    doc.line(margin, margin + 39, margin + contentWidth, margin + 39);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(2, 132, 199);
    const brandRight = '(c) By Hexavia! www.hexavia.africa';
    doc.text(brandRight, pageWidth - margin - 8 - doc.getTextWidth(brandRight), margin + 47.5);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      drawHexaviaHeader(false);
      y = margin + 62;
    }
  };

  // 1. PAGE 1: Corporate Header
  drawHexaviaHeader(true);
  y = margin + 68;

  // 2. DOCUMENT TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const cleanTitle = sanitizeText(docTitle);
  const titleLines = doc.splitTextToSize(cleanTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 16 + 4;

  // Date & Time Strip
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  if (meetingDate) {
    doc.text(`Date: ${sanitizeText(meetingDate)}`, margin, y);
    y += 13;
  }
  if (meetingTime) {
    doc.text(`Time: ${sanitizeText(meetingTime)}`, margin, y);
    y += 15;
  }

  // 3. IN ATTENDANCE
  checkPageBreak(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('In Attendance', margin, y);
  y += 14;

  if (inAttendance.length > 0) {
    inAttendance.forEach((grp) => {
      checkPageBreak(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(sanitizeText(grp.organization), margin, y);
      y += 12;

      grp.attendees.forEach((att) => {
        checkPageBreak(12);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`* ${sanitizeText(att.name)} - ${sanitizeText(att.role)}`, margin + 8, y);
        y += 11;
      });
      y += 3;
    });
  } else if (data.participants && data.participants.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Participants: ${sanitizeText(data.participants.join(', '))}`, margin + 8, y);
    y += 14;
  }
  y += 8;

  // 4. AGENDA
  if (agenda.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('AGENDA', margin, y);
    y += 13;

    agenda.forEach((item, idx) => {
      const itemText = item.startsWith(`${idx + 1}.`) ? item : `${idx + 1}. ${item}`;
      const cleanItem = sanitizeText(itemText);
      const lines = doc.splitTextToSize(cleanItem, contentWidth - 10);
      checkPageBreak(lines.length * 11 + 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(lines, margin + 6, y);
      y += lines.length * 11 + 2;
    });
    y += 12;
  }

  // 5. MEETING OBJECTIVE
  if (meetingObjective) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('MEETING OBJECTIVE', margin, y);
    y += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const objLines = doc.splitTextToSize(sanitizeText(meetingObjective), contentWidth);
    checkPageBreak(objLines.length * 12 + 6);
    doc.text(objLines, margin, y);
    y += objLines.length * 12 + 14;
  }

  // 6. OPENING AND CONTEXT SETTING
  if (openingAndContext) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('OPENING AND CONTEXT SETTING', margin, y);
    y += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const openLines = doc.splitTextToSize(sanitizeText(openingAndContext), contentWidth);
    checkPageBreak(openLines.length * 12 + 6);
    doc.text(openLines, margin, y);
    y += openLines.length * 12 + 14;
  }

  // 7. REVIEW OF PREVIOUS ACTION POINTS
  if (reviewPreviousActions.length > 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('REVIEW OF PREVIOUS ACTION POINTS', margin, y);
    y += 13;

    reviewPreviousActions.forEach((group) => {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(sanitizeText(group.track), margin, y);
      y += 12;

      group.items.forEach((item) => {
        const itemLines = doc.splitTextToSize(`* ${sanitizeText(item)}`, contentWidth - 12);
        checkPageBreak(itemLines.length * 11 + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(itemLines, margin + 8, y);
        y += itemLines.length * 11 + 2;
      });
      y += 6;
    });
    y += 8;
  }

  // 8. BUSINESS DEVELOPMENT & OPERATIONAL REVIEWS (Deep Dives)
  if (businessDevelopmentReviews.length > 0) {
    businessDevelopmentReviews.forEach((review) => {
      checkPageBreak(60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(2, 132, 199);
      doc.text(sanitizeText(review.track.toUpperCase()), margin, y);
      y += 14;

      review.subsections.forEach((sub) => {
        checkPageBreak(50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(sanitizeText(sub.topic.toUpperCase()), margin, y);
        y += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const detailLines = doc.splitTextToSize(sanitizeText(sub.details), contentWidth);
        checkPageBreak(detailLines.length * 12 + 6);
        doc.text(detailLines, margin, y);
        y += detailLines.length * 12 + 6;

        if (sub.metrics_or_facts && sub.metrics_or_facts.length > 0) {
          sub.metrics_or_facts.forEach((metric) => {
            const mLine = `  > Key Detail: ${sanitizeText(metric)}`;
            checkPageBreak(13);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.8);
            doc.setTextColor(37, 99, 235);
            doc.text(mLine, margin + 4, y);
            y += 11;
          });
          y += 4;
        }
        y += 6;
      });
      y += 10;
    });
  }

  // 9. ACTION POINTS AND NEXT STEPS (BY ASSIGNEE)
  if (actionPointsByPerson.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(5, 150, 105);
    doc.text('ACTION POINTS AND NEXT STEPS (BY ASSIGNEE)', margin, y);
    y += 14;

    actionPointsByPerson.forEach((p) => {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const personHeader = `${sanitizeText(p.person)}${p.role ? ` - ${sanitizeText(p.role)}` : ''}${p.organization ? `, ${sanitizeText(p.organization)}` : ''}`;
      doc.text(personHeader, margin, y);
      y += 12;

      p.actions.forEach((act) => {
        const actLines = doc.splitTextToSize(`[ ] ${sanitizeText(act)}`, contentWidth - 14);
        checkPageBreak(actLines.length * 11 + 3);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(actLines, margin + 8, y);
        y += actLines.length * 11 + 2;
      });
      y += 8;
    });
    y += 10;
  }

  // 10. ACTION ITEMS MATRIX TABLE
  if (data.action_items && data.action_items.length > 0) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`DELIVERABLES MATRIX (${data.action_items.length})`, margin, y);
    y += 12;

    // Table Header
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

  // 11. KEY DECISIONS & BLOCKERS
  if ((data.key_decisions && data.key_decisions.length > 0) || (data.key_blockers && data.key_blockers.length > 0)) {
    if (data.key_decisions && data.key_decisions.length > 0) {
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(37, 99, 235);
      doc.text(`KEY DECISIONS (${data.key_decisions.length})`, margin, y);
      y += 12;

      data.key_decisions.forEach((dec) => {
        const decText = typeof dec === 'string' ? dec : ((dec as any).decision || (dec as any).text || JSON.stringify(dec));
        const cleanDec = sanitizeText(decText);
        const decLines = doc.splitTextToSize(`* ${cleanDec}`, contentWidth - 12);
        checkPageBreak(decLines.length * 11 + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(decLines, margin + 6, y + 8);
        y += decLines.length * 11 + 4;
      });
      y += 10;
    }

    if (data.key_blockers && data.key_blockers.length > 0) {
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(225, 29, 72);
      doc.text(`BLOCKERS & RISKS (${data.key_blockers.length})`, margin, y);
      y += 12;

      data.key_blockers.forEach((blk) => {
        const blkText = typeof blk === 'string' ? blk : ((blk as any).blocker || (blk as any).risk || (blk as any).text || JSON.stringify(blk));
        const cleanBlk = sanitizeText(blkText);
        const blkLines = doc.splitTextToSize(`! ${cleanBlk}`, contentWidth - 12);
        checkPageBreak(blkLines.length * 11 + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(159, 18, 57);
        doc.text(blkLines, margin + 6, y + 8);
        y += blkLines.length * 11 + 4;
      });
      y += 10;
    }
  }

  // 12. CLOSING
  if (closingRemarks) {
    checkPageBreak(60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('CLOSING', margin, y);
    y += 13;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const closeLines = doc.splitTextToSize(sanitizeText(closingRemarks), contentWidth);
    checkPageBreak(closeLines.length * 12 + 6);
    doc.text(closeLines, margin, y);
    y += closeLines.length * 12 + 16;
  }

  // 13. MINUTES PREPARED BY
  if (minutesPreparedBy) {
    checkPageBreak(55);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 46, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Minutes Prepared By:', margin + 12, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sanitizeText(minutesPreparedBy.name)}, ${sanitizeText(minutesPreparedBy.role)}`, margin + 12, y + 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizeText(minutesPreparedBy.organization), margin + 12, y + 40);

    y += 56;
  }

  // 14. RUNNING FOOTERS WITH PAGE NUMBERS & COPYRIGHT
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 26, pageWidth - margin, pageHeight - 26);
    doc.text('(c) By Hexavia! www.hexavia.africa', margin, pageHeight - 14);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 14);
  }

  const cleanName = sanitizeFileName(docTitle);
  const dateSuffix = meetingDate ? `_${sanitizeFileName(meetingDate)}` : '';
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

