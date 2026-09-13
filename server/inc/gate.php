<?php
/**
 * The gate.
 *
 * Nothing of the site exists for a visitor who has not answered the question.
 * The built shell lives in /app, which Apache denies outright; index.php reads
 * it from disk and prints it only once this file says so. The JS bundle and the
 * media sit behind a cookie check in .htaccess — see gate_asset_key().
 *
 * Two cookies are minted together on success:
 *
 *   sch_pass  expiry + HMAC of that expiry. PHP verifies it properly.
 *   sch_k     a fixed high-entropy string, checked by mod_rewrite in front of
 *             /assets and /media. Apache can pattern-match a cookie but cannot
 *             verify an HMAC, so this is a bearer token. It buys native static
 *             serving — gzip, ETags, immutable caching — instead of pushing
 *             every asset through PHP.
 *
 * Neither is a secret worth much: anyone through the gate can hand their cookies
 * to someone else, exactly as they could tell them the answer. The gate is a
 * threshold, not a vault. What it does guarantee is that the content is never
 * sent to a client that has not passed it.
 */

declare(strict_types=1);

require_once __DIR__ . '/secrets.php';

const GATE_COOKIE = 'sch_pass';
const GATE_ASSET_COOKIE = 'sch_k';
const GATE_DENIED_COOKIE = 'sch_no';

const GATE_TTL = 180 * 24 * 3600;   // remember a visitor for half a year
const GATE_WINDOW = 3600;           // rate-limit window
const GATE_MAX_FAILS = 15;          // wrong answers per IP per window
const GATE_MAX_LEN = 200;           // longer than this is not an answer
const GATE_STATE = __DIR__ . '/state';

/* --- the token ----------------------------------------------------------- */

function gate_token(int $expires): string
{
    return $expires . '.' . hash_hmac('sha256', (string) $expires, GATE_SECRET);
}

function gate_token_valid(string $token): bool
{
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return false;
    }
    [$expires, $sig] = $parts;
    if (!ctype_digit($expires) || (int) $expires < time()) {
        return false;
    }
    // hash_equals, not ===: this one *is* worth comparing in constant time,
    // because a forged signature is the only way past the gate without the answer.
    return hash_equals(hash_hmac('sha256', $expires, GATE_SECRET), $sig);
}

function gate_unlocked(): bool
{
    $c = $_COOKIE[GATE_COOKIE] ?? null;
    return is_string($c) && $c !== '' && gate_token_valid($c);
}

/* --- the answer ---------------------------------------------------------- */

/**
 * Split an answer into comparable words.
 *
 * Case and accents are folded, and every non-letter becomes a separator, so
 * `Jesus!`, `jesus-christus` and `„Jesus"` all reduce to the same words. The
 * result is compared whole-word — never as a substring, which is what keeps
 * *Antichrist* and *christlich* out.
 *
 * @return string[]
 */
function gate_words(string $raw): array
{
    $s = mb_strtolower(trim($raw), 'UTF-8');
    $s = strtr($s, [
        'ä' => 'a', 'ö' => 'o', 'ü' => 'u', 'ß' => 'ss',
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'å' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u',
        'ñ' => 'n', 'ç' => 'c', 'ý' => 'y',
    ]);
    $s = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $s) ?? '';

    $words = [];
    foreach (explode(' ', trim($s)) as $w) {
        if ($w !== '') {
            $words[] = $w;
        }
    }
    return $words;
}

function gate_answer_accepted(string $raw): bool
{
    if (trim($raw) === '' || mb_strlen($raw, 'UTF-8') > GATE_MAX_LEN) {
        return false;
    }
    $words = gate_words($raw);
    if ($words === []) {
        return false;
    }
    foreach ($words as $w) {
        if (in_array($w, GATE_ANSWERS, true)) {
            return true;
        }
    }
    // "JesusChristus" written without the space.
    return in_array(implode('', $words), GATE_ANSWERS, true);
}

/* --- rate limiting ------------------------------------------------------- */

function gate_rate_file(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    // Hashed with the secret so the state directory never holds raw addresses.
    return GATE_STATE . '/rl/' . hash('sha256', $ip . '|' . GATE_SECRET) . '.txt';
}

/** @return array{0:int,1:int} window start, failures within it */
function gate_rate_read(): array
{
    $raw = @file_get_contents(gate_rate_file());
    if ($raw === false) {
        return [time(), 0];
    }
    $parts = explode(' ', trim($raw), 2);
    $start = (int) ($parts[0] ?? 0);
    $count = (int) ($parts[1] ?? 0);
    if ($start + GATE_WINDOW < time()) {
        return [time(), 0];   // the window lapsed; start a fresh one
    }
    return [$start, $count];
}

function gate_rate_limited(): bool
{
    [, $count] = gate_rate_read();
    return $count >= GATE_MAX_FAILS;
}

function gate_rate_bump(): void
{
    [$start, $count] = gate_rate_read();
    $file = gate_rate_file();
    @mkdir(dirname($file), 0700, true);
    @file_put_contents($file, $start . ' ' . ($count + 1), LOCK_EX);
    gate_rate_gc();
}

/** Sweep lapsed counters now and then, so the directory cannot grow forever. */
function gate_rate_gc(): void
{
    if (random_int(1, 50) !== 1) {
        return;
    }
    $dir = GATE_STATE . '/rl';
    $cutoff = time() - (GATE_WINDOW * 2);
    foreach (@glob($dir . '/*.txt') ?: [] as $f) {
        if (@filemtime($f) < $cutoff) {
            @unlink($f);
        }
    }
}

/* --- granting and denying ------------------------------------------------ */

/** @return array<string,mixed> */
function gate_cookie_options(int $expires): array
{
    return [
        'expires' => $expires,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function gate_grant(): void
{
    $expires = time() + GATE_TTL;
    setcookie(GATE_COOKIE, gate_token($expires), gate_cookie_options($expires));
    setcookie(GATE_ASSET_COOKIE, GATE_ASSET_KEY, gate_cookie_options($expires));
    setcookie(GATE_DENIED_COOKIE, '', gate_cookie_options(1));   // clear any denial
}

/**
 * Mark this browser as having answered wrongly.
 *
 * A session cookie, so reloading brings the denial back rather than quietly
 * offering a fresh form. Clearing cookies defeats it — that is unavoidable and
 * not what it is for. The rate limit is what stops scripted guessing.
 */
function gate_deny(): void
{
    setcookie(GATE_DENIED_COOKIE, '1', [
        'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax',
    ]);
}

function gate_denied_earlier(): bool
{
    return ($_COOKIE[GATE_DENIED_COOKIE] ?? '') === '1';
}
