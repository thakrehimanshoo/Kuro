'use client';

import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday, startOfMonth, endOfMonth, addMonths, subMonths, addDays, subDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CalendarEvent } from '@/lib/db';
import BottomNav from '@/components/BottomNav';
import DatePicker from '@/components/DatePicker';
import TimePicker from '@/components/TimePicker';

type ViewType = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const [view, setView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);

  // Drag state
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragType, setDragType] = useState<'move' | 'resize-top' | 'resize-bottom' | null>(null);

  // Get all calendar events
  const calendarEvents = useLiveQuery(() => db.calendar.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  // Week view dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month view for mini calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for current view
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

    if (calendarEvents) {
      calendarEvents.forEach((event) => {
        events.push({
          id: event.id,
          title: event.title,
          start: new Date(event.startDate),
          end: new Date(event.endDate),
          allDay: event.allDay,
          type: event.type,
          color: event.color || '#8ab4f8',
        });
      });
    }

    if (tasks) {
      tasks.forEach((task) => {
        if (task.dueDate && !task.completed) {
          events.push({
            title: task.title,
            start: new Date(task.dueDate),
            end: new Date(task.dueDate),
            allDay: true,
            type: 'task',
            color: '#ff6b6b',
          });
        }
      });
    }

    return events;
  }, [calendarEvents, tasks]);

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setNewEventTitle('');
    setNewEventDate(format(new Date(), 'yyyy-MM-dd'));
    setNewEventStartTime('09:00');
    setNewEventEndTime('10:00');
    setIsAllDay(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;

    const startDate = isAllDay
      ? new Date(newEventDate).getTime()
      : new Date(`${newEventDate}T${newEventStartTime}`).getTime();

    const endDate = isAllDay
      ? new Date(newEventDate).getTime()
      : new Date(`${newEventDate}T${newEventEndTime}`).getTime();

    if (selectedEvent?.id) {
      // Update
      await db.calendar.update(selectedEvent.id, {
        title: newEventTitle,
        startDate,
        endDate,
        allDay: isAllDay,
        updatedAt: Date.now(),
      });
    } else {
      // Create
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

    setShowEventModal(false);
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent?.id) {
      await db.calendar.delete(selectedEvent.id);
      setShowEventModal(false);
      setSelectedEvent(null);
    }
  };

  const getEventsForDay = (day: Date) => {
    return visibleEvents.filter(event =>
      isSameDay(new Date(event.start), day)
    );
  };

  // Drag handlers
  const handleDragStart = (event: CalendarEvent, type: 'move' | 'resize-top' | 'resize-bottom', e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.type !== 'custom') return; // Only allow dragging custom events

    setDraggedEvent(event);
    setIsDragging(true);
    setDragType(type);
    setDragStartY(e.clientY);
  };

  const handleDragMove = (e: React.MouseEvent) => {
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
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedEvent(null);
    setDragType(null);
    setDragStartY(0);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a] text-white lg:ml-64">
      {/* Header */}
      <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-all"
          >
            Today
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (view === 'day') setCurrentDate(subDays(currentDate, 1));
                else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
                else setCurrentDate(subMonths(currentDate, 1));
              }}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
            >
              ‹
            </button>
            <button
              onClick={() => {
                if (view === 'day') setCurrentDate(addDays(currentDate, 1));
                else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
                else setCurrentDate(addMonths(currentDate, 1));
              }}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
            >
              ›
            </button>
          </div>

          <h1 className="text-xl font-normal">
            {view === 'day' ? format(currentDate, 'EEEE, MMMM d, yyyy') : format(currentDate, 'MMMM yyyy')}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                view === 'day' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                view === 'week' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                view === 'month' ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              Month
            </button>
          </div>

          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-[#8ab4f8] text-[#202124] rounded-lg text-sm font-medium hover:bg-[#aecbfa] transition-all"
          >
            + Create
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        {view === 'day' ? (
          // Day View
          <div className="flex h-full">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 border-r border-white/10">
              <div className="h-20 flex items-center justify-center border-b border-white/10">
                <div className="text-sm font-medium">{format(currentDate, 'EEE d')}</div>
              </div>
              {hours.map(hour => (
                <div key={hour} className="h-16 text-sm opacity-40 pr-3 text-right pt-1">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day column */}
            <div className="flex-1 overflow-y-auto">
              <div className="min-w-full">
                {/* Day header with current time indicator */}
                <div className={`h-20 flex items-center justify-center border-b border-white/10 ${
                  isToday(currentDate) ? 'bg-[#8ab4f8]/10' : ''
                }`}>
                  <div className={`w-14 h-14 flex items-center justify-center rounded-full text-2xl ${
                    isToday(currentDate) ? 'bg-[#8ab4f8] text-[#202124] font-medium' : 'text-white/60'
                  }`}>
                    {format(currentDate, 'd')}
                  </div>
                </div>

                {/* Time slots */}
                <div
                  className="relative"
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  {hours.map(hour => (
                    <div
                      key={hour}
                      className="h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => {
                        if (!isDragging) {
                          setNewEventDate(format(currentDate, 'yyyy-MM-dd'));
                          setNewEventStartTime(`${hour.toString().padStart(2, '0')}:00`);
                          setNewEventEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
                          handleCreateEvent();
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
                      <div
                        className="absolute left-0 right-0 flex items-center z-10"
                        style={{ top: `${top}px` }}
                      >
                        <div className="w-3 h-3 bg-[#ea4335] rounded-full -ml-1.5" />
                        <div className="flex-1 h-0.5 bg-[#ea4335]" />
                      </div>
                    );
                  })()}

                  {/* Events overlay */}
                  {getEventsForDay(currentDate).map((event, i) => {
                    if (event.allDay) {
                      return (
                        <div
                          key={i}
                          className="absolute top-2 left-2 right-2 px-3 py-2 rounded-lg text-sm font-medium"
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

                    return (
                      <div
                        key={i}
                        className={`absolute left-2 right-2 rounded-lg transition-opacity group ${
                          isDraggable ? 'cursor-move' : 'cursor-pointer'
                        } ${isDragging && draggedEvent?.id === event.id ? 'opacity-60' : 'hover:opacity-90'}`}
                        style={{
                          backgroundColor: event.color + '90',
                          top: `${top}px`,
                          height: `${Math.max(height, 40)}px`,
                        }}
                        onMouseDown={(e) => {
                          if (isDraggable && fullEvent) {
                            handleDragStart(fullEvent, 'move', e);
                          }
                        }}
                        onClick={(e) => {
                          if (!isDragging && event.id && fullEvent) {
                            setSelectedEvent(fullEvent);
                            setNewEventTitle(fullEvent.title);
                            setNewEventDate(format(new Date(fullEvent.startDate), 'yyyy-MM-dd'));
                            setNewEventStartTime(format(new Date(fullEvent.startDate), 'HH:mm'));
                            setNewEventEndTime(format(new Date(fullEvent.endDate), 'HH:mm'));
                            setIsAllDay(fullEvent.allDay);
                            setShowEventModal(true);
                          }
                        }}
                      >
                        {/* Resize handle - top */}
                        {isDraggable && height >= 64 && (
                          <div
                            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              if (fullEvent) handleDragStart(fullEvent, 'resize-top', e);
                            }}
                          >
                            <div className="h-1 bg-white/30 rounded-t-lg" />
                          </div>
                        )}

                        <div className="px-3 py-2">
                          <div className="font-medium text-sm truncate">{event.title}</div>
                          <div className="text-xs opacity-90 mt-0.5">
                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                          </div>
                        </div>

                        {/* Resize handle - bottom */}
                        {isDraggable && height >= 64 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              if (fullEvent) handleDragStart(fullEvent, 'resize-bottom', e);
                            }}
                          >
                            <div className="h-1 bg-white/30 rounded-b-lg" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : view === 'week' ? (
          // Week View
          <div className="flex h-full">
            {/* Time column */}
            <div className="w-16 flex-shrink-0 border-r border-white/10">
              <div className="h-16" /> {/* Spacer for header */}
              {hours.map(hour => (
                <div key={hour} className="h-16 text-xs opacity-40 pr-2 text-right pt-1">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Days columns */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex min-w-[640px]">
                {weekDays.map(day => {
                  const dayEvents = getEventsForDay(day);
                  const isTodayDate = isToday(day);

                  return (
                    <div key={day.toString()} className="flex-1 border-r border-white/10">
                      {/* Day header */}
                      <div className={`h-16 flex flex-col items-center justify-center border-b border-white/10 ${
                        isTodayDate ? 'bg-[#8ab4f8]/10' : ''
                      }`}>
                        <div className="text-xs opacity-60">{format(day, 'EEE')}</div>
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                          isTodayDate ? 'bg-[#8ab4f8] text-[#202124] font-medium' : ''
                        }`}>
                          {format(day, 'd')}
                        </div>
                      </div>

                      {/* Time slots */}
                      <div
                        className="relative"
                        onMouseMove={handleDragMove}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                      >
                        {hours.map(hour => (
                          <div
                            key={hour}
                            className="h-16 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                            onClick={() => {
                              if (!isDragging) {
                                setNewEventDate(format(day, 'yyyy-MM-dd'));
                                setNewEventStartTime(`${hour.toString().padStart(2, '0')}:00`);
                                setNewEventEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`);
                                handleCreateEvent();
                              }
                            }}
                          />
                        ))}

                        {/* Events overlay */}
                        {dayEvents.map((event, i) => {
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

                          return (
                            <div
                              key={i}
                              className={`absolute left-1 right-1 rounded text-xs transition-opacity group ${
                                isDraggable ? 'cursor-move' : 'cursor-pointer'
                              } ${isDragging && draggedEvent?.id === event.id ? 'opacity-60' : 'hover:opacity-90'}`}
                              style={{
                                backgroundColor: event.color + '80',
                                top: `${top}px`,
                                height: `${Math.max(height, 32)}px`,
                              }}
                              onMouseDown={(e) => {
                                if (isDraggable && fullEvent) {
                                  handleDragStart(fullEvent, 'move', e);
                                }
                              }}
                              onClick={() => {
                                if (!isDragging && event.id && fullEvent) {
                                  setSelectedEvent(fullEvent);
                                  setNewEventTitle(fullEvent.title);
                                  setNewEventDate(format(new Date(fullEvent.startDate), 'yyyy-MM-dd'));
                                  setNewEventStartTime(format(new Date(fullEvent.startDate), 'HH:mm'));
                                  setNewEventEndTime(format(new Date(fullEvent.endDate), 'HH:mm'));
                                  setIsAllDay(fullEvent.allDay);
                                  setShowEventModal(true);
                                }
                              }}
                            >
                              {/* Resize handle - top */}
                              {isDraggable && height >= 48 && (
                                <div
                                  className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if (fullEvent) handleDragStart(fullEvent, 'resize-top', e);
                                  }}
                                >
                                  <div className="h-0.5 bg-white/30 rounded-t" />
                                </div>
                              )}

                              <div className="px-2 py-1">
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="text-xs opacity-80">
                                  {format(event.start, 'h:mm a')}
                                </div>
                              </div>

                              {/* Resize handle - bottom */}
                              {isDraggable && height >= 48 && (
                                <div
                                  className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if (fullEvent) handleDragStart(fullEvent, 'resize-bottom', e);
                                  }}
                                >
                                  <div className="h-0.5 bg-white/30 rounded-b" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // Month View
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm opacity-60 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
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
                      className={`aspect-square border border-white/10 rounded-lg p-2 hover:bg-white/5 cursor-pointer transition-all ${
                        isTodayDate ? 'border-[#8ab4f8]' : ''
                      }`}
                      onClick={() => {
                        setCurrentDate(day);
                        setView('week');
                      }}
                    >
                      <div className={`text-sm mb-1 ${
                        isTodayDate ? 'w-6 h-6 bg-[#8ab4f8] text-[#202124] rounded-full flex items-center justify-center font-medium' : ''
                      }`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className="text-xs px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: event.color + '40', color: event.color }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs opacity-60">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-[#202124] border border-white/20 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-normal mb-6">
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

      <BottomNav />
    </div>
  );
}
