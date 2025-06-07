import { Pool } from 'pg';

// Create a global pool instance
let pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
};

// Initialize database tables
const initDB = async () => {
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

export const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const pool = getPool();
  const { httpMethod, path, queryStringParameters, body } = event;
  
  try {
    // Initialize DB on first request
    await initDB();

    // Route handling
    const route = path.replace('/.netlify/functions/api', '');

    switch (httpMethod) {
      case 'GET':
        if (route === '/health') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() })
          };
        }
        
        if (route === '/data') {
          const result = await pool.query('SELECT * FROM owner_vaults ORDER BY created_at DESC');
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data: result.rows })
          };
        }
        
        if (route === '/owner') {
          const { address } = queryStringParameters || {};
          if (!address) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ success: false, error: 'Address required' })
            };
          }
          
          const result = await pool.query(
            'SELECT vault_address, created_at FROM owner_vaults WHERE owner_address = $1',
            [address]
          );
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              owner: address, 
              vaults: result.rows 
            })
          };
        }
        break;

      case 'POST':
        if (route === '/add') {
          const { owner_address, vault_address } = JSON.parse(body);
          
          if (!owner_address || !vault_address) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                success: false, 
                error: 'owner_address and vault_address required' 
              })
            };
          }

          try {
            await pool.query(
              'INSERT INTO owner_vaults (owner_address, vault_address) VALUES ($1, $2)',
              [owner_address, vault_address]
            );

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({ 
                success: true, 
                message: 'Vault added successfully' 
              })
            };
          } catch (err) {
            if (err.code === '23505') {
              return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ success: false, error: 'Vault already exists' })
              };
            } else {
              throw err;
            }
          }
        }
        break;

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Route not found' })
        };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, error: 'Route not found' })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};