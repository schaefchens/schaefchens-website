// Loads the deployed site in a headless browser and captures each page, so a
// human (or Claude) can see what actually renders rather than trusting a 200.
import puppeteer from 'puppeteer-core'

const CHROME = '/Users/css/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const SITE = process.env.SITE ?? 'https://schaefchens.de'
const OUT = process.env.OUT ?? '/tmp/shots'
const WIDTH = Number(process.env.W ?? 1280)
const HEIGHT = Number(process.env.H ?? 900)

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('requestfailed', (r) => errors.push(`requestfailed ${r.url()} ${r.failure()?.errorText}`))
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`) })

// The gate first, with no cookies at all.
await page.goto(SITE + '/', { waitUntil: 'networkidle2', timeout: 45000 })
await page.screenshot({ path: `${OUT}/00-gate.png` })
console.log('gate    :', JSON.stringify((await page.evaluate(() => document.body.innerText)).slice(0, 80)))

// Answer it the way a visitor would.
await page.type('#answer', 'Jesus')
await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2' }), page.click('button[type=submit]')])
await new Promise((r) => setTimeout(r, 800))

const pages = [['01-home', '/'], ['02-detail', '/app/bible-assistant'], ['03-faith', '/glaube'],
               ['04-contact', '/kontakt'], ['05-imprint', '/impressum']]
for (const [name, path] of pages) {
  await page.goto(SITE + path, { waitUntil: 'networkidle2', timeout: 45000 })
  await new Promise((r) => setTimeout(r, 600))
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: name === '01-home' || name === '02-detail' })
  const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim())
  console.log(`${name.padEnd(11)}: ${txt.slice(0, 90)}`)
}

console.log('\nconsole/network problems:', errors.length ? '\n  ' + [...new Set(errors)].join('\n  ') : 'none')
await browser.close()
