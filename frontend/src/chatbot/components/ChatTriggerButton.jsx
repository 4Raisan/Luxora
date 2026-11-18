import React, { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'lx_chatbot_btn_pos_v3'
const MARGIN = 16
const MIN_TOP = 76
const BOTTOM_OFFSET = 24

const clampPos = (x, y, width, height) => {
  const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN)
  const minY = Math.min(MIN_TOP, Math.max(MARGIN, window.innerHeight - height - BOTTOM_OFFSET))
  const maxY = Math.max(minY, window.innerHeight - height - MARGIN)
  return {
    x: Math.min(Math.max(MARGIN, x), maxX),
    y: Math.min(Math.max(minY, y), maxY),
  }
}

export function ChatTriggerButton({ onClick, isOpen }) {
  const [position, setPosition] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const suppressClickRef = useRef(false)
  const hasCustomPosRef = useRef(false)
  const ratioRef = useRef({ rx: 1, ry: 1 })
  const dragStartRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false })
  const buttonRef = useRef(null)

  const getBounds = (rect) => {
    const width = rect?.width || 150
    const height = rect?.height || 46
    const maxX = Math.max(MARGIN, window.innerWidth - width - MARGIN)
    const minY = Math.min(MIN_TOP, Math.max(MARGIN, window.innerHeight - height - BOTTOM_OFFSET))
    const maxY = Math.max(minY, window.innerHeight - height - MARGIN)
    return { width, height, minX: MARGIN, maxX, minY, maxY }
  }

  // Initialize from saved drag ratio or keep anchored bottom-right
  useEffect(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    const { width, height, minX, maxX, minY, maxY } = getBounds(rect)
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (typeof parsed.rx === 'number' && typeof parsed.ry === 'number') {
          hasCustomPosRef.current = true
          ratioRef.current = { rx: parsed.rx, ry: parsed.ry }
          const x = minX + Math.min(1, Math.max(0, parsed.rx)) * Math.max(0, maxX - minX)
          const y = minY + Math.min(1, Math.max(0, parsed.ry)) * Math.max(0, maxY - minY)
          setPosition({ x, y })
          return
        }
      } catch {
        // Fall through to bottom-right default
      }
    }
    setPosition(clampPos(window.innerWidth - width - MARGIN, window.innerHeight - height - BOTTOM_OFFSET, width, height))
  }, [])

  // Keep bottom-right default or restore proportional custom corner on viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const { width, height, minX, maxX, minY, maxY } = getBounds(rect)
      if (!hasCustomPosRef.current) {
        setPosition(clampPos(window.innerWidth - width - MARGIN, window.innerHeight - height - BOTTOM_OFFSET, width, height))
        return
      }
      const x = minX + ratioRef.current.rx * Math.max(0, maxX - minX)
      const y = minY + ratioRef.current.ry * Math.max(0, maxY - minY)
      setPosition({ x, y })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handlePointerDown = (e) => {
    if (!position || !buttonRef.current) return
    if (e.button !== 0 && e.pointerType === 'mouse') return

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false
    }
    isDraggingRef.current = false

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignore fallback
    }
  }

  const handlePointerMove = (e) => {
    if (dragStartRef.current.startX === 0 && dragStartRef.current.startY === 0) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY

    if (!isDraggingRef.current && Math.hypot(dx, dy) > 5) {
      isDraggingRef.current = true
      setIsDragging(true)
      dragStartRef.current.moved = true
    }

    if (isDraggingRef.current && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const { width, height, minX, maxX, minY, maxY } = getBounds(rect)
      const next = clampPos(dragStartRef.current.initialX + dx, dragStartRef.current.initialY + dy, width, height)
      hasCustomPosRef.current = true
      ratioRef.current = {
        rx: maxX > minX ? (next.x - minX) / (maxX - minX) : 1,
        ry: maxY > minY ? (next.y - minY) / (maxY - minY) : 1,
      }
      setPosition(next)
    }
  }

  const handlePointerUp = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignore
    }

    const wasDragging = isDraggingRef.current
    setIsDragging(false)
    isDraggingRef.current = false

    if (wasDragging) {
      suppressClickRef.current = true
      setTimeout(() => { suppressClickRef.current = false }, 50)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratioRef.current))
    }

    dragStartRef.current = { startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false }
  }

  const handlePointerCancel = () => {
    setIsDragging(false)
    isDraggingRef.current = false
    dragStartRef.current = { startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false }
  }

  const handleClick = (e) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      e.preventDefault()
      return
    }
    onClick?.()
  }

  if (isOpen) return null

  const style = position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        right: 'auto',
        touchAction: 'none'
      }
    : {
        right: `${MARGIN}px`,
        bottom: '24px',
        left: 'auto',
        top: 'auto',
        touchAction: 'none'
      }

  return (
    <button
      type="button"
      ref={buttonRef}
      className={`lx-chat-trigger lx-pulse-gold ${isDragging ? 'lx-chat-trigger--dragging' : ''}`}
      style={style}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label="Open Luxora AI Concierge (Drag to reposition)"
      title="Click to chat • Drag to move anywhere"
    >
      <div className="lx-chat-trigger__drag-grip" aria-hidden="true" title="Drag handle">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="2" cy="2" r="1.2" fill="#C9A84C" opacity="0.6"/>
          <circle cx="6" cy="2" r="1.2" fill="#C9A84C" opacity="0.6"/>
          <circle cx="2" cy="7" r="1.2" fill="#C9A84C" opacity="0.6"/>
          <circle cx="6" cy="7" r="1.2" fill="#C9A84C" opacity="0.6"/>
          <circle cx="2" cy="12" r="1.2" fill="#C9A84C" opacity="0.6"/>
          <circle cx="6" cy="12" r="1.2" fill="#C9A84C" opacity="0.6"/>
        </svg>
      </div>

      <div className="lx-chat-trigger__icon-wrap">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#C9A84C"/>
          <path d="M19 19L20 22L21 19L24 18L21 17L20 14L19 17L16 18L19 19Z" fill="#E8C96B"/>
        </svg>
        <span className="lx-chat-trigger__badge" />
      </div>
      <div className="lx-chat-trigger__text">
        <span className="lx-chat-trigger__label">AI Assistant</span>
      </div>
    </button>
  )
}

export default ChatTriggerButton
