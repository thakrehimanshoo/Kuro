'use client';

import { format, isToday } from 'date-fns';
import { type CalendarEvent } from '@/lib/db';
import { calculateEventLayout, getEventStyle } from '@/lib/calendar-utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
  currentDate: Date;
  events: Array<{
    id?: number;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: string;
    color: string;
  }>;
  calendarEvents: CalendarEvent[] | undefined;
  isDragging: boolean;
  draggedEvent: CalendarEvent | null;
  onCreateEvent: (date: string, startTime: string, endTime: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onTaskClick?: (taskId: number, title: string, dueDate: number) => void;
  onDragStart: (event: CalendarEvent, type: 'move' | 'resize-top' | 'resize-bottom', e: React.MouseEvent) => void;
  onDragMove: (e: React.MouseEvent) => void;
  onDragEnd: () => void;
}

export default function DayView({
  currentDate,
  events,
  calendarEvents,
  isDragging,
  draggedEvent,
  onCreateEvent,
  onEditEvent,
  onTaskClick,
  onDragStart,
  onDragMove,
  onDragEnd,
}: DayViewProps) {
  // Separate all-day and timed events
  const allDayEvents = events.filter(e => e.allDay);
  const timedEvents = events.filter(e => !e.allDay);
  const allDayHeight = allDayEvents.length > 0 ? Math.min(allDayEvents.length * 32 + 16, 120) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        <div className="w-12 xs:w-14 sm:w-16 lg:w-20 flex-shrink-0 border-r border-white/10" />
        <div className={`flex-1 h-14 xs:h-16 flex items-center justify-center ${
          isToday(currentDate) ? 'bg-[#8ab4f8]/10' : ''
        }`}>
          <div className="text-center">
            <div className="text-[10px] xs:text-xs opacity-60">{format(currentDate, 'EEEE')}</div>
            <div className={`w-8 h-8 xs:w-10 xs:h-10 flex items-center justify-center rounded-full text-sm xs:text-lg mx-auto ${
              isToday(currentDate) ? 'bg-[#8ab4f8] text-[#202124] font-medium' : 'text-white/60'
            }`}>
              {format(currentDate, 'd')}
            </div>
          </div>
        </div>
      </div>

      {/* All-day events section */}
      {allDayHeight > 0 && (
        <div className="flex border-b border-white/10 flex-shrink-0" style={{ minHeight: `${Math.min(allDayHeight, 80)}px` }}>
          <div className="w-12 xs:w-14 sm:w-16 lg:w-20 flex-shrink-0 border-r border-white/10 flex items-start justify-end pr-1 xs:pr-2 pt-1 xs:pt-2">
            <span className="text-[8px] xs:text-[10px] lg:text-xs opacity-40">all-day</span>
          </div>
          <div className={`flex-1 p-1.5 xs:p-2 space-y-1 overflow-y-auto ${
            isToday(currentDate) ? 'bg-[#8ab4f8]/5' : ''
          }`}>
            {allDayEvents.slice(0, 3).map((event, i) => (
              <div
                key={i}
                className="px-2 xs:px-3 py-1 xs:py-1.5 rounded-lg text-xs xs:text-sm cursor-pointer hover:opacity-80 transition-opacity truncate"
                style={{ backgroundColor: event.color + '40', color: event.color }}
                onClick={() => {
                  if (event.type === 'task' && event.id && onTaskClick) {
                    onTaskClick(event.id, event.title.replace(/^📋\s*/, ''), event.start.getTime());
                  }
                }}
              >
                {event.title}
              </div>
            ))}
            {allDayEvents.length > 3 && (
              <div className="text-[10px] xs:text-xs opacity-50 px-2">+{allDayEvents.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-12 xs:w-14 sm:w-16 lg:w-20 flex-shrink-0 border-r border-white/10 sticky left-0 bg-[#1a1a1a] z-10">
            {HOURS.map(hour => (
              <div key={hour} className="h-12 xs:h-14 sm:h-16 text-[9px] xs:text-[10px] sm:text-xs lg:text-sm opacity-40 pr-1 xs:pr-2 lg:pr-3 text-right pt-0.5 xs:pt-1">
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="flex-1">

            <div
              className="relative"
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
            >
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="h-12 xs:h-14 sm:h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => {
                    if (!isDragging) {
                      onCreateEvent(
                        format(currentDate, 'yyyy-MM-dd'),
                        `${hour.toString().padStart(2, '0')}:00`,
                        `${(hour + 1).toString().padStart(2, '0')}:00`
                      );
                    }
                  }}
                />
              ))}

              {/* Current time indicator */}
              {isToday(currentDate) && (() => {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                // Use responsive hour height: 48px (h-12), 56px (h-14), 64px (h-16)
                const hourHeight = typeof window !== 'undefined' && window.innerWidth < 375 ? 48 :
                                   typeof window !== 'undefined' && window.innerWidth < 640 ? 56 : 64;
                const top = currentHour * hourHeight + (currentMinute / 60) * hourHeight;

                return (
                  <div className="absolute left-0 right-0 flex items-center z-10" style={{ top: `${top}px` }}>
                    <div className="w-2.5 h-2.5 xs:w-3 xs:h-3 bg-[#ea4335] rounded-full -ml-1 xs:-ml-1.5" />
                    <div className="flex-1 h-0.5 bg-[#ea4335]" />
                  </div>
                );
              })()}

              {/* Events - only timed events (all-day shown in header) */}
              {(() => {
                const positionedEvents = calculateEventLayout(timedEvents);
                // Use responsive hour height
                const hourHeight = typeof window !== 'undefined' && window.innerWidth < 375 ? 48 :
                                   typeof window !== 'undefined' && window.innerWidth < 640 ? 56 : 64;

                return positionedEvents.map((event, i) => {
                  const startHour = event.start.getHours();
                  const startMinute = event.start.getMinutes();
                  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                  const top = startHour * hourHeight + (startMinute / 60) * hourHeight;
                  const height = (duration / 60) * hourHeight;
                  const fullEvent = event.id ? calendarEvents?.find(e => e.id === event.id) : null;
                  const isDraggable = fullEvent && event.type === 'custom';

                  // Get positioned styles for overlapping events
                  const positionStyle = getEventStyle(event);

                  return (
                    <div
                      key={i}
                      className={`absolute rounded-lg transition-opacity group ${
                        isDraggable ? 'cursor-move' : 'cursor-pointer'
                      } ${isDragging && draggedEvent?.id === event.id ? 'opacity-60' : 'hover:opacity-90'}`}
                      style={{
                        backgroundColor: event.color + '90',
                        top: `${top}px`,
                        height: `${Math.max(height, 32)}px`,
                        left: `calc(4px + ${positionStyle.left})`,
                        width: `calc(${positionStyle.width} - 2px)`,
                      }}
                      onMouseDown={(e) => {
                        if (isDraggable && fullEvent) {
                          onDragStart(fullEvent, 'move', e);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging) {
                          if (event.type === 'task' && event.id && onTaskClick) {
                            onTaskClick(event.id, event.title.replace(/^📋\s*/, ''), event.start.getTime());
                          } else if (fullEvent) {
                            onEditEvent(fullEvent);
                          }
                        }
                      }}
                    >
                      {isDraggable && height >= 56 && (
                        <div
                          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (fullEvent) onDragStart(fullEvent, 'resize-top', e);
                          }}
                        >
                          <div className="h-1 bg-white/30 rounded-t-lg" />
                        </div>
                      )}
                      <div className="px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 overflow-hidden">
                        <div className="font-medium text-[10px] xs:text-xs sm:text-sm truncate">{event.title}</div>
                        {height >= 48 && (
                          <div className="text-[9px] xs:text-[10px] sm:text-xs opacity-90 mt-0.5 truncate hidden xs:block">
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                          </div>
                        )}
                      </div>
                      {isDraggable && height >= 56 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            if (fullEvent) onDragStart(fullEvent, 'resize-bottom', e);
                          }}
                        >
                          <div className="h-1 bg-white/30 rounded-b-lg" />
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
