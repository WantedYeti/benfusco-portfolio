// Netlify Function: verify-recaptcha
// Verifies Google reCAPTCHA token server-side using RECAPTCHA_SECRET from environment variables.
// Endpoint: /.netlify/functions/verify-recaptcha
// Request: POST { token: '<g-recaptcha-response token>' }

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: 'Invalid JSON' }; }

  const token = body.token || body['g-recaptcha-response'];
  if (!token) return { statusCode: 400, body: 'Missing token' };

  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return { statusCode: 500, body: 'Server misconfigured' };

  try {
    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);

    // For better privacy, you can also pass remoteip if available.
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await res.json();
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 502, body: 'Verification failed' };
  }
};
