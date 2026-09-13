import { Link, useParams } from 'react-router-dom'
import { ContactForm } from '../components/ContactForm'
import { InstallButtons, SourceLine } from '../components/InstallButtons'
import { byId, ENTRIES } from '../content/catalogue'
import { useApp } from '../lib/state'
import { NotFound } from './NotFound'

export function Detail() {
  const { id } = useParams<{ id: string }>()
  const { lang, t } = useApp()
  const entry = id ? byId(id) : undefined

  if (!entry) return <NotFound />

  const c = entry[lang]
  const related = ENTRIES.filter((e) => e.id !== entry.id && !e.soon)

  return (
    <main>
      <div className="detail__hero" style={{ background: entry.art }}>
        <div className="detail__heroInner">
          <Link className="detail__back" to="/">
            {t.back}
          </Link>
          <div className="detail__id">
            <img className="detail__icon" src={entry.icon} alt="" width={112} height={112} />
            <div className="detail__titles">
              <p>{c.badge}</p>
              <h1>{c.name}</h1>
              <p className="detail__tagline">{c.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="detail__body">
        <InstallButtons entry={entry} />
        <SourceLine entry={entry} />

        {c.shots && c.shots.length > 0 && (
          <>
            <h2 className="sr-only">{t.screenshots}</h2>
            <div className={entry.shotAspect === 'landscape' ? 'shots shots--landscape' : 'shots'}>
              {c.shots.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${c.name} — ${t.screenshots} ${i + 1}`}
                  loading="lazy"
                  width={540}
                  height={entry.shotAspect === 'landscape' ? 304 : 960}
                />
              ))}
            </div>
          </>
        )}

        <div className="detail__cols">
          <div>
            <h2>{t.about}</h2>
            <p>{c.body}</p>

            <blockquote className="quote">
              {c.verse}
              <footer>{c.verseRef}</footer>
            </blockquote>

            <h3>{t.features}</h3>
            <ul className="ticks">
              {c.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <aside className="aside">
            <h3>{t.info}</h3>
            <dl className="meta">
              {c.meta.map(([k, v]) => (
                <div className="meta__row" key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <div className="support" id="support">
          <div>
            <p className="kicker">{t.supKicker}</p>
            <h2>{t.supTitle}</h2>
            <p>{t.supBody}</p>
          </div>
          <ContactForm about={entry.id} />
        </div>

        <h2 style={{ margin: '64px 0 22px', fontFamily: 'Newsreader, serif', fontSize: 26, fontWeight: 500 }}>
          {t.more}
        </h2>
        <div className="related">
          {related.map((e) => (
            <Link key={e.id} to={`/app/${e.id}`}>
              <img src={e.icon} alt="" loading="lazy" width={54} height={54} />
              <span className="related__text">
                <span className="related__name">{e[lang].name}</span>
                <span className="related__badge">{e[lang].badge}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
