<?php
/**
 * Front controller. Every request that is not a real file lands here.
 *
 * Unlocked  → print the built SPA shell from /app, which Apache denies over
 *             HTTP. React reads the path and renders the right page, so deep
 *             links like /app/bible-quiz work.
 * Locked    → print the gate. The shell is never read, the bundle is never
 *             referenced, and /assets 403s anyway without the cookie.
 */

declare(strict_types=1);

require __DIR__ . '/inc/gate.php';

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Type: text/html; charset=utf-8');

/* --- language ------------------------------------------------------------ */

const GATE_LANG_COOKIE = 'sch_lang';

function gate_lang(): string
{
    $q = $_GET['lang'] ?? null;
    if ($q === 'de' || $q === 'en') {
        setcookie(GATE_LANG_COOKIE, $q, [
            'expires' => time() + 31536000, 'path' => '/', 'secure' => true, 'samesite' => 'Lax',
        ]);
        return $q;
    }
    $c = $_COOKIE[GATE_LANG_COOKIE] ?? null;
    if ($c === 'de' || $c === 'en') {
        return $c;
    }
    $accept = strtolower($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');
    return str_starts_with($accept, 'en') ? 'en' : 'de';
}

const GATE_TEXT = [
    'de' => [
        'title' => 'schäfchens.de',
        'intro' => 'Jedem der dies weiß ist der Zugang erlaubt.',
        'question' => 'Wer ist der Herr?',
        'placeholder' => 'Antwort',
        'submit' => 'Eintreten',
        'denied' => 'Dieser Ort ist nicht für dich.',
        'empty' => 'Bitte gib eine Antwort ein.',
        'throttled' => 'Zu viele Versuche. Bitte später noch einmal.',
        'switch' => 'EN',
    ],
    'en' => [
        'title' => 'schäfchens.de',
        'intro' => 'Access is granted to everyone who knows this.',
        'question' => 'Who is the Lord?',
        'placeholder' => 'Answer',
        'submit' => 'Enter',
        'denied' => 'This place is not for you.',
        'empty' => 'Please enter an answer.',
        'throttled' => 'Too many attempts. Please try again later.',
        'switch' => 'DE',
    ],
];

/* --- helpers ------------------------------------------------------------- */

function h(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * The path to return to after a correct answer.
 *
 * Taken from the request itself, never from input — and collapsed to a single
 * leading slash, because `GET //evil.example/` would otherwise turn into a
 * protocol-relative Location header and hand us an open redirect.
 */
function gate_return_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (!is_string($path) || $path === '') {
        return '/';
    }
    $path = '/' . ltrim(str_replace('\\', '/', $path), '/');
    return preg_match('~^/[\x20-\x7e]*$~', $path) === 1 ? $path : '/';
}

function serve_shell(): void
{
    $shell = __DIR__ . '/shell/index.html';
    if (!is_file($shell)) {
        http_response_code(503);
        header('Cache-Control: no-store');
        echo '<!doctype html><meta charset="utf-8"><title>schäfchens.de</title>';
        echo '<p style="font:16px system-ui;padding:2rem">Die Seite wird gerade neu aufgespielt.</p>';
        return;
    }
    // Must revalidate: the shell names content-hashed bundles, and a cached copy
    // would boot asset names a later deploy has already replaced.
    header('Cache-Control: no-cache, must-revalidate');
    readfile($shell);
}

/* --- unlocked ------------------------------------------------------------ */

if (gate_unlocked()) {
    serve_shell();
    exit;
}

/* --- the gate ------------------------------------------------------------ */

$lang = gate_lang();
$t = GATE_TEXT[$lang];
$state = gate_denied_earlier() ? 'denied' : 'ask';
$hint = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $answer = (string) ($_POST['answer'] ?? '');

    if (trim($answer) === '') {
        // A slip, not a wrong answer: no denial, and it costs no attempt.
        $state = 'ask';
        $hint = $t['empty'];
    } elseif (gate_rate_limited()) {
        $state = 'denied';
        $hint = $t['throttled'];
    } elseif (gate_answer_accepted($answer)) {
        gate_grant();
        header('Location: ' . gate_return_path(), true, 303);
        exit;
    } else {
        gate_rate_bump();
        gate_deny();
        $state = 'denied';
    }
}

http_response_code($state === 'denied' ? 403 : 401);
header('Cache-Control: no-store, must-revalidate');
$other = $lang === 'de' ? 'en' : 'de';
?>
<!doctype html>
<html lang="<?= h($lang) ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title><?= h($t['title']) ?></title>
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="preload" as="font" type="font/woff2" href="/fonts/outfit-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/newsreader-latin.woff2" crossorigin>
<style>
/* Standalone on purpose: the gate must not pull anything from /assets, which is
   exactly what a visitor at this point is not allowed to fetch. Values are the
   same tokens as src/styles/tokens.css. */
@font-face{font-family:Newsreader;font-style:normal;font-weight:300 600;font-display:swap;
  src:url(/fonts/newsreader-latin.woff2) format('woff2')}
@font-face{font-family:Outfit;font-style:normal;font-weight:300 700;font-display:swap;
  src:url(/fonts/outfit-latin.woff2) format('woff2')}
:root{--bg:#0f1426;--bg-top:#1b2444;--ink:#e9e3d6;--ink-hi:#f6f1e6;--muted:#b6ae9d;
  --faint:#8d8575;--accent:#d8b25c;--accent-tx:#d8b25c;--on-accent:#141a2e;
  --line:rgba(233,227,214,.11);--border:rgba(233,227,214,.2);
  --panel:rgba(255,255,255,.028);--input-bg:rgba(15,20,38,.5);
  --accent-br:rgba(216,178,92,.48);color-scheme:dark}
@media (prefers-color-scheme:light){
  :root{--bg:#f4ebd8;--bg-top:#f6e4c3;--ink:#3a352c;--ink-hi:#201d16;--muted:#5e5749;
    --faint:#6f6858;--accent:#d8b25c;--accent-tx:#8a6416;--on-accent:#241c08;
    --line:rgba(70,56,28,.22);--border:rgba(70,56,28,.3);--panel:#fff;--input-bg:#fffdf7;
    --accent-br:rgba(138,100,22,.45);color-scheme:light}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;
  padding:clamp(24px,6vw,72px) 20px;
  background:radial-gradient(120% 80% at 50% -10%,var(--bg-top) 0%,var(--bg) 55%);
  color:var(--ink);font-family:Outfit,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.box{width:100%;max-width:420px;display:flex;flex-direction:column;align-items:center;
  text-align:center;border:1px solid var(--line);border-radius:26px;
  padding:clamp(28px,5vw,44px) clamp(22px,4vw,38px);background:var(--panel)}
.box img{width:104px;height:104px;border-radius:50%;object-fit:cover;border:1px solid var(--accent-br)}
.box.no img{border-color:var(--border);filter:grayscale(1);opacity:.45}
.mark{margin-top:20px;font-size:11.5px;font-weight:600;letter-spacing:.2em;
  text-transform:uppercase;color:var(--accent-tx)}
.intro{margin:18px 0 0;max-width:300px;font-size:14px;line-height:1.6;color:var(--muted);text-wrap:pretty}
h1{margin:12px 0 0;font-family:Newsreader,serif;font-size:clamp(27px,4.4vw,36px);
  font-weight:400;line-height:1.15;color:var(--ink-hi);text-wrap:balance}
.deny{margin:10px 0 0;font-family:Newsreader,serif;font-size:clamp(26px,4.2vw,34px);
  font-weight:400;line-height:1.15;color:var(--ink-hi);text-wrap:balance}
input{margin-top:26px;width:100%;padding:14px 16px;border:1px solid var(--border);
  border-radius:12px;background:var(--input-bg);color:var(--ink);
  font-family:Outfit,sans-serif;font-size:16px;text-align:center;letter-spacing:.14em}
button{margin-top:12px;width:100%;padding:14px 20px;border:none;border-radius:12px;
  background:var(--accent);color:var(--on-accent);font-family:Outfit,sans-serif;
  font-size:15.5px;font-weight:600;cursor:pointer}
.hint{margin:14px 0 0;font-size:13px;line-height:1.5;color:var(--faint)}
.lang{display:inline-block;margin-top:16px;padding:6px 12px;border:1px solid var(--border);
  border-radius:9px;color:var(--faint);font-size:12px;font-weight:600;letter-spacing:.08em;
  text-decoration:none}
.lang:hover{color:var(--accent-tx);border-color:var(--accent-br)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style>
</head>
<body>
<?php if ($state === 'denied'): ?>
  <div class="box no">
    <img src="/avatar.webp" alt="">
    <span class="mark">schäfchens.de</span>
    <p class="deny"><?= h($t['denied']) ?></p>
    <?php if ($hint !== ''): ?><p class="hint"><?= h($hint) ?></p><?php endif ?>
  </div>
<?php else: ?>
  <form class="box" method="post" action="">
    <img src="/avatar.webp" alt="">
    <span class="mark">schäfchens.de</span>
    <p class="intro"><?= h($t['intro']) ?></p>
    <h1><?= h($t['question']) ?></h1>
    <label class="sr-only" for="answer" hidden><?= h($t['placeholder']) ?></label>
    <input id="answer" type="text" name="answer" required autofocus autocomplete="off"
           autocapitalize="off" autocorrect="off" spellcheck="false"
           maxlength="<?= GATE_MAX_LEN ?>" placeholder="<?= h($t['placeholder']) ?>">
    <button type="submit"><?= h($t['submit']) ?></button>
    <?php if ($hint !== ''): ?><p class="hint"><?= h($hint) ?></p><?php endif ?>
    <a class="lang" href="?lang=<?= h($other) ?>"><?= h($t['switch']) ?></a>
  </form>
<?php endif ?>
</body>
</html>
