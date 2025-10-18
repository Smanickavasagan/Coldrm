import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { showAlert } from './Alert';
import { Gift, ArrowLeft } from 'lucide-react';

const EnrollPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasEnrolled, setHasEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    feedback: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showAlert('Please login to enroll', 'warning');
      navigate('/auth');
    } else {
      setUser(user);
      setFormData(prev => ({ ...prev, email: user.email }));
      await checkEnrollmentStatus(user.id);
    }
  };

  const checkEnrollmentStatus = async (userId) => {
    try {
      const { count, error } = await supabase
        .from('email_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('subject', 'COLDrm - Lifetime Free Access Enrollment');
      
      console.log('Frontend enrollment check - User:', userId, 'Count:', count, 'Error:', error);
      setHasEnrolled(count > 0);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send enrollment email via API
      const response = await fetch('/api/send-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          ...formData,
          userEmail: user.email,
          userId: user.id
        }),
        credentials: 'same-origin'
      });

      const result = await response.json();
      
      if (result.success) {
        showAlert('Enrollment submitted successfully! We will contact you soon.', 'success');
        navigate('/dashboard');
      } else {
        showAlert('Error: ' + (result.error || 'Please try again.'), 'error');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      showAlert('Network error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Lifetime Free Access Giveaway!
            </h1>
            <p className="text-gray-600">
              15 random users will get lifetime free access to COLDrm Premium
            </p>
          </div>

          {checkingEnrollment ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Checking enrollment status...</p>
            </div>
          ) : hasEnrolled ? (
            <div className="text-center py-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  ✅ Already Enrolled!
                </h3>
                <p className="text-green-700">
                  You have already submitted your enrollment for the lifetime free access giveaway. 
                  Winners will be announced during the launch.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (for updates)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you need COLDrm?
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="Tell us about your business and how COLDrm will help you..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback & Suggestions
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="Share your thoughts about COLDrm and what features you'd like to see..."
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your enrollment will be sent to our team. 
                Winners will be announced while launching.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 font-semibold text-lg"
            >
              {loading ? 'Submitting...' : 'Enroll for Free Access'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollPage;