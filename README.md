# schaefchens.de

The store for the Schäfchens apps and games, at <https://schaefchens.de>.
Password-gated: nothing of the catalogue is served to a visitor who has not
answered the question at the door.

`CLAUDE.md` is the architecture map — read that for anything structural. This
file is the practical one.

## Stack

React 19 + Vite 8 + TypeScript 6, matching `bible-assistant-app`. Copy lives in
a plain typed dictionary (`src/i18n/`) rather than i18next: there are only two
languages and the text is static, so a shared `Strings` interface buys
compile-time detection of a key added to one language and forgotten in the
other, which i18next cannot do.

PHP 8.5 on Hetzner shared webspace serves the gate and the contact endpoint.

## Local dev

```
npm install
npm run dev          # Vite on :5173 — the gate is not in the loop
npm run build        # token check + tsc + vite
npm run typecheck
```

`npm run dev` serves the SPA directly, with no PHP in the loop — so you always
see the site unlocked, which is what you want while building pages.

The gate itself is only exercised against the deployed site. `npm run deploy`
verifies it on every run, and `npm run deploy:verify` re-runs those checks
alone without uploading anything.

## Deploy

```
npm run deploy         # build, upload, verify
npm run deploy:dry     # print the plan, upload nothing
npm run deploy:verify  # just the HTTP checks
```

Needs `sftp.env` (copy `sftp.env.example`) and `server/inc/secrets.php` (copy
`secrets.php.example`). Both are gitignored.

The verify step is not decoration — it asserts the gate actually holds:

```
/                        401, and contains no /assets reference and no catalogue text
/assets/<hash>.js        403 without the cookie, 200 with it, gzipped
/media/...               same
/inc/secrets.php         403
/inc/state/…             403
/shell/index.html        403
/app/bible-quiz          401  ← the deep link must reach the gate, not 403
POST /api/contact.php    403 without the cookie
```

## The gate

`server/inc/gate.php`. Two cookies are minted by a correct answer:

- `sch_pass` — expiry plus an HMAC of it, verified in PHP with `hash_equals`.
- `sch_k` — a fixed key checked by `mod_rewrite` in front of `/assets` and
  `/media`. Apache can pattern-match a cookie but cannot verify an HMAC; this
  buys native static serving (gzip, ETags, immutable caching) instead of
  proxying every asset through PHP.

Answers are compared **whole-word** after folding case and accents, so
"Der Herr ist Jesus Christus" passes on `jesus` while *Antichrist* and
*christlich* match nothing. The accepted list lives in `secrets.php` on the
server — edit it there and it takes effect at once, no rebuild.

Empty input is treated as a slip: the form returns with a hint rather than the
denial screen, and it costs no rate-limit attempt. A wrong answer is final —
there is no retry link, by design.

Neither cookie is a secret worth much: anyone through the gate can pass their
cookies on, exactly as they could pass on the answer. What the gate guarantees
is that the content is never *sent* to a client that has not answered.

## Two host constraints, learned the hard way

**`/lib` cannot be created over SFTP.** `mkdir /lib` returns `Permission
denied` — the chroot protects the jail's own library directory. The PHP
includes live in `/inc` for that reason. Do not rename it back.

**`/app` must not exist as a directory.** It is the SPA's route namespace
(`/app/bible-quiz`). A real `/app` directory carrying `Require all denied` wins
in Apache's auth phase, which runs *before* `mod_rewrite` — so every detail page
would 403 on reload or a shared link. The built shell lives in `/shell`, and
`deploy.sh` asserts `/app/bible-quiz` reaches the gate so this cannot regress.

Everything the `.htaccess` files use was verified against this vhost before
being relied on — `DirectoryIndex`, `RewriteCond %{HTTP_COOKIE}`,
`Require all denied`, `<Files>`, `<FilesMatch>`, `Header always`,
`AddOutputFilterByType`. An `AllowOverride` violation is a hard 500 that
`<IfModule>` guards do **not** prevent, so none of it was assumed.

## Where the copy comes from

Nothing here is invented marketing text.

| entry | source |
| --- | --- |
| Bible Assistant | its actual Play Store listing, `resources/store/listing-{de-DE,en-US}.md` |
| Bible Quiz | its own UI strings (`client/src/locales/*.json`) |
| Walk in the Spirit | its README |
| Expanse Horizons | read from the source; **the least certain — worth a review** |

The design mockup shipped placeholder copy describing rather different apps
(Walk in the Spirit as "a quiet journey game, no score chasing", when it is a
roguelike card-battler). That was all rewritten.

Walk in the Spirit's Spirit stat is deliberately **not** described: it is a
mechanic the player should meet in play, not read about in a shop listing.

## Screenshots

Bible Assistant uses its real Play Store screenshots, per language — better
than anything a headless browser produces.

The rest are captured from the live apps:

```
npm run shots                 # all of them, DE and EN
node scripts/shots.mjs bible-quiz
```

Both games open with something in the way (a tip modal, a splash sequence), so
the script clicks by visible text and waits on a condition rather than a fixed
delay. After capturing, update the count in `src/content/catalogue.ts` —
`shots(id, lang, n)` takes the number per language.

## Legal

Impressum and Datenschutz carry real details (Christoph Scharf, Lambsheim). The
privacy page documents the gate cookie as strictly necessary under
§ 25(2) TTDSG, which it is — it is set only after the question is answered and
holds no personal data.

Fonts are self-hosted. The mockup hotlinked Google Fonts, which is precisely
what the LG München ruling was about, and awkward on a page that also serves a
Datenschutz.

## Contact form

Every message is appended to `/inc/state/messages.jsonl`, which is denied over
HTTP — read it over SFTP. Mail is sent only when `CONTACT_MAIL` is set in
`secrets.php`; it is currently empty, so the log is the record. Writing first
and mailing second is deliberate: a bounced `mail()` must not lose a message.

Spam defence is a honeypot field, a minimum time on the form, and a per-IP
hourly cap — no captcha.
