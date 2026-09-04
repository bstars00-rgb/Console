/**
 * OHMYHOTEL&CO wordmark, recreated as inline SVG (the original is a raster/SVG
 * asset we do not hotlink). Refined against the original during visual QA.
 */
interface LogoProps {
  /** Overall height in px; width scales with the mark. */
  height?: number
  /** Show the "OHMYHOTEL&CO" wordmark under the citrus mark. */
  withWordmark?: boolean
  className?: string
}

export function Logo({ height = 74, withWordmark = true, className }: LogoProps) {
  return (
    <div
      className={className}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
    >
      <CitrusMark size={withWordmark ? height * 0.62 : height} />
      {withWordmark && <Wordmark height={height * 0.16} />}
    </div>
  )
}

function CitrusMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="38" r="22" fill="#EF7F29" />
      <path
        d="M32 17c1.5-9 13-13 13-13s-1.5 11-10 13.5c1.5 1.5 2.5 3 3 5-3-1-6-3-9-5.5z"
        fill="#3FAE4A"
      />
    </svg>
  )
}

function Wordmark({ height }: { height: number }) {
  // Simple text wordmark; letter-spacing approximates the original.
  return (
    <span
      style={{
        fontSize: height,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: '0.06em',
        color: '#4a4a4a',
        whiteSpace: 'nowrap',
      }}
    >
      OHMYHOTEL<span style={{ color: '#EF7F29' }}>&</span>CO
    </span>
  )
}
