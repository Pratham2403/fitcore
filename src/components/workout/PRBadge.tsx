'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DURATION, EASE, SPRING } from '@/components/ui/motion'

const SPARK_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#22C55E']
const SPARK_COUNT = 10
const SPARK_DISTANCE_PX = 28
const SPARK_SIZE_PX = 5

/** Persistent "New PR" badge that announces itself once with a short spark burst. */
export default function PRBadge() {
  const isReducedMotion = useReducedMotion()
  // Angles are fixed at mount so re-renders never re-randomise the burst
  const [sparkAngles] = useState(() =>
    Array.from({ length: SPARK_COUNT }, (_, i) => (i / SPARK_COUNT) * 2 * Math.PI + Math.random() * 0.4),
  )

  return (
    <span className="relative grid min-h-11 place-items-center flex-shrink-0">
      {!isReducedMotion && sparkAngles.map((angle, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-sm"
          style={{ width: SPARK_SIZE_PX, height: SPARK_SIZE_PX, background: SPARK_COLORS[i % SPARK_COLORS.length] }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * SPARK_DISTANCE_PX, y: Math.sin(angle) * SPARK_DISTANCE_PX, opacity: 0, scale: 0.5 }}
          transition={{ duration: DURATION.illustrative, ease: EASE.outExpo }}
        />
      ))}
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING.snappy}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
        style={{ background: '#F59E0B', color: '#000' }}
      >
        ★ PR
      </motion.span>
    </span>
  )
}
