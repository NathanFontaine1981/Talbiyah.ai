import { useState, useEffect } from 'react';
import { Mail, Send, History, FileText, Users, Search, RefreshCw, ChevronDown, X, Check, AlertCircle, Clock, User, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  variables: string[];
  is_active: boolean;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  template_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  metadata: any;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  created_at: string;
}

type TabType = 'compose' | 'history' | 'templates' | 'bulk';

export default function AdminEmail() {
  const [activeTab, setActiveTab] = useState<TabType>('compose');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Compose state
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // User selection
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Email history
  const [emailLog, setEmailLog] = useState<EmailLog[]>([]);

  // Bulk email
  const [bulkRecipients, setBulkRecipients] = useState<User[]>([]);
  const [bulkFilter, setBulkFilter] = useState<'all' | 'students' | 'teachers' | 'parents' | 'inactive'>('all');

  // Preview modal
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    if (activeTab === 'history') {
      fetchEmailLog();
    }
  }, [activeTab]);

  useEffect(() => {
    if (userSearch) {
      const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered.slice(0, 10));
    } else {
      setFilteredUsers([]);
    }
  }, [userSearch, users]);

  async function fetchTemplates() {
    const { data, error } = await supabase
      .from('admin_email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setTemplates(data);
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      if (!error && data) {
        setUsers(data.map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          roles: u.roles || [],
          created_at: u.created_at,
        })));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }

  async function fetchEmailLog() {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_email_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setEmailLog(data);
    }
    setLoading(false);
  }

  function selectUser(user: User) {
    setRecipient(user.email);
    setRecipientName(user.full_name);
    setUserSearch('');
    setShowUserDropdown(false);
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
    setShowTemplateDropdown(false);
  }

  function applyTemplateVariables(text: string, vars: Record<string, string>): string {
    let result = text;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  }

  async function sendEmail() {
    if (!recipient || !subject || !body) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      // Apply template variables if using a template
      const finalSubject = applyTemplateVariables(subject, { user_name: recipientName || 'there' });
      const finalBody = applyTemplateVariables(body, { user_name: recipientName || 'there' });

      // Send the email
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'admin_notification',
          recipient_email: recipient,
          recipient_name: recipientName || 'User',
          data: {
            subject: finalSubject,
            message: finalBody,
          }
        }
      });

      if (error) throw error;

      // Log the email
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_email_log').insert({
        sender_id: user?.id,
        recipient_email: recipient,
        recipient_name: recipientName,
        subject: finalSubject,
        body: finalBody,
        template_type: selectedTemplate?.name || 'custom',
        status: 'sent',
      });

      toast.success(`Email sent to ${recipient}`);

      // Reset form
      setRecipient('');
      setRecipientName('');
      setSubject('');
      setBody('');
      setSelectedTemplate(null);
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error(err.message || 'Failed to send email');

      // Log failed email
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_email_log').insert({
        sender_id: user?.id,
        recipient_email: recipient,
        recipient_name: recipientName,
        subject: subject,
        body: body,
        template_type: selectedTemplate?.name || 'custom',
        status: 'failed',
        error_message: err.message,
      });
    } finally {
      setSending(false);
    }
  }

  async function sendBulkEmails() {
    if (bulkRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }
    if (!subject || !body) {
      toast.error('Please fill in subject and message');
      return;
    }

    const confirmed = confirm(`Send email to ${bulkRecipients.length} recipients?`);
    if (!confirmed) return;

    setSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const user of bulkRecipients) {
      try {
        const finalSubject = applyTemplateVariables(subject, { user_name: user.full_name || 'there' });
        const finalBody = applyTemplateVariables(body, { user_name: user.full_name || 'there' });

        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'admin_notification',
            recipient_email: user.email,
            recipient_name: user.full_name || 'User',
            data: {
              subject: finalSubject,
              message: finalBody,
            }
          }
        });

        // Log successful email
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        await supabase.from('admin_email_log').insert({
          sender_id: adminUser?.id,
          recipient_email: user.email,
          recipient_name: user.full_name,
          recipient_user_id: user.id,
          subject: finalSubject,
          body: finalBody,
          template_type: selectedTemplate?.name || 'bulk_custom',
          status: 'sent',
          metadata: { bulk_send: true, total_recipients: bulkRecipients.length }
        });

        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Failed to send to ${user.email}:`, err);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setSending(false);
    toast.success(`Sent ${successCount} emails successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setBulkRecipients([]);
  }

  function filterUsersForBulk() {
    let filtered = users.filter(u => u.email); // Must have email

    switch (bulkFilter) {
      case 'students':
        filtered = filtered.filter(u => u.roles?.includes('student'));
        break;
      case 'teachers':
        filtered = filtered.filter(u => u.roles?.includes('teacher'));
        break;
      case 'parents':
        filtered = filtered.filter(u => u.roles?.includes('parent'));
        break;
      case 'inactive':
        // Would need last_sign_in data for this
        break;
    }

    return filtered;
  }

  function toggleBulkRecipient(user: User) {
    if (bulkRecipients.find(r => r.id === user.id)) {
      setBulkRecipients(bulkRecipients.filter(r => r.id !== user.id));
    } else {
      setBulkRecipients([...bulkRecipients, user]);
    }
  }

  function selectAllFiltered() {
    const filtered = filterUsersForBulk();
    setBulkRecipients(filtered);
  }

  function clearBulkSelection() {
    setBulkRecipients([]);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Mail className="w-8 h-8 text-emerald-500" />
              Admin Email Center
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Send emails and manage communications</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'compose', label: 'Compose', icon: Send },
            { id: 'bulk', label: 'Bulk Send', icon: Users },
            { id: 'history', label: 'History', icon: History },
            { id: 'templates', label: 'Templates', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch || recipient}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setRecipient(e.target.value);
                      setShowUserDropdown(true);
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder="Search for user or enter email..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />

                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                        >
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {recipientName && (
                  <p className="mt-1 text-sm text-emerald-600">Sending to: {recipientName}</p>
                )}
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template (Optional)
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between"
                  >
                    <span className={selectedTemplate ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                      {selectedTemplate ? selectedTemplate.name : 'Select a template...'}
                    </span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>

                  {showTemplateDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          setSelectedTemplate(null);
                          setShowTemplateDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500"
                      >
                        No template (custom email)
                      </button>
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                          <p className="text-sm text-gray-500">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message here...

Use {{user_name}} to insert the recipient's name."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Available variables: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{'{{user_name}}'}</code>
                </p>
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  onClick={sendEmail}
                  disabled={sending || !recipient || !subject || !body}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Send Tab */}
        {activeTab === 'bulk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recipient Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Recipients
              </h3>

              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: 'all', label: 'All Users' },
                  { id: 'students', label: 'Students' },
                  { id: 'teachers', label: 'Teachers' },
                  { id: 'parents', label: 'Parents' },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setBulkFilter(filter.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      bulkFilter === filter.id
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllFiltered}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200"
                >
                  Select All ({filterUsersForBulk().length})
                </button>
                <button
                  onClick={clearBulkSelection}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Clear Selection
                </button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-80 overflow-y-auto">
                {filterUsersForBulk().map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <input
                      type="checkbox"
                      checked={bulkRecipients.some(r => r.id === user.id)}
                      onChange={() => toggleBulkRecipient(user)}
                      className="w-4 h-4 text-emerald-500 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{user.full_name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-1">
                      {user.roles?.map((role) => (
                        <span key={role} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs capitalize">
                          {role}
                        </span>
                      ))}
                    </div>
                  </label>
                ))}
              </div>

              <p className="mt-3 text-sm text-emerald-600 font-medium">
                {bulkRecipients.length} recipients selected
              </p>
            </div>

            {/* Email Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Content
              </h3>

              <div className="space-y-4">
                {/* Template Selection */}
                <div className="relative">
                  <button
                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left flex items-center justify-between text-sm"
                  >
                    <span className={selectedTemplate ? 'text-gray-900 dark:text-white' : 'text-gray-500'}>
                      {selectedTemplate ? selectedTemplate.name : 'Select template...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showTemplateDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => selectTemplate(template)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />

                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Message body..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />

                <button
                  onClick={sendBulkEmails}
                  disabled={sending || bulkRecipients.length === 0 || !subject || !body}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sending to {bulkRecipients.length} recipients...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send to {bulkRecipients.length} Recipients
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Email History</h3>
              <button
                onClick={fetchEmailLog}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {emailLog.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No emails sent yet</p>
                </div>
              ) : (
                emailLog.map((email) => (
                  <div key={email.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {email.status === 'sent' ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {email.subject}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          To: {email.recipient_name || email.recipient_email}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(email.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          {email.template_type && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {email.template_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setPreviewEmail(email)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Email Templates</h3>
              <p className="text-sm text-gray-500">Pre-configured templates for common communications</p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {templates.map((template) => (
                <div key={template.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        selectTemplate(template);
                        setActiveTab('compose');
                      }}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                    >
                      Use Template
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.subject}</p>
                  </div>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs text-gray-500">Variables:</span>
                      {template.variables.map((v) => (
                        <code key={v} className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Preview Modal */}
        {previewEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Email Preview</h3>
                <button
                  onClick={() => setPreviewEmail(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">To:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{previewEmail.recipient_email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Subject:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{previewEmail.subject}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Sent:</span>
                    <p className="text-gray-700 dark:text-gray-300">
                      {format(new Date(previewEmail.created_at), 'MMMM d, yyyy \'at\' HH:mm')}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500">Message:</span>
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {previewEmail.body}
                    </div>
                  </div>
                  {previewEmail.error_message && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-400">
                        <strong>Error:</strong> {previewEmail.error_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
