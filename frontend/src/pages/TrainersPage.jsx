import React from 'react';
import { useQuery } from 'react-query';
import { trainersApi } from '../utils/api';
import { Star, Plus } from 'lucide-react';

export default function TrainersPage() {
  const { data: trainers, isLoading } = useQuery('trainers', () => trainersApi.list().then(r => r.data));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Trainers</h1>
          <p className="text-sm text-gray-400">{trainers?.length || 0} staff members</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> Add Trainer
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(trainers || []).map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700 flex-shrink-0">
                  {t.name?.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t.branch_name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-600">{parseFloat(t.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                  t.is_available ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {t.is_available ? 'Available' : 'On leave'}
                </span>
              </div>

              {t.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {t.specialties.map(sp => (
                    <span key={sp} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{sp}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg py-2">
                  <div className="text-base font-semibold text-gray-900">{t.class_count || 0}</div>
                  <div className="text-[10px] text-gray-400">Classes</div>
                </div>
                <div className="bg-gray-50 rounded-lg py-2">
                  <div className="text-base font-semibold text-gray-900">{t.sessions_this_month || 0}</div>
                  <div className="text-[10px] text-gray-400">Sessions / mo</div>
                </div>
              </div>

              {t.bio && (
                <p className="text-xs text-gray-500 mt-3 line-clamp-2">{t.bio}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
