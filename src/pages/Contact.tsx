import { Link } from 'react-router-dom'
import { ContactForm } from '../components/ContactForm'
import { useApp } from '../lib/state'

export function Contact() {
  const { t } = useApp()
  const cards: [string, string][] = [
    [t.contactEmail, 'app.support@schaefchens.de'],
    [t.contactSource, 'github.com/schaefchens'],
    [t.contactReply, t.contactReplyValue],
  ]

  return (
    <main className="prose prose--wide">
      <Link className="detail__back" to="/">
        {t.back}
      </Link>
      <p className="kicker" style={{ marginTop: 22 }}>
        {t.navContact}
      </p>
      <h1 style={{ marginTop: 0 }}>{t.contactTitle}</h1>
      <p className="prose__lead">{t.contactLead}</p>

      <div className="contact__grid">
        <div className="contact__form">
          <ContactForm withConsent />
        </div>
        <div className="contact__cards">
          {cards.map(([k, v]) => (
            <div className="contact__card" key={k}>
              <p>{k}</p>
              <p>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
