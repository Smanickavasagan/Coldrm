# COLDrm - CRM + Cold Email Tool

A simple MVP web app that combines CRM functionality with AI-powered cold email sending, designed for freelancers and small business owners.

## Features

### 🧠 CRM Module
- Add up to 10 contacts (MVP limit)
- Store contact details: Name, Email, Company, Notes
- Auto-add contacts when recipients click CTA buttons in emails
- Clean table view with edit/delete functionality

### ✉️ Cold Mail Module
- AI-powered email generation using Cohere API
- Send up to 20 emails (MVP limit)
- 1-minute intervals between emails (warm-up process)
- Automatic CTA button inclusion
- Progress tracking during bulk sending

### 🔐 Authentication
- Email/password authentication via Supabase
- Protected dashboard routes
- User-specific data isolation

## Tech Stack

- **Frontend**: React.js + Tailwind CSS
- **Backend/Database**: Supabase (Auth + PostgreSQL)
- **AI**: Cohere API for email generation
- **Email**: Nodemailer with SMTP
- **Hosting**: Vercel (recommended)

## Setup Instructions

### 1. Clone and Install
```bash
git clone <your-repo>
cd coldrm
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_COHERE_API_KEY=your_cohere_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Supabase Setup
1. Create a new Supabase project
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) on both tables
4. Copy your project URL and anon key to the `.env` file

### 4. Cohere API Setup
1. Sign up at [Cohere](https://cohere.ai/)
2. Get your API key from the dashboard
3. Add it to your `.env` file

### 5. Email Setup
1. Use Gmail or another SMTP provider
2. For Gmail, enable 2FA and create an App Password
3. Add your credentials to the `.env` file

### 6. Run the Application
```bash
npm start
```

## Project Structure

```
coldrm/
├── src/
│   ├── components/
│   │   ├── LandingPage.js    # Public landing page
│   │   ├── Auth.js           # Login/signup forms
│   │   ├── Dashboard.js      # Main dashboard
│   │   ├── CRM.js           # Contact management
│   │   └── ColdMail.js      # Email composition & sending
│   ├── supabaseClient.js    # Supabase configuration
│   ├── App.js               # Main app with routing
│   └── index.js             # React entry point
├── api/
│   ├── generate-email.js    # Cohere AI integration
│   └── send-email.js        # Email sending endpoint
├── public/
│   └── index.html           # HTML template
└── supabase-schema.sql      # Database schema
```

## MVP Limitations

- **Contacts**: Maximum 10 per user
- **Emails**: Maximum 20 per user
- **Rate Limiting**: 1 email per minute during bulk sending
- **No Payment System**: Free tier only
- **Basic Analytics**: Simple counters only

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
Make sure to add all environment variables to your hosting platform:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_COHERE_API_KEY`
- `EMAIL_USER`
- `EMAIL_PASS`

## Usage

1. **Sign Up**: Create an account on the landing page
2. **Add Contacts**: Use the CRM tab to add up to 10 contacts
3. **Compose Emails**: Use the Cold Mail tab to generate AI-powered emails
4. **Send Campaigns**: Select recipients and send with automatic rate limiting
5. **Track Results**: Monitor email counts and contact interactions

## Security Features

- Row Level Security (RLS) in Supabase
- User-specific data isolation
- Protected API endpoints
- Secure authentication flow

## Future Enhancements

- Email analytics and tracking
- Template library
- Team collaboration
- Payment integration
- Advanced automation
- A/B testing

## Support

For issues or questions, please check the documentation or create an issue in the repository.