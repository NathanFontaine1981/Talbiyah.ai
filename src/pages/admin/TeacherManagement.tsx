import { useEffect, useState } from 'react';
import { Check, X, Loader2, Mail, Calendar, User, Clock, CheckCircle, ChevronDown, ChevronUp, MapPin, Phone, Globe, GraduationCap, BookOpen, Video } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface TeacherApplication {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  status: string;
  full_name: string;
  email: string;
  created_at: string;
  phone_number: string | null;
  location: string | null;
  timezone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  education_level: string | null;
  islamic_learning_interests: string[] | null;
  video_intro_url: string | null;
}

export default function TeacherManagement() {
  const [pendingApplications, setPendingApplications] = useState<TeacherApplication[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      setLoading(true);

      // Fetch teacher profiles
      const { data: teacherProfilesData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('id, user_id, bio, hourly_rate, status, created_at, education_level, islamic_learning_interests, video_intro_url')
        .order('created_at', { ascending: false });

      if (teacherError) {
        console.error('Fetch error:', teacherError);
        throw teacherError;
      }

      if (!teacherProfilesData || teacherProfilesData.length === 0) {
        setPendingApplications([]);
        setApprovedTeachers([]);
        setLoading(false);
        return;
      }

      // Fetch corresponding profiles
      const userIds = teacherProfilesData.map(tp => tp.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number, location, timezone, date_of_birth, gender')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      // Create a map of user_id to profile data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const formattedData = teacherProfilesData?.map(teacher => {
        const profile = profilesMap.get(teacher.user_id);
        return {
          id: teacher.id,
          user_id: teacher.user_id,
          bio: teacher.bio,
          hourly_rate: teacher.hourly_rate,
          status: teacher.status,
          created_at: teacher.created_at,
          education_level: teacher.education_level,
          islamic_learning_interests: teacher.islamic_learning_interests,
          video_intro_url: teacher.video_intro_url,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || 'N/A',
          phone_number: profile?.phone_number || null,
          location: profile?.location || null,
          timezone: profile?.timezone || null,
          date_of_birth: profile?.date_of_birth || null,
          gender: profile?.gender || null,
        };
      }) || [];

      setPendingApplications(formattedData.filter(t => t.status === 'pending_approval'));
      setApprovedTeachers(formattedData.filter(t => t.status === 'approved'));
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(teacherId: string) {
    setProcessingId(teacherId);
    try {
      // Find the teacher to get their email and name
      const teacher = [...pendingApplications, ...approvedTeachers].find(t => t.id === teacherId);

      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', teacherId);

      if (updateError) throw updateError;

      // Send approval email notification
      if (teacher) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'teacher_approved',
              recipient_email: teacher.email,
              recipient_name: teacher.full_name,
              data: {}
            }
          });
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
          // Don't fail the approval if email fails
        }
      }

      await fetchTeachers();
      toast.success('Teacher approved successfully! They will need to set their availability before students can book.');
    } catch (error) {
      console.error('Error approving teacher:', error);
      toast.error('Failed to approve teacher. Please try again.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(teacherId: string) {
    setProcessingId(teacherId);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'rejected' })
        .eq('id', teacherId);

      if (error) throw error;

      await fetchTeachers();
      toast.info('Teacher application rejected.');
    } catch (error) {
      console.error('Error rejecting teacher:', error);
      toast.error('Failed to reject teacher. Please try again.');
    } finally {
      setProcessingId(null);
    }
  }

  const TeacherCard = ({ teacher }: { teacher: TeacherApplication }) => {
    const isExpanded = expandedId === teacher.id;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition">
        {/* Header - Always visible */}
        <div
          className="p-6 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : teacher.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{teacher.full_name}</h3>
                  {teacher.gender && (
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                      {teacher.gender}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">£{teacher.hourly_rate}/hr</span>
                  <span className="text-gray-500 dark:text-gray-400">•</span>
                  <span className="text-gray-500 dark:text-gray-400">Applied {new Date(teacher.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                teacher.status === 'pending_approval' ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400' :
                teacher.status === 'approved' ? 'bg-green-500/20 text-green-500 dark:text-green-400' :
                'bg-red-500/20 text-red-500 dark:text-red-400'
              }`}>
                {teacher.status === 'pending_approval' ? 'Pending' : teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
            <div className="pt-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Contact Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <a href={`mailto:${teacher.email}`} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
                      {teacher.email}
                    </a>
                  </div>
                  {teacher.phone_number && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                      <span className="text-gray-900 dark:text-white">{teacher.phone_number}</span>
                    </div>
                  )}
                  {teacher.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Location:</span>
                      <span className="text-gray-900 dark:text-white">{teacher.location}</span>
                    </div>
                  )}
                  {teacher.timezone && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Timezone:</span>
                      <span className="text-gray-900 dark:text-white">{teacher.timezone}</span>
                    </div>
                  )}
                  {teacher.date_of_birth && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Date of Birth:</span>
                      <span className="text-gray-900 dark:text-white">{new Date(teacher.date_of_birth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Education & Qualifications */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Education & Qualifications</span>
                </h4>
                <div className="space-y-3 text-sm">
                  {teacher.education_level && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 dark:text-gray-400">Education Level:</span>
                      <span className="text-gray-900 dark:text-white">{teacher.education_level}</span>
                    </div>
                  )}
                  {teacher.islamic_learning_interests && teacher.islamic_learning_interests.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block mb-2">Teaching Subjects:</span>
                      <div className="flex flex-wrap gap-2">
                        {teacher.islamic_learning_interests.map((subject, idx) => (
                          <span key={idx} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs">
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {teacher.bio && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>About</span>
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{teacher.bio}</p>
                </div>
              )}

              {/* Video Introduction */}
              {teacher.video_intro_url && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                    <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Video Introduction</span>
                  </h4>
                  <video
                    src={teacher.video_intro_url}
                    controls
                    className="w-full max-w-md rounded-lg bg-gray-100 dark:bg-gray-900"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href={`mailto:${teacher.email}`}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact Teacher</span>
                </a>

                {teacher.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(teacher.id);
                      }}
                      disabled={processingId === teacher.id}
                      className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {processingId === teacher.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(teacher.id);
                      }}
                      disabled={processingId === teacher.id}
                      className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {processingId === teacher.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Teacher Management</h2>
        <p className="text-gray-600 dark:text-gray-400">Review and manage teacher applications</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Pending ({pendingApplications.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'approved'
              ? 'bg-green-500/20 text-green-500 dark:text-green-400 border border-green-500/30'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Approved ({approvedTeachers.length})</span>
          </div>
        </button>
      </div>

      {activeTab === 'pending' && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Teacher Applications</h3>
          {pendingApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No pending applications at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approved' && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Approved Teachers</h3>
          {approvedTeachers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No approved teachers yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedTeachers.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
