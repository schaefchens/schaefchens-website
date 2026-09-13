import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { AppStateProvider } from './lib/state'
import { Contact } from './pages/Contact'
import { Detail } from './pages/Detail'
import { Faith } from './pages/Faith'
import { Home } from './pages/Home'
import { Imprint, Privacy } from './pages/Legal'
import { NotFound } from './pages/NotFound'

/** A route change should land at the top, the way a page load would. Anchors
 *  within the home page are handled by the header, which scrolls deliberately. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="shell">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app/:id" element={<Detail />} />
            <Route path="/glaube" element={<Faith />} />
            <Route path="/kontakt" element={<Contact />} />
            <Route path="/impressum" element={<Imprint />} />
            <Route path="/datenschutz" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AppStateProvider>
  )
}
