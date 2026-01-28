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
        <div className="w-16 lg:w-20 flex-shrink-0 border-r border-white/10" />
        <div className={`flex-1 h-16 flex items-center justify-center ${
          isToday(currentDate) ? 'bg-[#8ab4f8]/10' : ''
        }`}>
          <div className="text-center">
            <div className="text-xs opacity-60">{format(currentDate, 'EEEE')}</div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full text-lg mx-auto ${
              isToday(currentDate) ? 'bg-[#8ab4f8] text-[#202124] font-medium' : 'text-white/60'
            }`}>
              {format(currentDate, 'd')}
            </div>
          </div>
        </div>
      </div>

      {/* All-day events section */}
      {allDayHeight > 0 && (
        <div className="flex border-b border-white/10 flex-shrink-0" style={{ minHeight: `${allDayHeight}px` }}>
          <div className="w-16 lg:w-20 flex-shrink-0 border-r border-white/10 flex items-start justify-end pr-2 pt-2">
            <span className="text-[10px] lg:text-xs opacity-40">all-day</span>
          </div>
          <div className={`flex-1 p-2 space-y-1 overflow-y-auto ${
            isToday(currentDate) ? 'bg-[#8ab4f8]/5' : ''
          }`}>
            {allDayEvents.map((event, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:opacity-80 transition-opacity"
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
          </div>
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          {/* Time column */}
          <div className="w-16 lg:w-20 flex-shrink-0 border-r border-white/10 sticky left-0 bg-[#1a1a1a] z-10">
            {HOURS.map(hour => (
              <div key={hour} className="h-16 text-xs lg:text-sm opacity-40 pr-2 lg:pr-3 text-right pt-1">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
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
                  className="h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
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
                const top = currentHour * 64 + (currentMinute / 60) * 64;

                return (
                  <div className="absolute left-0 right-0 flex items-center z-10" style={{ top: `${top}px` }}>
                    <div className="w-3 h-3 bg-[#ea4335] rounded-full -ml-1.5" />
                    <div className="flex-1 h-0.5 bg-[#ea4335]" />
                  </div>
                );
              })()}

              {/* Events - only timed events (all-day shown in header) */}
              {(() => {
                const positionedEvents = calculateEventLayout(timedEvents);

                return positionedEvents.map((event, i) => {
                  const startHour = event.start.getHours();
                  const startMinute = event.start.getMinutes();
                  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                  const top = startHour * 64 + (startMinute / 60) * 64;
                  const height = (duration / 60) * 64;
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
                        height: `${Math.max(height, 40)}px`,
                        left: `calc(8px + ${positionStyle.left})`,
                        width: `calc(${positionStyle.width} - 4px)`,
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
                      {isDraggable && height >= 64 && (
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
                      <div className="px-3 py-2 overflow-hidden">
                        <div className="font-medium text-sm truncate">{event.title}</div>
                        {height >= 56 && (
                          <div className="text-xs opacity-90 mt-0.5 truncate">
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                          </div>
                        )}
                      </div>
                      {isDraggable && height >= 64 && (
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
