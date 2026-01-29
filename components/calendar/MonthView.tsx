'use client';

import { format, isToday } from 'date-fns';

interface MonthViewProps {
  monthStart: Date;
  monthDays: Date[];
  onDayClick: (day: Date) => void;
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

export default function MonthView({
  monthStart,
  monthDays,
  onDayClick,
  getEventsForDay,
}: MonthViewProps) {
  return (
    <div className="p-1.5 xs:p-2 sm:p-4 lg:p-8 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-0.5 xs:gap-1 lg:gap-2 mb-0.5 xs:mb-1 lg:mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-[9px] xs:text-[10px] sm:text-xs lg:text-sm opacity-60 font-medium py-0.5 xs:py-1 lg:py-2">
              <span className="hidden xs:inline">{day.slice(0, 3)}</span>
              <span className="xs:hidden">{day[0]}</span>
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5 xs:gap-1 lg:gap-2">
          {/* Empty cells for first week */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {monthDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`aspect-square border border-white/10 rounded xs:rounded-lg p-0.5 xs:p-1 lg:p-2 hover:bg-white/5 active:bg-white/10 cursor-pointer transition-all ${
                  isTodayDate ? 'border-[#8ab4f8]' : ''
                }`}
                onClick={() => onDayClick(day)}
              >
                <div className={`text-[10px] xs:text-xs lg:text-sm mb-0.5 lg:mb-1 ${
                  isTodayDate ? 'w-4 h-4 xs:w-5 xs:h-5 lg:w-6 lg:h-6 bg-[#8ab4f8] text-[#202124] rounded-full flex items-center justify-center font-medium text-[9px] xs:text-[10px] lg:text-sm' : ''
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 lg:space-y-1">
                  {dayEvents.slice(0, 2).map((event, i) => (
                    <div
                      key={i}
                      className="text-[7px] xs:text-[8px] sm:text-[10px] lg:text-xs px-0.5 lg:px-1 py-0.5 rounded truncate"
                      style={{ backgroundColor: event.color + '40', color: event.color }}
                    >
                      <span className="hidden sm:inline">{event.title}</span>
                      <span className="sm:hidden">•</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[7px] xs:text-[8px] lg:text-xs opacity-60">
                      <span className="hidden sm:inline">+{dayEvents.length - 2}</span>
                      <span className="sm:hidden">+{dayEvents.length - 2}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
