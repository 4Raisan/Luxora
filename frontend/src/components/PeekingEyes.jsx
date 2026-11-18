import React, { useState, useEffect, useId } from 'react'
import './PeekingEyes.css'

/**
 * Half-Face Robot Peeker (Appears from behind the password text box)
 * Shows ONLY the top half of the robot face (smooth pearlescent white dome + glossy black visor
 * with glowing cyan digital LED eyes that track keystrokes in real time).
 * Has no body/torso, emerging smoothly from behind the top border of the password box.
 */
const PeekingEyes = ({
  isActive = false,
  textLength = 0,
  isPasswordVisible = false,
  position = 'left',
  className = '',
}) => {
  const uid = useId().replace(/:/g, '')
  const whiteId = `robotWhite3D-${uid}`
  const visorId = `robotVisor-${uid}`
  const cyanGlowId = `robotCyanGlow-${uid}`
  const cyanBloomId = `robotCyanBloom-${uid}`
  const shadowId = `robotShadow-${uid}`

  const [blink, setBlink] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Digital LED eye blink cycle (disabled under reduced motion)
  useEffect(() => {
    if (!isActive || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let resetTimer = null
    let secondTimer = null
    let thirdTimer = null
    const triggerBlink = () => {
      setBlink(true)
      resetTimer = setTimeout(() => setBlink(false), 160)
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.2) {
        triggerBlink()
        if (Math.random() > 0.65) {
          secondTimer = setTimeout(() => {
            setBlink(true)
            thirdTimer = setTimeout(() => setBlink(false), 160)
          }, 240)
        }
      }
    }, 3200)

    return () => {
      clearInterval(interval)
      if (resetTimer) clearTimeout(resetTimer)
      if (secondTimer) clearTimeout(secondTimer)
      if (thirdTimer) clearTimeout(thirdTimer)
    }
  }, [isActive])

  // Keypress micro-bounce on typing
  useEffect(() => {
    if (textLength > 0) {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 130)
      return () => clearTimeout(timer)
    }
  }, [textLength])

  // Precision tracking math (looking down directly into the password input)
  const maxOffset = 5.0
  const pupilX =
    position === 'left'
      ? Math.min(maxOffset, Math.max(-maxOffset, -2.0 + Math.min(textLength, 24) * 0.35))
      : Math.min(maxOffset, Math.max(-maxOffset, -4.5 + Math.min(textLength, 24) * 0.42))
  const pupilY = isPasswordVisible ? 0 : 2.5

  return (
    <div
      className={`robot-half-wrapper robot-half-wrapper--${position} ${
        isActive ? 'is-active' : ''
      } ${isPasswordVisible ? 'is-shy' : ''} ${
        isTyping ? 'is-typing' : ''
      } ${className}`}
      aria-hidden="true"
    >
      <div className="robot-half-container">
        {/* Master High-Definition Half-Head Vector SVG */}
        <svg
          viewBox="0 0 96 46"
          className="robot-half-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 3D Pearlescent White Shell Gradient */}
            <radialGradient id={whiteId} cx="50%" cy="20%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="55%" stopColor="#f3f6fa" />
              <stop offset="85%" stopColor="#e1e7f0" />
              <stop offset="100%" stopColor="#c8d2df" />
            </radialGradient>

            {/* Glossy Obsidian Visor Screen */}
            <linearGradient id={visorId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e232a" />
              <stop offset="35%" stopColor="#0f1318" />
              <stop offset="100%" stopColor="#05070a" />
            </linearGradient>

            {/* Glowing Cyan LED Eye Gradient */}
            <radialGradient id={cyanGlowId} cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#67e8f9" />
              <stop offset="75%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </radialGradient>

            {/* Cyan LED Bloom Filter */}
            <filter id={cyanBloomId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Studio Drop Shadow */}
            <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* ── 1. Top Half-Head Dome (Sliced Flush at Bottom) ── */}
          <g className="robot-half-head" filter={`url(#${shadowId})`}>
            {/* Smooth Pearlescent White Capsule Dome */}
            <path
              d="M 10 46 C 10 14, 86 14, 86 46 Z"
              fill={`url(#${whiteId})`}
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />

            {/* Top Curved Specular Glint */}
            <ellipse cx="48" cy="16" rx="26" ry="5" fill="#ffffff" opacity="0.85" />

            {/* ── 2. Curved Glossy Obsidian Screen Visor ── */}
            <path
              d="M 18 46 C 18 20, 78 20, 78 46 Z"
              fill={`url(#${visorId})`}
              stroke="#0f172a"
              strokeWidth="0.8"
            />

            {/* Visor Specular Glass Glint Line */}
            <path
              d="M 22 28 C 32 22, 64 22, 74 28"
              fill="none"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* ── 3. Glowing Cyan LED Eyes Overlay ── */}
            {!isPasswordVisible && (
              <g
                filter={`url(#${cyanBloomId})`}
                style={{
                  transform: `translate(${pupilX}px, ${pupilY}px)`,
                  transition: 'transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <g
                  className={`robot-led-eyes ${blink ? 'is-blinking' : ''}`}
                  style={{ transformOrigin: '48px 33px' }}
                >
                  {/* Left Cyan LED Eye (Curved Crescent Oval) */}
                  <ellipse
                    cx="34"
                    cy="34"
                    rx="6.8"
                    ry="5.2"
                    fill={`url(#${cyanGlowId})`}
                    transform="rotate(-8 34 34)"
                  />
                  {/* Left Eye High-Intensity Core Spot */}
                  <ellipse cx="34" cy="33.2" rx="4.2" ry="2.6" fill="#ffffff" transform="rotate(-8 34 34)" />

                  {/* Right Cyan LED Eye (Curved Crescent Oval) */}
                  <ellipse
                    cx="62"
                    cy="34"
                    rx="6.8"
                    ry="5.2"
                    fill={`url(#${cyanGlowId})`}
                    transform="rotate(8 62 34)"
                  />
                  {/* Right Eye High-Intensity Core Spot */}
                  <ellipse cx="62" cy="33.2" rx="4.2" ry="2.6" fill="#ffffff" transform="rotate(8 62 34)" />
                </g>
              </g>
            )}

            {/* When password is revealed in cleartext: Cyan LED Eyes squint into shy smiling arcs (> <) */}
            {isPasswordVisible && (
              <g className="robot-shy-eyes" filter={`url(#${cyanBloomId})`}>
                <path
                  d="M 28 35 Q 34 30 40 35"
                  fill="none"
                  stroke="#67e8f9"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 56 35 Q 62 30 68 35"
                  fill="none"
                  stroke="#67e8f9"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        </svg>
      </div>
    </div>
  )
}

export default PeekingEyes
