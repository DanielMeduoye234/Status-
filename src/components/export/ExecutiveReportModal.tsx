'use client';

import React, { useState } from 'react';
import { MeetingPDFData, MonthlyReportPDFData, exportMeetingSummaryPDF, exportMonthlyReportPDF } from '@/lib/export/pdfExport';
import { ExecutiveMeetingTemplate } from './ExecutiveMeetingTemplate';
import { ExecutiveMonthlyTemplate } from './ExecutiveMonthlyTemplate';
import { 
  X, 
  Download, 
  Printer, 
  Palette, 
  Loader2, 
  Sparkles,
  CheckCircle,
  FileText
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'meeting' | 'monthly';
  meetingData?: MeetingPDFData;
  monthlyData?: MonthlyReportPDFData;
}

export const ExecutiveReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  type,
  meetingData,
  monthlyData,
}) => {
  const [theme, setTheme] = useState<'navy' | 'slate' | 'emerald'>('navy');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      if (type === 'meeting' && meetingData) {
        await exportMeetingSummaryPDF(meetingData);
      } else if (type === 'monthly' && monthlyData) {
        await exportMonthlyReportPDF(monthlyData);
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const title = type === 'meeting' 
    ? (meetingData?.title || 'Meeting Summary') 
    : (monthlyData?.title || 'Monthly Report');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      {/* Print-specific style injection to hide UI chrome during window.print() */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #executive-report-print-container,
          #executive-report-print-container * {
            visibility: visible;
          }
          #executive-report-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .pdf-page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* MODAL CONTROL HEADER (NO-PRINT) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Executive PDF Template Preview
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Fortune-500 Grade
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* THEME TOGGLE */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs text-slate-300">
              <Palette className="w-3.5 h-3.5 ml-1 text-slate-400" />
              <button
                onClick={() => setTheme('navy')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  theme === 'navy' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-white'
                }`}
              >
                Navy
              </button>
              <button
                onClick={() => setTheme('slate')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  theme === 'slate' ? 'bg-slate-700 text-white shadow-xs' : 'hover:text-white'
                }`}
              >
                Slate
              </button>
              <button
                onClick={() => setTheme('emerald')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  theme === 'emerald' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-white'
                }`}
              >
                Emerald
              </button>
            </div>

            {/* PRINT BUTTON */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
              title="Print document or save via browser system print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / System PDF</span>
            </button>

            {/* DOWNLOAD PDF BUTTON */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                exportSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white disabled:opacity-50'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PREVIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/60">
          <div 
            id="executive-report-print-container" 
            className="rounded-xl overflow-hidden shadow-2xl bg-white transition-all"
          >
            {type === 'meeting' && meetingData && (
              <ExecutiveMeetingTemplate data={meetingData} theme={theme} />
            )}
            {type === 'monthly' && monthlyData && (
              <ExecutiveMonthlyTemplate data={monthlyData} theme={theme} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
