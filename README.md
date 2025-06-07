# Vault Tracker

A full-stack web application for tracking cryptocurrency vaults with owner associations, built with Node.js, Express, PostgreSQL, and deployed on Vercel.

## Features

- **Add Vaults**: Associate vault addresses with owner addresses
- **Search by Owner**: Find all vaults belonging to a specific owner
- **View All Data**: Display all vault-owner relationships
- **Real-time Status**: Health check indicator for server connectivity
- **Responsive Design**: Modern, mobile-friendly interface

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Deployment**: Vercel

## Project Structure

```
vault-tracker/
├── api/
│   └── index.js          # Express server with API endpoints
├── public/
│   └── index.html        # Frontend interface
├── package.json          # Dependencies and scripts
├── vercel.json          # Vercel deployment configuration
└── README.md            # This file
```

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/data` - Get all vault-owner relationships
- `GET /api/owner?address=ADDRESS` - Get vaults for specific owner
- `POST /api/add` - Add new vault-owner relationship

### Request/Response Examples

**Add Vault:**
```bash
curl -X POST https://your-app.vercel.app/api/add \
  -H "Content-Type: application/json" \
  -d '{"owner_address":"0x123...","vault_address":"0xabc..."}'
```

**Get Owner's Vaults:**
```bash
curl "https://your-app.vercel.app/api/owner?address=0x123..."
```

## Deployment to Vercel

### 1. Setup Database

First, create a PostgreSQL database. You can use:
- **Neon** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app
- **PlanetScale**: https://planetscale.com

### 2. Environment Variables

In your Vercel dashboard, add these environment variables:

```
PGUSER=your_username
PGHOST=your_host
PGDATABASE=your_database_name
PGPASSWORD=your_password
PGPORT=5432
```

### 3. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Using GitHub**
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### 4. Database Setup

The application automatically creates the required table (`owner_vaults`) on first connection. No manual database setup required.

## Local Development

1. **Clone and install dependencies:**
```bash
git clone <your-repo>
cd vault-tracker
npm install
```

2. **Create `.env` file:**
```env
PGUSER=your_username
PGHOST=localhost
PGDATABASE=vault_db
PGPASSWORD=your_password
PGPORT=5432
```

3. **Run locally:**
```bash
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/*

## Database Schema

```sql
CREATE TABLE owner_vaults (
  id SERIAL PRIMARY KEY,
  owner_address VARCHAR(255) NOT NULL,
  vault_address VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_address, vault_address)
);
```

## Security Features

- Input validation for required fields
- Unique constraint prevents duplicate vault-owner pairs
- CORS enabled for cross-origin requests
- SSL connection for production database
- SQL injection protection with parameterized queries

## Frontend Features

- **Modern UI**: Gradient backgrounds, glassmorphism effects
- **Real-time Status**: Server connectivity indicator
- **Form Validation**: Client-side input validation
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during API calls

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check environment variables
   - Verify database credentials
   - Ensure database server is running

2. **CORS Errors**
   - Already configured in the backend
   - Check if frontend and backend URLs match

3. **Deployment Issues**
   - Verify `vercel.json` configuration
   - Check build logs in Vercel dashboard
   - Ensure all environment variables are set

### Debug Steps:

1. Check Vercel function logs
2. Test API endpoints directly
3. Verify database connection
4. Check browser console for frontend errors

## License

MIT License - feel free to use this project for your own applications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Need help?** Check the Vercel documentation or create an issue in the repository.