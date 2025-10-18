# Technology Stack

## Frontend

### Core Framework
- **React**: 18.2.0
- **React DOM**: 18.2.0
- **React Router DOM**: 6.8.1

### UI & Styling
- **Tailwind CSS**: 3.3.6
- **PostCSS**: 8.4.32
- **Autoprefixer**: 10.4.16
- **Lucide React**: 0.294.0 (icons)

### Build System
- **React Scripts**: 5.0.1 (Create React App)

### Monitoring
- **Vercel Speed Insights**: 1.2.0

## Backend

### Runtime
- **Node.js**: Vercel serverless functions

### Database & Auth
- **Supabase JS**: 2.38.4 (PostgreSQL + Auth)

### Email
- **Nodemailer**: 7.0.9 (SMTP)

### Security
- **Node.js Crypto**: Built-in (AES-256-CBC encryption)

## Development Commands

```bash
# Start development server
npm start
# or
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Eject from Create React App (not recommended)
npm run eject
```

## Environment Variables

Required in `.env`:
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (API only)
- `ENCRYPTION_KEY`: 32-byte hex key for AES-256 encryption

## Deployment

### Platform
- **Vercel**: Hosting and serverless functions

### Build Configuration
- Build command: `react-scripts build`
- Output directory: `build`
- API directory: `api`

## Browser Support

### Production
- >0.2% market share
- Not dead browsers
- Not Opera Mini

### Development
- Latest Chrome
- Latest Firefox
- Latest Safari

## Code Quality

### Linting
- ESLint with `react-app` and `react-app/jest` configs

## Database Schema

### Tables
- **users**: User accounts and metadata
- **contacts**: CRM contact records
- **emails**: Email history and tracking
- **email_config**: Encrypted Gmail credentials

### Security
- Row Level Security (RLS) enabled
- Service role bypass for API operations
