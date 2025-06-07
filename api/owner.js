// File: api/owner.js - Get vaults by owner endpoint
import { getPool, initDB } from '../lib/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address required' });
    }
    
    await initDB();
    const pool = getPool();
    const result = await pool.query(
      'SELECT vault_address, created_at FROM owner_vaults WHERE owner_address = $1',
      [address]
    );
    
    res.json({ 
      success: true, 
      owner: address, 
      vaults: result.rows 
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

