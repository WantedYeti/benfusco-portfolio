<?php
// Simple PHP handler for local/dev hosting (not Netlify). Sends an email using PHP's mail().
// IMPORTANT: This only works on hosts that support PHP and have mail configured.
// On Netlify or GitHub Pages, use Netlify Forms instead (already configured via data-netlify).

header('Content-Type: application/json; charset=UTF-8');

// Basic spam check: honeypot and empty website field must be empty
$honeypot = isset($_POST['bot-field']) ? trim($_POST['bot-field']) : '';
$website = isset($_POST['website']) ? trim($_POST['website']) : '';
if ($honeypot !== '' || $website !== '') {
  http_response_code(200);
  echo json_encode(['ok' => true]); // silently succeed for bots
  exit;
}

$first = isset($_POST['firstName']) ? trim($_POST['firstName']) : '';
$last = isset($_POST['lastName']) ? trim($_POST['lastName']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$how = isset($_POST['how']) ? trim($_POST['how']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($first === '' || $last === '' || $email === '' || $message === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
  exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid email']);
  exit;
}

// Compose mail
$to = 'contact@fuscomedia.com';
$subject = 'New contact from fuscomedia.com';
$body = "New contact submission:\n\n" .
        "Name: {$first} {$last}\n" .
        "Email: {$email}\n" .
        "How did you hear: {$how}\n\n" .
        "Message:\n{$message}\n";
$headers = [
  'From: no-reply@fuscomedia.com',
  'Reply-To: ' . $email,
  'Content-Type: text/plain; charset=UTF-8'
];

// Attempt to send
$sent = @mail($to, $subject, $body, implode("\r\n", $headers));
if ($sent) {
  http_response_code(200);
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
}
?>
