'use client';

import { format, isToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';

interface Event {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: string;
  color: string;
}

interface MobileAgendaViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onCreateEvent: () => void;
  onTaskClick?: (taskId: number, title: string, dueDate: number) => void;
  getEventsForDay: (day: Date) => Event[];
}

export default function MobileAgendaView({
  currentDate,
  onDateChange,
  onCreateEvent,
  onTaskClick,
  getEventsForDay,
}: MobileAgendaViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const todayEvents = getEventsForDay(currentDate);

  // Calculate offset for first day of month
  const startOffset = monthStart.getDay();

  return (
    <div className="flex flex-col h-full">
      {/* Compact Mini Calendar */}
      <div className="flex-shrink-0 px-3 pt-2 pb-3">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => onDateChange(subMonths(currentDate, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10"
          >
            ‹
          </button>
          <div className="text-sm font-medium">{format(currentDate, 'MMMM yyyy')}</div>
          <button
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/10"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[9px] opacity-40 py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid - compact */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for offset */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {monthDays.map(day => {
            const isSelected = isSameDay(day, currentDate);
            const isTodayDate = isToday(day);
            const hasEvents = getEventsForDay(day).length > 0;

            return (
              <button
                key={day.toString()}
                onClick={() => onDateChange(day)}
                className={`aspect-square flex flex-col items-center justify-center rounded-md text-[11px] relative transition-all
                  ${isSelected ? 'bg-[#8ab4f8] text-black font-medium' : ''}
                  ${isTodayDate && !isSelected ? 'border border-[#8ab4f8]' : ''}
                  ${!isSelected ? 'active:bg-white/10' : ''}
                `}
              >
                {format(day, 'd')}
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#8ab4f8]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Selected day header */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div>
          <div className="text-sm font-medium">
            {isToday(currentDate) ? 'Today' : format(currentDate, 'EEEE')}
          </div>
          <div className="text-[11px] opacity-50">{format(currentDate, 'MMMM d, yyyy')}</div>
        </div>
        <button
          onClick={onCreateEvent}
          className="w-8 h-8 bg-[#8ab4f8] text-black rounded-full flex items-center justify-center text-lg font-medium active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {/* Events list - scrollable only if needed */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm">No events</div>
            <div className="text-[11px]">Tap + to add one</div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event, i) => (
              <div
                key={i}
                onClick={() => {
                  if (event.type === 'task' && event.id && onTaskClick) {
                    onTaskClick(event.id, event.title.replace(/^📋\s*/, ''), event.start.getTime());
                  }
                }}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 active:bg-white/10 cursor-pointer transition-colors"
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{event.title}</div>
                  <div className="text-[11px] opacity-50">
                    {event.allDay ? 'All day' : `${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`}
                  </div>
                </div>
                {event.type === 'task' && (
                  <div className="text-[10px] px-1.5 py-0.5 bg-[#ff6b6b]/20 text-[#ff6b6b] rounded">
                    Task
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
