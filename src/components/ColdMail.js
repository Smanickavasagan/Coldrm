import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Send, Clock, Settings, Trash2, Shield } from 'lucide-react';

const ColdMail = ({ contacts, emailsSent, onEmailSent, maxEmails }) => {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [emailContent, setEmailContent] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    getUserProfile();
  }, []);

  const getUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);
      setUserEmail(user.email);
    }
  };

  const saveEmailConfig = async () => {
    if (!emailPassword.trim()) {
      alert('Please enter your Gmail app password');
      return;
    }

    setSavingConfig(true);
    try {
      // Remove spaces from password
      const cleanPassword = emailPassword.replace(/\s/g, '');
      console.log('Saving email config for user:', userProfile?.id);
      
      // Encrypt password before storing
      const encryptResponse = await fetch('/api/encrypt-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: cleanPassword })
      });

      const encryptResult = await encryptResponse.json();
      console.log('Encryption response:', encryptResult);
      
      if (!encryptResult.encryptedPassword) {
        throw new Error('Failed to encrypt password');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          email_provider: 'gmail',
          encrypted_email_password: encryptResult.encryptedPassword,
          email_configured: true
        })
        .eq('id', userProfile.id)
        .select();

      console.log('Supabase update result:', { data, error });
      
      if (error) throw error;
      
      alert('Email configuration saved successfully!');
      setEmailPassword('');
      setShowEmailSetup(false);
      await getUserProfile();
    } catch (error) {
      console.error('Save config error:', error);
      alert('Error saving email configuration: ' + error.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const deleteEmailConfig = async () => {
    if (!window.confirm('Are you sure you want to delete your email configuration?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_provider: null,
          encrypted_email_password: null,
          email_configured: false
        })
        .eq('id', userProfile.id);

      if (error) throw error;
      
      alert('Email configuration deleted successfully!');
      getUserProfile();
    } catch (error) {
      alert('Error deleting email configuration: ' + error.message);
    }
  };



  const sendRealEmail = async ({ to, subject, content, contactName, fromName, fromCompany, fromEmail }) => {
    try {
      const payload = {
        to,
        subject,
        content,
        contactName,
        fromName,
        fromCompany,
        fromEmail,
        userId: userProfile?.id
      };
      console.log('Sending email with payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/send-email-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        console.error('Full server error:', text);
        alert('Server error: ' + text.substring(0, 500));
        return { success: false, error: text.substring(0, 200) };
      }
      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  };

  const sendEmails = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    if (!businessInfo.trim()) {
      alert('Please enter your business information');
      return;
    }

    if (!emailContent.trim()) {
      alert('Please write email content');
      return;
    }

    if (emailsSent + selectedContacts.length > maxEmails) {
      alert(`This would exceed your limit of ${maxEmails} emails`);
      return;
    }

    if (!userProfile?.email_configured) {
      alert('Please configure your email settings first');
      return;
    }

    setSending(true);
    setSendingProgress({ current: 0, total: selectedContacts.length });

    try {
      for (let i = 0; i < selectedContacts.length; i++) {
        const contact = contacts.find(c => c.id === selectedContacts[i]);
        
        const ctaLink = `${window.location.origin}/cta-clicked/${contact.id}`;
        const emailWithCTA = emailContent + `\n\n[Let's Talk](${ctaLink})`;

        const result = await sendRealEmail({
          to: contact.email,
          subject: `Quick chat about ${businessInfo.split(' ')[0]}?`,
          content: emailWithCTA,
          contactName: contact.name,
          fromName: userProfile?.username || 'User',
          fromCompany: userProfile?.company_name || 'Company',
          fromEmail: userEmail
        });
        
        if (!result.success) {
          alert('Failed to send email to ' + contact.name + ': ' + result.error);
          setSending(false);
          setSendingProgress(null);
          return;
        }
        
        await supabase.from('email_logs').insert([{
          contact_id: contact.id,
          subject: `Quick chat about ${businessInfo.split(' ')[0]}?`,
          content: emailWithCTA,
          status: 'sent'
        }]);

        setSendingProgress({ current: i + 1, total: selectedContacts.length });

        if (i < selectedContacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }

      alert('Emails sent successfully!');
      setSelectedContacts([]);
      setEmailContent('');
      setBusinessInfo('');
      onEmailSent();
    } catch (error) {
      alert('Error sending emails: ' + error.message);
    } finally {
      setSending(false);
      setSendingProgress(null);
    }
  };

  const canSendEmails = emailsSent < maxEmails && !sending && userProfile?.email_configured;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Cold Email</h2>
        {!canSendEmails && emailsSent >= maxEmails && (
          <span className="text-red-600 text-sm">Email limit reached ({maxEmails})</span>
        )}
      </div>

      {sending && sendingProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-blue-800">
              Sending emails... {sendingProgress.current}/{sendingProgress.total}
            </span>
          </div>
          <div className="mt-2 bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Email Configuration */}
        {userProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Email Configuration</h3>
                {userProfile.email_configured ? (
                  <div>
                    <p className="text-green-700 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Email configured - Ready to send from {userEmail}
                    </p>
                    <p className="text-blue-700 mt-1">
                      Sending as: {userProfile.username} from {userProfile.company_name}
                    </p>
                  </div>
                ) : (
                  <p className="text-orange-700">Email not configured - Please set up your Gmail app password</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEmailSetup(!showEmailSetup)}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {userProfile.email_configured ? 'Update' : 'Setup'}
                </button>
                {userProfile.email_configured && (
                  <button
                    onClick={deleteEmailConfig}
                    className="text-red-600 hover:text-red-800 flex items-center text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            {showEmailSetup && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-medium mb-3">Gmail SMTP Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gmail App Password</label>
                    <input
                      type="password"
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="Enter your Gmail app password"
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="bg-green-50 p-3 rounded text-xs text-green-800">
                    <p className="font-medium mb-2">🔒 Security Information:</p>
                    <p>• Your app password is encrypted with AES-256 before storage</p>
                    <p>• We only use it to send emails on your behalf</p>
                    <p>• You can delete it anytime from this dashboard</p>
                    <p>• Emails are sent directly from your Gmail account</p>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="font-medium mb-1">How to get Gmail App Password:</p>
                    <p>1. Enable 2-Factor Authentication on your Gmail</p>
                    <p>2. Go to Google Account Settings → Security → App passwords</p>
                    <p>3. Generate a new app password for "Mail"</p>
                    <p>4. Copy and paste it above</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEmailConfig}
                      disabled={savingConfig}
                      className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                    >
                      {savingConfig ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button
                      onClick={() => setShowEmailSetup(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Business Information
          </label>
          <textarea
            value={businessInfo}
            onChange={(e) => setBusinessInfo(e.target.value)}
            placeholder="Describe your business, services, or what you're offering..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            rows="3"
            disabled={sending}
          />
        </div>

        {/* Email Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Content
          </label>
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Your email content will appear here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            rows="8"
            disabled={sending}
          />
        </div>

        {/* Contact Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Recipients
          </label>
          {contacts.length === 0 ? (
            <p className="text-gray-500">No contacts available. Add contacts in the CRM tab first.</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {contacts.map((contact) => (
                <label key={contact.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContacts([...selectedContacts, contact.id]);
                      } else {
                        setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                      }
                    }}
                    disabled={sending}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-gray-500 ml-2">{contact.email}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={sendEmails}
          disabled={!canSendEmails || selectedContacts.length === 0 || !emailContent.trim()}
          className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send className="h-5 w-5 mr-2" />
          {sending ? 'Sending...' : `Send to ${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''}`}
        </button>

        {!userProfile?.email_configured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Please configure your Gmail app password above to start sending emails.
            </p>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p>• Emails are sent with 1-minute intervals to avoid spam filters</p>
          <p>• Each email includes a CTA button that adds interested recipients to your CRM</p>
          <p>• You have {maxEmails - emailsSent} emails remaining</p>
        </div>
      </div>
    </div>
  );
};

export default ColdMail;