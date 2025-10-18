# COLDrm

Minimal README restored. Add your project documentation here.

## Get Users Who Want Full Version Notifications

To retrieve users who opted in for full version release notifications:

### SQL Query (Supabase Dashboard):
```sql
SELECT p.username, p.company_name, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.notify_full_version = true
ORDER BY p.created_at DESC;
```

### API Endpoint:
```javascript
// GET /api/get-notification-users
const response = await fetch('/api/get-notification-users', {
  headers: { 'X-Requested-With': 'XMLHttpRequest' }
});
const data = await response.json();
// data.users contains the notification users
```

### Quick Count:
```sql
SELECT COUNT(*) as notification_users 
FROM profiles 
WHERE notify_full_version = true;
```

## Get Enrolled Users

To retrieve users who enrolled in the giveaway:

### SQL Query (Supabase Dashboard):
```sql
SELECT p.username, p.company_name, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;
```

### Get All Users Count:
```sql
SELECT COUNT(*) as total_enrolled_users 
FROM profiles;
```