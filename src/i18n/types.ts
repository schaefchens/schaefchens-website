/* The shape of the UI copy. Both dictionaries are typed against this, so a key
 * added to one language and forgotten in the other fails `tsc`, rather than
 * rendering `undefined` to a visitor. */

export interface Section {
  h: string
  p: string
}

export interface Strings {
  /* home */
  kicker: string
  heroTitle: string
  heroSub: string
  chipFree: string
  chipPlatforms: string

  /* nav */
  navApps: string
  navGames: string
  navFaith: string
  navContact: string
  navBlog: string

  /* grids */
  appsTitle: string
  appsNote: string
  gamesTitle: string
  gamesNote: string
  soonLine: string
  soonName: string
  soonTagline: string
  soonBadge: string

  /* about */
  aboutKicker: string
  aboutTitle: string
  aboutBody: string
  aboutBody2: string
  aboutFacts: string[]

  /* licence */
  licKicker: string
  licTitle: string
  licBody: string
  licCta: string
  licPoints: string[]
  sourceCta: string
  licenceLine: string
  licenceProprietary: string

  /* faith */
  faithKicker: string
  faithTitle: string
  faithBody: string
  faithCta: string
  blogCta: string
  faithLead: string
  faithSections: Section[]
  faithVerse: string

  /* detail */
  back: string
  about: string
  features: string
  info: string
  more: string
  screenshots: string
  instAndroid: [string, string]
  instWeb: [string, string]

  /* contact + support */
  contactTitle: string
  contactLead: string
  supKicker: string
  supTitle: string
  supBody: string
  supName: string
  supMail: string
  supMsg: string
  supSend: string
  supSending: string
  supSent: string
  supHint: string
  supFailed: string
  consent: string
  contactEmail: string
  contactSource: string
  contactReply: string
  contactReplyValue: string

  /* legal */
  imprint: string
  privacy: string
  legalBlocks: Section[]
  privacyBlocks: Section[]

  /* footer + misc */
  footTag: string
  notFound: string
  notFoundBack: string
}
