import { useState } from 'react';
import { X, Send, Calendar, Clock, MessageSquare } from 'lucide-react';

interface MessageTemplate {
  id: string;
  template_code: string;
  template_text: string;
  sender_role: 'student' | 'teacher';
  requires_response: boolean;
  requires_data: any;
  display_order: number;
}

interface MessageTemplateSelectorProps {
  templates: MessageTemplate[];
  onSelect: (templateCode: string, data: any) => Promise<void>;
  onCancel: () => void;
  sending: boolean;
}

export default function MessageTemplateSelector({
  templates,
  onSelect,
  onCancel,
  sending,
}: MessageTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState<any>({});

  const handleTemplateClick = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;

    const data = selectedTemplate.requires_data
      ? { value: formData.value }
      : null;

    await onSelect(selectedTemplate.template_code, data);
    setSelectedTemplate(null);
    setFormData({});
  };

  const renderDataInput = () => {
    if (!selectedTemplate?.requires_data) return null;

    const dataType = selectedTemplate.requires_data.type;

    if (dataType === 'datetime') {
      // Datetime picker
      const minDate = new Date();
      minDate.setHours(minDate.getHours() + 1); // At least 1 hour from now

      return (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Select Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.value || ''}
            onChange={(e) => setFormData({ value: e.target.value })}
            min={minDate.toISOString().slice(0, 16)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            required
          />
        </div>
      );
    }

    if (dataType === 'minutes') {
      // Minutes selector
      const options = selectedTemplate.requires_data.options || [5, 10, 15, 20];

      return (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Select Minutes
          </label>
          <div className="grid grid-cols-4 gap-2">
            {options.map((mins: number) => (
              <button
                key={mins}
                type="button"
                onClick={() => setFormData({ value: mins })}
                className={`px-4 py-2 rounded-lg border-2 transition ${
                  formData.value === mins
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-900 font-semibold'
                    : 'border-gray-300 hover:border-cyan-300'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (dataType === 'text') {
      // Free text input (with character limit)
      const maxLength = selectedTemplate.requires_data.max_length || 100;

      return (
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Your Question
          </label>
          <textarea
            value={formData.value || ''}
            onChange={(e) => setFormData({ value: e.target.value })}
            maxLength={maxLength}
            placeholder="Type your question here..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[80px]"
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {(formData.value || '').length}/{maxLength} characters
            </p>
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ No contact info allowed
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const canSend = () => {
    if (!selectedTemplate) return false;
    if (!selectedTemplate.requires_data) return true;
    return formData.value && formData.value.length > 0;
  };

  if (!selectedTemplate) {
    // Template selection screen
    return (
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">Choose a message</h4>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {templates.map((template) => {
            const preview = template.template_text
              .replace('{new_datetime}', '[date/time]')
              .replace('{time}', '[time]')
              .replace('{minutes}', '[minutes]')
              .replace('{question}', '[your question]');

            return (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition group"
              >
                <p className="text-sm font-medium text-gray-900 group-hover:text-cyan-900">
                  {preview}
                </p>
                {template.requires_response && (
                  <span className="inline-block mt-1 text-xs text-amber-600 font-medium">
                    ⏳ Requires teacher response
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Template form screen
  const previewText = selectedTemplate.template_text
    .replace('{new_datetime}', formData.value ? new Date(formData.value).toLocaleString() : '[date/time]')
    .replace('{time}', formData.value ? new Date(formData.value).toLocaleTimeString() : '[time]')
    .replace('{minutes}', formData.value || '[minutes]')
    .replace('{question}', formData.value || '[your question]');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Compose message</h4>
        <button
          onClick={() => setSelectedTemplate(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message preview */}
      <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-3">
        <p className="text-sm text-cyan-900">
          <strong>Preview:</strong> {previewText}
        </p>
      </div>

      {/* Data input */}
      {renderDataInput()}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => setSelectedTemplate(null)}
          disabled={sending}
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSend}
          disabled={!canSend() || sending}
          className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>
      </div>
    </div>
  );
}
