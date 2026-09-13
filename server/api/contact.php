<?php
/**
 * Contact and per-app support form.
 *
 * Every message is appended to lib/state/messages.jsonl, which is denied over
 * HTTP. Mail is sent only when CONTACT_MAIL is set in secrets.php — it is
 * empty for now, so the log is the record. Writing first and mailing second is
 * deliberate: a bounced or misconfigured mail() must not lose the message.
 *
 * Spam defence is three cheap checks rather than a captcha: a honeypot field,
 * a minimum time on the form, and a per-IP hourly cap.
 */

declare(strict_types=1);

require __DIR__ . '/../inc/gate.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

/** @param array<string,mixed> $extra */
function reply(bool $ok, int $status, array $extra = []): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok] + $extra, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/* The form only exists behind the gate, so a post without the cookie is either
 * a stale tab or somebody poking at the endpoint directly. */
if (!gate_unlocked()) {
    reply(false, 403, ['error' => 'locked']);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    reply(false, 405, ['error' => 'method']);
}

const MSG_MAX_PER_HOUR = 5;
const MSG_MIN_SECONDS = 3;

function msg_rate_file(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return GATE_STATE . '/msg/' . hash('sha256', $ip . '|msg|' . GATE_SECRET) . '.txt';
}

/** @return array{0:int,1:int} */
function msg_rate_read(): array
{
    $raw = @file_get_contents(msg_rate_file());
    if ($raw === false) {
        return [time(), 0];
    }
    $p = explode(' ', trim($raw), 2);
    $start = (int) ($p[0] ?? 0);
    $count = (int) ($p[1] ?? 0);
    return $start + 3600 < time() ? [time(), 0] : [$start, $count];
}

function msg_rate_bump(): void
{
    [$start, $count] = msg_rate_read();
    $file = msg_rate_file();
    @mkdir(dirname($file), 0700, true);
    @file_put_contents($file, $start . ' ' . ($count + 1), LOCK_EX);
}

/* --- validate ------------------------------------------------------------ */

$field = static fn(string $k, int $max): string => mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $max, 'UTF-8');

// The honeypot is off-screen and aria-hidden. Anything in it came from a bot.
// Answer 200 so the bot has no signal to tune against; nothing is recorded.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    reply(true, 200, ['stored' => false]);
}

$elapsed = (int) ($_POST['elapsed'] ?? 0);
if ($elapsed < MSG_MIN_SECONDS) {
    reply(false, 422, ['error' => 'too-fast']);
}

[, $sent] = msg_rate_read();
if ($sent >= MSG_MAX_PER_HOUR) {
    reply(false, 429, ['error' => 'rate']);
}

$name = $field('name', 120);
$email = $field('email', 180);
$message = $field('message', 5000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(false, 422, ['error' => 'invalid']);
}

/* --- record -------------------------------------------------------------- */

$record = [
    'at' => gmdate('c'),
    'about' => $field('about', 60),
    'name' => $name,
    'email' => $email,
    'message' => $message,
    'consent' => isset($_POST['consent']),
    'lang' => ($_COOKIE['sch_lang'] ?? '') === 'en' ? 'en' : 'de',
    'ua' => mb_substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200, 'UTF-8'),
];

@mkdir(GATE_STATE, 0700, true);
$line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($line === false) {
    reply(false, 500, ['error' => 'encode']);
}
if (@file_put_contents(GATE_STATE . '/messages.jsonl', $line . "\n", FILE_APPEND | LOCK_EX) === false) {
    reply(false, 500, ['error' => 'store']);
}

msg_rate_bump();

/* --- mail, if configured ------------------------------------------------- */

if (CONTACT_MAIL !== '') {
    // Non-ASCII in a header has to be MIME-encoded or it arrives as mojibake.
    $subject = mb_encode_mimeheader('schäfchens.de — '
        . ($record['about'] !== '' ? $record['about'] : 'Kontakt'), 'UTF-8', 'B');
    $body = "Von:      {$name} <{$email}>\n"
        . ($record['about'] !== '' ? "Betrifft: {$record['about']}\n" : '')
        . "Zeit:     {$record['at']}\n\n{$message}\n";
    $headers = [
        'From: ' . mb_encode_mimeheader('schäfchens.de', 'UTF-8', 'B') . ' <' . CONTACT_FROM . '>',
        'Reply-To: ' . $email,
        'Content-Type: text/plain; charset=UTF-8',
        'MIME-Version: 1.0',
    ];
    // The -f envelope sender has to be a mailbox on this domain or the host
    // silently drops the message. Failure here is not reported to the visitor:
    // the message is already safely on disk.
    @mail(CONTACT_MAIL, $subject, $body, implode("\r\n", $headers), '-f' . CONTACT_FROM);
}

reply(true, 200, ['stored' => true]);
