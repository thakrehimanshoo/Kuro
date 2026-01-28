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
  return (
    <div className="flex h-full">
      {/* Time column */}
      <div className="w-14 lg:w-16 flex-shrink-0 border-r border-white/10">
        <div className="h-16" /> {/* Spacer for header */}
        {HOURS.map(hour => (
          <div key={hour} className="h-16 text-[10px] lg:text-xs opacity-40 pr-1 lg:pr-2 text-right pt-1">
            {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
          </div>
        ))}
      </div>

      {/* Days columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex min-w-full lg:min-w-[640px]">
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div key={day.toString()} className="flex-1 border-r border-white/10 min-w-[90px] lg:min-w-0">
                {/* Day header */}
                <div className={`h-16 flex flex-col items-center justify-center border-b border-white/10 ${
                  isTodayDate ? 'bg-[#8ab4f8]/10' : ''
                }`}>
                  <div className="text-[10px] lg:text-xs opacity-60">{format(day, 'EEE')}</div>
                  <div className={`w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-full text-sm lg:text-base ${
                    isTodayDate ? 'bg-[#8ab4f8] text-[#202124] font-medium' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>

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
                      className="h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
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

                  {/* Events overlay */}
                  {(() => {
                    // Calculate layout for overlapping events
                    const positionedEvents = calculateEventLayout(dayEvents);

                    return positionedEvents.map((event, i) => {
                      if (event.allDay) {
                        return (
                          <div
                            key={i}
                            className="absolute top-2 left-1 right-1 px-2 py-1 rounded text-xs truncate"
                            style={{ backgroundColor: event.color + '40', color: event.color }}
                          >
                            {event.title}
                          </div>
                        );
                      }

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
                          className={`absolute rounded text-xs transition-opacity group ${
                            isDraggable ? 'cursor-move' : 'cursor-pointer'
                          } ${isDragging && draggedEvent?.id === event.id ? 'opacity-60' : 'hover:opacity-90'}`}
                          style={{
                            backgroundColor: event.color + '80',
                            top: `${top}px`,
                            height: `${Math.max(height, 32)}px`,
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

                          <div className="px-1 lg:px-2 py-0.5 lg:py-1 overflow-hidden">
                            <div className="font-medium truncate text-[10px] lg:text-xs">{event.title}</div>
                            {height >= 40 && (
                              <div className="text-[9px] lg:text-xs opacity-80 truncate">
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
