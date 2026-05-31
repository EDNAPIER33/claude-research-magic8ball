import { kv as redis } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = req.headers['x-admin-password'];

  if (!adminPassword || provided !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const answers = await redis.lrange('answers', 0, -1);
    return res.status(200).json({ answers: answers || [] });
  }

  if (req.method === 'POST') {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ error: 'Answer required' });
    await redis.rpush('answers', answer.trim());
    const answers = await redis.lrange('answers', 0, -1);
    return res.status(200).json({ answers });
  }

  if (req.method === 'DELETE') {
    const { answer } = req.body;
    if (!answer) return res.status(400).json({ error: 'Answer required' });
    await redis.lrem('answers', 0, answer);
    const answers = await redis.lrange('answers', 0, -1);
    return res.status(200).json({ answers });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
