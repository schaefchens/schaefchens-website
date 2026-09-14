/* The four projects this store lists.
 *
 * Copy is not invented: Bible Assistant's comes from its actual Play Store
 * listing (resources/store/listing-{de-DE,en-US}.md), the two games' from their
 * READMEs and their own UI strings. The mockup's placeholder text described
 * different apps than the ones that exist — see README.md, "Where the copy
 * comes from".
 *
 * Add an entry here and it appears in the right grid with a detail page; there
 * is nothing else to register. */

export type Kind = 'app' | 'game'
export type Lang = 'de' | 'en'

/** PolyForm Noncommercial 1.0.0, or closed source with no public licence. */
export type Licence = 'polyform-nc' | 'proprietary'

/** The licence text itself.
 *  No trailing slash: polyformproject.org 404s on the slashed form. */
export const POLYFORM_NC_URL = 'https://polyformproject.org/licenses/noncommercial/1.0.0'

export interface Localised {
  name: string
  badge: string
  tagline: string
  body: string
  features: string[]
  verse: string
  verseRef: string
  /** Rendered as a definition list in the detail sidebar. */
  meta: ReadonlyArray<readonly [string, string]>
  /** Absolute URLs under /media/shots. Omit for entries with no screenshots. */
  shots?: string[]
}

export interface Entry {
  id: string
  kind: Kind
  /** CSS gradient behind the icon on the card and the detail hero. */
  art: string
  icon: string
  licence: Licence
  github?: string
  /** Installable web app. */
  web?: string
  /** Play Store *closed test* opt-in. The public /store/apps/details URL 404s
   *  for anyone not on the tester list, so this is the only link that works. */
  playAlpha?: string
  /** Announced but not yet reachable — renders as a dimmed card with no link. */
  soon?: boolean
  /** Screenshot orientation. Walk in the Spirit is landscape-locked, so a
   *  portrait frame would letterbox it into a thin band. Defaults to portrait. */
  shotAspect?: 'portrait' | 'landscape'
  de: Localised
  en: Localised
}

const ART = {
  bible: 'linear-gradient(150deg,#2c3a6e 0%,#4a5aa0 55%,#8e7bb5 100%)',
  spirit: 'linear-gradient(150deg,#1f4d45 0%,#2f7a63 55%,#c9a24a 100%)',
  quiz: 'linear-gradient(150deg,#5c2340 0%,#93395a 50%,#d8b25c 100%)',
  expanse: 'linear-gradient(150deg,#24404f 0%,#356070 55%,#7fa8b8 100%)',
} as const

const shots = (id: string, lang: Lang, n: number): string[] =>
  Array.from({ length: n }, (_, i) => `/media/shots/${id}/${lang}/${i + 1}.webp`)

export const ENTRIES: Entry[] = [
  {
    id: 'bible-assistant',
    kind: 'app',
    art: ART.bible,
    icon: '/media/icons/bible-assistant.webp',
    licence: 'polyform-nc',
    github: 'https://github.com/schaefchens/bible-assistant',
    web: 'https://bibleassistant.apps.schaefchens.de/?install=1',
    playAlpha: 'https://play.google.com/apps/testing/de.schaefchens.apps.bibleassistant',
    de: {
      name: 'Bible Assistant',
      badge: 'App',
      tagline: 'Bibel hören, lesen und behalten — per Sprache gesteuert, auch offline.',
      body:
        'Du sagst, was du hören willst — „Lies Johannes 3,16" oder „Erzähl mir die Geschichte ' +
        'vom verlorenen Sohn" — und der Abschnitt wird laut gelesen, Wort für Wort mitmarkiert. ' +
        'Und wenn du lieber selbst liest: Es ist genauso eine ruhige, schön gesetzte Lese-Bibel.',
      features: [
        'Stelle ansagen oder eintippen — der Abschnitt wird vorgelesen',
        'Wort-für-Wort-Markierung, damit Auge und Ohr zusammenbleiben',
        'Freihändig-Modus mit fünf riesigen Flächen — für Autofahrt, Küche und Nachttisch',
        'Fragen in eigenen Worten statt Stellen auswendig kennen',
        'Karten und Tafeln, um Verse zu behalten und nach Thema zu ordnen',
        'Acht Übersetzungen, der Bibeltext liegt offline auf dem Gerät',
        'Kein Konto: zwölf Wörter beim ersten Start, sonst nichts',
      ],
      verse: 'Dein Wort ist meines Fußes Leuchte und ein Licht auf meinem Wege.',
      verseRef: 'Psalm 119,105',
      meta: [
        ['Kategorie', 'Bibel & Studium'],
        ['Plattformen', 'Android · Web'],
        ['Preis', 'Kostenlos'],
        ['Sprachen', 'Deutsch, Englisch'],
        ['Übersetzungen', '8'],
        ['Offline', 'Bibeltext und Lesen'],
        ['Konto', 'Nicht nötig'],
      ],
      shots: shots('bible-assistant', 'de', 4),
    },
    en: {
      name: 'Bible Assistant',
      badge: 'App',
      tagline: 'Hear, read and keep the Bible — voice-driven, hands-free, offline.',
      body:
        'Say what you want to hear — "Read John 3:16" or "Tell me the story of the lost son" — ' +
        'and the passage is read aloud, every word highlighted as it goes. And when you would ' +
        'rather read for yourself, it is just as much a quiet, well-set reading Bible.',
      features: [
        'Say a passage, or type it — and it is read aloud',
        'Word-by-word highlighting, so your eye stays with your ear',
        'Hands-free mode with five enormous zones — for the car, the kitchen, the bedside table',
        'Ask in your own words instead of knowing the reference',
        'Cards and boards, to keep verses and group them by theme',
        'Eight translations, with the Bible text held offline on the device',
        'No account: twelve words on first run, and nothing else',
      ],
      verse: 'Your word is a lamp to my feet and a light to my path.',
      verseRef: 'Psalm 119:105',
      meta: [
        ['Category', 'Bible & study'],
        ['Platforms', 'Android · Web'],
        ['Price', 'Free'],
        ['Languages', 'German, English'],
        ['Translations', '8'],
        ['Offline', 'Bible text and reading'],
        ['Account', 'Not required'],
      ],
      shots: shots('bible-assistant', 'en', 4),
    },
  },

  {
    id: 'expanse-horizons',
    kind: 'app',
    art: ART.expanse,
    icon: '/media/icons/expanse-horizons.webp',
    licence: 'proprietary',
    web: 'https://expanse.apps.schaefchens.de/?install=1',
    de: {
      name: 'Expanse Horizons',
      badge: 'App',
      tagline: 'Ein ruhiger Ort für kurze Gedanken und Eindrücke.',
      body:
        'Expanse Horizons ist ein Ort für kurze Eindrücke — aufschreiben, sammeln und lesen, ' +
        'was andere geteilt haben. Anders als die übrigen Anwendungen hier braucht Expanse ' +
        'ein Konto, weil Beiträge zwischen Geräten und Personen geteilt werden.',
      features: [
        'Kurze Eindrücke schreiben und teilen',
        'Ein eigener Feed und ein Bereich zum Entdecken',
        'Läuft im Browser, installierbar als App',
        'Konto erforderlich',
      ],
      shots: shots('expanse-horizons', 'de', 1),
      verse: 'Ein jeglicher sei gesinnt, wie Jesus Christus auch war.',
      verseRef: 'Philipper 2,5',
      meta: [
        ['Kategorie', 'Austausch'],
        ['Plattformen', 'Web'],
        ['Preis', 'Kostenlos'],
        ['Konto', 'Erforderlich'],
        ['Quellcode', 'Nicht veröffentlicht'],
      ],
    },
    en: {
      name: 'Expanse Horizons',
      badge: 'App',
      tagline: 'A quiet place for short thoughts and impressions.',
      body:
        'Expanse Horizons is a place for short impressions — write them down, collect them, ' +
        'and read what others have shared. Unlike the other applications here, Expanse needs ' +
        'an account, because posts are shared across devices and between people.',
      features: [
        'Write and share short impressions',
        'Your own feed, and a place to explore',
        'Runs in the browser, installable as an app',
        'Account required',
      ],
      shots: shots('expanse-horizons', 'en', 1),
      verse: 'Let this mind be in you, which was also in Christ Jesus.',
      verseRef: 'Philippians 2:5',
      meta: [
        ['Category', 'Sharing'],
        ['Platforms', 'Web'],
        ['Price', 'Free'],
        ['Account', 'Required'],
        ['Source', 'Not published'],
      ],
    },
  },

  {
    id: 'bible-quiz',
    kind: 'game',
    art: ART.quiz,
    icon: '/media/icons/bible-quiz.webp',
    licence: 'polyform-nc',
    github: 'https://github.com/schaefchens/bible-quiz',
    web: 'https://biblequiz.games.schaefchens.de/?install=1',
    de: {
      name: 'Bible Quiz',
      badge: 'Spiel',
      tagline: 'Wer wird Bibel-Millionär? Fünfzehn Fragen, fünf Joker, Himmels-Talente.',
      body:
        'Fünfzehn Fragen quer durch die Schrift, eine Gewinnleiter aus Himmels-Talenten und die ' +
        'Wahl, jederzeit auszusteigen und das Erspielte zu behalten. Zu jeder Antwort steht die ' +
        'Stelle, an der sie nachzulesen ist.',
      features: [
        'Fünfzehn Fragen bis zur Million',
        'Fünf Joker: 50:50, Publikum, Telefon, Gnade und Bibel',
        'Aussteigen und die erspielten Talente behalten',
        'Stellenangabe zu jeder Antwort — zum Nachlesen',
        'Eigene Quizze erstellen und veröffentlichen',
        'Deutsch und Englisch, offline spielbar',
      ],
      shots: shots('bible-quiz', 'de', 3),
      verse: 'Forschet in der Schrift; denn ihr meinet, ihr habt das ewige Leben darin.',
      verseRef: 'Johannes 5,39',
      meta: [
        ['Kategorie', 'Spiel · Wissen'],
        ['Plattformen', 'Web'],
        ['Preis', 'Kostenlos'],
        ['Sprachen', 'Deutsch, Englisch'],
        ['Runde', '15 Fragen'],
        ['Konto', 'Nicht nötig'],
      ],
    },
    en: {
      name: 'Bible Quiz',
      badge: 'Game',
      tagline: 'Who wants to be a Bible millionaire? Fifteen questions, five lifelines.',
      body:
        'Fifteen questions across the whole of scripture, a prize ladder counted in heavenly ' +
        'talents, and the choice to walk away at any point and keep what you have won. Every ' +
        'answer comes with the passage it came from.',
      features: [
        'Fifteen questions to the million',
        'Five lifelines: 50:50, ask the audience, phone a friend, grace and scripture',
        'Walk away and keep the talents you have won',
        'A scripture reference with every answer',
        'Build and publish your own quizzes',
        'German and English, playable offline',
      ],
      shots: shots('bible-quiz', 'en', 3),
      verse: 'You search the Scriptures, because you think that in them you have eternal life.',
      verseRef: 'John 5:39',
      meta: [
        ['Category', 'Game · knowledge'],
        ['Platforms', 'Web'],
        ['Price', 'Free'],
        ['Languages', 'German, English'],
        ['Round', '15 questions'],
        ['Account', 'Not required'],
      ],
    },
  },

  {
    id: 'walk-in-the-spirit',
    kind: 'game',
    art: ART.spirit,
    icon: '/media/icons/walk-in-the-spirit.webp',
    licence: 'polyform-nc',
    github: 'https://github.com/schaefchens/bible-game',
    web: 'https://walkinthespirit.games.schaefchens.de/?install=1',
    shotAspect: 'landscape',
    de: {
      name: 'Walk in the Spirit',
      badge: 'Spiel',
      tagline: 'Ein biblischer Karten-Roguelike über drei Wege, drei Helden und die Schrift.',
      body:
        'Drei Abenteuer, drei Heldenklassen und ein Deck, das mit jedem Weg wächst. ' +
        'Bibelvers-Karten verdienst du, indem du Lücken in echter Schrift füllst. Wie weit du ' +
        'kommst, hängt nicht allein davon ab, wie hart du zuschlägst — das Übrige findest du ' +
        'unterwegs heraus.',
      features: [
        'Drei Abenteuer: Am stillen Wasser, Die Straße nach Jericho, Das Tal Elah',
        'Drei Heldenklassen — Eiferer, Hirte, Kaufmann — je mit eigenem Startdeck',
        'Bibelvers-Karten, verdient durch das Füllen echter Schriftlücken',
        'Kartenkämpfe mit Deckbau, Beute und Aufstieg bis Stufe 99',
        'Koop für zwei bis drei Spieler',
        'Offline spielbar, der Fortschritt bleibt auf dem Gerät',
      ],
      shots: shots('walk-in-the-spirit', 'de', 2),
      verse: 'Wandelt im Geist, so werdet ihr die Lüste des Fleisches nicht vollbringen.',
      verseRef: 'Galater 5,16',
      meta: [
        ['Kategorie', 'Spiel · Roguelike'],
        ['Plattformen', 'Web'],
        ['Preis', 'Kostenlos'],
        ['Sprachen', 'Deutsch, Englisch'],
        ['Koop', '2–3 Spieler'],
        ['Konto', 'Nicht nötig'],
      ],
    },
    en: {
      name: 'Walk in the Spirit',
      badge: 'Game',
      tagline: 'A biblical card roguelike of three roads, three heroes and scripture.',
      body:
        'Three adventures, three hero classes, and a deck that grows with every road walked. ' +
        'Bible-verse cards are earned by filling gaps in real scripture. How far you get does ' +
        'not rest on how hard you hit alone — the rest you find out on the road.',
      features: [
        'Three adventures: Beside Still Waters, The Road to Jericho, The Valley of Elah',
        'Three hero classes — Zealot, Shepherd, Merchant — each with its own starter deck',
        'Bible-verse cards, earned by filling gaps in real scripture',
        'Card combat with deckbuilding, loot and levelling to 99',
        'Co-op for two to three players',
        'Playable offline, with progress kept on the device',
      ],
      shots: shots('walk-in-the-spirit', 'en', 2),
      verse: 'Walk in the Spirit, and ye shall not fulfil the lust of the flesh.',
      verseRef: 'Galatians 5:16',
      meta: [
        ['Category', 'Game · roguelike'],
        ['Platforms', 'Web'],
        ['Price', 'Free'],
        ['Languages', 'German, English'],
        ['Co-op', '2–3 players'],
        ['Account', 'Not required'],
      ],
    },
  },
]

export const byId = (id: string): Entry | undefined => ENTRIES.find((e) => e.id === id)
export const byKind = (kind: Kind): Entry[] => ENTRIES.filter((e) => e.kind === kind)
