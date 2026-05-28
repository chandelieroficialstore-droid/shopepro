const crypto = require('crypto');
const SHOPEE_API = 'https://open-api.affiliate.shopee.com.br/graphql';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { appId, query, variables } = req.body;
  if (!appId || !query) return res.status(400).json({ error: 'appId e query são obrigatórios' });

  const secret = process.env.SHOPEE_SECRET;
  if (!secret) return res.status(500).json({ error: 'SHOPEE_SECRET não configurado no Vercel' });

  const payload   = JSON.stringify(variables ? { query, variables } : { query });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash('sha256')
    .update(appId + timestamp + payload + secret)
    .digest('hex');

  try {
    const response = await fetch(SHOPEE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
      },
      body: payload,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Erro ao contatar API Shopee: ' + err.message });
  }
};
