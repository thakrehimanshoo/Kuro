'use client';

import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', className = '' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const ref = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get days from previous month to fill the grid
  const startDayOfWeek = monthStart.getDay();
  const previousMonthDays = startDayOfWeek > 0
    ? eachDayOfInterval({
        start: subMonths(monthStart, 1),
        end: new Date(monthStart.getTime() - 86400000)
      }).slice(-startDayOfWeek)
    : [];

  // Get days from next month to fill the grid
  const totalCells = previousMonthDays.length + days.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = nextMonthDaysCount > 0
    ? eachDayOfInterval({
        start: addMonths(monthStart, 1),
        end: new Date(addMonths(monthStart, 1).getTime() + (nextMonthDaysCount - 1) * 86400000)
      })
    : [];

  const allDays = [...previousMonthDays, ...days, ...nextMonthDays];

  const handleDateSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const renderCalendarContent = () => (
    <>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setCurrentMonth(subMonths(currentMonth, 1));
          }}
          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-lg"
        >
          ‹
        </button>
        <div className="font-medium text-sm">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setCurrentMonth(addMonths(currentMonth, 1));
          }}
          className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-lg"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs opacity-50 font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleDateSelect(day);
              }}
              className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all
                ${isSelected ? 'bg-[#8ab4f8] text-[#202124] font-medium hover:bg-[#aecbfa]' : 'hover:bg-white/10'}
                ${!isCurrentMonth ? 'opacity-40' : ''}
                ${isTodayDate && !isSelected ? 'border border-white/30' : ''}
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleDateSelect(new Date());
          }}
          className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-all"
        >
          Today
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleClear(e);
            setIsOpen(false);
          }}
          className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-all"
        >
          Clear
        </button>
      </div>
    </>
  );

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Input trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left text-white text-sm focus:outline-none focus:border-white/30 transition-all flex items-center justify-between"
        >
          <span className={selectedDate ? '' : 'opacity-30'}>
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {selectedDate && <span className="text-white/40">✕</span>}
            <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </button>
        {selectedDate && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded transition-all text-white/60 hover:text-white z-10"
          >
            ✕
          </button>
        )}
      </div>

      {/* Calendar modal - centered on all screen sizes */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#202124] border border-white/10 rounded-xl p-4 shadow-2xl w-full max-w-[320px]">
            {renderCalendarContent()}
          </div>
        </div>
      )}
    </div>
  );
}
