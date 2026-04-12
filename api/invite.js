export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    return res.status(500).json({ error: 'Server misconfiguration: missing SITE_URL' });
  }

  if (!supabaseUrl || !serviceRoleKey || !siteUrl) {
    return res.status(500).json({ error: 'Server misconfiguration: missing Supabase credentials' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        data: {},
        redirect_to: `${siteUrl}/accept-invite`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.msg ?? data.error_description ?? 'Failed to send invite' });
    }

    return res.status(200).json({ message: 'Invite sent' });
  } catch (err) {
    console.error('Invite error:', err);
    return res.status(500).json({ error: 'Failed to send invite' });
  }
}
