import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, Mail, LogOut, Home } from 'lucide-react';
import CRM from './CRM';
import ColdMail from './ColdMail';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('crm');
  const [contacts, setContacts] = useState([]);
  const [emailsSent, setEmailsSent] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser();
    fetchContacts();
    fetchEmailCount();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

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
                <p className="text-2xl font-bold text-gray-800">{contacts.length}/20</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-800">{emailsSent}/15</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b">
            <nav className="flex">
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
            {activeTab === 'crm' && (
              <CRM 
                contacts={contacts} 
                onContactsChange={fetchContacts}
                maxContacts={20}
              />
            )}
            {activeTab === 'coldmail' && (
              <ColdMail 
                contacts={contacts}
                emailsSent={emailsSent}
                onEmailSent={fetchEmailCount}
                maxEmails={15}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;