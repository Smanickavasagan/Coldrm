# Project Structure

## Directory Organization

```
Coldrm/
├── api/                    # Vercel serverless functions
│   ├── crypto-utils.js     # AES-256 encryption utilities
│   ├── cta-clicked.js      # CTA tracking endpoint
│   ├── encrypt-password.js # Password encryption endpoint
│   ├── send-email-smtp.js  # SMTP email sending
│   └── send-enrollment.js  # User enrollment emails
├── src/
│   ├── components/         # React components
│   │   ├── Auth.js         # Authentication UI
│   │   ├── ColdMail.js     # Cold email interface
│   │   ├── CRM.js          # Contact management
│   │   ├── Dashboard.js    # Main dashboard
│   │   ├── EnrollPage.js   # User enrollment
│   │   └── LandingPage.js  # Public landing page
│   ├── App.js              # Main app with routing
│   ├── index.js            # React entry point
│   ├── index.css           # Global styles
│   └── supabaseClient.js   # Supabase configuration
├── public/
│   └── index.html          # HTML template
└── Configuration files
    ├── package.json        # Dependencies and scripts
    ├── tailwind.config.js  # Tailwind CSS config
    └── postcss.config.js   # PostCSS config
```

## Core Components

### Frontend Layer
- **App.js**: React Router setup with protected routes
- **Auth.js**: Login/signup/password reset forms
- **Dashboard.js**: Main navigation hub
- **CRM.js**: Contact CRUD operations, filtering, status management
- **ColdMail.js**: Email composition, recipient selection, sending interface
- **EnrollPage.js**: New user onboarding
- **LandingPage.js**: Public marketing page

### Backend Layer (Serverless)
- **send-email-smtp.js**: Nodemailer SMTP integration, rate limiting, email sending
- **encrypt-password.js**: Gmail password encryption before storage
- **cta-clicked.js**: CTA click tracking, automatic status updates
- **send-enrollment.js**: Welcome email dispatch
- **crypto-utils.js**: Shared encryption/decryption functions

### Data Layer
- **supabaseClient.js**: Supabase client initialization
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Tables**: users, contacts, emails, email_config

## Architectural Patterns

### Client-Server Architecture
- React SPA frontend
- Vercel serverless functions as backend API
- Supabase as database and auth provider

### Security Architecture
- AES-256-CBC encryption for sensitive data
- CSRF protection via X-Requested-With headers
- Row Level Security in database
- Service role key for API operations
- Input sanitization and validation

### Data Flow
1. User authenticates via Supabase Auth
2. Frontend fetches data using Supabase client
3. Sensitive operations (email sending) go through serverless API
4. API functions use service role for database access
5. Encrypted credentials stored and decrypted on-demand
