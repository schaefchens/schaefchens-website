# Architecture

The store for the Schäfchens apps and games. A small React SPA behind a
server-side gate, deployed by SFTP to Hetzner shared webspace.

This file says *why*. `README.md` says how to run it.

## The shape of the problem

Two requirements pull against each other:

1. The catalogue must not reach anyone who has not answered the question.
2. It is a SPA, and a SPA's bundle contains every word of its content.

A client-side gate satisfies neither — view-source defeats it. So the gate is
server-side, and the bundle is treated as content to be protected rather than
as inert static files.

## Layout on the server

The SFTP account is jailed to the document root, so remote `/` is the web root.

```
/                index.php    front controller: gate, then print the shell
                 .htaccess    rewrites, the cookie guard, compression, headers
                 avatar.webp  needed by the gate page itself → public
                 favicon-32.png, apple-touch-icon.png
/fonts           self-hosted woff2 → public (the gate page renders in them)
/assets          the JS/CSS bundle    → guarded by the sch_k cookie
/media           icons, screenshots   → guarded by the sch_k cookie
/shell           index.html           → Require all denied; read from disk by PHP
/inc             gate.php, secrets.php, state/  → Require all denied
/api             contact.php
```

`/fonts` and `avatar.webp` are public because the gate page needs them before
any cookie exists. They carry nothing worth hiding — the avatar is already
public on the blog.

## The gate

`server/inc/gate.php`. A correct answer mints two cookies:

**`sch_pass`** — `<expiry>.<hmac_sha256(expiry, GATE_SECRET)>`. PHP verifies it
with `hash_equals`. This is the one that decides whether `index.php` prints the
shell. Constant-time comparison matters here: forging the signature is the only
way past the gate without the answer.

**`sch_k`** — a fixed hex key from `secrets.php`, substituted into `.htaccess`
at deploy time and checked by `mod_rewrite` before `/assets` and `/media`.

Why two? Apache can pattern-match a cookie but cannot verify an HMAC. The
alternative — proxying every asset through a PHP script — means hand-rolling
MIME types, ETags, range requests and cache headers, and losing `sendfile`. The
fixed key buys native static serving instead. It is a bearer token, and that is
an honest description of what any gate cookie is: whoever holds it is through.

The guard answers **403, not a redirect**. These are subresource requests; a
redirected `<script>` tag fails in a way nobody can debug.

### Answer matching

Fold case and accents, replace every non-letter with a separator, then compare
**whole words** against the accepted list.

Whole words, not substrings, is the whole point: `str_contains($answer,
'christ')` would admit **Antichrist**, and `jesus` as a substring would admit
*Jesuiten*. Tokenising also means word order and articles stop mattering, so
"Der Herr ist Jesus Christus" passes on `jesus` alone.

The list lives in `secrets.php`, on the server, so it can be changed without a
rebuild. `christ` is accepted although in German it means "a Christian" rather
than the name — turning away a German speaker who typed it meaning *Christus*
is the worse failure.

Empty input returns the form with a hint and costs no attempt: it is a slip,
not a wrong answer. A wrong answer is final and sets a session cookie so a
reload does not quietly offer a fresh form. Clearing cookies defeats that; the
per-IP rate limit (15/hour) is what actually stops scripted guessing.

## Routing

`.htaccess` sends anything that is not a real file to `index.php`, which gates
and then prints `/shell/index.html`. React reads the path from there, so deep
links survive a reload.

**`/app` must never exist as a directory.** `/app/:id` is the detail route. A
real `/app` directory carrying `Require all denied` wins in Apache's auth
phase, which runs before `mod_rewrite` — so every detail page 403s on reload,
while in-app navigation keeps working, which is exactly the kind of bug that
ships. This is why the shell sits in `/shell`, and why `deploy.sh` asserts
`/app/bible-quiz` reaches the gate.

## Host constraints

`www99.your-server.de`, ProFTPD mod_sftp, no shell. Every remote operation has
to be expressible as an sftp batch command: no tar, no atomic directory swap.

**`/lib` cannot be created.** `mkdir /lib` returns `Permission denied` — the
chroot protects its own library directory. Hence `/inc`.

**`AllowOverride` is generous, but was verified rather than assumed.** Before
any of it was relied on, the real generated `.htaccess` was uploaded to a
throwaway directory and every directive checked: `DirectoryIndex`,
`RewriteCond %{HTTP_COOKIE}`, `[F,L]`, `Require all denied`, `<Files>`,
`<FilesMatch>`, `Header always`, `AddOutputFilterByType`, `Options -Indexes`.
An `AllowOverride` violation is a hard 500, and `<IfModule>` does **not** guard
against it — it only guards a missing module.

`AddOutputFilterByType` must list `text/javascript`, not just
`application/javascript`: that is the Content-Type this host sends for `.js`,
and listing only the other leaves the bundle uncompressed with no visible
symptom. (The same trap was hit on biblequiz.)

## Theme and language

Three theme states: no `data-theme` attribute means follow the OS; `light` and
`dark` override it. The light palette is therefore written twice — once under
`@media (prefers-color-scheme: light)` and once under `[data-theme="light"]` —
because plain CSS cannot share a declaration block between the two.
`scripts/check-tokens.mjs` fails the build if they drift apart, and runs as
part of `npm run build`.

A small inline script in `index.html` applies the stored theme before first
paint; without it the page renders dark for a frame and then flips. It
duplicates the read in `src/lib/theme.ts` — the storage key and the attribute
name are the contract between them.

## Content

`src/content/catalogue.ts` is the single registry. Add an entry and it appears
in the right grid with a detail page; there is nothing else to wire up.

Copy is taken from each project's real material — Bible Assistant's from its
Play Store listing, Bible Quiz's from its own UI strings, Walk in the Spirit's
from its README. The mockup's placeholder text described different apps and was
discarded.

Walk in the Spirit's hidden Spirit stat is deliberately absent from its
description: it is a mechanic to be discovered in play.

Expanse Horizons is the one entry whose copy was inferred from source rather
than from written material, and the one to re-check. It is also the only
proprietary entry and the only one requiring an account — which is why the
site-wide "no user accounts" claim was softened to "with one exception".

## Contact

`server/api/contact.php` requires the gate cookie, then applies a honeypot, a
minimum time on the form, and a per-IP hourly cap. It appends to
`/inc/state/messages.jsonl` **before** attempting mail, so a misconfigured
`mail()` cannot lose a message. `CONTACT_MAIL` is empty, so nothing is sent
yet; setting it is the only change needed.
