import { POLYFORM_NC_URL, type Entry } from '../content/catalogue'
import { useApp } from '../lib/state'

/** The install row on a detail page: the web app, plus Play where it exists. */
export function InstallButtons({ entry }: { entry: Entry }) {
  const { t } = useApp()

  return (
    <div className="installs">
      {entry.web && (
        <a className="install install--primary" href={entry.web} target="_blank" rel="noreferrer noopener">
          <span className="install__icon" aria-hidden="true">
            ✦
          </span>
          <span className="install__text">
            <span className="install__small">{t.instWeb[1]}</span>
            <span className="install__label">{t.instWeb[0]}</span>
          </span>
        </a>
      )}

      {entry.playAlpha && (
        <a className="install" href={entry.playAlpha} target="_blank" rel="noreferrer noopener">
          <span className="install__icon" aria-hidden="true">
            ◉
          </span>
          <span className="install__text">
            <span className="install__small">{t.instAndroid[1]}</span>
            <span className="install__label">{t.instAndroid[0]}</span>
          </span>
        </a>
      )}
    </div>
  )
}

/** Source link and licence line beneath the install row. */
export function SourceLine({ entry }: { entry: Entry }) {
  const { t } = useApp()

  return (
    <div className="srcline">
      {entry.github && (
        <a className="srcline__btn" href={entry.github} target="_blank" rel="noreferrer noopener">
          <span aria-hidden="true" style={{ fontFamily: 'Newsreader, serif', fontSize: 17 }}>
            ⌥
          </span>
          {t.sourceCta}
        </a>
      )}
      {/* Only the PolyForm line leads anywhere — "all rights reserved" has no
          document to point at. */}
      {entry.licence === 'polyform-nc' ? (
        <a className="srcline__lic" href={POLYFORM_NC_URL} target="_blank" rel="noreferrer noopener">
          {t.licenceLine}
        </a>
      ) : (
        <span>{t.licenceProprietary}</span>
      )}
    </div>
  )
}
