import { useState } from 'react'
import './Calendar.css'

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

/* Returns the calendar grid: array of day objects (or null for empty cells) */
const buildCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  // Convert to Mon-first: Sun becomes 6, Mon becomes 0
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []

  // Previous month trailing days
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, type: 'prev' })
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, type: 'current' })
  }

  // Next month leading days — fill to complete last row
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, type: 'next' })
    }
  }

  return cells
}

const Calendar = () => {
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected]   = useState(today.getDate())

  const cells = buildCalendarDays(viewYear, viewMonth)

  const goToPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelected(null)
  }

  const goToNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelected(null)
  }

  const isToday = (cell) =>
    cell.type === 'current' &&
    cell.day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear === today.getFullYear()

  const isSelected = (cell) =>
    cell.type === 'current' && cell.day === selected

  return (
    <div className="cal">
      {/* Header */}
      <div className="cal__header">
        <span className="cal__month-label">
          {MONTHS[viewMonth].toUpperCase()} {viewYear}
        </span>
        <div className="cal__nav">
          <button className="cal__nav-btn" onClick={goToPrev} id="cal-prev-btn" aria-label="Previous month">
            ‹
          </button>
          <button className="cal__nav-btn" onClick={goToNext} id="cal-next-btn" aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="cal__grid">
        {DAYS_OF_WEEK.map(d => (
          <span key={d} className="cal__dow">{d}</span>
        ))}

        {/* Day cells */}
        {cells.map((cell, i) => (
          <button
            key={i}
            id={cell.type === 'current' ? `cal-day-${cell.day}` : undefined}
            className={[
              'cal__day',
              cell.type !== 'current' ? 'cal__day--faded' : '',
              isToday(cell)    ? 'cal__day--today'    : '',
              isSelected(cell) && !isToday(cell) ? 'cal__day--selected' : '',
            ].join(' ')}
            onClick={() => cell.type === 'current' && setSelected(cell.day)}
            tabIndex={cell.type === 'current' ? 0 : -1}
          >
            {cell.day}
          </button>
        ))}
      </div>

      {/* Footer: selected date */}
      {selected && (
        <div className="cal__footer">
          <span className="cal__footer-dot" />
          <span className="cal__footer-text">
            {selected} {MONTHS[viewMonth]} {viewYear}
          </span>
        </div>
      )}
    </div>
  )
}

export default Calendar
