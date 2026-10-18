'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { EASE } from '@/components/ui/motion'

const REVEAL_DURATION_S = 0.6
const REVEAL_OFFSET_PX = 16

/** Fades content up once as it scrolls into view; static under reduced motion. */
export default function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET_PX }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: REVEAL_DURATION_S, ease: EASE.outExpo, delay }}
    >
      {children}
    </motion.div>
  )
}
