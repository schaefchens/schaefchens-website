import { Link } from 'react-router-dom'
import type { Entry } from '../content/catalogue'
import { useApp } from '../lib/state'

/** One tile in the Apps or Games grid. */
export function AppCard({ entry }: { entry: Entry }) {
  const { lang, t } = useApp()
  const c = entry[lang]

  const inner = (
    <>
      <div className="card__art" style={{ background: entry.art }}>
        <img className="card__icon" src={entry.icon} alt="" loading="lazy" width={96} height={96} />
        <span className="card__badge">{c.badge}</span>
      </div>
      <div className="card__body">
        <span className="card__name">{c.name}</span>
        <span className="card__tagline">{c.tagline}</span>
        <span className="card__foot">{entry.soon ? t.soonLine : t.chipPlatforms}</span>
      </div>
    </>
  )

  if (entry.soon) return <div className="card card--soon">{inner}</div>

  return (
    <Link className="card" to={`/app/${entry.id}`}>
      {inner}
    </Link>
  )
}

/** The dimmed "something else is coming" tile that pads out a thin grid. */
export function SoonCard({ kind }: { kind: 'app' | 'game' }) {
  const { t } = useApp()
  return (
    <div className="card card--soon">
      <div
        className="card__art"
        style={{
          background:
            kind === 'app'
              ? 'linear-gradient(150deg,#26304f 0%,#3b4670 100%)'
              : 'linear-gradient(150deg,#3a3350 0%,#55486e 100%)',
        }}
      >
        <span className="card__glyph" aria-hidden="true">
          ✦
        </span>
        <span className="card__badge">{t.soonBadge}</span>
      </div>
      <div className="card__body">
        <span className="card__name">{t.soonName}</span>
        <span className="card__tagline">{t.soonTagline}</span>
        <span className="card__foot">{t.soonLine}</span>
      </div>
    </div>
  )
}
