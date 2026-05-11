import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { branchesApi } from '../utils/api';
import { Plus, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function BranchesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { data: branches, isLoading } = useQuery('branches', () => branchesApi.list().then(r => r.data));
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const mutation = useMutation(branchesApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('branches');
      toast.success('Branch created!');
      reset();
      setShowForm(false);
    }
  });

  const branchColors = ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-400">{branches?.length || 0} locations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> Add Branch
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-medium text-gray-900 mb-4">New Branch</div>
          <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { name: 'name', label: 'Branch Name', required: true },
                { name: 'city', label: 'City', required: true },
                { name: 'phone', label: 'Phone' },
                { name: 'email', label: 'Email', type: 'email' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                  <input type={f.type || 'text'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    {...register(f.name, { required: f.required })} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Address</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  {...register('address')} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60">
                {isSubmitting ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {(branches || []).map((b, i) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${branchColors[i % branchColors.length]}`}>
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{b.name}</div>
                  <div className="text-xs text-gray-400">{b.city}</div>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  ['Active Members', b.active_members || 0],
                  ['Trainers', b.trainer_count || 0],
                  ['Active Classes', b.active_classes || 0],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
                {b.phone && <div>{b.phone}</div>}
                {b.email && <div>{b.email}</div>}
                {b.address && <div className="truncate">{b.address}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
