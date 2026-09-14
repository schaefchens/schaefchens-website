import { Link } from 'react-router-dom'
import { AppCard, SoonCard } from '../components/AppCard'
import { byKind } from '../content/catalogue'
import { SHOW_COMING_SOON, SHOW_FAITH } from '../content/features'
import { useApp } from '../lib/state'

export function Home() {
  const { t } = useApp()
  const apps = byKind('app')
  const games = byKind('game')

  return (
    <main>
      <section className="hero">
        {/* The dove of the Spirit. A cross here read as a memorial rather than
            as the workshop's mark — same reason the blessing carries one. */}
        <span className="hero__dove" role="presentation" aria-hidden="true">
          {'\u{1F54A}\u{FE0F}'}
        </span>
        <p className="kicker">{t.kicker}</p>
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSub}</p>
        <div className="chips">
          <span className="chip chip--accent">{t.chipFree}</span>
          <span className="chip">{t.chipPlatforms}</span>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 96 }}>
        <div className="section" id="apps">
          <div className="section__head">
            <h2>{t.appsTitle}</h2>
            <span>{t.appsNote}</span>
          </div>
          <div className="grid">
            {apps.map((e) => (
              <AppCard key={e.id} entry={e} />
            ))}
            {SHOW_COMING_SOON && <SoonCard kind="app" />}
          </div>
        </div>

        <div className="section" id="games">
          <div className="section__head">
            <h2>{t.gamesTitle}</h2>
            <span>{t.gamesNote}</span>
          </div>
          <div className="grid">
            {games.map((e) => (
              <AppCard key={e.id} entry={e} />
            ))}
            {SHOW_COMING_SOON && <SoonCard kind="game" />}
          </div>
        </div>

        <div className="panel panel--split" id="about">
          <div className="about__portrait">
            <img src="/avatar.webp" alt="" width={216} height={216} />
            <ul className="ticks">
              {t.aboutFacts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="kicker">{t.aboutKicker}</p>
            <h2>{t.aboutTitle}</h2>
            <p>{t.aboutBody}</p>
            <p>{t.aboutBody2}</p>
          </div>
        </div>

        {SHOW_FAITH && (
          <div className="faith-teaser" id="glaube">
            <p className="kicker">{t.faithKicker}</p>
            <h2>{t.faithTitle}</h2>
            <p>{t.faithBody}</p>
            <div className="cta-row">
              <Link className="btn-solid" to="/glaube">
                {t.faithCta}
              </Link>
              <a className="btn-outline" href="https://blog.schaefchens.de" target="_blank" rel="noreferrer noopener">
                {t.blogCta}
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
