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
  const startOffset = monthStart.getDay();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mini Calendar Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => onDateChange(subMonths(currentDate, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 text-lg"
          >
            ‹
          </button>
          <div className="text-base font-medium">{format(currentDate, 'MMMM yyyy')}</div>
          <button
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-full active:bg-white/10 text-lg"
          >
            ›
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] opacity-40 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
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
                className={`aspect-square flex flex-col items-center justify-center rounded-full text-xs transition-all relative
                  ${isSelected ? 'bg-[#8ab4f8] text-black font-semibold' : ''}
                  ${isTodayDate && !isSelected ? 'border border-[#8ab4f8] text-[#8ab4f8]' : ''}
                  ${!isSelected ? 'active:bg-white/10' : ''}
                `}
              >
                {format(day, 'd')}
                {hasEvents && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#8ab4f8]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mx-4" />

      {/* Selected Day Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div>
          <div className="text-base font-medium">
            {isToday(currentDate) ? 'Today' : format(currentDate, 'EEEE')}
          </div>
          <div className="text-xs opacity-50">{format(currentDate, 'MMMM d, yyyy')}</div>
        </div>
        <button
          onClick={onCreateEvent}
          className="w-9 h-9 bg-[#8ab4f8] text-black rounded-full flex items-center justify-center text-xl font-medium active:scale-95 transition-transform"
        >
          +
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {todayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center opacity-40">
            <div className="text-xl mb-1">No events</div>
            <div className="text-xs">Tap + to create one</div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event, i) => (
              <button
                key={i}
                onClick={() => {
                  if (event.type === 'task' && event.id && onTaskClick) {
                    onTaskClick(event.id, event.title.replace(/^📋\s*/, ''), event.start.getTime());
                  }
                }}
                className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/5 active:bg-white/10 text-left transition-colors"
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{event.title}</div>
                  <div className="text-xs opacity-50 mt-0.5">
                    {event.allDay ? 'All day' : `${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`}
                  </div>
                </div>
                {event.type === 'task' && (
                  <div className="text-[10px] px-2 py-0.5 bg-[#ff6b6b]/20 text-[#ff6b6b] rounded-full">
                    Task
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
