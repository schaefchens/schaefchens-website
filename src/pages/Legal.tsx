import { Link } from 'react-router-dom'
import { useApp } from '../lib/state'
import type { Section } from '../i18n'

function LegalPage({ title, blocks }: { title: string; blocks: Section[] }) {
  const { t } = useApp()
  return (
    <main className="prose">
      <Link className="detail__back" to="/">
        {t.back}
      </Link>
      <h1>{title}</h1>
      {blocks.map((b) => (
        <section key={b.h}>
          <h2>{b.h}</h2>
          <p>{b.p}</p>
        </section>
      ))}
    </main>
  )
}

export function Imprint() {
  const { t } = useApp()
  return <LegalPage title={t.imprint} blocks={t.legalBlocks} />
}

export function Privacy() {
  const { t } = useApp()
  return <LegalPage title={t.privacy} blocks={t.privacyBlocks} />
}
