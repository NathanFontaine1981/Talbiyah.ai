import { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Percent,
  DollarSign,
  Gift,
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'free_lesson';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  first_lesson_only: boolean;
  min_cart_value: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export default function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed' | 'free_lesson',
    discount_value: 10,
    max_uses: '',
    first_lesson_only: false,
    min_cart_value: 0,
    valid_until: ''
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  async function fetchPromoCodes() {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createPromoCode() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: formData.code.toUpperCase(),
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          first_lesson_only: formData.first_lesson_only,
          min_cart_value: formData.min_cart_value,
          valid_until: formData.valid_until || null,
          created_by: user?.id
        });

      if (error) throw error;

      setShowCreateModal(false);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      toast.error(error.message || 'Failed to create promo code');
    }
  }

  async function updatePromoCode() {
    if (!editingCode) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({
          code: formData.code.toUpperCase(),
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          first_lesson_only: formData.first_lesson_only,
          min_cart_value: formData.min_cart_value,
          valid_until: formData.valid_until || null
        })
        .eq('id', editingCode.id);

      if (error) throw error;

      setEditingCode(null);
      resetForm();
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      toast.error(error.message || 'Failed to update promo code');
    }
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchPromoCodes();
    } catch (error) {
      console.error('Error toggling promo code:', error);
    }
  }

  async function deletePromoCode(id: string) {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
    }
  }

  function resetForm() {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      max_uses: '',
      first_lesson_only: false,
      min_cart_value: 0,
      valid_until: ''
    });
  }

  function startEdit(code: PromoCode) {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      max_uses: code.max_uses?.toString() || '',
      first_lesson_only: code.first_lesson_only,
      min_cart_value: code.min_cart_value,
      valid_until: code.valid_until?.split('T')[0] || ''
    });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function getDiscountDisplay(code: PromoCode) {
    switch (code.discount_type) {
      case 'percentage':
        return `${code.discount_value}% off`;
      case 'fixed':
        return `£${code.discount_value.toFixed(2)} off`;
      case 'free_lesson':
        return 'Free lesson';
    }
  }

  function getDiscountIcon(type: string) {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed':
        return <DollarSign className="w-4 h-4" />;
      case 'free_lesson':
        return <Gift className="w-4 h-4" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading promo codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Promo Codes</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage promotional codes for discounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Code</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{promoCodes.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Codes</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {promoCodes.filter(c => c.is_active).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {promoCodes.reduce((sum, c) => sum + c.current_uses, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Uses</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {promoCodes.filter(c => c.discount_type === 'free_lesson').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Free Lesson Codes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promo Codes List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Code</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Discount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Uses</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Restrictions</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((code) => (
              <tr key={code.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200/20">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded">
                      {code.code}
                    </span>
                    <button
                      onClick={() => copyCode(code.code)}
                      className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
                    >
                      {copiedCode === code.code ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  {code.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{code.description}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      code.discount_type === 'free_lesson' ? 'bg-amber-500/20 text-amber-400' :
                      code.discount_type === 'percentage' ? 'bg-emerald-500/20 text-emerald-600' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {getDiscountIcon(code.discount_type)}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{getDiscountDisplay(code)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900 dark:text-white">
                    <span className="font-semibold">{code.current_uses}</span>
                    {code.max_uses && (
                      <span className="text-gray-600 dark:text-gray-400"> / {code.max_uses}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {code.first_lesson_only && (
                      <span className="inline-block px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        First lesson only
                      </span>
                    )}
                    {code.min_cart_value > 0 && (
                      <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                        Min £{code.min_cart_value}
                      </span>
                    )}
                    {code.valid_until && (
                      <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        Expires {format(new Date(code.valid_until), 'MMM d')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(code.id, code.is_active)}
                    className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                      code.is_active
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-gray-600/50 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {code.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(code)}
                      className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => deletePromoCode(code.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {promoCodes.length === 0 && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No promo codes yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-emerald-600 hover:text-cyan-300 font-medium"
            >
              Create your first promo code
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCode) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCode(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME20"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Welcome discount for new users"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Discount Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'percentage', label: 'Percentage', icon: Percent },
                    { value: 'fixed', label: 'Fixed Amount', icon: DollarSign },
                    { value: 'free_lesson', label: 'Free Lesson', icon: Gift }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, discount_type: value as any })}
                      className={`p-3 rounded-lg border-2 transition flex flex-col items-center space-y-1 ${
                        formData.discount_type === value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${formData.discount_type === value ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`} />
                      <span className={`text-xs ${formData.discount_type === value ? 'text-emerald-600' : 'text-gray-600 dark:text-gray-400'}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.discount_type !== 'free_lesson' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(£)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Max Uses (optional)</label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    min={1}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Min Cart Value (£)</label>
                  <input
                    type="number"
                    value={formData.min_cart_value}
                    onChange={(e) => setFormData({ ...formData, min_cart_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Expires On (optional)</label>
                <input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.first_lesson_only}
                  onChange={(e) => setFormData({ ...formData, first_lesson_only: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-200 dark:border-gray-700 text-emerald-500 focus:ring-emerald-500 bg-gray-50 dark:bg-gray-700"
                />
                <span className="text-gray-600 dark:text-gray-400">Only valid for first lesson</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCode(null);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={editingCode ? updatePromoCode : createPromoCode}
                disabled={!formData.code}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
