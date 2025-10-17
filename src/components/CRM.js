import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit, Trash2, Building, Mail, FileText, Search, Tag, Calendar, Clock, TrendingUp } from 'lucide-react';

const CRM = ({ contacts, onContactsChange, maxContacts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showEmailHistory, setShowEmailHistory] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    notes: '',
    status: 'lead',
    tags: '',
    follow_up_date: '',
    follow_up_notes: ''
  });

  const statuses = [
    { value: 'lead', label: 'Lead', color: 'bg-gray-100 text-gray-800' },
    { value: 'prospect', label: 'Prospect', color: 'bg-blue-100 text-blue-800' },
    { value: 'customer', label: 'Customer', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSave = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      if (editingContact) {
        const { error } = await supabase
          .from('contacts')
          .update(dataToSave)
          .eq('id', editingContact.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contacts')
          .insert([dataToSave]);
        
        if (error) throw error;
      }
      
      setFormData({ name: '', email: '', company: '', notes: '', status: 'lead', tags: '', follow_up_date: '', follow_up_notes: '' });
      setShowForm(false);
      setEditingContact(null);
      onContactsChange();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      company: contact.company || '',
      notes: contact.notes || '',
      status: contact.status || 'lead',
      tags: contact.tags ? contact.tags.join(', ') : '',
      follow_up_date: contact.follow_up_date || '',
      follow_up_notes: contact.follow_up_notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (!error) onContactsChange();
    }
  };

  const viewEmailHistory = async (contactId) => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('contact_id', contactId)
      .order('sent_at', { ascending: false });
    
    if (!error) {
      setEmailHistory(data || []);
      setShowEmailHistory(contactId);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canAddContact = contacts.length < maxContacts;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Contacts</h2>
        <button
          onClick={() => setShowForm(true)}
          disabled={!canAddContact}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {!canAddContact && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">You've reached the maximum of {maxContacts} contacts for the MVP.</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${statusFilter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All ({contacts.length})
          </button>
          {statuses.map(status => (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${statusFilter === status.value ? 'bg-primary-500 text-white' : status.color}`}
            >
              {status.label} ({contacts.filter(c => c.status === status.value).length})
            </button>
          ))}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-xl w-full max-w-md m-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
              <input
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                placeholder="Follow-up Date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                placeholder="Follow-up Notes"
                value={formData.follow_up_notes}
                onChange={(e) => setFormData({...formData, follow_up_notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="2"
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="3"
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600"
                >
                  {editingContact ? 'Update' : 'Add'} Contact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingContact(null);
                    setFormData({ name: '', email: '', company: '', notes: '', status: 'lead', tags: '', follow_up_date: '', follow_up_notes: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email History Modal */}
      {showEmailHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl m-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Email History</h3>
            {emailHistory.length === 0 ? (
              <p className="text-gray-500">No emails sent to this contact yet.</p>
            ) : (
              <div className="space-y-4">
                {emailHistory.map((email) => (
                  <div key={email.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{email.subject}</span>
                      <span className={`text-xs px-2 py-1 rounded ${email.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {email.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{new Date(email.sent_at).toLocaleString()}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{email.content.substring(0, 200)}...</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowEmailHistory(null)}
              className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="h-12 w-12 mx-auto mb-4 text-gray-300 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <p>{searchTerm || statusFilter !== 'all' ? 'No contacts match your filters.' : 'No contacts yet. Add your first contact to get started!'}</p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const statusInfo = statuses.find(s => s.value === contact.status) || statuses[0];
            const isFollowUpDue = contact.follow_up_date && new Date(contact.follow_up_date) <= new Date();
            
            return (
              <div key={contact.id} className={`bg-gray-50 p-4 rounded-lg border ${isFollowUpDue ? 'border-orange-300 bg-orange-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mt-1">
                      <Mail className="h-4 w-4 mr-2" />
                      {contact.email}
                    </div>
                    
                    {contact.company && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <Building className="h-4 w-4 mr-2" />
                        {contact.company}
                      </div>
                    )}
                    
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        {contact.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {contact.follow_up_date && (
                      <div className={`flex items-center mt-2 text-sm ${isFollowUpDue ? 'text-orange-700 font-medium' : 'text-gray-600'}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Follow-up: {new Date(contact.follow_up_date).toLocaleDateString()}
                        {isFollowUpDue && ' (Due!)'}
                      </div>
                    )}
                    
                    {contact.last_contacted && (
                      <div className="flex items-center text-gray-500 mt-1 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        Last contacted: {new Date(contact.last_contacted).toLocaleDateString()}
                      </div>
                    )}
                    
                    {contact.notes && (
                      <div className="flex items-start text-gray-600 mt-2">
                        <FileText className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="text-sm">{contact.notes}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => viewEmailHistory(contact.id)}
                      className="p-2 text-gray-500 hover:text-blue-500"
                      title="View email history"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2 text-gray-500 hover:text-primary-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CRM;