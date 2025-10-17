const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  const { contactId } = req.query;

  if (!contactId) {
    return res.status(400).send('Invalid request');
  }

  try {
    await supabaseClient
      .from('contacts')
      .update({ 
        status: 'prospect', 
        notes: 'Clicked CTA button - Interested!' 
      })
      .eq('id', contactId);

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thank You</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { background: white; color: #333; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            h1 { color: #667eea; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Thank You!</h1>
            <p>We've received your interest and will get back to you soon.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Error processing request');
  }
};
