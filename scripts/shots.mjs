#!/usr/bin/env node
/**
 * Capture the store screenshots for the entries that have no store listing of
 * their own, straight from the live apps.
 *
 * Bible Assistant is deliberately absent: it already ships designed Play Store
 * screenshots in both languages (resources/store/), which beat anything a
 * headless browser can grab. See README, "Screenshots".
 *
 *   node scripts/shots.mjs            all apps, both languages
 *   node scripts/shots.mjs bible-quiz just that one
 *
 * Writes public/media/shots/<id>/<lang>/<n>.webp. Requires a Chromium; set
 * CHROME to override the autodetected one.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/media/shots')

const CHROME_CANDIDATES = [
  process.env.CHROME,
  '/Users/css/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean)

const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p))
if (!CHROME) {
  console.error('No Chromium found. Set CHROME=/path/to/chrome and retry.')
  process.exit(1)
}

/* A shot is a label plus an optional interaction to run before capturing.
 *
 * Clicks match on visible text, not on tag names: both games open with
 * something in the way — Bible Quiz with a "Spieltipp" modal, Walk in the
 * Spirit with a "tap to begin" splash — and a blind `click('button')` captured
 * nothing but those. `setup` runs once before the first shot. */
const APPS = [
  {
    id: 'bible-quiz',
    url: 'https://biblequiz.games.schaefchens.de/',
    // Dismiss the tip modal, and tell it not to come back.
    setup: async (p) => {
      await clickText(p, /verstanden|got it|understood/i)
      await wait(p, 800)
      // The start button is inert while the bank downloads.
      await until(p, /werden geladen|loading/i, { gone: true })
    },
    shots: [
      { name: 'start' },
      {
        name: 'question',
        act: async (p) => {
          await clickText(p, /spiel starten|start game|start quiz/i)
          await until(p, /frage\s*1|question\s*1/i)
          await wait(p, 1200)
        },
      },
      { name: 'answered', act: async (p) => { await clickAnswer(p); await wait(p, 2800) } },
    ],
  },
  {
    id: 'walk-in-the-spirit',
    url: 'https://walkinthespirit.games.schaefchens.de/',
    // Landscape-locked: captured portrait it letterboxes into a thin band.
    viewport: { width: 900, height: 506 },
    /* The menu is in the DOM within a couple of seconds, but a splash sequence
     * — "tap to begin", the studio logo, "crafted with Claude AI" — is painted
     * over it and fades on a timer. Waiting on the menu's *text* therefore
     * returns far too early and captures the overlay, which is exactly what the
     * first attempt did. There is nothing to wait on but the clock. */
    setup: async (p) => {
      // One tap dismisses "tap to begin"; two studio splashes then play on a
      // timer before the menu is uncovered. The menu's text is in the DOM the
      // whole time, behind them, so there is nothing to wait *on* — only the
      // clock. Waiting on the text is what captured the splash twice over.
      await p.mouse.click(450, 253)
      await wait(p, 16000)
    },
    shots: [
      { name: 'menu' },
      {
        name: 'worlds',
        act: async (p) => {
          await clickAnyText(p, /^(start new game|neues spiel starten|neues spiel)$/i)
          await wait(p, 3500)
        },
      },
    ],
  },
  {
    id: 'expanse-horizons',
    url: 'https://expanse.schaefchens.de/',
    shots: [{ name: 'landing' }],
  },
  {
    id: 'arche-radio',
    url: 'https://radio.schaefchens.de/',
    // Its theme follows the device until a listener picks one. The dark one,
    // Storm Ark, is the navy its icon is drawn in.
    scheme: 'dark',
    /* Nothing here taps "Tap to join live": that tap is the listener's consent
     * to load YouTube, and it would start a listening session on the live
     * station. The stage is shot as a first visitor sees it. */
    setup: async (p) => {
      await until(p, /willkommen bei arche radio|welcome to arche radio/i)
    },
    shots: [
      // A first visit opens on the welcome dialog.
      { name: 'welcome' },
      {
        name: 'live',
        act: async (p) => {
          await clickText(p, /^(los geht's|let's get started)$/i)
          await wait(p, 1500)
        },
      },
      {
        name: 'schedule',
        act: async (p) => {
          await clickText(p, /^(programm|schedule)$/i)
          // The day's plan arrives after the page, which shows "…" until then.
          await until(p, /^…$/m, { gone: true })
          // The player pins to the top on every page. Scrolled to the heading
          // alone, the plan's first rows were hidden behind it.
          await p.evaluate(() => {
            const h = [...document.querySelectorAll('h1,h2')].find((e) => /^(programm|schedule)$/i.test(e.innerText.trim()))
            if (!h) return
            h.scrollIntoView({ block: 'start' })
            const dock = document.querySelector('.stage-dock')
            if (dock) scrollBy(0, -(dock.getBoundingClientRect().bottom + 16))
          })
          await wait(p, 1500)
        },
      },
    ],
  },
]

const wait = (page, ms) => page.evaluate((n) => new Promise((r) => setTimeout(r, n)), ms)

/** Poll until the page's text matches (or stops matching), or time runs out.
 *  Fixed sleeps are why the first pass captured "questions loading" and a
 *  studio splash — both apps take an unpredictable moment to settle. */
async function until(page, re, { gone = false, timeout = 20000 } = {}) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const hit = await page.evaluate(
      (src, flags) => new RegExp(src, flags).test(document.body.innerText || ''),
      re.source, re.flags,
    )
    if (hit !== gone) return true
    await wait(page, 400)
  }
  return false
}

/** Click the smallest visible clickable whose own text matches; null if none. */
async function clickText(page, re) {
  return page.evaluate((src, flags) => {
    const rx = new RegExp(src, flags)
    const clickable = [...document.querySelectorAll('button,a,[role=button],[onclick]')]
    const hits = clickable.filter((e) => {
      const r = e.getBoundingClientRect()
      if (r.width < 20 || r.height < 12) return false
      return rx.test((e.innerText || e.textContent || '').trim())
    })
    // Smallest match: the label itself rather than a wrapper containing it.
    hits.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
      return ra.width * ra.height - rb.width * rb.height
    })
    const el = hits[0]
    if (!el) return null
    el.click()
    return (el.innerText || '').trim().slice(0, 40)
  }, re.source, re.flags)
}

/** Click by text across *all* elements, not just buttons — Walk in the Spirit's
 *  menu entries are plain divs with handlers, so the clickable-only search
 *  above finds nothing on it. Picks the smallest match to avoid the wrapper. */
async function clickAnyText(page, re) {
  return page.evaluate((src, flags) => {
    const rx = new RegExp(src, flags)
    const hits = [...document.querySelectorAll('body *')].filter((e) => {
      const r = e.getBoundingClientRect()
      if (r.width < 24 || r.height < 12) return false
      if (e.children.length > 2) return false
      return rx.test((e.innerText || e.textContent || '').trim())
    })
    hits.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
      return ra.width * ra.height - rb.width * rb.height
    })
    const el = hits[0]
    if (!el) return null
    el.click()
    return (el.innerText || '').trim().slice(0, 40)
  }, re.source, re.flags)
}

/** Bible Quiz answers are lettered buttons; pick the first one offered. */
async function clickAnswer(page) {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((e) => {
      const r = e.getBoundingClientRect()
      return r.width > 200 && r.height > 40 && /^[A-D][\s.:)]/.test((e.innerText || '').trim())
    })
    if (el) el.click()
    return el ? (el.innerText || '').trim().slice(0, 30) : null
  })
}

const only = process.argv.slice(2)
const targets = only.length ? APPS.filter((a) => only.includes(a.id)) : APPS

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })

for (const app of targets) {
  for (const lang of ['de', 'en']) {
    const dir = join(OUT, app.id, lang)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })

    // A context per language, so each run is a first visit. Pages of one
    // context share storage: Arche Radio's English shots came out in German,
    // with its welcome dialog already gone — the German run had saved both.
    const context = await browser.createBrowserContext()
    const page = await context.newPage()
    const vp = app.viewport ?? { width: 390, height: 844 }
    await page.setViewport({ ...vp, deviceScaleFactor: 2 })
    // Headless Chrome reports no dark preference, so an app that follows the
    // device would be shot in its light theme.
    if (app.scheme) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: app.scheme }])
    await page.setExtraHTTPHeaders({ 'Accept-Language': lang === 'de' ? 'de-DE,de;q=0.9' : 'en-US,en;q=0.9' })
    // i18next reads navigator.language, which the header alone does not change.
    await page.evaluateOnNewDocument((l) => {
      Object.defineProperty(navigator, 'language', { get: () => (l === 'de' ? 'de-DE' : 'en-US') })
      Object.defineProperty(navigator, 'languages', { get: () => (l === 'de' ? ['de-DE', 'de'] : ['en-US', 'en']) })
    }, lang)

    let n = 0
    try {
      await page.goto(app.url, { waitUntil: 'networkidle2', timeout: 60000 })
      await wait(page, 2500)
      if (app.setup) await app.setup(page)
      for (const shot of app.shots) {
        if (shot.act) await shot.act(page)
        const png = join(dir, `${++n}.png`)
        await page.screenshot({ path: png })
        const wide = (app.viewport?.width ?? 0) > (app.viewport?.height ?? 1)
        execFileSync('cwebp', ['-quiet', '-q', '82', '-resize', wide ? '900' : '540', '0', png, '-o', png.replace(/\.png$/, '.webp')])
        rmSync(png)
        console.log(`  ${app.id}/${lang}/${n}.webp  (${shot.name})`)
      }
    } catch (err) {
      console.error(`  ${app.id}/${lang}: FAILED — ${err.stack ?? err.message}`)
    }
    await context.close()
  }
}

console.log('\nAdd the counts to src/content/catalogue.ts — shots() takes the number per language.')

// browser.close() can hang when a page left a request in flight, and the
// captures are already on disk by here — so do not wait on it forever.
await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 5000))])
process.exit(0)
