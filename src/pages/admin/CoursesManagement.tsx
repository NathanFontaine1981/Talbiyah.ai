import { useEffect, useState } from 'react';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Subject {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  created_at: string;
}

export default function CoursesManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Courses Management</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your course catalog and subjects</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-emerald-500/25 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-emerald-500/30 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                <button className="p-2 bg-blue-500/20 dark:bg-blue-500/30 hover:bg-blue-500/30 dark:hover:bg-blue-500/40 border border-blue-500/30 dark:border-blue-500/50 rounded-lg transition">
                  <Edit className="w-4 h-4 text-blue-400 dark:text-blue-300" />
                </button>
                <button className="p-2 bg-red-500/20 dark:bg-red-500/30 hover:bg-red-500/30 dark:hover:bg-red-500/40 border border-red-500/30 dark:border-red-500/50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-400 dark:text-red-300" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{subject.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{subject.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Created {new Date(subject.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">No courses found</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Get started by adding your first course</p>
        </div>
      )}
    </div>
  );
}
