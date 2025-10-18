const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  const requestedWith = req.headers['x-requested-with'];
  const csrfToken = req.headers['x-csrf-token'];
  if (requestedWith !== 'XMLHttpRequest' || csrfToken !== 'coldrm-csrf-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        username,
        company_name,
        created_at,
        users!inner(email)
      `)
      .eq('notify_full_version', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users = data.map(profile => ({
      id: profile.id,
      username: profile.username,
      company_name: profile.company_name,
      email: profile.users.email,
      created_at: profile.created_at
    }));

    res.status(200).json({ 
      success: true, 
      count: users.length,
      users 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}