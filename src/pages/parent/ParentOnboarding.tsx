import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, X, Calendar, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { calculateAge, calculateSchoolYear, getDateConstraints } from '../../utils/ageCalculations';

interface Child {
  id: string;
  name: string;
  dob: string;
  age?: number;
  gender: string;
}

export default function ParentOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [children, setChildren] = useState<Child[]>([]);
  const [saving, setSaving] = useState(false);
  const [parentName, setParentName] = useState('');

  // Form state for adding a child
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [childGender, setChildGender] = useState('');

  // Use centralized date constraints
  const dateConstraints = getDateConstraints();

  useState(() => {
    loadParentInfo();
  });

  async function loadParentInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setParentName(profile.full_name || '');
      }
    }
  }

  function handleAddChild() {
    if (!childName.trim() || !childDob) {
      toast.error('Please enter child name and date of birth');
      return;
    }

    const age = calculateAge(childDob);

    // Validate age restriction (0-15 years old)
    if (age >= 16) {
      toast.warning('This child is 16 or older and can create their own student account instead.');
      return;
    }

    const newChild: Child = {
      id: Math.random().toString(36).substr(2, 9),
      name: childName.trim(),
      dob: childDob,
      age: age,
      gender: childGender || ''
    };

    setChildren([...children, newChild]);
    setChildName('');
    setChildDob('');
    setChildGender('');
  }

  function handleRemoveChild(id: string) {
    setChildren(children.filter(c => c.id !== id));
  }

  async function handleFinishSetup() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save all children to parent_children table
      for (const child of children) {
        await supabase
          .from('parent_children')
          .insert({
            parent_id: user.id,
            child_name: child.name,
            child_age: child.age,
            child_gender: child.gender || null,
            child_dob: child.dob,
            has_account: false,
            child_id: null,
            account_id: null
          });
      }

      // Update parent's roles to include 'parent'
      const { data: parentProfile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single();

      const currentRoles = parentProfile?.roles || ['student'];
      if (!currentRoles.includes('parent')) {
        await supabase
          .from('profiles')
          .update({ roles: [...currentRoles, 'parent'] })
          .eq('id', user.id);
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error saving children:', err);
      toast.error('Failed to save children: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    navigate('/dashboard');
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome{parentName ? `, ${parentName.split(' ')[0]}` : ''}! 👋
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Let's set up your account. Who will be taking lessons?
          </p>

          <button
            onClick={() => setStep(2)}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold rounded-xl transition shadow-lg"
          >
            Continue to Setup →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your Children</h2>
          <p className="text-gray-600 mb-8">
            Add your children's information below. You can create login accounts for them later.
          </p>

          {/* Add Child Form */}
          <div className="bg-purple-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Add a Child
            </h3>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Child's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Aaliyah"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  min={dateConstraints.min}
                  max={dateConstraints.max}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {childDob && (
                  <div className="mt-2 p-2 bg-purple-50 rounded-lg text-sm">
                    <span className="text-gray-600">Age: </span>
                    <span className="font-semibold text-purple-700">{calculateAge(childDob)} years old</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className="text-gray-600">School Year: </span>
                    <span className="font-semibold text-purple-700">{calculateSchoolYear(childDob)}</span>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Children must be 3 years or older. Ages 18+ should create their own account.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender (optional)
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={childGender === 'Male'}
                      onChange={(e) => setChildGender(e.target.value)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={childGender === 'Female'}
                      onChange={(e) => setChildGender(e.target.value)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Female</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Prefer not to say"
                      checked={childGender === 'Prefer not to say'}
                      onChange={(e) => setChildGender(e.target.value)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Prefer not to say</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddChild}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Child
            </button>
          </div>

          {/* Children List */}
          {children.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Your Children ({children.length})</h3>
              <div className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {child.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{child.name}</p>
                        <p className="text-sm text-gray-600">
                          Age {child.dob ? calculateAge(child.dob) : child.age}
                          {child.dob && ` • ${calculateSchoolYear(child.dob)}`}
                          {child.gender && ` • ${child.gender}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveChild(child.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
            >
              Skip for now - I'll add children later
            </button>
            <button
              onClick={handleFinishSetup}
              disabled={saving || children.length === 0}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : `Finish Setup ${children.length > 0 ? `(${children.length} ${children.length === 1 ? 'child' : 'children'})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
