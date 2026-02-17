import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function TierDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  async function runDiagnostics() {
    const diagnostics: DiagnosticResult[] = [];

    try {
      // 1. Check user auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        diagnostics.push({
          name: 'User Authentication',
          status: 'error',
          message: 'Not authenticated',
          details: authError
        });
        setResults(diagnostics);
        setLoading(false);
        return;
      }
      diagnostics.push({
        name: 'User Authentication',
        status: 'success',
        message: `Logged in as ${user.email}`
      });

      // 2. Check teacher_tiers table
      const { data: tiers, error: tiersError } = await supabase
        .from('teacher_tiers')
        .select('tier, tier_name, tier_level')
        .order('tier_level');

      if (tiersError) {
        diagnostics.push({
          name: 'teacher_tiers Table',
          status: 'error',
          message: tiersError.message,
          details: tiersError
        });
      } else {
        diagnostics.push({
          name: 'teacher_tiers Table',
          status: 'success',
          message: `Found ${tiers.length} tiers`,
          details: tiers
        });
      }

      // 3. Check teacher profile
      const { data: teacherProfile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id, current_tier, tier_assigned_at, status')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        diagnostics.push({
          name: 'Teacher Profile',
          status: 'warning',
          message: 'No teacher profile found or error',
          details: profileError
        });
      } else {
        diagnostics.push({
          name: 'Teacher Profile',
          status: 'success',
          message: `Profile found - Status: ${teacherProfile.status}`,
          details: {
            id: teacherProfile.id,
            current_tier: teacherProfile.current_tier,
            tier_assigned_at: teacherProfile.tier_assigned_at
          }
        });

        // 4. Check teacher_tier_stats view
        const { data: tierStats, error: statsError } = await supabase
          .from('teacher_tier_stats')
          .select('*')
          .eq('teacher_id', teacherProfile.id)
          .single();

        if (statsError) {
          diagnostics.push({
            name: 'teacher_tier_stats View',
            status: 'error',
            message: statsError.message,
            details: statsError
          });
        } else {
          diagnostics.push({
            name: 'teacher_tier_stats View',
            status: 'success',
            message: 'View accessible and contains data',
            details: {
              tier: tierStats.tier,
              tier_name: tierStats.tier_name,
              tier_icon: tierStats.tier_icon,
              teacher_hourly_rate: tierStats.teacher_hourly_rate,
              hours_taught: tierStats.hours_taught,
              total_students: tierStats.total_students
            }
          });
        }
      }

    } catch (error) {
      diagnostics.push({
        name: 'General Error',
        status: 'error',
        message: 'Unexpected error during diagnostics',
        details: error
      });
    }

    setResults(diagnostics);
    setLoading(false);
  }

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case 'error': return <XCircle className="w-6 h-6 text-red-400" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-amber-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-emerald-500/30 bg-emerald-500/10';
      case 'error': return 'border-red-500/30 bg-red-500/10';
      case 'warning': return 'border-amber-500/30 bg-amber-500/10';
      default: return 'border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Tier System Diagnostics</h1>
          <p className="text-gray-500 mb-8">Checking database setup and permissions</p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-6 border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start space-x-4">
                    {getIcon(result.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {result.name}
                      </h3>
                      <p className="text-gray-600 mb-3">{result.message}</p>
                      {result.details && (
                        <details className="mt-3">
                          <summary className="text-sm text-emerald-600 cursor-pointer hover:text-emerald-700">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex space-x-4">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              {loading ? 'Running...' : 'Run Diagnostics Again'}
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
