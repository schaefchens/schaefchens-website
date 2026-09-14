import { useCallback, useEffect, useRef } from 'react'
import { useApp } from '../lib/state'

/* A screenshot viewer.
 *
 * Built on the native <dialog> rather than a hand-rolled overlay, which hands
 * us the focus trap, Escape, the top layer and ::backdrop for nothing. What is
 * left to do by hand is the paging, the swipe, and locking the page behind it —
 * showModal() does not stop the body scrolling underneath on iOS. */

interface Props {
  shots: string[]
  /** Index of the shot being shown, or null when closed. */
  index: number | null
  label: string
  onClose: () => void
  onIndex: (i: number) => void
}

const SWIPE_MIN = 40

export function Lightbox({ shots, index, label, onClose, onIndex }: Props) {
  const { lang } = useApp()
  const ref = useRef<HTMLDialogElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)

  const open = index !== null
  const count = shots.length

  const step = useCallback(
    (delta: number) => {
      if (index === null || count < 2) return
      onIndex((index + delta + count) % count)
    },
    [index, count, onIndex],
  )

  /* Drive the dialog from the prop, and keep the page behind it still. */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()

    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step])

  if (count === 0) return null

  const de = lang === 'de'
  const src = index === null ? undefined : shots[index]

  return (
    <dialog
      ref={ref}
      className="lb"
      aria-label={label}
      /* Escape and the close button both fire this. */
      onClose={onClose}
      /* The figure below stops its own clicks, so anything reaching the dialog
         itself is the backdrop. */
      onClick={onClose}
      onTouchStart={(e) => {
        const t = e.touches[0]
        touch.current = t ? { x: t.clientX, y: t.clientY } : null
      }}
      onTouchEnd={(e) => {
        const start = touch.current
        const t = e.changedTouches[0]
        touch.current = null
        if (!start || !t) return
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        // Horizontal intent only — a vertical drag should not page.
        if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1)
      }}
    >
      <button type="button" className="lb__close" onClick={onClose} aria-label={de ? 'Schliessen' : 'Close'}>
        <span aria-hidden="true">✕</span>
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            className="lb__nav lb__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              step(-1)
            }}
            aria-label={de ? 'Vorheriges Bild' : 'Previous image'}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            className="lb__nav lb__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              step(1)
            }}
            aria-label={de ? 'Nächstes Bild' : 'Next image'}
          >
            <span aria-hidden="true">›</span>
          </button>
        </>
      )}

      <figure className="lb__figure" onClick={(e) => e.stopPropagation()}>
        {src && <img className="lb__img" src={src} alt={`${label} ${(index ?? 0) + 1}`} draggable={false} />}
        {count > 1 && (
          <figcaption className="lb__count">
            {(index ?? 0) + 1} / {count}
          </figcaption>
        )}
      </figure>
    </dialog>
  )
}
