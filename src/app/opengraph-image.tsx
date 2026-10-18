import { ImageResponse } from 'next/og'

export const alt = 'FitCore — Build the physique you want without wrecking the joints you have.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Social preview card rendered at build time. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'radial-gradient(70% 90% at 80% 0%, rgba(16,185,129,0.28), #0F0F0F)',
          color: '#F5F5F5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 600 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#10B981' }} />
          FitCore
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2 }}>
            Build the physique you want
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, color: '#10B981' }}>
            without wrecking the joints you have.
          </div>
        </div>
        <div style={{ fontSize: 28, color: '#A3A3A3' }}>Constraint-aware strength training</div>
      </div>
    ),
    size,
  )
}
