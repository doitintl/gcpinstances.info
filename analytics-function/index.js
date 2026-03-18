const { http } = require('@google-cloud/functions-framework')

http('trackPageView', (req, res) => {
  // Allow CORS for sendBeacon from any origin
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send('')
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { page, ts } = body || {}

  console.log(JSON.stringify({
    severity: 'INFO',
    event: 'pageview',
    page: page || 'unknown',
    ts: ts || Date.now(),
    userAgent: req.headers['user-agent'] || '',
    referer: req.headers['referer'] || '',
  }))

  return res.status(204).send('')
})
