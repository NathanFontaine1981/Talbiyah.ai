import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Loader,
  Users,
  Calendar,
  MapPin,
  Copy,
  Check,
  ChevronRight,
  ExternalLink,
  Wifi,
  Globe,
  ArrowLeft,
  Home,
  ImagePlus,
  X,
  Pencil,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { COURSE_NOTES_PRICING } from '../../constants/courseNotesPricing';

interface Course {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  location: string | null;
  delivery_mode: string;
  start_date: string | null;
  end_date: string | null;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  current_participants: number;
  max_participants: number;
  course_type: string;
  poster_url: string | null;
  total_sessions: number | null;
  is_free: boolean;
  price_per_session: number | null;
}


function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}


export default function TeacherCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  // Edit state
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    delivery_mode: 'in_person',
    schedule_day: 'Monday',
    schedule_time: '10:00',
    duration_minutes: 60,
    max_participants: 30,
    start_date: '',
    end_date: '',
    total_sessions: 10,
    is_free: true,
    price_per_session: 0,
  });
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editPosterPreview, setEditPosterPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    delivery_mode: 'in_person',
    schedule_day: 'Monday',
    schedule_time: '10:00',
    duration_minutes: 60,
    max_participants: 30,
    start_date: '',
    end_date: '',
    total_sessions: 10,
    is_free: true,
    price_per_session: 0,
  });

  useEffect(() => { fetchCourses(); }, []);

  async function fetchCourses() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('group_sessions')
        .select('id, name, slug, description, location, delivery_mode, start_date, end_date, schedule_day, schedule_time, duration_minutes, current_participants, max_participants, course_type, poster_url, total_sessions, is_free, price_per_session')
        .or(`teacher_id.eq.${user.id},created_by.eq.${user.id}`)
        .eq('course_type', 'course')
        .order('created_at', { ascending: false });

      setCourses(data || []);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Course name is required'); return; }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slug = generateSlug(form.name);

      // Upload poster if selected
      let poster_url: string | null = null;
      if (posterFile) {
        const fileExt = posterFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `posters/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('course_assets')
          .upload(filePath, posterFile);

        if (uploadError) {
          console.error('Poster upload error:', uploadError);
          toast.error('Failed to upload poster, creating course without it');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('course_assets')
            .getPublicUrl(filePath);
          poster_url = publicUrl;
        }
      }

      const { error } = await supabase.from('group_sessions').insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        slug,
        location: form.location.trim() || null,
        delivery_mode: form.delivery_mode,
        schedule_day: form.schedule_day,
        schedule_time: form.schedule_time,
        duration_minutes: form.duration_minutes,
        max_participants: form.max_participants,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        total_sessions: form.total_sessions || null,
        is_free: form.is_free,
        price_per_session: form.is_free ? 0 : form.price_per_session,
        course_type: 'course',
        is_public: true,
        teacher_id: user.id,
        created_by: user.id,
        poster_url,
      });

      if (error) {
        if (error.code === '23505' && error.message.includes('slug')) {
          toast.error('A course with a similar name already exists. Try a different name.');
        } else {
          throw error;
        }
      } else {
        toast.success('Course created! Share the link with your students.');
        setShowCreate(false);
        setForm({ name: '', description: '', location: '', delivery_mode: 'in_person', schedule_day: 'Monday', schedule_time: '10:00', duration_minutes: 60, max_participants: 30, start_date: '', end_date: '', total_sessions: 10, is_free: true, price_per_session: 0 });
        setPosterFile(null);
        setPosterPreview(null);
        fetchCourses();
      }
    } catch (err: any) {
      toast.error('Failed to create course: ' + err.message);
    } finally {
      setCreating(false);
    }
  }

  function copyLink(course: Course) {
    const url = `${window.location.origin}/course/${course.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(course.id);
    toast.success('Course link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  function startEditing(course: Course) {
    setEditingCourseId(course.id);
    setEditForm({
      name: course.name,
      description: course.description || '',
      location: course.location || '',
      delivery_mode: course.delivery_mode,
      schedule_day: course.schedule_day,
      schedule_time: course.schedule_time,
      duration_minutes: course.duration_minutes,
      max_participants: course.max_participants,
      start_date: course.start_date || '',
      end_date: course.end_date || '',
      total_sessions: course.total_sessions || 10,
      is_free: course.is_free,
      price_per_session: course.price_per_session || 0,
    });
    setEditPosterFile(null);
    setEditPosterPreview(course.poster_url || null);
  }

  function cancelEditing() {
    setEditingCourseId(null);
    setEditPosterFile(null);
    setEditPosterPreview(null);
  }

  async function handleSaveCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCourseId) return;
    if (!editForm.name.trim()) { toast.error('Course name is required'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let poster_url: string | undefined;

      // Upload new poster if selected
      if (editPosterFile) {
        const fileExt = editPosterFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `posters/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('course_assets')
          .upload(filePath, editPosterFile);

        if (uploadError) {
          console.error('Poster upload error:', uploadError);
          toast.error('Failed to upload poster');
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('course_assets')
            .getPublicUrl(filePath);
          poster_url = publicUrl;
        }
      } else if (editPosterPreview === null) {
        // Poster was removed
        poster_url = '';
      }

      const updates: Record<string, any> = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        location: editForm.location.trim() || null,
        delivery_mode: editForm.delivery_mode,
        schedule_day: editForm.schedule_day,
        schedule_time: editForm.schedule_time,
        duration_minutes: editForm.duration_minutes,
        max_participants: editForm.max_participants,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        total_sessions: editForm.total_sessions || null,
        is_free: editForm.is_free,
        price_per_session: editForm.is_free ? 0 : editForm.price_per_session,
      };

      if (poster_url !== undefined) {
        updates.poster_url = poster_url || null;
      }

      const { error } = await supabase
        .from('group_sessions')
        .update(updates)
        .eq('id', editingCourseId);

      if (error) throw error;

      toast.success('Course updated!');
      cancelEditing();
      fetchCourses();
    } catch (err: any) {
      toast.error('Failed to update course: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const deliveryLabel: Record<string, string> = { online: 'Online', in_person: 'In Person', hybrid: 'Hybrid' };
  const deliveryIcon: Record<string, React.ReactNode> = {
    online: <Wifi className="w-3.5 h-3.5" />,
    in_person: <MapPin className="w-3.5 h-3.5" />,
    hybrid: <Globe className="w-3.5 h-3.5" />,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back nav */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage your courses</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Course</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ladies Dawra Qur'an"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What will students learn in this course?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Poster</label>
              {posterPreview ? (
                <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                  <img src={posterPreview} alt="Poster preview" className="w-full max-h-64 object-contain" />
                  <button
                    type="button"
                    onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                  <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload a poster image</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG or WebP (max 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                      setPosterFile(file);
                      setPosterPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Cheadle Masjid"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Mode</label>
              <select
                value={form.delivery_mode}
                onChange={(e) => setForm({ ...form, delivery_mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="in_person">In Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Day</label>
              <select
                value={form.schedule_day}
                onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
              <input
                type="time"
                value={form.schedule_time}
                onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                max={240}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
              <input
                type="number"
                min={2}
                max={200}
                value={form.max_participants}
                onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Sessions & Pricing */}
            <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sessions & Pricing</h3>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Sessions</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.total_sessions}
                onChange={(e) => setForm({ ...form, total_sessions: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Price</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_free}
                    onChange={(e) => setForm({ ...form, is_free: e.target.checked, price_per_session: e.target.checked ? 0 : form.price_per_session })}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Free</span>
                </label>
                {!form.is_free && (
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-sm text-gray-500 dark:text-gray-400">£</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.price_per_session}
                      onChange={(e) => setForm({ ...form, price_per_session: parseInt(e.target.value) || 0 })}
                      placeholder="per session"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">/ session</span>
                  </div>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Study Notes:</span>{' '}
                  £{COURSE_NOTES_PRICING.flatPrice.toFixed(2)} one-off per student
                  <span className="text-blue-600 dark:text-blue-400 text-xs ml-1">
                    (Session 1 free, then flat £{COURSE_NOTES_PRICING.flatPrice.toFixed(2)} for all remaining sessions)
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
              {creating && <Loader className="w-4 h-4 animate-spin" />}
              Create Course
            </button>
          </div>
        </form>
      )}

      {/* Course list */}
      {courses.length === 0 && !showCreate ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first course and share the link with students</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Course
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => (
            <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              {editingCourseId === course.id ? (
                /* Edit form */
                <form onSubmit={handleSaveCourse}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Course</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Name *</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Poster</label>
                      {editPosterPreview ? (
                        <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                          <img src={editPosterPreview} alt="Poster preview" className="w-full max-h-64 object-contain" />
                          <button
                            type="button"
                            onClick={() => { setEditPosterFile(null); setEditPosterPreview(null); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                          <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload a poster image</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG or WebP (max 5MB)</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
                              setEditPosterFile(file);
                              setEditPosterPreview(URL.createObjectURL(file));
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Mode</label>
                      <select
                        value={editForm.delivery_mode}
                        onChange={(e) => setEditForm({ ...editForm, delivery_mode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="in_person">In Person</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Day</label>
                      <select
                        value={editForm.schedule_day}
                        onChange={(e) => setEditForm({ ...editForm, schedule_day: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                      <input
                        type="time"
                        value={editForm.schedule_time}
                        onChange={(e) => setEditForm({ ...editForm, schedule_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min={15}
                        max={240}
                        value={editForm.duration_minutes}
                        onChange={(e) => setEditForm({ ...editForm, duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Students</label>
                      <input
                        type="number"
                        min={2}
                        max={200}
                        value={editForm.max_participants}
                        onChange={(e) => setEditForm({ ...editForm, max_participants: parseInt(e.target.value) || 30 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={editForm.start_date}
                        onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Sessions & Pricing */}
                    <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sessions & Pricing</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Sessions</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editForm.total_sessions}
                        onChange={(e) => setEditForm({ ...editForm, total_sessions: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Price</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editForm.is_free}
                            onChange={(e) => setEditForm({ ...editForm, is_free: e.target.checked, price_per_session: e.target.checked ? 0 : editForm.price_per_session })}
                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Free</span>
                        </label>
                        {!editForm.is_free && (
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">£</span>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={editForm.price_per_session}
                              onChange={(e) => setEditForm({ ...editForm, price_per_session: parseInt(e.target.value) || 0 })}
                              placeholder="per session"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">/ session</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          <span className="font-medium">Study Notes:</span>{' '}
                          £{COURSE_NOTES_PRICING.flatPrice.toFixed(2)} one-off per student
                          <span className="text-blue-600 dark:text-blue-400 text-xs ml-1">
                            (Session 1 free, then flat £{COURSE_NOTES_PRICING.flatPrice.toFixed(2)} for all remaining sessions)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={cancelEditing} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
                      {saving && <Loader className="w-4 h-4 animate-spin" />}
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                /* Read-only view */
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{course.name}</h3>
                      {course.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {course.current_participants} students
                        </span>
                        {course.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {course.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          {deliveryIcon[course.delivery_mode]}
                          {deliveryLabel[course.delivery_mode]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {course.schedule_day.includes(' - ') || course.schedule_day.includes(',') ? course.schedule_day : `${course.schedule_day}s`} at {course.schedule_time?.slice(0, 5)}
                        </span>
                        {course.start_date && (
                          <span>{formatDate(course.start_date)}{course.end_date ? ` — ${formatDate(course.end_date)}` : ''}</span>
                        )}
                        {course.total_sessions && (
                          <span>{course.total_sessions} sessions</span>
                        )}
                        <span className="font-medium">
                          {course.is_free ? 'Free' : `£${course.price_per_session}/session`}
                        </span>
                        {course.total_sessions && (
                          <span className="text-blue-600 dark:text-blue-400">
                            Study Notes: £{COURSE_NOTES_PRICING.flatPrice.toFixed(2)}/student
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => startEditing(course)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => copyLink(course)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      {copiedId === course.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === course.id ? 'Copied!' : 'Copy Student Link'}
                    </button>
                    <Link
                      to={`/course/${course.slug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Course Page
                    </Link>
                    <Link
                      to={`/teacher/course/${course.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Manage Sessions
                    </Link>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
