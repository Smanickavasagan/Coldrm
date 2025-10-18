# Development Guidelines

## Code Quality Standards

### Formatting & Structure
- **Indentation**: 2 spaces consistently across all files
- **Semicolons**: Used consistently in JavaScript
- **Quotes**: Single quotes for imports, double quotes for JSX attributes
- **Line Length**: Reasonable line lengths, breaking complex expressions
- **Blank Lines**: Single blank line between logical sections

### Naming Conventions
- **Components**: PascalCase (ColdMail, CRM, Dashboard)
- **Functions**: camelCase (getUserProfile, sendEmails, checkRateLimit)
- **Variables**: camelCase (selectedContacts, emailContent, userProfile)
- **Constants**: camelCase for regular constants, UPPER_SNAKE_CASE for true constants
- **Files**: PascalCase for components (ColdMail.js), kebab-case for API routes (send-email-smtp.js)
- **Database Fields**: snake_case (email_configured, encrypted_email_password, follow_up_date)

### Documentation
- Minimal inline comments - code is self-documenting
- Comments only for complex logic or security-critical sections
- No JSDoc or function documentation headers
- Clear variable and function names eliminate need for comments

## React Patterns

### Component Structure
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Icon1, Icon2 } from 'lucide-react';

// 2. Component definition with destructured props
const ComponentName = ({ prop1, prop2, onCallback }) => {
  // 3. State declarations
  const [state1, setState1] = useState(initialValue);
  const [state2, setState2] = useState(initialValue);
  
  // 4. Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);
  
  // 5. Event handlers and helper functions
  const handleAction = async () => {
    // handler logic
  };
  
  // 6. Return JSX
  return (
    <div>
      {/* component markup */}
    </div>
  );
};

// 7. Export
export default ComponentName;
```

### State Management
- **useState** for all local state
- No Redux or external state management
- Props drilling for parent-child communication
- Callback props for child-to-parent updates (onContactsChange, onEmailSent)
- Supabase client for global auth state

### Async Operations
- **async/await** syntax exclusively (no .then() chains)
- Try-catch blocks for error handling
- User-facing alerts for errors: `alert('Error: ' + error.message)`
- Loading states during async operations: `const [loading, setLoading] = useState(false)`
- Progress tracking for long operations: `setSendingProgress({ current: i, total: length })`

### Data Fetching
```javascript
// Pattern used throughout
const fetchData = async () => {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('field', value);
  
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  
  // Process data
};
```

## Security Patterns

### Input Validation
```javascript
// Type checking
if (!value || typeof value !== 'string') {
  return res.status(400).json({ error: 'Invalid input' });
}

// Length limits
if (content.length > 10000) {
  return res.status(400).json({ error: 'Content too long' });
}

// Email validation
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}
```

### HTML Sanitization
```javascript
function sanitizeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

### CSRF Protection
```javascript
// All API calls include this header
headers: {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
}

// API endpoints validate
if (requestedWith !== 'XMLHttpRequest') {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### Encryption
```javascript
// AES-256-CBC with unique IV per encryption
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv(algorithm, key, iv);
// Store as: iv:encryptedData
return iv.toString('hex') + ':' + encrypted;
```

## API Patterns

### Serverless Function Structure
```javascript
module.exports = async function handler(req, res) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  // 2. Method validation
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // 3. CSRF check
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // 4. Input validation
  const { param1, param2 } = req.body;
  if (!param1 || typeof param1 !== 'string') {
    return res.status(400).json({ error: 'Invalid param1' });
  }
  
  // 5. Business logic with try-catch
  try {
    // logic here
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Database Access
- **Service role key** in API functions to bypass RLS
- **Anon key** in frontend with RLS protection
- Destructured imports: `const { createClient } = require('@supabase/supabase-js')`
- Error handling on every query

### Rate Limiting
```javascript
async function checkRateLimit(userId) {
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabaseClient
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', oneMinuteAgo);
  return count < 5;
}
```

## UI/UX Patterns

### Tailwind CSS Usage
- Utility-first approach exclusively
- No custom CSS classes (except in index.css for globals)
- Inline styles only for dynamic values: `style={{ width: \`\${percentage}%\` }}`
- Consistent spacing: p-4, mb-6, space-y-4
- Color palette: primary-500, gray-800, blue-100, green-700, red-600

### Form Patterns
```javascript
// Controlled inputs
<input
  type="text"
  value={formData.field}
  onChange={(e) => setFormData({...formData, field: e.target.value})}
  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
  required
/>
```

### Modal Pattern
```javascript
{showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-full max-w-md m-4">
      {/* modal content */}
    </div>
  </div>
)}
```

### Loading States
```javascript
// Button disabled state
<button
  disabled={loading || !canProceed}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Loading...' : 'Action'}
</button>

// Progress bar
<div className="bg-blue-200 rounded-full h-2">
  <div 
    className="bg-blue-500 h-2 rounded-full transition-all"
    style={{ width: `${(current / total) * 100}%` }}
  />
</div>
```

### Icons
- **Lucide React** for all icons
- Consistent sizing: h-4 w-4 (small), h-5 w-5 (medium)
- Always with descriptive context: `<Send className="h-5 w-5 mr-2" />`

## Common Idioms

### Conditional Rendering
```javascript
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}
{array.length === 0 ? <EmptyState /> : <List />}
```

### Array Operations
```javascript
// Filter
const filtered = items.filter(item => condition);

// Map with key
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// Find
const item = items.find(i => i.id === targetId);
```

### Object Spreading
```javascript
// Update nested state
setFormData({...formData, field: newValue})

// Merge objects
const payload = { ...baseData, ...additionalData };
```

### Async Delays
```javascript
// Wait between operations
await new Promise(resolve => setTimeout(resolve, 60000));
```

### Confirmation Dialogs
```javascript
if (!window.confirm('Are you sure?')) return;
```

## Error Handling

### Frontend
- Alert dialogs for user-facing errors
- Try-catch around async operations
- Graceful degradation (show empty states)

### Backend
- Specific error messages for debugging
- HTTP status codes: 400 (validation), 403 (CSRF), 429 (rate limit), 500 (server error)
- Error details in response: `{ error: message, code: errorCode }`

## Testing Approach
- No automated tests in MVP
- Manual testing workflow
- Test account with unlimited access for development
- Production limits enforced for regular users
