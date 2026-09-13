import { useRef, useState } from 'react'
import { useApp } from '../lib/state'

type Status = 'idle' | 'sending' | 'sent' | 'failed'

interface Props {
  /** Which application the message is about, when sent from a detail page. */
  about?: string
  /** The contact page adds a consent checkbox; the inline support box does not. */
  withConsent?: boolean
}

export function ContactForm({ about, withConsent = false }: Props) {
  const { t } = useApp()
  const [status, setStatus] = useState<Status>('idle')
  // Server-side we require a few seconds between render and submit. A script
  // that posts the form instantly fails this without a captcha in anyone's way.
  const openedAt = useRef(Date.now())

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'sending' || status === 'sent') return
    setStatus('sending')

    const body = new FormData(e.currentTarget)
    body.set('elapsed', String(Math.round((Date.now() - openedAt.current) / 1000)))
    if (about) body.set('about', about)

    try {
      const res = await fetch('/api/contact.php', { method: 'POST', body })
      const data: unknown = await res.json().catch(() => null)
      const ok = res.ok && typeof data === 'object' && data !== null && (data as { ok?: boolean }).ok === true
      setStatus(ok ? 'sent' : 'failed')
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <div className="form">
        <p className="form__note" role="status">
          {t.supSent}
        </p>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      {/* Honeypot. Off-screen and aria-hidden, so nothing but a bot fills it. */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <input type="text" name="name" placeholder={t.supName} autoComplete="name" required maxLength={120} />
      <input type="email" name="email" placeholder={t.supMail} autoComplete="email" required maxLength={180} />
      <textarea name="message" rows={withConsent ? 6 : 4} placeholder={t.supMsg} required maxLength={5000} />

      {withConsent && (
        <label>
          <input type="checkbox" name="consent" required />
          {t.consent}
        </label>
      )}

      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? t.supSending : t.supSend}
      </button>

      <span className={status === 'failed' ? 'form__note form__note--error' : 'form__note'} role="status">
        {status === 'failed' ? t.supFailed : t.supHint}
      </span>
    </form>
  )
}
