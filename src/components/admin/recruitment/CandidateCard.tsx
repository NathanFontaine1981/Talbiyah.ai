import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MoreVertical, Mail, CalendarPlus, StickyNote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  country?: string;
  subjects: string[];
  expected_hourly_rate?: number;
  assigned_tier?: string;
  pipeline_stage: string;
  pipeline_stage_updated_at: string;
  admin_notes?: string;
  created_at: string;
}

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
  onQuickAction: (action: string) => void;
}

export default function CandidateCard({ candidate, onClick, onQuickAction }: CandidateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
        boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : undefined,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const daysInStage = candidate.pipeline_stage_updated_at
    ? formatDistanceToNow(new Date(candidate.pipeline_stage_updated_at), { addSuffix: false })
    : 'N/A';

  function handleCardClick(e: React.MouseEvent) {
    // Don't trigger click if the menu button was clicked
    if ((e.target as HTMLElement).closest('[data-menu-trigger]')) return;
    onClick();
  }

  function handleMenuToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }

  function handleQuickAction(action: string) {
    setMenuOpen(false);
    onQuickAction(action);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleCardClick}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow relative ${
        isDragging ? 'ring-2 ring-emerald-400' : ''
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate flex-1">
          {candidate.full_name}
        </h4>
        <div className="relative" data-menu-trigger>
          <button
            onClick={handleMenuToggle}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              {/* Invisible overlay to close menu */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 w-44"
              >
                <button
                  onClick={() => handleQuickAction('send_email')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send Email
                </button>
                <button
                  onClick={() => handleQuickAction('schedule_interview')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Schedule Interview
                </button>
                <button
                  onClick={() => handleQuickAction('add_note')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Add Note
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Email */}
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{candidate.email}</p>

      {/* Subjects */}
      {candidate.subjects && candidate.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {candidate.subjects.map((subject) => (
            <span
              key={subject}
              className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
            >
              {subject}
            </span>
          ))}
        </div>
      )}

      {/* Footer: days in stage */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          In stage: {daysInStage}
        </span>
        {candidate.expected_hourly_rate != null && (
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
            £{candidate.expected_hourly_rate}/hr
          </span>
        )}
      </div>
    </div>
  );
}
