import { useState, useEffect, useCallback } from 'react';
import { Mail, Send, X, ChevronLeft, FileText, Edit3, Eye } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    subjects: string[];
    expected_hourly_rate?: number;
    assigned_tier?: string;
  } | null;
  onSent?: () => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  category: string;
  created_at: string;
}

function applyVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

export default function SendEmailModal({ isOpen, onClose, candidate, onSent }: SendEmailModalProps) {
  const [step, setStep] = useState<'templates' | 'edit'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Editable variable overrides
  const [variableOverrides, setVariableOverrides] = useState<Record<string, string>>({});

  // Build the variable map from candidate data + overrides
  const buildVariableMap = useCallback(
    (overrides?: Record<string, string>): Record<string, string> => {
      if (!candidate) return {};
      const ov = overrides ?? variableOverrides;
      return {
        teacher_name: candidate.full_name,
        platform_name: ov.platform_name ?? 'Fiverr',
        subjects: candidate.subjects.join(', '),
        interview_link: ov.interview_link ?? '',
        tier_name: candidate.assigned_tier || 'To be assigned',
        hourly_rate:
          candidate.expected_hourly_rate != null
            ? `£${candidate.expected_hourly_rate}`
            : 'To be discussed',
        ...ov,
      };
    },
    [candidate, variableOverrides],
  );

  // Fetch templates on mount / open
  useEffect(() => {
    if (!isOpen) return;
    setStep('templates');
    setSelectedTemplate(null);
    setEditedSubject('');
    setEditedBody('');
    setPreviewMode(false);
    setVariableOverrides({});
    fetchTemplates();
  }, [isOpen]);

  async function fetchTemplates() {
    setLoadingTemplates(true);
    const { data, error } = await supabase
      .from('admin_email_templates')
      .select('*')
      .eq('category', 'recruitment')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load email templates');
    } else {
      setTemplates(data ?? []);
    }
    setLoadingTemplates(false);
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template);
    const vars = buildVariableMap({});
    setEditedSubject(applyVariables(template.subject, vars));
    setEditedBody(applyVariables(template.body, vars));
    setPreviewMode(false);
    setStep('edit');
  }

  function handleVariableChange(key: string, value: string) {
    const newOverrides = { ...variableOverrides, [key]: value };
    setVariableOverrides(newOverrides);

    // Re-apply template with new variable values
    if (selectedTemplate) {
      const vars = buildVariableMap(newOverrides);
      setEditedSubject(applyVariables(selectedTemplate.subject, vars));
      setEditedBody(applyVariables(selectedTemplate.body, vars));
    }
  }

  function goBackToTemplates() {
    setStep('templates');
    setSelectedTemplate(null);
    setEditedSubject('');
    setEditedBody('');
    setPreviewMode(false);
  }

  async function handleSend() {
    if (!candidate || !selectedTemplate) return;
    if (!editedSubject.trim() || !editedBody.trim()) {
      toast.error('Subject and body cannot be empty');
      return;
    }

    setSending(true);
    try {
      // Send the email via edge function
      const { error: sendError } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'admin_notification',
          recipient_email: candidate.email,
          recipient_name: candidate.full_name,
          data: {
            subject: editedSubject,
            message: editedBody,
          },
        },
      });

      if (sendError) throw sendError;

      // Get current user for logging
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insert into admin_email_log
      const { data: emailLogData, error: logError } = await supabase
        .from('admin_email_log')
        .insert({
          sender_id: user?.id,
          recipient_email: candidate.email,
          recipient_name: candidate.full_name,
          subject: editedSubject,
          body: editedBody,
          template_type: selectedTemplate.name,
          status: 'sent',
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Error logging email:', logError);
      }

      // Insert into recruitment_email_log
      const variablesUsed = buildVariableMap();
      const { error: recruitLogError } = await supabase.from('recruitment_email_log').insert({
        candidate_id: candidate.id,
        email_log_id: emailLogData?.id ?? null,
        template_name: selectedTemplate.name,
        sent_by: user?.id,
        variables_used: variablesUsed,
      });

      if (recruitLogError) {
        console.error('Error logging recruitment email:', recruitLogError);
      }

      toast.success(`Email sent to ${candidate.full_name}`);
      onSent?.();
      onClose();
    } catch (err: any) {
      console.error('Error sending email:', err);
      toast.error(err.message || 'Failed to send email');

      // Log failed attempt
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        await supabase.from('admin_email_log').insert({
          sender_id: user?.id,
          recipient_email: candidate.email,
          recipient_name: candidate.full_name,
          subject: editedSubject,
          body: editedBody,
          template_type: selectedTemplate?.name || 'custom',
          status: 'failed',
          error_message: err.message,
        });
      } catch (logErr) {
        console.error('Error logging failed email:', logErr);
      }
    } finally {
      setSending(false);
    }
  }

  if (!isOpen || !candidate) return null;

  // Determine which variables to show in the sidebar
  const allVariableKeys = selectedTemplate?.variables?.length
    ? selectedTemplate.variables
    : [
        'teacher_name',
        'platform_name',
        'subjects',
        'interview_link',
        'tier_name',
        'hourly_rate',
      ];

  const variableMap = buildVariableMap();

  // Variables that the admin can edit
  const editableVariables = new Set(['platform_name', 'interview_link']);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {step === 'templates' ? 'Select Email Template' : 'Compose Email'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                To: {candidate.full_name} ({candidate.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'templates' && (
            <div>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    Loading templates...
                  </span>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recruitment email templates found.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Create templates in the Email section with category "recruitment".
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-emerald-500 hover:shadow-sm transition-all text-left w-full"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {template.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">
                            Subject: {template.subject}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'edit' && selectedTemplate && (
            <div className="space-y-5">
              {/* Back to templates */}
              <button
                onClick={goBackToTemplates}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to templates
              </button>

              {/* Template name badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {selectedTemplate.name}
                </span>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ml-auto"
                >
                  {previewMode ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left side: Subject + Body */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Subject
                    </label>
                    {previewMode ? (
                      <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600">
                        {editedSubject}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                      />
                    )}
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Body
                    </label>
                    {previewMode ? (
                      <div className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 min-h-[256px] whitespace-pre-wrap">
                        {editedBody}
                      </div>
                    ) : (
                      <textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        className="w-full h-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-y"
                      />
                    )}
                  </div>
                </div>

                {/* Right side: Variables panel */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Template Variables
                  </h4>
                  <div className="space-y-3">
                    {allVariableKeys.map((varKey) => {
                      const isEditable = editableVariables.has(varKey);
                      const currentValue = variableMap[varKey] ?? '';
                      return (
                        <div key={varKey}>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-[10px]">
                              {`{{${varKey}}}`}
                            </code>
                          </label>
                          {isEditable ? (
                            <input
                              type="text"
                              value={variableOverrides[varKey] ?? currentValue}
                              onChange={(e) => handleVariableChange(varKey, e.target.value)}
                              placeholder={
                                varKey === 'interview_link'
                                  ? 'Paste interview link...'
                                  : `Enter ${varKey.replace(/_/g, ' ')}...`
                              }
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                            />
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              {currentValue || (
                                <span className="text-gray-400 italic">Not set</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          {step === 'edit' && (
            <button
              onClick={handleSend}
              disabled={sending || !editedSubject.trim() || !editedBody.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2.5 font-medium flex items-center gap-2 transition-colors"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
