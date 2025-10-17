import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Users, Zap, ArrowRight, Gift, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

const LandingPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">COLDrm</div>
          <div className="space-x-4">
            {session ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-800">Dashboard</Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition flex items-center inline-flex"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-gray-600 hover:text-gray-800">Login</Link>
                <Link to="/auth" className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Giveaway Banner */}
      <div className="container mx-auto px-6 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <Gift className="h-12 w-12 mr-4" />
              <div>
                <h3 className="text-2xl font-bold">🎉 Lifetime Free Access Giveaway!</h3>
                <p className="text-purple-100">15 random users will get lifetime free access to COLDrm Premium</p>
              </div>
            </div>
            <Link 
              to="/enroll" 
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center"
            >
              Enroll Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          COLDrm — Simple CRM + Cold Email Tool for Freelancers
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Manage your client contacts and send personalized cold emails that sound human. 
          Perfect for freelancers and small business owners.
        </p>
        <div className="space-x-4">
          {session ? (
            <Link to="/dashboard" className="bg-primary-500 text-white px-8 py-4 rounded-lg text-lg hover:bg-primary-600 transition inline-flex items-center">
              Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link to="/auth" className="bg-primary-500 text-white px-8 py-4 rounded-lg text-lg hover:bg-primary-600 transition inline-flex items-center">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-16">Everything You Need</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Users className="h-12 w-12 text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold mb-4">Smart CRM</h3>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>✓ Manage up to 20 contacts</li>
              <li>✓ Status pipeline (Lead → Prospect → Customer)</li>
              <li>✓ Add tags & notes</li>
              <li>✓ Follow-up reminders</li>
              <li>✓ Email history tracking</li>
              <li>✓ Search & filter contacts</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Mail className="h-12 w-12 text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold mb-4">Cold Email System</h3>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>✓ Send up to 15 emails</li>
              <li>✓ Use your own Gmail account</li>
              <li>✓ Personalized with receiver name</li>
              <li>✓ CTA button tracking</li>
              <li>✓ Rate limiting (1 email/min)</li>
              <li>✓ Email delivery tracking</li>
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <Zap className="h-12 w-12 text-primary-500 mb-4" />
            <h3 className="text-xl font-semibold mb-4">Security & More</h3>
            <ul className="text-gray-600 space-y-2 text-sm">
              <li>✓ AES-256 password encryption</li>
              <li>✓ Email confirmation</li>
              <li>✓ Password reset</li>
              <li>✓ Auto-interested tracking</li>
              <li>✓ Secure SMTP sending</li>
              <li>✓ Fast & responsive UI</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MVP Limits */}
      <section className="container mx-auto px-6 py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">MVP Limits</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg">
              <p className="text-4xl font-bold text-primary-500 mb-2">20</p>
              <p className="text-gray-600">Contacts Maximum</p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <p className="text-4xl font-bold text-primary-500 mb-2">15</p>
              <p className="text-gray-600">Cold Emails Maximum</p>
            </div>
          </div>
          <p className="text-gray-600 mt-6">Perfect for testing and small campaigns!</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 COLDrm. Built for freelancers and small businesses.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;