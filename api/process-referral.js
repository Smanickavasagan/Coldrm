const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const requestedWith = req.headers['x-requested-with'];
  if (requestedWith !== 'XMLHttpRequest') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { refereeId, referralCode } = req.body;

  if (!refereeId || !referralCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Find referrer by code
    const { data: referrer, error: referrerError } = await supabaseClient
      .from('profiles')
      .select('id, username')
      .eq('referral_code', referralCode.toUpperCase())
      .single();

    if (referrerError || !referrer) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    if (referrer.id === refereeId) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }

    // Check if already referred
    const { data: existing } = await supabaseClient
      .from('referrals')
      .select('id')
      .eq('referee_id', refereeId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User already used a referral code' });
    }

    // Create referral record
    const { error: referralError } = await supabaseClient
      .from('referrals')
      .insert([{
        referrer_id: referrer.id,
        referee_id: refereeId,
        referral_code: referralCode.toUpperCase(),
        rewards_given: true
      }]);

    if (referralError) throw referralError;

    // Give rewards to referrer (10 emails + 10 contacts)
    const { error: referrerRewardError } = await supabaseClient
      .from('profiles')
      .update({
        bonus_emails: supabaseClient.raw('bonus_emails + 10'),
        bonus_contacts: supabaseClient.raw('bonus_contacts + 10')
      })
      .eq('id', referrer.id);

    if (referrerRewardError) throw referrerRewardError;

    // Give rewards to referee (5 emails + 5 contacts)
    const { error: refereeRewardError } = await supabaseClient
      .from('profiles')
      .update({
        bonus_emails: supabaseClient.raw('bonus_emails + 5'),
        bonus_contacts: supabaseClient.raw('bonus_contacts + 5'),
        referred_by: referralCode.toUpperCase()
      })
      .eq('id', refereeId);

    if (refereeRewardError) throw refereeRewardError;

    res.status(200).json({ 
      success: true, 
      message: 'Referral processed successfully!',
      referrerReward: { emails: 10, contacts: 10 },
      refereeReward: { emails: 5, contacts: 5 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}