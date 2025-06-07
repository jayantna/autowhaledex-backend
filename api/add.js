// File: api/add.js - Add vault to owner endpoint
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

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { owner_address, vault_address } = req.body;
    
    if (!owner_address || !vault_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'owner_address and vault_address required' 
      });
    }

    await initDB();
    const pool = getPool();
    await pool.query(
      'INSERT INTO owner_vaults (owner_address, vault_address) VALUES ($1, $2)',
      [owner_address, vault_address]
    );

    res.json({ 
      success: true, 
      message: 'Vault added successfully' 
    });
  } catch (err) {
    console.error('Database error:', err);
    if (err.code === '23505') {
      res.status(409).json({ success: false, error: 'Vault already exists' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}