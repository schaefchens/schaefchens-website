import { Link } from 'react-router-dom'
import { useApp } from '../lib/state'

export function Faith() {
  const { t } = useApp()
  return (
    <main className="prose">
      <Link className="detail__back" to="/">
        {t.back}
      </Link>
      <h1>{t.faithTitle}</h1>
      <p className="prose__lead">{t.faithLead}</p>
      {t.faithSections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}
      <div className="prose__verse">{t.faithVerse}</div>
    </main>
  )
}
