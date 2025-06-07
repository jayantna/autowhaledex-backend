import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL connection
let pool;

// Create database if it doesn't exist
const createDatabase = async () => {
  const adminPool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: 'postgres', // Connect to default postgres database
    password: process.env.PGPASSWORD || 'password',
    port: process.env.PGPORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check if vault_db exists
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'vault_db'"
    );
    
    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await adminPool.query('CREATE DATABASE vault_db');
      console.log('Database vault_db created successfully');
    } else {
      console.log('Database vault_db already exists');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await adminPool.end();
  }
};

// Initialize database connection
const initConnection = async () => {
  pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'vault_db',
    password: process.env.PGPASSWORD || 'password',
    port: process.env.PGPORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully');
  } catch (err) {
    console.error('Database connection error:', err.message);
    throw err;
  }
};

// Initialize database tables
const initDB = async () => {
  try {
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
    console.error('Database init error:', err);
    throw err;
  }
};

// Routes

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM owner_vaults ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get vaults by owner
app.get('/api/owner', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ success: false, error: 'Address required' });
    }
    
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add vault to owner
app.post('/api/add', async (req, res) => {
  try {
    const { owner_address, vault_address } = req.body;
    
    if (!owner_address || !vault_address) {
      return res.status(400).json({ 
        success: false, 
        error: 'owner_address and vault_address required' 
      });
    }

    await pool.query(
      'INSERT INTO owner_vaults (owner_address, vault_address) VALUES ($1, $2)',
      [owner_address, vault_address]
    );

    res.json({ 
      success: true, 
      message: 'Vault added successfully' 
    });
  } catch (err) {
    if (err.code === '23505') {
      res.status(409).json({ success: false, error: 'Vault already exists' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Start server
const start = async () => {
  try {
    console.log('Starting server...');
    
    // Skip database creation in production (use existing database)
    if (process.env.NODE_ENV !== 'production') {
      await createDatabase();
    }
    
    await initConnection();
    await initDB();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('Endpoints:');
      console.log('  GET /health');
      console.log('  GET /api/data');
      console.log('  GET /api/owner?address=ADDRESS');
      console.log('  POST /api/add');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

export default app;