import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
let pool;

// Initialize database connection
const initConnection = async () => {
  if (pool) return pool;
  
  pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'vault_db',
    password: process.env.PGPASSWORD || 'password',
    port: process.env.PGPORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test connection and initialize tables
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully');
    
    // Initialize database tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS owner_vaults (
        id SERIAL PRIMARY KEY,
        owner_address VARCHAR(255) NOT NULL,
        vault_address VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(owner_address, vault_address)
      )
    `);
    console.log('Database table initialized');
  } catch (err) {
    console.error('Database connection/init error:', err.message);
    throw err;
  }
  
  return pool;
};

// Middleware to ensure database connection
const ensureConnection = async (req, res, next) => {
  try {
    if (!pool) {
      await initConnection();
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all data
app.get('/api/data', ensureConnection, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM owner_vaults ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get vaults by owner
app.get('/api/owner', ensureConnection, async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address parameter required' });
    }
    
    const result = await pool.query(
      'SELECT vault_address, created_at FROM owner_vaults WHERE owner_address = $1 ORDER BY created_at DESC',
      [address]
    );
    
    res.json({ 
      success: true, 
      owner: address, 
      vaults: result.rows 
    });
  } catch (err) {
    console.error('Error fetching owner vaults:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add vault to owner
app.post('/api/add', ensureConnection, async (req, res) => {
  try {
    const { owner_address, vault_address } = req.body;
    
    if (!owner_address || !vault_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both owner_address and vault_address are required' 
      });
    }

    await pool.query(
      'INSERT INTO owner_vaults (owner_address, vault_address) VALUES ($1, $2)',
      [owner_address, vault_address]
    );

    res.json({ 
      success: true, 
      message: 'Vault added successfully',
      data: { owner_address, vault_address }
    });
  } catch (err) {
    console.error('Error adding vault:', err);
    if (err.code === '23505') {
      res.status(409).json({ success: false, error: 'Vault already exists for this owner' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Export for Vercel
export default app;