// The light palette in src/styles/tokens.css exists twice — once under
// `@media (prefers-color-scheme: light)` for the "follow the OS" setting, and
// once under `:root[data-theme="light"]` for the explicit toggle. Plain CSS
// cannot share a declaration block between the two, so this asserts they stay
// byte-identical. Editing one and forgetting the other produces a bug that only
// shows up for users whose OS theme disagrees with their chosen theme.
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')

/** Pull the declarations out of the rule whose selector line matches `head`.
 *  `head` must name the rule that directly holds the declarations — pointing it
 *  at an @media wrapper would glue the inner selector onto the first one. */
function block(head) {
  const at = css.indexOf(head)
  if (at === -1) throw new Error(`tokens.css: no rule matching ${JSON.stringify(head)}`)
  if (css.indexOf(head, at + 1) !== -1)
    throw new Error(`tokens.css: ${JSON.stringify(head)} matches more than one rule`)
  const open = css.indexOf('{', at)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css
        .slice(open + 1, i)
        .split(';')
        .map((d) => d.trim())
        .filter((d) => d.startsWith('--') || d.startsWith('color-scheme'))
        .sort()
    }
  }
  throw new Error(`tokens.css: unbalanced braces after ${JSON.stringify(head)}`)
}

const viaMedia = block(":root:not([data-theme='dark'])") // lives inside the @media rule
const viaAttr = block(":root[data-theme='light']")

const only = (a, b) => a.filter((d) => !b.includes(d))
const missingFromAttr = only(viaMedia, viaAttr)
const missingFromMedia = only(viaAttr, viaMedia)

if (missingFromAttr.length || missingFromMedia.length) {
  console.error('tokens.css: the two light palettes have drifted apart.\n')
  for (const d of missingFromAttr) console.error(`  in @media but not in [data-theme="light"]:  ${d}`)
  for (const d of missingFromMedia) console.error(`  in [data-theme="light"] but not in @media:  ${d}`)
  console.error('')
  process.exit(1)
}

console.log(`tokens.css: light palettes agree (${viaMedia.length} declarations)`)
