<?php
// Secure Contact Form Handler
// - Validates and sanitizes input
// - Honeypot spam check
// - Simple per-IP rate limiting (30 seconds)
// - Optional CAPTCHA verification (Turnstile or reCAPTCHA v2)
// - Sends email via PHP mail()
// - Returns JSON for AJAX, or redirects back with status query

// ===================
// CONFIGURATION
// ===================

// Where to send the email (owner address)
$TO_EMAIL = 'you@example.com'; // TODO: replace with your email address

// Email subject line
$EMAIL_SUBJECT = 'New contact from benfusco.com';

// From header: use a domain address you control; user address goes in Reply-To
$FROM_EMAIL = 'no-reply@benfusco.com'; // TODO: replace with your domain email

// Rate limiting (seconds per IP)
$RATE_LIMIT_WINDOW = 30; // 30 seconds

// CAPTCHA (optional): 'none' | 'turnstile' | 'recaptcha'
$CAPTCHA_PROVIDER = 'none'; // Set to 'turnstile' or 'recaptcha' to enable

// For Cloudflare Turnstile
$TURNSTILE_SECRET = 'YOUR_TURNSTILE_SECRET_KEY'; // TODO

// For Google reCAPTCHA v2
$RECAPTCHA_SECRET = 'YOUR_RECAPTCHA_SECRET_KEY'; // TODO

// Logging path (spam/rate-limit/etc.)
$LOG_FILE = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'contact_form_spam.log';

// ===================
// HELPER FUNCTIONS
// ===================

function is_ajax_request(): bool {
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) ||
           (isset($_SERVER['HTTP_ACCEPT']) && stripos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
}

function get_client_ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function deny_with($message, $status = 400) {
    http_response_code($status);
    if (is_ajax_request()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => false, 'error' => $message]);
    } else {
        $loc = '/contact.html?status=error';
        header('Location: ' . $loc);
    }
    exit;
}

function ok_response() {
    if (is_ajax_request()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => true, 'message' => 'Message sent successfully!']);
    } else {
        header('Location: /contact.html?status=success');
    }
    exit;
}

function sanitize_text($s): string {
    $s = trim((string)$s);
    // prevent header injection
    $s = str_replace(["\r", "\n"], ' ', $s);
    return $s;
}

function sanitize_email($e): string {
    $e = sanitize_text($e);
    return filter_var($e, FILTER_SANITIZE_EMAIL);
}

function valid_email($e): bool {
    return (bool) filter_var($e, FILTER_VALIDATE_EMAIL);
}

function rate_limit_check($window): bool {
    $ip = get_client_ip();
    $key = 'contact_' . md5($ip);
    $path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $key . '.txt';
    $now = time();
    if (file_exists($path)) {
        $last = (int) @file_get_contents($path);
        if ($now - $last < $window) {
            return false; // too soon
        }
    }
    @file_put_contents($path, (string)$now, LOCK_EX);
    return true;
}

function log_spam($reason, $data = []) {
    global $LOG_FILE;
    $entry = [
        'ts' => date('c'),
        'ip' => get_client_ip(),
        'reason' => $reason,
        'data' => $data,
    ];
    @file_put_contents($LOG_FILE, json_encode($entry) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function verify_captcha($provider, $secret) {
    if ($provider === 'turnstile') {
        $token = $_POST['cf-turnstile-response'] ?? $_POST['cf_turnstile_response'] ?? '';
        if (!$token) return false;
        $resp = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => get_client_ip()])
            ]
        ]));
        if (!$resp) return false;
        $json = @json_decode($resp, true);
        return !empty($json['success']);
    }
    if ($provider === 'recaptcha') {
        $token = $_POST['g-recaptcha-response'] ?? '';
        if (!$token) return false;
        $resp = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => get_client_ip()])
            ]
        ]));
        if (!$resp) return false;
        $json = @json_decode($resp, true);
        return !empty($json['success']);
    }
    return true; // provider none
}

// ===================
// MAIN HANDLER
// ===================

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    deny_with('Method Not Allowed', 405);
}

// Honeypot (either name works)
$honeypot1 = $_POST['bot-field'] ?? '';
$honeypot2 = $_POST['website'] ?? '';
if (!empty($honeypot1) || !empty($honeypot2)) {
    log_spam('honeypot', ['bot-field' => $honeypot1, 'website' => $honeypot2]);
    deny_with('Spam detected', 200); // pretend success
}

// Rate limit
if (!rate_limit_check($RATE_LIMIT_WINDOW)) {
    log_spam('rate-limit');
    deny_with('Too many requests. Please wait a bit and try again.', 429);
}

// Collect fields (support both minimal and extended forms)
$name = sanitize_text($_POST['name'] ?? '');
$first = sanitize_text($_POST['firstName'] ?? '');
$last = sanitize_text($_POST['lastName'] ?? '');
if ($name === '' && ($first !== '' || $last !== '')) {
    $name = trim($first . ' ' . $last);
}
$email = sanitize_email($_POST['email'] ?? '');
$message = sanitize_text($_POST['message'] ?? '');

// Validation
if ($name === '' || $email === '' || $message === '') {
    deny_with('Missing required fields.');
}
if (!valid_email($email)) {
    deny_with('Invalid email address.');
}

// Optional CAPTCHA
if ($CAPTCHA_PROVIDER !== 'none') {
    $ok = verify_captcha($CAPTCHA_PROVIDER, $CAPTCHA_PROVIDER === 'turnstile' ? $TURNSTILE_SECRET : $RECAPTCHA_SECRET);
    if (!$ok) {
        log_spam('captcha-failed');
        deny_with('Captcha verification failed.');
    }
}

// Compose email
$body_lines = [
    "Name: " . htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
    "Email: " . htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
    "Message:",
    htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
];
$body = implode("\n", $body_lines);

// Headers (prevent injection, use Reply-To)
$headers = [];
$headers[] = 'From: ' . $FROM_EMAIL;
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers_str = implode("\r\n", $headers);

// Send
$sent = @mail($TO_EMAIL, $EMAIL_SUBJECT, $body, $headers_str);
if ($sent) {
    ok_response();
} else {
    deny_with('Message failed. Please try again.', 500);
}

?>