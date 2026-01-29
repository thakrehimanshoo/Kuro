'use client';

import { format, isToday } from 'date-fns';
import { type CalendarEvent } from '@/lib/db';
import { calculateEventLayout, getEventStyle } from '@/lib/calendar-utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface WeekViewProps {
  weekDays: Date[];
  calendarEvents: CalendarEvent[] | undefined;
  isDragging: boolean;
  draggedEvent: CalendarEvent | null;
  onCreateEvent: (date: string, startTime: string, endTime: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onTaskClick?: (taskId: number, title: string, dueDate: number) => void;
  onDragStart: (event: CalendarEvent, type: 'move' | 'resize-top' | 'resize-bottom', e: React.MouseEvent) => void;
  onDragMove: (e: React.MouseEvent) => void;
  onDragEnd: () => void;
  getEventsForDay: (day: Date) => Array<{
    id?: number;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: string;
    color: string;
  }>;
}

export default function WeekView({
  weekDays,
  calendarEvents,
  isDragging,
  draggedEvent,
  onCreateEvent,
  onEditEvent,
  onTaskClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  getEventsForDay,
}: WeekViewProps) {
  // Calculate max all-day events for any day to determine header height
  const maxAllDayEvents = Math.max(
    ...weekDays.map(day => getEventsForDay(day).filter(e => e.allDay).length),
    0
  );
  const allDayHeight = maxAllDayEvents > 0 ? Math.min(maxAllDayEvents * 28 + 8, 120) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header row with day names */}
      <div className="flex border-b border-white/10 flex-shrink-0">
        <div className="w-10 xs:w-12 sm:w-14 lg:w-16 flex-shrink-0 border-r border-white/10" />
        {weekDays.map(day => {
          const isTodayDate = isToday(day);
          return (
            <div
              key={`header-${day.toString()}`}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 xs:py-2 border-r border-white/10 ${
                isTodayDate ? 'bg-[#8ab4f8]/10' : ''
              }`}
            >
              <div className="text-[8px] xs:text-[9px] sm:text-[10px] lg:text-xs opacity-60">{format(day, 'EEE').charAt(0)}<span className="hidden xs:inline">{format(day, 'EEE').slice(1)}</span></div>
              <div className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full text-xs xs:text-sm lg:text-base ${
                isTodayDate ? 'bg-[#8ab4f8] text-[#202124] font-medium' : ''
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day events row */}
      {allDayHeight > 0 && (
        <div className="flex border-b border-white/10 flex-shrink-0" style={{ minHeight: `${Math.min(allDayHeight, 80)}px` }}>
          <div className="w-10 xs:w-12 sm:w-14 lg:w-16 flex-shrink-0 border-r border-white/10 flex items-start justify-end pr-0.5 xs:pr-1 pt-0.5 xs:pt-1">
            <span className="text-[7px] xs:text-[8px] sm:text-[9px] lg:text-[10px] opacity-40">all-day</span>
          </div>
          {weekDays.map(day => {
            const allDayEvents = getEventsForDay(day).filter(e => e.allDay);
            const isTodayDate = isToday(day);

            return (
              <div
                key={`allday-${day.toString()}`}
                className={`flex-1 min-w-0 border-r border-white/10 p-0.5 xs:p-1 space-y-0.5 xs:space-y-1 overflow-hidden ${
                  isTodayDate ? 'bg-[#8ab4f8]/5' : ''
                }`}
              >
                {allDayEvents.slice(0, 3).map((event, i) => (
                  <div
                    key={i}
                    className="px-0.5 xs:px-1 sm:px-1.5 py-0.5 rounded text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs truncate cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: event.color + '40', color: event.color }}
                    onClick={() => {
                      if (event.type === 'task' && event.id && onTaskClick) {
                        onTaskClick(event.id, event.title.replace(/^📋\s*/, ''), event.start.getTime());
                      }
                    }}
                  >
                    <span className="hidden xs:inline">{event.title}</span>
                    <span className="xs:hidden">{event.title.slice(0, 6)}{event.title.length > 6 ? '..' : ''}</span>
                  </div>
                ))}
                {allDayEvents.length > 3 && (
                  <div className="text-[7px] xs:text-[8px] opacity-50 px-0.5">+{allDayEvents.length - 3}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-w-full">
          {/* Time column */}
          <div className="w-10 xs:w-12 sm:w-14 lg:w-16 flex-shrink-0 border-r border-white/10">
            {HOURS.map(hour => (
              <div key={hour} className="h-12 xs:h-14 sm:h-16 text-[8px] xs:text-[9px] sm:text-[10px] lg:text-xs opacity-40 pr-0.5 xs:pr-1 lg:pr-2 text-right pt-0.5 xs:pt-1">
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div key={day.toString()} className="flex-1 border-r border-white/10 min-w-0">

                {/* Time slots */}
                <div
                  className="relative"
                  onMouseMove={onDragMove}
                  onMouseUp={onDragEnd}
                  onMouseLeave={onDragEnd}
                >
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="h-12 xs:h-14 sm:h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                      onClick={() => {
                        if (!isDragging) {
                          onCreateEvent(
                            format(day, 'yyyy-MM-dd'),
                            `${hour.toString().padStart(2, '0')}:00`,
                            `${(hour + 1).toString().padStart(2, '0')}:00`
                          );
                        }
                      }}
                    />
                  ))}

                  {/* Events overlay - only timed events (all-day shown in header) */}
                  {(() => {
                    // Filter out all-day events (they're shown in the header)
                    const timedEvents = dayEvents.filter(e => !e.allDay);
                    const positionedEvents = calculateEventLayout(timedEvents);

                    // Use CSS variable-like approach for responsive heights
                    // Base: 48px (h-12), xs: 56px (h-14), sm+: 64px (h-16)
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
                          className={`absolute rounded text-xs transition-opacity group ${
                            isDraggable ? 'cursor-move' : 'cursor-pointer'
                          } ${isDragging && draggedEvent?.id === event.id ? 'opacity-60' : 'hover:opacity-90'}`}
                          style={{
                            backgroundColor: event.color + '80',
                            top: `${top}px`,
                            height: `${Math.max(height, 24)}px`,
                            left: positionStyle.left,
                            width: positionStyle.width,
                          }}
                          onMouseDown={(e) => {
                            if (isDraggable && fullEvent) {
                              onDragStart(fullEvent, 'move', e);
                            }
                          }}
                          onClick={() => {
                            if (!isDragging) {
                              if (event.type === 'task' && event.id && onTaskClick) {
                                onTaskClick(event.id, event.title.replace(/^📋\s*/, ''), event.start.getTime());
                              } else if (fullEvent) {
                                onEditEvent(fullEvent);
                              }
                            }
                          }}
                        >
                          {/* Resize handle - top */}
                          {isDraggable && height >= 48 && (
                            <div
                              className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                if (fullEvent) onDragStart(fullEvent, 'resize-top', e);
                              }}
                            >
                              <div className="h-0.5 bg-white/30 rounded-t" />
                            </div>
                          )}

                          <div className="px-0.5 xs:px-1 lg:px-2 py-0.5 lg:py-1 overflow-hidden">
                            <div className="font-medium truncate text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs">{event.title}</div>
                            {height >= 32 && (
                              <div className="text-[6px] xs:text-[7px] sm:text-[9px] lg:text-xs opacity-80 truncate hidden xs:block">
                                {format(event.start, 'h:mm a')}
                              </div>
                            )}
                          </div>

                          {/* Resize handle - bottom */}
                          {isDraggable && height >= 48 && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                if (fullEvent) onDragStart(fullEvent, 'resize-bottom', e);
                              }}
                            >
                              <div className="h-0.5 bg-white/30 rounded-b" />
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
