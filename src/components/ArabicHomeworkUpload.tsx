import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
  Send,
  Paperclip,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Confidence levels for student self-assessment
const CONFIDENCE_LEVELS = [
  { value: 1, label: 'Need More Practice', color: 'red', description: 'Still learning the basics, need more repetition' },
  { value: 2, label: 'Getting There', color: 'amber', description: 'Understand some concepts but need reinforcement' },
  { value: 3, label: 'Fairly Confident', color: 'yellow', description: 'Can recall most vocabulary and apply rules with effort' },
  { value: 4, label: 'Strong', color: 'emerald', description: 'Feel comfortable with the material, minor gaps' },
  { value: 5, label: 'Mastered', color: 'cyan', description: 'Can use vocabulary and rules naturally and fluently' },
];

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface HomeworkSubmission {
  id: string;
  uploaded_files: UploadedFile[] | null;
  student_notes: string | null;
  confidence_level: number | null;
  quiz_score: number | null;
  quiz_total: number | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
  submitted_at: string | null;
  teacher_feedback: string | null;
  teacher_rating: string | null;
  reviewed_at: string | null;
}

interface ArabicHomeworkUploadProps {
  syllabusId: string;
  unitTitle: string;
  learnerId: string;
  existingSubmission?: HomeworkSubmission | null;
  onSubmitted?: () => void;
}

export default function ArabicHomeworkUpload({
  syllabusId,
  unitTitle,
  learnerId,
  existingSubmission,
  onSubmitted
}: ArabicHomeworkUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    existingSubmission?.uploaded_files || []
  );
  const [studentNotes, setStudentNotes] = useState(existingSubmission?.student_notes || '');
  const [confidenceLevel, setConfidenceLevel] = useState<number | null>(
    existingSubmission?.confidence_level || null
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('Some files were skipped. Only images, PDFs, and Word docs under 10MB are allowed.');
    }
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<UploadedFile[]> => {
    const uploaded: UploadedFile[] = [...uploadedFiles];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${learnerId}/${syllabusId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('homework')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload ${file.name}`);
      }

      const { data: urlData } = supabase.storage
        .from('homework')
        .getPublicUrl(fileName);

      uploaded.push({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size
      });
    }

    return uploaded;
  };

  const handleSubmit = async () => {
    if (files.length === 0 && uploadedFiles.length === 0 && !studentNotes.trim()) {
      setError('Please add files or notes before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload any new files
      let allFiles = uploadedFiles;
      if (files.length > 0) {
        setUploading(true);
        allFiles = await uploadFiles();
        setUploading(false);
      }

      // Create or update submission
      const submissionData = {
        syllabus_id: syllabusId,
        learner_id: learnerId,
        course_type: 'arabic',
        uploaded_files: allFiles,
        student_notes: studentNotes.trim() || null,
        confidence_level: confidenceLevel,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      if (existingSubmission?.id) {
        const { error: updateError } = await supabase
          .from('homework_submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('homework_submissions')
          .insert(submissionData);

        if (insertError) throw insertError;
      }

      setFiles([]);
      setUploadedFiles(allFiles);
      onSubmitted?.();
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit homework');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isReviewed = existingSubmission?.status === 'reviewed';
  const isSubmitted = existingSubmission?.status === 'submitted';

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600/20 to-amber-600/20 p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Homework for {unitTitle}</h3>
              <p className="text-xs text-slate-400">Upload your completed work</p>
            </div>
          </div>
          {existingSubmission && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isReviewed
                ? 'bg-emerald-500/20 text-emerald-400'
                : isSubmitted
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              {existingSubmission.status === 'reviewed' ? 'Reviewed' :
               existingSubmission.status === 'submitted' ? 'Submitted' :
               existingSubmission.status === 'needs_revision' ? 'Needs Revision' : 'Draft'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Teacher Feedback (if reviewed) */}
        {isReviewed && existingSubmission?.teacher_feedback && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">Teacher Feedback</span>
              {existingSubmission.teacher_rating && (
                <span className="ml-auto flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {existingSubmission.teacher_rating}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm">{existingSubmission.teacher_feedback}</p>
            {existingSubmission.reviewed_at && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Reviewed {new Date(existingSubmission.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Quiz Results (if any) */}
        {existingSubmission && existingSubmission.quiz_score !== null && existingSubmission.quiz_total !== null && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-cyan-400" />
                <span className="font-semibold text-cyan-400">Quiz Score</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">
                  {existingSubmission.quiz_score}/{existingSubmission.quiz_total}
                </span>
                <span className="text-sm text-slate-400 ml-2">
                  ({Math.round((existingSubmission.quiz_score / existingSubmission.quiz_total) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Confidence/Retention Level Selector */}
        {!isReviewed ? (
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">How confident do you feel about this unit?</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Help your teacher understand your retention level so they can focus on reinforcing areas where you need more practice.
            </p>
            <div className="space-y-2">
              {CONFIDENCE_LEVELS.map((level) => {
                const isSelected = confidenceLevel === level.value;
                const colorClasses: Record<string, string> = {
                  red: isSelected ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-slate-600 hover:border-red-500/50',
                  amber: isSelected ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-slate-600 hover:border-amber-500/50',
                  yellow: isSelected ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'border-slate-600 hover:border-yellow-500/50',
                  emerald: isSelected ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600 hover:border-emerald-500/50',
                  cyan: isSelected ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-slate-600 hover:border-cyan-500/50',
                };
                return (
                  <button
                    key={level.value}
                    onClick={() => setConfidenceLevel(level.value)}
                    className={`w-full p-3 rounded-lg border-2 transition text-left ${colorClasses[level.color]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? level.color === 'red' ? 'bg-red-500/30 text-red-300'
                            : level.color === 'amber' ? 'bg-amber-500/30 text-amber-300'
                            : level.color === 'yellow' ? 'bg-yellow-500/30 text-yellow-300'
                            : level.color === 'emerald' ? 'bg-emerald-500/30 text-emerald-300'
                            : 'bg-cyan-500/30 text-cyan-300'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {level.value}
                        </div>
                        <div>
                          <p className={`font-medium ${isSelected ? '' : 'text-white'}`}>{level.label}</p>
                          <p className="text-xs text-slate-500">{level.description}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : existingSubmission?.confidence_level && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-purple-400">Your Confidence Level</span>
            </div>
            {(() => {
              const level = CONFIDENCE_LEVELS.find(l => l.value === existingSubmission.confidence_level);
              if (!level) return null;
              return (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    level.color === 'red' ? 'bg-red-500/30 text-red-300'
                    : level.color === 'amber' ? 'bg-amber-500/30 text-amber-300'
                    : level.color === 'yellow' ? 'bg-yellow-500/30 text-yellow-300'
                    : level.color === 'emerald' ? 'bg-emerald-500/30 text-emerald-300'
                    : 'bg-cyan-500/30 text-cyan-300'
                  }`}>
                    {level.value}
                  </div>
                  <div>
                    <p className="font-medium text-white">{level.label}</p>
                    <p className="text-xs text-slate-400">{level.description}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Uploaded Files</p>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.type)}
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 truncate max-w-[200px]"
                    >
                      {file.name}
                    </a>
                    <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                  </div>
                  {!isReviewed && (
                    <button
                      onClick={() => removeUploadedFile(index)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Files to Upload */}
        {files.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2">Files to Upload</p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.type)}
                    <span className="text-sm text-white truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-500/20 rounded text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        {!isReviewed && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-orange-500/50 rounded-xl text-slate-400 hover:text-orange-400 transition flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              <span>Add Files (Images, PDF, Word)</span>
            </button>
          </div>
        )}

        {/* Student Notes */}
        {!isReviewed ? (
          <div>
            <label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notes for Teacher (optional)
            </label>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Any questions or comments about this homework..."
              className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
              rows={3}
            />
          </div>
        ) : existingSubmission?.student_notes && (
          <div>
            <p className="text-sm text-slate-400 mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Your Notes
            </p>
            <p className="text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2">
              {existingSubmission.student_notes}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        {!isReviewed && (
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading || (files.length === 0 && uploadedFiles.length === 0 && !studentNotes.trim())}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : isSubmitted ? (
              <>
                <Send className="w-5 h-5" />
                Update Submission
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Homework
              </>
            )}
          </button>
        )}

        {/* Submission Info */}
        {existingSubmission?.submitted_at && (
          <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Submitted {new Date(existingSubmission.submitted_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
