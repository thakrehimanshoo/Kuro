'use client';

import { useState, useMemo, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths, addDays, subDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { db, type CalendarEvent } from '@/lib/db';
import BottomNav from '@/components/BottomNav';
import DatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';
import DayView from '@/components/calendar/DayView';
import WeekView from '@/components/calendar/WeekView';
import MonthView from '@/components/calendar/MonthView';
import { CalendarPageSkeleton } from '@/components/Skeleton';

type ViewType = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [createAsTask, setCreateAsTask] = useState(false);

  // Drag state
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragType, setDragType] = useState<'move' | 'resize-top' | 'resize-bottom' | null>(null);

  // Get all calendar events and tasks
  const calendarEvents = useLiveQuery(() => db.calendar.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  // Week view dates - memoized for performance
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Month view dates - memoized for performance
  const { monthStart, monthDays } = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return {
      monthStart: start,
      monthDays: eachDayOfInterval({ start, end }),
    };
  }, [currentDate]);

  // Get events for current view - optimized to filter by date range
  const visibleEvents = useMemo(() => {
    const events: Array<{
      id?: number;
      title: string;
      start: Date;
      end: Date;
      allDay: boolean;
      type: string;
      color: string;
    }> = [];

    // Determine date range based on view
    let rangeStart: Date;
    let rangeEnd: Date;

    if (view === 'day') {
      rangeStart = new Date(currentDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(currentDate);
      rangeEnd.setHours(23, 59, 59, 999);
    } else if (view === 'week') {
      rangeStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      rangeEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    } else {
      rangeStart = startOfMonth(currentDate);
      rangeEnd = endOfMonth(currentDate);
    }

    if (calendarEvents) {
      calendarEvents.forEach((event) => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);

        // Only include events that overlap with the current view
        if (eventEnd >= rangeStart && eventStart <= rangeEnd) {
          events.push({
            id: event.id,
            title: event.title,
            start: eventStart,
            end: eventEnd,
            allDay: event.allDay,
            type: event.type,
            color: event.color || '#8ab4f8',
          });
        }
      });
    }

    // Show tasks with due dates directly from db.tasks (single source of truth)
    if (tasks) {
      tasks.forEach((task) => {
        if (task.dueDate && !task.completed) {
          const taskDate = new Date(task.dueDate);

          // Only include tasks that fall within the current view
          if (taskDate >= rangeStart && taskDate <= rangeEnd) {
            events.push({
              id: task.id,
              title: `📋 ${task.title}`,
              start: taskDate,
              end: taskDate,
              allDay: true,
              type: 'task',
              color: '#ff6b6b',
            });
          }
        }
      });
    }

    return events;
  }, [calendarEvents, tasks, currentDate, view]);

  const handleCreateEvent = useCallback(() => {
    setSelectedEvent(null);
    setNewEventTitle('');
    setNewEventDate(format(new Date(), 'yyyy-MM-dd'));
    setNewEventStartTime('09:00');
    setNewEventEndTime('10:00');
    setIsAllDay(false);
    setCreateAsTask(false);
    setShowEventModal(true);
  }, []);

  const handleSaveEvent = useCallback(async () => {
    if (!newEventTitle.trim() || !newEventDate) return;

    const startDate = isAllDay
      ? new Date(newEventDate).getTime()
      : new Date(`${newEventDate}T${newEventStartTime}`).getTime();

    const endDate = isAllDay
      ? new Date(newEventDate).getTime()
      : new Date(`${newEventDate}T${newEventEndTime}`).getTime();

    // Validate that end time is after start time
    if (!isAllDay && endDate <= startDate) {
      alert('End time must be after start time');
      return;
    }

    if (selectedEvent?.id) {
      // Update existing event
      await db.calendar.update(selectedEvent.id, {
        title: newEventTitle,
        startDate,
        endDate,
        allDay: isAllDay,
        updatedAt: Date.now(),
      });

      // If this is a task event, also update the linked task
      if (selectedEvent.type === 'task' && selectedEvent.linkedId) {
        await db.tasks.update(selectedEvent.linkedId, {
          title: newEventTitle.replace(/^📋\s*/, ''), // Remove emoji prefix if present
          dueDate: startDate,
        });
      }
    } else {
      // Create new event
      if (createAsTask) {
        // Create as a task only (tasks are shown on calendar from db.tasks directly)
        await db.tasks.add({
          title: newEventTitle,
          completed: false,
          priority: 'medium',
          createdAt: Date.now(),
          dueDate: startDate,
        });
      } else {
        // Create as regular calendar event
        await db.calendar.add({
          title: newEventTitle,
          startDate,
          endDate,
          allDay: isAllDay,
          type: 'custom',
          color: '#8ab4f8',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    setShowEventModal(false);
    setCreateAsTask(false);
  }, [newEventTitle, newEventDate, newEventStartTime, newEventEndTime, isAllDay, selectedEvent, createAsTask]);

  const handleDeleteEvent = useCallback(async () => {
    if (selectedEvent?.id) {
      await db.calendar.delete(selectedEvent.id);
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  }, [selectedEvent]);

  // Drag handlers - memoized for performance
  const handleDragStart = useCallback((event: CalendarEvent, type: 'move' | 'resize-top' | 'resize-bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.type !== 'custom') return; // Only allow dragging custom events

    setDraggedEvent(event);
    setIsDragging(true);
    setDragType(type);
    setDragStartY(e.clientY);
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedEvent || !dragType) return;

    e.preventDefault();
    const deltaY = e.clientY - dragStartY;
    const deltaMinutes = Math.round(deltaY / 64 * 60); // 64px per hour

    if (Math.abs(deltaMinutes) < 15) return; // Snap to 15-minute intervals

    const startDate = new Date(draggedEvent.startDate);
    const endDate = new Date(draggedEvent.endDate);

    if (dragType === 'move') {
      startDate.setMinutes(startDate.getMinutes() + deltaMinutes);
      endDate.setMinutes(endDate.getMinutes() + deltaMinutes);
    } else if (dragType === 'resize-top') {
      startDate.setMinutes(startDate.getMinutes() + deltaMinutes);
      if (startDate >= endDate) return; // Prevent invalid times
    } else if (dragType === 'resize-bottom') {
      endDate.setMinutes(endDate.getMinutes() + deltaMinutes);
      if (endDate <= startDate) return; // Prevent invalid times
    }

    setDragStartY(e.clientY);
    db.calendar.update(draggedEvent.id!, {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      updatedAt: Date.now(),
    });
  }, [isDragging, draggedEvent, dragType, dragStartY]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedEvent(null);
    setDragType(null);
    setDragStartY(0);
  }, []);

  // Memoize getEventsForDay for performance
  const getEventsForDay = useCallback((day: Date) => {
    return visibleEvents.filter(event =>
      isSameDay(new Date(event.start), day)
    );
  }, [visibleEvents]);

  // Handler to create event with pre-filled date and time
  const handleCreateEventWithTime = useCallback((date: string, startTime: string, endTime: string) => {
    setSelectedEvent(null);
    setNewEventTitle('');
    setNewEventDate(date);
    setNewEventStartTime(startTime);
    setNewEventEndTime(endTime);
    setIsAllDay(false);
    setCreateAsTask(false);
    setShowEventModal(true);
  }, []);

  // State for task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ id: number; title: string; dueDate: number } | null>(null);

  // Handler to edit an event
  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setNewEventTitle(event.title);
    setNewEventDate(format(new Date(event.startDate), 'yyyy-MM-dd'));
    setNewEventStartTime(format(new Date(event.startDate), 'HH:mm'));
    setNewEventEndTime(format(new Date(event.endDate), 'HH:mm'));
    setIsAllDay(event.allDay);
    setCreateAsTask(false);
    setShowEventModal(true);
  }, []);

  // Handler to view/edit a task (from calendar click)
  const handleTaskClick = useCallback((taskId: number, title: string, dueDate: number) => {
    setSelectedTask({ id: taskId, title, dueDate });
    setShowTaskModal(true);
  }, []);

  // Handler for month view day click
  const handleMonthDayClick = useCallback((day: Date) => {
    setCurrentDate(day);
    setView('day');
  }, []);

  // Show skeleton while loading
  if (!calendarEvents || !tasks) {
    return <CalendarPageSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white lg:ml-64">
      {/* Header */}
      <div className="border-b border-white/10">
        {/* Top row - Mobile optimized */}
        <div className="flex items-center justify-between px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 lg:px-4 py-1.5 lg:py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs lg:text-sm transition-all"
            >
              Today
            </button>

            <div className="flex items-center gap-1 lg:gap-2">
              <button
                onClick={() => {
                  if (view === 'day') setCurrentDate(subDays(currentDate, 1));
                  else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
                  else setCurrentDate(subMonths(currentDate, 1));
                }}
                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-lg lg:text-xl"
              >
                ‹
              </button>
              <button
                onClick={() => {
                  if (view === 'day') setCurrentDate(addDays(currentDate, 1));
                  else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
                  else setCurrentDate(addMonths(currentDate, 1));
                }}
                className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all text-lg lg:text-xl"
              >
                ›
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateEvent}
            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-[#8ab4f8] text-[#202124] rounded-lg text-xs lg:text-sm font-medium hover:bg-[#aecbfa] transition-all flex items-center gap-1"
          >
            <span className="text-base lg:text-lg leading-none">+</span>
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>

        {/* Second row - Title and view switcher */}
        <div className="flex items-center justify-between px-4 lg:px-8 pb-3 lg:pb-4">
          <h1 className="text-base lg:text-xl font-normal truncate">
            {view === 'day'
              ? format(currentDate, 'EEEE, MMM d, yyyy')
              : format(currentDate, 'MMMM yyyy')}
          </h1>

          {/* View switcher - visible on all screen sizes */}
          <div className="flex items-center gap-1 lg:gap-2 bg-white/5 rounded-lg p-0.5 lg:p-1">
            <button
              onClick={() => setView('day')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded text-xs lg:text-sm transition-all ${
                view === 'day' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className="hidden sm:inline">Day</span>
              <span className="sm:hidden">D</span>
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded text-xs lg:text-sm transition-all ${
                view === 'week' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className="hidden sm:inline">Week</span>
              <span className="sm:hidden">W</span>
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded text-xs lg:text-sm transition-all ${
                view === 'month' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className="hidden sm:inline">Month</span>
              <span className="sm:hidden">M</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        {view === 'day' ? (
          <DayView
            currentDate={currentDate}
            events={visibleEvents}
            calendarEvents={calendarEvents}
            isDragging={isDragging}
            draggedEvent={draggedEvent}
            onCreateEvent={handleCreateEventWithTime}
            onEditEvent={handleEditEvent}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        ) : view === 'week' ? (
          <WeekView
            weekDays={weekDays}
            calendarEvents={calendarEvents}
            isDragging={isDragging}
            draggedEvent={draggedEvent}
            onCreateEvent={handleCreateEventWithTime}
            onEditEvent={handleEditEvent}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            getEventsForDay={getEventsForDay}
          />
        ) : (
          <MonthView
            monthStart={monthStart}
            monthDays={monthDays}
            onDayClick={handleMonthDayClick}
            getEventsForDay={getEventsForDay}
          />
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 lg:px-6">
          <div className="bg-[#202124] border border-white/20 rounded-xl p-4 lg:p-6 w-full max-w-md">
            <h2 className="text-lg lg:text-xl font-normal mb-4 lg:mb-6">
              {selectedEvent ? 'Edit Event' : 'Add Event'}
            </h2>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Add title"
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-white placeholder-white/40 focus:outline-none focus:border-[#8ab4f8] text-lg"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm opacity-60 mb-2">Date</label>
                <DatePicker
                  value={newEventDate}
                  onChange={setNewEventDate}
                  placeholder="Select date"
                />
              </div>

              {!selectedEvent && (
                <div className="flex items-center gap-3 p-3 bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="createAsTask"
                    checked={createAsTask}
                    onChange={(e) => {
                      setCreateAsTask(e.target.checked);
                      if (e.target.checked) setIsAllDay(true);
                    }}
                    className="w-4 h-4 accent-[#ff6b6b]"
                  />
                  <label htmlFor="createAsTask" className="text-sm text-[#ff6b6b] font-medium">
                    Create as Task (shows in Tasks page)
                  </label>
                </div>
              )}

              {!createAsTask && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="allDay" className="text-sm">All day</label>
                </div>
              )}

              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <TimePicker
                    value={newEventStartTime}
                    onChange={setNewEventStartTime}
                    label="Start time"
                  />
                  <TimePicker
                    value={newEventEndTime}
                    onChange={setNewEventEndTime}
                    label="End time"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 px-4 py-2 hover:bg-white/5 rounded-lg transition-all"
              >
                Cancel
              </button>
              {selectedEvent && selectedEvent.type === 'custom' && (
                <button
                  onClick={handleDeleteEvent}
                  className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  Delete
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                disabled={!newEventTitle.trim() || !newEventDate}
                className="flex-1 px-4 py-2 bg-[#8ab4f8] text-[#202124] rounded-lg font-medium hover:bg-[#aecbfa] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal - when clicking on a task in calendar */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 lg:px-6">
          <div className="bg-[#202124] border border-white/20 rounded-xl p-4 lg:p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ff6b6b]/20 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <h2 className="text-lg font-medium">{selectedTask.title}</h2>
                <p className="text-sm opacity-60">
                  Due: {format(new Date(selectedTask.dueDate), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <p className="text-sm opacity-60 mb-6">
              This is a task. You can edit or complete it from the Tasks page.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 hover:bg-white/5 rounded-lg transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  router.push('/tasks');
                }}
                className="flex-1 px-4 py-2 bg-[#ff6b6b] text-white rounded-lg font-medium hover:bg-[#ff8080] transition-all"
              >
                Go to Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
