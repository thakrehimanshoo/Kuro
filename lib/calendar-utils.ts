// Utility functions for calendar event collision detection and layout

export interface LayoutEvent {
  id?: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: string;
  color: string;
}

export interface PositionedEvent extends LayoutEvent {
  column: number;      // Which column this event is in (0-indexed)
  totalColumns: number; // Total columns in this overlap group
}

/**
 * Checks if two events overlap in time
 */
function eventsOverlap(a: LayoutEvent, b: LayoutEvent): boolean {
  // All-day events don't overlap with timed events for layout purposes
  if (a.allDay || b.allDay) return false;

  return a.start < b.end && a.end > b.start;
}

/**
 * Calculate layout positions for overlapping events
 * Returns events with column and totalColumns properties for positioning
 */
export function calculateEventLayout(events: LayoutEvent[]): PositionedEvent[] {
  // Filter out all-day events for overlap calculation
  const timedEvents = events.filter(e => !e.allDay);
  const allDayEvents = events.filter(e => e.allDay);

  // Sort by start time, then by duration (longer first)
  const sortedEvents = [...timedEvents].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    // If same start, put longer events first
    const durationA = a.end.getTime() - a.start.getTime();
    const durationB = b.end.getTime() - b.start.getTime();
    return durationB - durationA;
  });

  // Build overlap groups
  const positioned: PositionedEvent[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < sortedEvents.length; i++) {
    if (processed.has(i)) continue;

    // Find all events that overlap with this one (directly or transitively)
    const overlapGroup: number[] = [i];
    const toCheck = [i];
    processed.add(i);

    while (toCheck.length > 0) {
      const current = toCheck.pop()!;
      for (let j = 0; j < sortedEvents.length; j++) {
        if (processed.has(j)) continue;

        // Check if j overlaps with any event in the current group
        const overlapsWithGroup = overlapGroup.some(k =>
          eventsOverlap(sortedEvents[j], sortedEvents[k])
        );

        if (overlapsWithGroup) {
          overlapGroup.push(j);
          toCheck.push(j);
          processed.add(j);
        }
      }
    }

    // Assign columns within this overlap group
    const groupEvents = overlapGroup.map(idx => sortedEvents[idx]);

    // Sort group by start time
    const sortedGroup = [...groupEvents].sort((a, b) =>
      a.start.getTime() - b.start.getTime()
    );

    // Greedy column assignment
    const columns: LayoutEvent[][] = [];

    for (const event of sortedGroup) {
      // Find the first column where this event fits
      let assignedColumn = -1;

      for (let col = 0; col < columns.length; col++) {
        const columnEvents = columns[col];
        const fitsInColumn = !columnEvents.some(e => eventsOverlap(e, event));

        if (fitsInColumn) {
          assignedColumn = col;
          columnEvents.push(event);
          break;
        }
      }

      // If no column fits, create a new one
      if (assignedColumn === -1) {
        assignedColumn = columns.length;
        columns.push([event]);
      }
    }

    // Now assign totalColumns and column to each event
    const totalColumns = columns.length;

    for (let col = 0; col < columns.length; col++) {
      for (const event of columns[col]) {
        positioned.push({
          ...event,
          column: col,
          totalColumns,
        });
      }
    }
  }

  // Add all-day events (they don't get column layout)
  for (const event of allDayEvents) {
    positioned.push({
      ...event,
      column: 0,
      totalColumns: 1,
    });
  }

  return positioned;
}

/**
 * Calculate the CSS left and width percentages for a positioned event
 */
export function getEventStyle(event: PositionedEvent): {
  left: string;
  width: string;
} {
  const widthPercent = 100 / event.totalColumns;
  const leftPercent = event.column * widthPercent;

  // Add a small gap between columns
  const gap = 2; // pixels

  return {
    left: `calc(${leftPercent}% + ${event.column > 0 ? gap / 2 : 0}px)`,
    width: `calc(${widthPercent}% - ${gap}px)`,
  };
}
