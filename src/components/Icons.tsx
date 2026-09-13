import { useId } from 'react'

/* Nav and language icons.
 *
 * Inline SVG rather than emoji or an icon font: the mockup's own vocabulary is
 * thin gold line-work (✦ ◐ ☀ ☾ ⌥), and emoji would arrive in each platform's
 * own house style — full-colour on macOS, flat on Windows, and regional-
 * indicator flags render as bare letters ("DE", "GB") on Windows entirely.
 * These inherit currentColor, so they pick up the nav's hover and active
 * colours for free, and they cost nothing to load. */

const base = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

/** Apps — four tiles. */
export const IconApps = () => (
  <svg {...base} className="nav-ico">
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </svg>
)

/** Games — a die showing three. */
export const IconGames = () => (
  <svg {...base} className="nav-ico">
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.5" />
    <circle cx="8.2" cy="8.2" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="15.8" r="1.35" fill="currentColor" stroke="none" />
  </svg>
)

/** Faith — a plain Latin cross. */
export const IconFaith = () => (
  <svg {...base} className="nav-ico">
    <path d="M12 3.2v17.6" />
    <path d="M6.6 9h10.8" />
  </svg>
)

/** Contact — an envelope. */
export const IconContact = () => (
  <svg {...base} className="nav-ico">
    <rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2.6" />
    <path d="M3.6 7.3 12 13.1l8.4-5.8" />
  </svg>
)

/** Blog — a quill. The inner vane is what stops it reading as a leaf. */
export const IconBlog = () => (
  <svg {...base} className="nav-ico">
    <path d="M20 4c-.9 7.8-6 12.3-13 12.3H5.2" />
    <path d="M4 20l7.4-7.4" />
    <path d="M20 4c-5.9 1-9.9 3.9-12 8.6" />
  </svg>
)

/** The hero ornament: a thin Latin cross, drawn as one filled outline so the
 *  bars keep an even hairline weight at every size. Purely decorative — the
 *  heading beneath it carries the meaning, so it is hidden from assistive
 *  technology rather than given a label nobody needs read aloud. */
export const HeroCross = () => (
  <svg
    className="hero__cross"
    viewBox="0 0 56 84"
    role="presentation"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M26 0 h4 v22 h18 v4 h-18 v58 h-4 v-58 h-18 v-4 h18 z"
      fill="currentColor"
    />
  </svg>
)

/* --- flags ---------------------------------------------------------------- */

/** German tricolour. */
export function FlagDE() {
  const id = useId()
  return (
    <svg className="flag" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" focusable="false">
      <clipPath id={id}>
        <rect width="20" height="14" rx="2.5" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="20" height="14" fill="#000000" />
        <rect y="4.667" width="20" height="4.667" fill="#DD0000" />
        <rect y="9.333" width="20" height="4.667" fill="#FFCE00" />
      </g>
      <rect width="20" height="14" rx="2.5" fill="none" stroke="rgba(0,0,0,.22)" />
    </svg>
  )
}

/** Union Jack. Simplified: the real flag counterchanges the red saltire, which
 *  is invisible at 20px and costs four extra paths to draw. */
export function FlagEN() {
  const id = useId()
  return (
    <svg className="flag" viewBox="0 0 20 14" width="20" height="14" aria-hidden="true" focusable="false">
      <clipPath id={id}>
        <rect width="20" height="14" rx="2.5" />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect width="20" height="14" fill="#012169" />
        <path d="M0 0 L20 14 M20 0 L0 14" stroke="#FFFFFF" strokeWidth="2.9" />
        <path d="M0 0 L20 14 M20 0 L0 14" stroke="#C8102E" strokeWidth="1.5" />
        <path d="M10 0 V14 M0 7 H20" stroke="#FFFFFF" strokeWidth="4.6" />
        <path d="M10 0 V14 M0 7 H20" stroke="#C8102E" strokeWidth="2.7" />
      </g>
      <rect width="20" height="14" rx="2.5" fill="none" stroke="rgba(0,0,0,.22)" />
    </svg>
  )
}
