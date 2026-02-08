import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import ParentDetailsStep from '../components/onboarding/ParentDetailsStep';
import ChildDetailsStep from '../components/onboarding/ChildDetailsStep';
import WelcomeStep from '../components/onboarding/WelcomeStep';
import { BookOpen } from 'lucide-react';
import { calculateAge, calculateSchoolYear } from '../utils/ageCalculations';

export interface ParentData {
  fullName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  preferredContact: 'whatsapp' | 'email' | 'telegram' | 'sms';
  howHeardAboutUs: string;
}

export interface ChildData {
  firstName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | '';
  learningGoals: string[];
}

const STORAGE_KEY = 'talbiyah_onboarding_progress';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [parentData, setParentData] = useState<ParentData>({
    fullName: '',
    phoneCountryCode: '+44',
    phoneNumber: '',
    preferredContact: 'whatsapp',
    howHeardAboutUs: ''
  });

  const [children, setChildren] = useState<ChildData[]>([{
    firstName: '',
    dateOfBirth: '',
    gender: '',
    learningGoals: []
  }]);

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.parentData) setParentData(parsed.parentData);
        if (parsed.children) setChildren(parsed.children);
        if (parsed.step) setStep(parsed.step);
      } catch (e) {
        console.error('Error loading saved progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      parentData,
      children,
      step
    }));
  }, [parentData, children, step]);

  // Check auth and onboarding status
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          navigate('/');
          return;
        }

        setUser(session.user);

        // Check if already completed onboarding
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed, full_name, phone, phone_number, phone_country_code, role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profile?.onboarding_completed) {
          navigate('/dashboard');
          return;
        }

        // Only parents should be on this page - teachers and students should NOT see onboarding
        // Teachers go to /welcome then /apply-to-teach
        // Students go to /welcome which creates a learner for them
        if (profile?.role === 'teacher' || profile?.roles?.includes('teacher')) {
          // Teacher detected, redirecting to apply-to-teach
          navigate('/apply-to-teach');
          return;
        }

        if (profile?.role !== 'parent' && profile?.role !== undefined) {
          // Non-parent user detected, redirecting to dashboard
          navigate('/dashboard');
          return;
        }

        // If role is undefined/null and not a parent, redirect to welcome
        if (!profile?.role && !profile?.roles?.includes('parent')) {
          // User without role detected, redirecting to welcome
          navigate('/welcome');
          return;
        }

        // Pre-fill name and phone if available from signup
        if (profile) {
          setParentData(prev => {
            const updated = { ...prev };
            if (profile.full_name) updated.fullName = profile.full_name;
            if (profile.phone_country_code) updated.phoneCountryCode = profile.phone_country_code;
            // Use phone_number first, then parse from phone (full number from signup)
            if (profile.phone_number) {
              updated.phoneNumber = profile.phone_number;
            } else if (profile.phone) {
              // Parse: "+44 7123456789" → extract number part
              const match = profile.phone.match(/^\+\d{1,3}\s*(.+)/);
              if (match) updated.phoneNumber = match[1].trim();
            }
            return updated;
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in checkUser:', error);
        navigate('/');
      }
    };

    checkUser();
  }, [navigate]);

  const handleComplete = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: parentData.fullName,
          phone_number: parentData.phoneNumber,
          phone_country_code: parentData.phoneCountryCode,
          preferred_contact: parentData.preferredContact,
          how_heard_about_us: parentData.howHeardAboutUs || null,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create learners (children) and parent_children records
      for (const child of children) {
        const age = calculateAge(child.dateOfBirth);
        const schoolYear = calculateSchoolYear(child.dateOfBirth);

        // Creating learner for child

        // Create learner record
        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .insert({
            parent_id: user.id,
            name: child.firstName,
            first_name: child.firstName,
            date_of_birth: child.dateOfBirth,
            age: age, // Keep for backwards compatibility
            school_year: schoolYear,
            gender: child.gender,
            learning_goals: child.learningGoals
          })
          .select('id')
          .single();

        if (learnerError) {
          console.error('Error creating learner:', learnerError);
          throw learnerError;
        }

        
        // Also create parent_children record for dashboard display
        if (learnerData) {
          const { error: parentChildError } = await supabase
            .from('parent_children')
            .insert({
              parent_id: user.id,
              child_id: learnerData.id,
              child_name: child.firstName,
              child_age: age,
              child_gender: child.gender,
              has_account: false,
              account_id: null
            });

          if (parentChildError) {
            console.error('Error creating parent_children record:', parentChildError);
            // Don't throw - learner was created successfully
          }
        }
      }

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save your information: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to onboarding form
      </a>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-7 h-7 text-emerald-500" />
              <span className="text-xl font-semibold text-gray-900">Talbiyah.ai</span>
            </div>
            <div className="text-sm text-gray-500">
              Step {step} of 3
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <nav aria-label="Onboarding progress" className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <ol className="flex items-center py-4">
            {[
              { num: 1, label: 'About You' },
              { num: 2, label: 'Your Child' },
              { num: 3, label: 'Welcome' }
            ].map((s, index) => (
              <li key={s.num} className="flex items-center flex-1" aria-current={step === s.num ? 'step' : undefined}>
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step > s.num
                      ? 'bg-emerald-500 text-white'
                      : step === s.num
                        ? 'bg-emerald-500 text-white ring-4 ring-cyan-100'
                        : 'bg-gray-200 text-gray-500'
                  }`} aria-label={step > s.num ? `Step ${s.num}: ${s.label} - completed` : `Step ${s.num}: ${s.label}`}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`ml-3 font-medium hidden sm:block ${
                    step >= s.num ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${
                    step > s.num ? 'bg-emerald-500' : 'bg-gray-200'
                  }`} aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>

      {/* Content */}
      <main id="main-content" className="py-8 px-4">
        {step === 1 && (
          <ParentDetailsStep
            data={parentData}
            onChange={setParentData}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ChildDetailsStep
            children={children}
            onChange={setChildren}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <WelcomeStep
            parentName={parentData.fullName.split(' ')[0]}
            childName={children[0]?.firstName || 'your child'}
            onComplete={handleComplete}
            saving={saving}
          />
        )}
      </main>
    </div>
  );
}
