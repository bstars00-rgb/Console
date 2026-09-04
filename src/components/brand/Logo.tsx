/**
 * OHMYHOTEL&CO wordmark, recreated as inline SVG (the original is a raster/SVG
 * asset we do not hotlink). Refined against the original during visual QA.
 */
interface LogoProps {
  /** Overall height in px; width scales with the mark. */
  height?: number
  /** Show the "OHMYHOTEL&CO" wordmark next to / under the citrus mark. */
  withWordmark?: boolean
  /** Lay the wordmark to the right of the mark (header) vs. below (login). */
  horizontal?: boolean
  /** Wordmark text color (e.g. white on the dark sidebar block). */
  wordmarkColor?: string
  className?: string
}

export function Logo({
  height = 74,
  withWordmark = true,
  horizontal = false,
  wordmarkColor = '#4a4a4a',
  className,
}: LogoProps) {
  const markSize = withWordmark && !horizontal ? height * 0.62 : height
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: horizontal ? 'row' : 'column',
        alignItems: 'center',
        gap: horizontal ? 7 : 6,
      }}
    >
      <CitrusMark size={horizontal ? height : markSize} />
      {withWordmark && <Wordmark height={horizontal ? height * 0.42 : height * 0.16} color={wordmarkColor} />}
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

function Wordmark({ height, color = '#4a4a4a' }: { height: number; color?: string }) {
  // Simple text wordmark; letter-spacing approximates the original.
  return (
    <span
      style={{
        fontSize: height,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: '0.06em',
        color,
        whiteSpace: 'nowrap',
      }}
    >
      OHMYHOTEL<span style={{ color: '#EF7F29' }}>&</span>CO
    </span>
  )
}
