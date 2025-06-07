import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
let pool;

// Create database if it doesn't exist
const createDatabase = async () => {
  const adminPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // new Pool({
  //   user: process.env.PGUSER || 'postgres',
  //   host: process.env.PGHOST || 'localhost',
  //   database: process.env.PGDATABASE || 'postgres', // Connect to default postgres database
  //   password: process.env.PGPASSWORD || 'password',
  //   port: process.env.PGPORT || 5432,
  // });


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
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  // new Pool({
  //   user: 'postgres',
  //   host: 'localhost',
  //   database: 'vault_db',
  //   password: 'password',
  //   port: 5432,
  // });
  
  // Test connection
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to vault_db successfully');
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Get all data
app.get('/data', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM owner_vaults ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get vaults by owner
app.get('/owner', async (req, res) => {
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
app.post('/add', async (req, res) => {
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
    await createDatabase();
    await initConnection();
    await initDB();
    
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log('Endpoints:');
      console.log('  GET /health');
      console.log('  GET /data');
      console.log('  GET /owner?address=ADDRESS');
      console.log('  POST /add');
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

// # Check health
// curl http://localhost:3000/health

// # Get all data
// curl http://localhost:3000/data

// # Get owner's vaults
// curl "http://localhost:3000/owner?address=0x123"
// curl "postgresql://neondb_owner:npg_91ilpTHBYCfd@ep-muddy-band-a5yeonhi-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require/owner?address=0x123"

// # Add vault
// curl -X POST http://localhost:3000/add \
//   -H "Content-Type: application/json" \
//   -d '{"owner_address":"0x123","vault_address":"0xabc"}'