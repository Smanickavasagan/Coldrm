import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { showAlert } from './Alert';
import { Users, Mail, LogOut, Home, User, Lock, Key, MessageSquare, Gift, Copy } from 'lucide-react';
import CRM from './CRM';
import ColdMail from './ColdMail';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [contacts, setContacts] = useState([]);
  const [emailsSent, setEmailsSent] = useState(0);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ username: '', company_name: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    const initDashboard = async () => {
      await getUser();
      fetchContacts();
      fetchEmailCount();
    };
    initDashboard();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      await ensureProfile(user);
      await getUserProfile(user.id);
    }
  };

  const getUserProfile = async (userId) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        username, 
        company_name, 
        referral_code, 
        referred_by, 
        bonus_contacts, 
        bonus_emails,
        referrer:profiles!referred_by(username)
      `)
      .eq('id', userId)
      .single();
    
    if (!error && profile) {
      setUserProfile(profile);
      setProfileData({ username: profile.username || '', company_name: profile.company_name || '' });
    }
  };

  const updateProfile = async () => {
    if (!profileData.username.trim() || !profileData.company_name.trim()) {
      showAlert('Please fill in both name and company', 'warning');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: profileData.username.trim(),
        company_name: profileData.company_name.trim()
      })
      .eq('id', user.id);

    if (error) {
      showAlert('Error updating profile: ' + error.message, 'error');
    } else {
      showAlert('Profile updated successfully!', 'success');
      setUserProfile({ username: profileData.username, company_name: profileData.company_name });
      setEditingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showAlert('Please fill in all password fields', 'warning');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showAlert('New password must be at least 6 characters', 'warning');
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        showAlert('Current password is incorrect', 'error');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        showAlert('Error updating password: ' + updateError.message, 'error');
      } else {
        showAlert('Password updated successfully!', 'success');
        setChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      showAlert('Error changing password: ' + error.message, 'error');
    }
  };

  const sendPasswordReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      showAlert('Error sending reset email: ' + error.message, 'error');
    } else {
      showAlert('Password reset email sent! Check your inbox.', 'success');
    }
  };

  const ensureProfile = async (user) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist, create it
    if (error && error.code === 'PGRST116') {
      const userReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const usedReferralCode = user.user_metadata?.referral_code;
      
      // Process referral if provided
      let bonusContacts = 0;
      let bonusEmails = 0;
      let referredBy = null;
      
      if (usedReferralCode) {
        try {
          const response = await fetch('/api/process-referral', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
              refereeId: user.id,
              referralCode: usedReferralCode
            })
          });
          
          const result = await response.json();
          if (result.success) {
            bonusContacts = 5;
            bonusEmails = 5;
            referredBy = usedReferralCode;
          }
        } catch (error) {
          console.error('Referral processing failed:', error);
        }
      }

      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          username: user.user_metadata?.username || 'User',
          company_name: user.user_metadata?.company_name || 'Company',
          email_configured: false,
          notify_full_version: user.user_metadata?.notify_full_version ?? true,
          referral_code: userReferralCode,
          bonus_contacts: bonusContacts,
          bonus_emails: bonusEmails,
          referred_by: referredBy
        }]);

      if (createError) {
        console.error('Failed to create profile:', createError);
      }
    }
  };

  const adminEmails = ['manickavasagan022@gmail.com', 'manickavasagan60@gmail.com'];
  const isAdminAccount = user?.email && adminEmails.includes(user.email);
  const baseContacts = 20;
  const baseEmails = 15;
  const bonusContacts = userProfile?.bonus_contacts || 0;
  const bonusEmails = userProfile?.bonus_emails || 0;
  const maxContacts = isAdminAccount ? 999999 : baseContacts + bonusContacts;
  const maxEmails = isAdminAccount ? 999999 : baseEmails + bonusEmails;

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setContacts(data || []);
  };

  const fetchEmailCount = async () => {
    const { count } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true });
    
    setEmailsSent(count || 0);
  };

  const sendFeedback = async () => {
    if (!feedback.trim()) {
      showAlert('Please enter your feedback', 'warning');
      return;
    }

    setSendingFeedback(true);
    try {
      const response = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          userEmail: user?.email,
          userName: userProfile?.username,
          companyName: userProfile?.company_name,
          feedback: feedback
        })
      });

      const result = await response.json();
      if (result.success) {
        showAlert('Feedback sent successfully! Thank you.', 'success');
        setFeedback('');
        setShowFeedback(false);
      } else {
        showAlert('Failed to send feedback: ' + result.error, 'error');
      }
    } catch (error) {
      showAlert('Error sending feedback: ' + error.message, 'error');
    } finally {
      setSendingFeedback(false);
    }
  };



  const copyReferralCode = () => {
    if (userProfile?.referral_code) {
      navigator.clipboard.writeText(userProfile.referral_code);
      showAlert('Referral code copied to clipboard!', 'success');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">COLDrm Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <Home className="h-5 w-5 mr-2" />
                Home
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Feedback
              </button>
              <button
                onClick={() => setShowReferral(true)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <Gift className="h-5 w-5 mr-2" />
                Referral
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-800">{contacts.length}/{isAdminAccount ? '∞' : maxContacts}</p>
                {bonusContacts > 0 && !isAdminAccount && (
                  <p className="text-xs text-green-600">+{bonusContacts} bonus</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-800">{emailsSent}/{isAdminAccount ? '∞' : maxEmails}</p>
                {bonusEmails > 0 && !isAdminAccount && (
                  <p className="text-xs text-green-600">+{bonusEmails} bonus</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('crm')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'crm'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                CRM
              </button>
              <button
                onClick={() => setActiveTab('coldmail')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'coldmail'
                    ? 'border-b-2 border-primary-500 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Cold Mail
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Profile Settings</h2>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {editingProfile ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {editingProfile ? (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                        <input
                          type="text"
                          value={profileData.company_name}
                          onChange={(e) => setProfileData({...profileData, company_name: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter your company name"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={updateProfile}
                          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingProfile(false);
                            setProfileData({ username: userProfile?.username || '', company_name: userProfile?.company_name || '' });
                          }}
                          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-gray-900 text-lg">{userProfile?.username || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                        <p className="text-gray-900 text-lg">{userProfile?.company_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900 text-lg">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Password Settings</h3>
                      {changingPassword ? (
                        <div className="bg-white p-4 border rounded-lg space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Enter new password (min 6 characters)"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                              placeholder="Confirm new password"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={changePassword}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Update Password
                            </button>
                            <button
                              onClick={() => {
                                setChangingPassword(false);
                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              }}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setChangingPassword(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center"
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Change Password
                          </button>
                          <button
                            onClick={sendPasswordReset}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'crm' && (
              <CRM 
                contacts={contacts} 
                onContactsChange={fetchContacts}
                maxContacts={maxContacts}
              />
            )}
            {activeTab === 'coldmail' && (
              <ColdMail 
                contacts={contacts}
                emailsSent={emailsSent}
                onEmailSent={fetchEmailCount}
                maxEmails={maxEmails}
              />
            )}
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4">Send Feedback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or report issues..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="6"
                  disabled={sendingFeedback}
                />
              </div>
              <div className="text-xs text-gray-500">
                <p>Your feedback will be sent to the development team along with your contact information.</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={sendFeedback}
                  disabled={sendingFeedback || !feedback.trim()}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {sendingFeedback ? 'Sending...' : 'Send Feedback'}
                </button>
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setFeedback('');
                  }}
                  disabled={sendingFeedback}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {showReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4">Referral Program</h3>
            
            {/* Your Referral Code */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Your Referral Code</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={userProfile?.referral_code || ''}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded bg-gray-50 text-center font-mono text-lg"
                />
                <button
                  onClick={copyReferralCode}
                  className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Share this code to earn +10 emails & +10 contacts per referral!
              </p>
            </div>

            {/* Referral Status */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Referral Status</h4>
              <p className="text-sm text-gray-600 mb-2">
                Referral codes can only be used during account creation.
              </p>

              {userProfile?.referred_by ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-sm">
                    ✅ You were referred by: <span className="font-semibold">{userProfile.referrer?.username || 'Unknown User'}</span>
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    Code used: <span className="font-mono">{userProfile.referred_by}</span>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-gray-600 text-sm">
                    No referral code was used during signup.
                  </p>
                </div>
              )}
            </div>

            {/* Rewards Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <h5 className="font-medium text-blue-800 mb-1">Referral Rewards:</h5>
              <p className="text-blue-700">• You get: +10 emails & +10 contacts per referral</p>
              <p className="text-blue-700">• They get: +5 emails & +5 contacts</p>
            </div>

            <button
              onClick={() => setShowReferral(false)}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;