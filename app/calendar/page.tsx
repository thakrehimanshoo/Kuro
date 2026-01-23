'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Event as CalendarEventType } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CalendarEvent } from '@/lib/db';
import BottomNav from '@/components/BottomNav';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface ExtendedEvent extends CalendarEventType {
  resource?: {
    type: string;
    data: CalendarEvent | unknown;
  };
}

export default function CalendarPage() {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState<Date>(new Date());
  const [newEventEnd, setNewEventEnd] = useState<Date>(addHours(new Date(), 1));
  const [isAllDay, setIsAllDay] = useState(false);

  // Get all calendar events
  const calendarEvents = useLiveQuery(() => db.calendar.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  // Transform data for calendar
  const events = useMemo(() => {
    const result: ExtendedEvent[] = [];

    // Calendar events
    if (calendarEvents) {
      calendarEvents.forEach((event) => {
        result.push({
          title: event.title,
          start: new Date(event.startDate),
          end: new Date(event.endDate),
          allDay: event.allDay,
          resource: { type: event.type, data: event },
        });
      });
    }

    // Tasks with due dates
    if (tasks) {
      tasks.forEach((task) => {
        if (task.dueDate && !task.completed) {
          result.push({
            title: `📋 ${task.title}`,
            start: new Date(task.dueDate),
            end: new Date(task.dueDate),
            allDay: true,
            resource: { type: 'task', data: task },
          });
        }
      });
    }

    return result;
  }, [calendarEvents, tasks]);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      setNewEventStart(start);
      setNewEventEnd(end);
      setNewEventTitle('');
      setSelectedEvent(null);
      setShowEventModal(true);
    },
    []
  );

  const handleSelectEvent = useCallback((event: ExtendedEvent) => {
    if (!event.resource) return;

    if (event.resource.type === 'custom' || event.resource.type === 'session') {
      setSelectedEvent(event.resource.data as CalendarEvent);
      setShowEventModal(true);
    } else if (event.resource.type === 'task') {
      // Navigate to tasks page or show task details
      window.location.href = '/tasks';
    }
  }, []);

  const handleSaveEvent = async () => {
    if (!newEventTitle.trim()) return;

    if (selectedEvent) {
      // Update existing event
      await db.calendar.update(selectedEvent.id!, {
        title: newEventTitle,
        startDate: newEventStart.getTime(),
        endDate: newEventEnd.getTime(),
        allDay: isAllDay,
        updatedAt: Date.now(),
      });
    } else {
      // Create new event
      await db.calendar.add({
        title: newEventTitle,
        startDate: newEventStart.getTime(),
        endDate: newEventEnd.getTime(),
        allDay: isAllDay,
        type: 'custom',
        color: '#ffffff',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    setShowEventModal(false);
    setNewEventTitle('');
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && selectedEvent.id) {
      await db.calendar.delete(selectedEvent.id);
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  const eventStyleGetter = (event: ExtendedEvent) => {
    let backgroundColor = '#ffffff20';
    let color = '#ffffff';

    if (event.resource?.type === 'task') {
      backgroundColor = '#ff6b6b40';
      color = '#ff6b6b';
    } else if (event.resource?.type === 'session') {
      backgroundColor = '#51cf6640';
      color = '#51cf66';
    } else if (event.resource?.type === 'note') {
      backgroundColor = '#ffd43b40';
      color = '#ffd43b';
    }

    return {
      style: {
        backgroundColor,
        color,
        border: `1px solid ${color}40`,
        borderRadius: '6px',
        fontSize: '0.875rem',
      },
    };
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white lg:ml-64">
      {/* Header */}
      <div className="safe-top px-6 lg:px-12 pt-8 lg:pt-12 pb-6 border-b border-white/10">
        <h1 className="text-4xl lg:text-5xl font-extralight mb-3">Calendar</h1>
        <p className="text-sm lg:text-base opacity-40">
          Plan your tasks, sessions, and notes
        </p>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-8 px-4 lg:px-12 py-6">
        <div className="max-w-7xl h-[calc(100vh-200px)] lg:h-[calc(100vh-240px)]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventStyleGetter}
            className="custom-calendar"
            views={['month', 'week', 'day']}
          />
        </div>

        {/* Legend */}
        <div className="max-w-7xl mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#ff6b6b]" />
            <span className="opacity-60">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#51cf66]" />
            <span className="opacity-60">Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#ffd43b]" />
            <span className="opacity-60">Notes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/20" />
            <span className="opacity-60">Custom Events</span>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
          <div className="bg-black border border-white/20 rounded-2xl p-6 lg:p-8 w-full max-w-md">
            <h2 className="text-2xl font-extralight mb-6">
              {selectedEvent ? 'Edit Event' : 'New Event'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm opacity-60 mb-2">Title</label>
                <input
                  type="text"
                  value={selectedEvent ? selectedEvent.title : newEventTitle}
                  onChange={(e) =>
                    selectedEvent
                      ? setSelectedEvent({ ...selectedEvent, title: e.target.value })
                      : setNewEventTitle(e.target.value)
                  }
                  placeholder="Event title"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="allDay" className="text-sm opacity-60">
                  All day event
                </label>
              </div>

              {!isAllDay && (
                <>
                  <div>
                    <label className="block text-sm opacity-60 mb-2">Start</label>
                    <input
                      type="datetime-local"
                      value={format(newEventStart, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setNewEventStart(new Date(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm opacity-60 mb-2">End</label>
                    <input
                      type="datetime-local"
                      value={format(newEventEnd, "yyyy-MM-dd'T'HH:mm")}
                      onChange={(e) => setNewEventEnd(new Date(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              {selectedEvent && selectedEvent.type === 'custom' && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                disabled={!newEventTitle.trim() && !selectedEvent}
                className="flex-1 px-4 py-3 bg-white text-black rounded-lg hover:scale-105 transition-transform disabled:opacity-30 disabled:hover:scale-100"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        .custom-calendar {
          background: transparent;
          color: white;
        }
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 12px 4px;
          font-weight: 300;
          font-size: 0.875rem;
          opacity: 0.6;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-month-view,
        .rbc-time-view {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
        }
        .rbc-day-bg {
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }
        .rbc-off-range-bg {
          background: rgba(255, 255, 255, 0.01);
        }
        .rbc-today {
          background: rgba(255, 255, 255, 0.05);
        }
        .rbc-date-cell {
          padding: 8px;
          text-align: right;
          font-size: 0.875rem;
          opacity: 0.6;
        }
        .rbc-now .rbc-date-cell {
          opacity: 1;
          font-weight: 500;
        }
        .rbc-toolbar {
          padding: 16px 0;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rbc-toolbar button {
          color: white;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.15s;
        }
        .rbc-toolbar button:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .rbc-toolbar button.rbc-active {
          background: white;
          color: black;
        }
        .rbc-event {
          padding: 4px 6px;
        }
        .rbc-event-label {
          font-size: 0.75rem;
        }
        .rbc-show-more {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          padding: 4px;
        }
        .rbc-month-row {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          min-height: 80px;
        }
        .rbc-time-content {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .rbc-time-slot {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .rbc-current-time-indicator {
          background-color: white;
        }
        .rbc-timeslot-group {
          border-left: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
}
