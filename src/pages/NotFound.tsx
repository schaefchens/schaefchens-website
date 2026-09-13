import { Link } from 'react-router-dom'
import { useApp } from '../lib/state'

export function NotFound() {
  const { t } = useApp()
  return (
    <main className="prose">
      <h1>{t.notFound}</h1>
      <p className="prose__lead">
        <Link to="/">{t.notFoundBack}</Link>
      </p>
    </main>
  )
}
