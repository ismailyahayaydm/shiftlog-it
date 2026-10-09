import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Check,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Server,
  ArrowUpDown,
  X,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export type Severity = 'low' | 'medium' | 'high';

export interface HandoverNote {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  timestamp: string; // ISO string format e.g. "2026-10-09T08:15"
  resolved: boolean;
  resolvedAt?: string | null;
  category?: string;
}

const STORAGE_KEY = 'it_support_shift_handover_notes_v1';

// Initial realistic IT support study notes
const INITIAL_DEMO_NOTES: HandoverNote[] = [
  {
    id: 'note-1',
    title: 'VPN Gateway 02 - Intermittent RADIUS timeouts',
    description:
      'Remote users reporting error 504 on primary MFA tunnel. Failover to secondary tunnel initiated at 07:45. ISP & NOC ticket #88419 open. Monitor latency on incoming shift.',
    severity: 'high',
    timestamp: '2026-10-09T08:15',
    resolved: false,
    category: 'Network',
  },
  {
    id: 'note-2',
    title: 'Executive Boardroom Conf-01 Polycom Mic Degraded',
    description:
      'Audio dropping every 10 minutes on Zoom Room. Firmware reboot performed; cable checked. Physical reseat needed before 11:00 AM VP sync.',
    severity: 'medium',
    timestamp: '2026-10-09T07:30',
    resolved: false,
    category: 'Hardware',
  },
  {
    id: 'note-3',
    title: 'Domain Controller DC-02 Emergency Patch Re-Verification',
    description:
      'Security patch KB5034441 verified on test cluster. Staged reboot scheduled for tonight at 02:00 AM maintenance window. Approved by Lead SysAdmin.',
    severity: 'low',
    timestamp: '2026-10-09T06:45',
    resolved: true,
    resolvedAt: '2026-10-09T07:15',
    category: 'Server',
  },
  {
    id: 'note-4',
    title: 'New Hire Batch (Marketing) - 4 MacBooks Ready for Handover',
    description:
      'Jamf enrollment complete, Slack & Okta provisioned. Machines placed in Locker 3 with temporary credentials in sealed envelopes.',
    severity: 'low',
    timestamp: '2026-10-09T05:50',
    resolved: true,
    resolvedAt: '2026-10-09T06:10',
    category: 'Access',
  },
];

const QUICK_CATEGORIES = ['Network', 'Hardware', 'Server', 'Access', 'Incident', 'Routine'];

// Format a date string safely
function formatDisplayDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

// Get current local datetime formatted for <input type="datetime-local">
function getLocalNowISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

export default function App() {
  const [notes, setNotes] = useState<HandoverNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage:', e);
    }
    return INITIAL_DEMO_NOTES;
  });

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Drawer state for adding note
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Note Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<Severity>('medium');
  const [newTimestamp, setNewTimestamp] = useState<string>(getLocalNowISO);
  const [newCategory, setNewCategory] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success'>('info');

  const titleInputId = useId();
  const descInputId = useId();
  const timestampInputId = useId();

  // Save to localStorage whenever notes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to persist notes to localStorage:', e);
    }
  }, [notes]);

  const showToast = (msg: string, type: 'info' | 'success' = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Open Add Modal & refresh timestamp to now
  const handleOpenAddModal = () => {
    setNewTimestamp(getLocalNowISO());
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Handle Note Submission
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Please enter a note title.');
      return;
    }
    if (!newDescription.trim()) {
      setFormError('Please provide a short description.');
      return;
    }

    const newNote: HandoverNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: newTitle.trim(),
      description: newDescription.trim(),
      severity: newSeverity,
      timestamp: newTimestamp || getLocalNowISO(),
      resolved: false,
      category: newCategory || undefined,
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewTitle('');
    setNewDescription('');
    setNewSeverity('medium');
    setNewCategory('');
    setFormError('');
    setIsAddModalOpen(false);
    showToast('Handover note logged successfully', 'success');
  };

  // Toggle Resolved state
  const handleToggleResolved = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const nextResolved = !n.resolved;
          return {
            ...n,
            resolved: nextResolved,
            resolvedAt: nextResolved ? getLocalNowISO() : null,
          };
        }
        return n;
      })
    );
  };

  // Delete Note
  const handleDeleteNote = (id: string, title: string) => {
    if (window.confirm(`Delete handover note "${title}"?`)) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showToast('Note deleted', 'info');
    }
  };

  // Reset demo data
  const handleResetDemoData = () => {
    if (window.confirm('Reset notes to default IT support study template?')) {
      setNotes(INITIAL_DEMO_NOTES);
      showToast('Reset to study template notes', 'info');
    }
  };

  // Clear all resolved notes
  const handleClearResolved = () => {
    const resolvedCount = notes.filter((n) => n.resolved).length;
    if (resolvedCount === 0) {
      showToast('No resolved notes to clear', 'info');
      return;
    }
    if (window.confirm(`Remove all ${resolvedCount} resolved handover notes?`)) {
      setNotes((prev) => prev.filter((n) => !n.resolved));
      showToast(`Removed ${resolvedCount} resolved notes`, 'info');
    }
  };

  // Copy structured handover brief for next shift (Slack / Teams / Ticket log)
  const handleCopyHandoverSummary = async () => {
    const activeNotes = notes.filter((n) => !n.resolved);
    const resolvedNotes = notes.filter((n) => n.resolved);

    let text = `=========================================\n`;
    text += `📋 IT SHIFT HANDOVER REPORT\n`;
    text += `Time: ${new Date().toLocaleString()}\n`;
    text += `Total Notes: ${notes.length} (🔴 ${activeNotes.length} Active / 🟢 ${resolvedNotes.length} Resolved)\n`;
    text += `=========================================\n\n`;

    if (activeNotes.length > 0) {
      text += `🚨 ACTIVE / PENDING HANDOVER ITEMS:\n`;
      activeNotes.forEach((n, idx) => {
        text += `\n${idx + 1}. [${n.severity.toUpperCase()}] ${n.title}\n`;
        text += `   Logged: ${formatDisplayDateTime(n.timestamp)}\n`;
        if (n.category) text += `   Category: ${n.category}\n`;
        text += `   Details: ${n.description}\n`;
      });
      text += `\n`;
    } else {
      text += `✅ No open critical items for incoming shift!\n\n`;
    }

    if (resolvedNotes.length > 0) {
      text += `-----------------------------------------\n`;
      text += `✔️ RESOLVED THIS SHIFT (${resolvedNotes.length}):\n`;
      resolvedNotes.forEach((n) => {
        text += `• [${n.severity.toUpperCase()}] ${n.title} (Resolved at ${formatDisplayDateTime(n.resolvedAt || n.timestamp)})\n`;
      });
      text += `\n`;
    }

    text += `Handover logged via ShiftLog IT App.\n`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('Handover report copied to clipboard!', 'success');
    } catch {
      showToast('Could not access clipboard', 'info');
    }
  };

  // Sorted newest first by timestamp
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });
  }, [notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return sortedNotes.filter((note) => {
      // Status filter
      if (statusFilter === 'active' && note.resolved) return false;
      if (statusFilter === 'resolved' && !note.resolved) return false;

      // Severity filter
      if (severityFilter !== 'all' && note.severity !== severityFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesDesc = note.description.toLowerCase().includes(q);
        const matchesCategory = note.category?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    });
  }, [sortedNotes, statusFilter, severityFilter, searchQuery]);

  // Metrics count
  const activeCount = notes.filter((n) => !n.resolved).length;
  const resolvedCount = notes.filter((n) => n.resolved).length;
  const highActiveCount = notes.filter((n) => !n.resolved && n.severity === 'high').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20">
      {/* Toast Notification */}
      {toastMessage && (
        <aside
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 max-w-[90vw] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="text-slate-100">{toastMessage}</span>
        </aside>
      )}

      {/* Mobile Top App Bar (Compact 52px sticky header) */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Zone */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">
                ShiftLog IT
              </h1>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Support Handover
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyHandoverSummary}
              title="Copy formatted handover summary"
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 active:bg-slate-800 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Export Handover</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-500/30 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-4 pb-28">
        {/* KPI / Shift Status Metric Strip */}
        <section className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Pending
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                {activeCount}
              </span>
              <span className="text-[11px] text-slate-500">active</span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              highActiveCount > 0
                ? 'bg-rose-950/20 border-rose-900/50'
                : 'bg-slate-900/80 border-slate-800/80'
            }`}
          >
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
              {highActiveCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
              High Sev
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  highActiveCount > 0 ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {highActiveCount}
              </span>
              <span className="text-[11px] text-slate-500">critical</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Resolved
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {resolvedCount}
              </span>
              <span className="text-[11px] text-slate-500">cleared</span>
            </div>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <div className="space-y-2.5 mb-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, ticket, or description..."
              className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="min-h-[44px] min-w-[44px] absolute right-0 top-0 flex items-center justify-center text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Status Segments */}
            <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`min-h-[36px] px-3 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({notes.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`min-h-[36px] px-3 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Open ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`min-h-[36px] px-3 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === 'resolved'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>

            {/* Severity Filter Dropdown/Pills */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium pl-1">Sev:</span>
              {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`min-h-[36px] px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                    severityFilter === sev
                      ? sev === 'high'
                        ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                        : sev === 'medium'
                        ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                        : sev === 'low'
                        ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev.charAt(0).toUpperCase() + sev.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section Heading & Notes Count */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5 px-0.5">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Shift Handover Log</span>
            <span>·</span>
            <span className="font-mono tabular-nums text-slate-300">
              {filteredNotes.length} note{filteredNotes.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">Sorted newest first</span>
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 my-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-500 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">No notes found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `No handover notes matching "${searchQuery}". Clear your search query to see all notes.`
                : statusFilter === 'resolved'
                ? 'No notes marked resolved yet.'
                : statusFilter === 'active'
                ? 'Great news! All handover items are resolved.'
                : 'Your handover log is empty. Tap "New Note" to log an incident or ticket.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Clear Search
              </button>
            ) : (
              <button
                onClick={handleOpenAddModal}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-cyan-500 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                Add First Handover Note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const isHigh = note.severity === 'high';
              const isMedium = note.severity === 'medium';
              const isLow = note.severity === 'low';

              return (
                <div
                  key={note.id}
                  className={`group rounded-2xl border transition-all duration-150 ${
                    note.resolved
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                      : isHigh
                      ? 'bg-slate-900/90 border-rose-900/50 shadow-sm shadow-rose-950/20'
                      : isMedium
                      ? 'bg-slate-900/90 border-amber-900/40'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="p-4 sm:p-4.5">
                    {/* Header Row: Resolve Trigger + Title + Severity Tag */}
                    <div className="flex items-start gap-3">
                      {/* Big Thumb-friendly Hitbox for Resolve Toggle (>=44x44px) */}
                      <button
                        onClick={() => handleToggleResolved(note.id)}
                        title={note.resolved ? 'Mark as active / unresolved' : 'Mark as resolved'}
                        className={`min-h-[44px] min-w-[44px] -ml-2 -mt-2 rounded-xl flex items-center justify-center transition-colors ${
                          note.resolved
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {note.resolved ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 stroke-[1.75]" />
                        )}
                      </button>

                      {/* Title & Metadata */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <h2
                            className={`text-sm font-semibold leading-snug break-words ${
                              note.resolved
                                ? 'line-through text-slate-400 font-normal'
                                : 'text-slate-100'
                            }`}
                          >
                            {note.title}
                          </h2>

                          {/* Severity Indicator */}
                          <span
                            className={`text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                              isHigh
                                ? 'bg-rose-950/70 border-rose-800/80 text-rose-300'
                                : isMedium
                                ? 'bg-amber-950/70 border-amber-800/80 text-amber-300'
                                : 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300'
                            }`}
                          >
                            {note.severity}
                          </span>
                        </div>

                        {/* Unboxed Metadata (Following Zero-Pill Constitution) */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{formatDisplayDateTime(note.timestamp)}</span>
                          {note.category && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-cyan-400/90 font-sans font-medium">
                                {note.category}
                              </span>
                            </>
                          )}
                          {note.resolved && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-emerald-400 font-sans font-medium">
                                Resolved
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description Body */}
                    <p
                      className={`text-xs sm:text-sm mt-3 leading-relaxed whitespace-pre-line pl-9 ${
                        note.resolved ? 'text-slate-400' : 'text-slate-300'
                      }`}
                    >
                      {note.description}
                    </p>

                    {/* Bottom Action Footer of Card */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/60 pl-9 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Toggle button text link for extra clarity */}
                        <button
                          onClick={() => handleToggleResolved(note.id)}
                          className={`min-h-[44px] px-2 -my-2 flex items-center font-medium transition-colors ${
                            note.resolved
                              ? 'text-slate-400 hover:text-slate-200'
                              : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                        >
                          {note.resolved ? 'Reopen item' : 'Mark resolved'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteNote(note.id, note.title)}
                          title="Delete note"
                          className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Shift Handover Study Utilities Footer */}
        <section className="mt-8 pt-4 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
            <span>Saved in browser storage (offline-ready)</span>
          </div>

          <div className="flex items-center gap-3">
            {resolvedCount > 0 && (
              <button
                onClick={handleClearResolved}
                className="hover:text-slate-300 transition-colors underline underline-offset-2"
              >
                Clear resolved ({resolvedCount})
              </button>
            )}
            <button
              onClick={handleResetDemoData}
              className="hover:text-slate-300 transition-colors"
            >
              Reset sample notes
            </button>
          </div>
        </section>
      </main>

      {/* Floating Action Button (FAB) for Instant Thumb Access on Mobile */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          onClick={handleOpenAddModal}
          aria-label="Add new note"
          className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Add Note Bottom Sheet / Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Sheet Drag Handle for mobile affordance */}
            <div className="sm:hidden w-10 h-1 bg-slate-700 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 id="modal-title" className="text-base font-bold text-white">
                  Add Handover Note
                </h2>
                <p className="text-xs text-slate-400">
                  Document ticket, outage, or pending task for shift
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateNote} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Field */}
              <div>
                <label
                  htmlFor={titleInputId}
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Title / Subject <span className="text-rose-400">*</span>
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Printer 4th Floor Jam, VPN Degraded, DC-02 Backup"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />

                {/* Quick Subject Tag chips to speed up mobile typing */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[10px] text-slate-500 font-medium shrink-0">Tags:</span>
                  {QUICK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setNewCategory(newCategory === cat ? '' : cat);
                        if (!newTitle.includes(`[${cat}]`)) {
                          setNewTitle((prev) => (prev ? `[${cat}] ${prev}` : `[${cat}] `));
                        }
                      }}
                      className={`min-h-[30px] px-2.5 py-0.5 text-xs rounded-lg border shrink-0 transition-colors ${
                        newCategory === cat
                          ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      +{cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor={descInputId}
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Short Description & Action Needed <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id={descInputId}
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What happened? What was already attempted? What should the next technician do?"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
              </div>

              {/* Severity Level Selection (Tactile 3-option radio buttons) */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Severity Level <span className="text-rose-400">*</span>
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSeverity('low')}
                    className={`min-h-[48px] p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      newSeverity === 'low'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">Low</span>
                    <span className="text-[10px] text-slate-500">Routine / Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSeverity('medium')}
                    className={`min-h-[48px] p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      newSeverity === 'medium'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">Medium</span>
                    <span className="text-[10px] text-slate-500">Needs Action</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSeverity('high')}
                    className={`min-h-[48px] p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                      newSeverity === 'high'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">High</span>
                    <span className="text-[10px] text-slate-500">Outage / Blocker</span>
                  </button>
                </div>
              </div>

              {/* Timestamp Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor={timestampInputId}
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                  >
                    Incident / Note Timestamp
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewTimestamp(getLocalNowISO())}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Set to Now
                  </button>
                </div>
                <input
                  id={timestampInputId}
                  type="datetime-local"
                  required
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] min-h-[48px] px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
