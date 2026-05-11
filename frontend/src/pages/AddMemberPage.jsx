// AddMemberPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { membersApi, branchesApi } from '../utils/api';
import toast from 'react-hot-toast';

export default function AddMemberPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { data: branches } = useQuery('branches', () => branchesApi.list().then(r => r.data));
  const { data: plansData } = useQuery('renewal-plans', () =>
    membersApi.renewalInfo('00000000-0000-0000-0000-000000000000').then(r => r.data).catch(() => null)
  );

  const mutation = useMutation(membersApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('members');
      toast.success('Member created successfully!');
      navigate('/members');
    }
  });

  const fields = [
    { name: 'name', label: 'Full Name', required: true },
    { name: 'phone', label: 'Phone', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { name: 'address', label: 'Address' },
    { name: 'emergency_contact', label: 'Emergency Contact' },
  ];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/members')} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">Add New Member</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.name} className={f.name === 'address' ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}{f.required && ' *'}</label>
                <input type={f.type || 'text'}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  {...register(f.name, { required: f.required ? `${f.label} is required` : false })} />
                {errors[f.name] && <p className="text-xs text-red-500 mt-0.5">{errors[f.name].message}</p>}
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                {...register('gender')}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                {...register('branch_id', { required: 'Branch is required' })}>
                <option value="">Select branch</option>
                {(branches || []).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Membership Plan *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Basic Monthly', price: 1200, desc: '1 branch · Group classes' },
                  { name: 'Premium Monthly', price: 3000, desc: '2 branches · 1 PT session' },
                  { name: 'Elite Monthly', price: 6000, desc: 'All branches · 4 PT sessions' },
                  { name: 'Elite Annual', price: 60000, desc: 'All branches · Save ₹12,000' },
                ].map(p => (
                  <label key={p.name} className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-emerald-400 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                    <input type="radio" value={p.name} {...register('plan_id', { required: true })} className="text-emerald-500" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-gray-400">₹{p.price.toLocaleString()} · {p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/members')}
              className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-60">
              {isSubmitting ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
