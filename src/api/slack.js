export default async function handler(req, res) {
    const url = process.env.SLACK_WEBHOOK_URL;
  
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
  
    if (response.ok) {
      res.status(200).json({ message: 'Success' });
    } else {
      res.status(500).json({ error: 'Failed to send to Slack' });
    }
  }