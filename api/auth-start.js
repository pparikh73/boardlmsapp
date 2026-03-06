// Vercel serverless function — fetches Skilljar's OAuth auth endpoint server-side
// and returns the Azure B2C redirect URL (with a fresh state token) to the client.
// This bypasses Skilljar's intermediate IdP selection page which defaults to AVEYA.

const SKILLJAR_AUTH_URL = 'https://accounts.skilljar.com/auth/login/3u81yknqkpzep';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const response = await fetch(SKILLJAR_AUTH_URL, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const location = response.headers.get('location');

    if (location) {
      return res.status(200).json({ url: location });
    }

    // Skilljar returned HTML (multi-IdP page) — fall back to direct navigation
    return res.status(200).json({ url: SKILLJAR_AUTH_URL });
  } catch {
    return res.status(200).json({ url: SKILLJAR_AUTH_URL });
  }
}
