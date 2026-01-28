import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Eye, X, Mail, Lock, User, Calendar, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { calculateAge, calculateSchoolYear, validateDOB, getDateConstraints } from '../utils/ageCalculations';

interface Child {
  id: string;
  child_name: string;
  child_age: number | null;
  child_gender: string | null;
  child_dob: string | null;
  has_account: boolean;
  account_id: string | null;
}

export default function MyChildren() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  useEffect(() => {
    loadChildren();
  }, []);

  async function loadChildren() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('parent_children')
        .select('id, child_name, child_age, child_gender, child_dob, has_account, account_id')
        .eq('parent_id', user.id);

      if (error) throw error;
      setChildren(data || []);
    } catch (err) {
      console.error('Error loading children:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveChild(childId: string, childName: string) {
    if (!confirm(`Are you sure you want to remove ${childName}? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('parent_children')
        .delete()
        .eq('id', childId);

      if (error) throw error;
      await loadChildren();
    } catch (err: any) {
      toast.error('Failed to remove child: ' + err.message);
    }
  }

  function handleUpgradeToAccount(child: Child) {
    setSelectedChild(child);
    setShowUpgradeModal(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg"
      >
        Skip to children list
      </a>
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                My Children
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your children's learning journey
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Child
            </button>
          </div>
        </div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-6">
              Add your children to start managing their learning journey
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
            >
              Add Your First Child
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {child.child_name?.[0] || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {child.child_name}
                      </h3>
                      {child.child_age && (
                        <p className="text-sm text-gray-500">Age {child.child_age}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveChild(child.id, child.child_name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    aria-label={`Remove ${child.child_name}`}
                    title="Remove child"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Account Status Badge */}
                <div className="mb-4">
                  {child.has_account ? (
                    <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                      Full Account
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
                      Lightweight
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/child/${child.id}/dashboard`)}
                    className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Dashboard
                  </button>
                  {!child.has_account && (
                    <button
                      onClick={() => handleUpgradeToAccount(child)}
                      className="w-full px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition flex items-center justify-center gap-2"
                    >
                      <span>🔓</span>
                      Create Login
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      {showAddModal && (
        <AddChildModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadChildren();
          }}
        />
      )}

      {/* Upgrade to Account Modal */}
      {showUpgradeModal && selectedChild && (
        <UpgradeToAccountModal
          child={selectedChild}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedChild(null);
          }}
          onSuccess={() => {
            setShowUpgradeModal(false);
            setSelectedChild(null);
            loadChildren();
          }}
        />
      )}
    </div>
  );
}

interface AddChildModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddChildModal({ onClose, onSuccess }: AddChildModalProps) {
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [childGender, setChildGender] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Use centralized date constraints
  const dateConstraints = getDateConstraints();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!childName.trim() || !childDob) {
      setError('Please enter child name and date of birth');
      return;
    }

    const age = calculateAge(childDob);

    // Validate age restriction (0-15 years old)
    if (age >= 16) {
      setError('This child is 16 or older and can create their own student account instead.');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert lightweight child
      const { error: insertError } = await supabase
        .from('parent_children')
        .insert({
          parent_id: user.id,
          child_name: childName.trim(),
          child_age: age,
          child_gender: childGender || null,
          child_dob: childDob,
          has_account: false,
          child_id: null,
          account_id: null
        });

      if (insertError) throw insertError;

      onSuccess();
    } catch (err: any) {
      console.error('Error adding child:', err);
      setError(err.message || 'Failed to add child');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div role="dialog" aria-modal="true" aria-labelledby="add-child-title" className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h3 id="add-child-title" className="text-2xl font-bold text-gray-900 mb-6">Add Child</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="child-name" className="block text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Child's Name <span className="text-red-500">*</span>
            </label>
            <input
              id="child-name"
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Aaliyah"
              required
            />
          </div>

          <div>
            <label htmlFor="child-dob" className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              id="child-dob"
              type="date"
              value={childDob}
              onChange={(e) => setChildDob(e.target.value)}
              min={dateConstraints.min}
              max={dateConstraints.max}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            {childDob && !validateDOB(childDob) && (
              <div className="mt-2 p-2 bg-purple-50 rounded-lg text-sm">
                <span className="text-gray-600">Age: </span>
                <span className="font-semibold text-purple-700">{calculateAge(childDob)} years old</span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-gray-600">School Year: </span>
                <span className="font-semibold text-purple-700">{calculateSchoolYear(childDob)}</span>
              </div>
            )}
            {childDob && validateDOB(childDob) && (
              <p className="mt-2 text-sm text-red-500">{validateDOB(childDob)}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Children must be 3 years or older. Ages 18+ should create their own account.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gender (optional)
            </label>
            <div className="space-y-2">
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

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Child'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface UpgradeToAccountModalProps {
  child: Child;
  onClose: () => void;
  onSuccess: () => void;
}

function UpgradeToAccountModal({ child, onClose, onSuccess }: UpgradeToAccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      const { data: { user: parentUser } } = await supabase.auth.getUser();
      if (!parentUser) throw new Error('Not authenticated');

      // Create child account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: child.child_name,
            date_of_birth: child.child_dob,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create child account');

      // Update child's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: child.child_name,
          date_of_birth: child.child_dob,
          roles: ['student'],
          linked_parent_id: parentUser.id
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Create learner entry
      const { error: learnerError } = await supabase
        .from('learners')
        .insert({
          parent_id: authData.user.id,
          name: child.child_name,
          age: child.child_age,
          gender: child.child_gender,
          gamification_points: 0
        });

      if (learnerError) console.error('Error creating learner entry:', learnerError);

      // Update parent_children record
      const { error: updateError } = await supabase
        .from('parent_children')
        .update({
          has_account: true,
          account_id: authData.user.id,
          child_id: authData.user.id
        })
        .eq('id', child.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err: any) {
      console.error('Error upgrading to account:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div role="dialog" aria-modal="true" aria-labelledby="upgrade-account-title" className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h3 id="upgrade-account-title" className="text-2xl font-bold text-gray-900 mb-2">Create Login for {child.child_name}</h3>
        <p className="text-gray-600 mb-6 text-sm">
          This will create a separate account that {child.child_name} can use to log in independently.
          You'll still have access to manage their account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="child-email" className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="child-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="child@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="child-password" className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="child-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Minimum 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="child-confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="child-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
