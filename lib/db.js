// File: lib/db.js - Database utility functions
import { Pool } from 'pg';

let pool;

export const getPool = () => {
  if (!pool) {
    pool = new Pool({
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'vault_db',
      password: process.env.PGPASSWORD || 'password',
      port: process.env.PGPORT || 5432,
      ssl: process.env.NODE_ENV === 'production'
    });
  }
  return pool;
};

export const initDB = async () => {
  const pool = getPool();
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

