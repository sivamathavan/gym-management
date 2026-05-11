import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { membersApi } from '../utils/api';
import dayjs from 'dayjs';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-red-50 text-red-700',
  suspended: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-400',
};

const planColors = {
  'Elite Monthly': 'bg-amber-50 text-amber-700',
  'Elite Annual': 'bg-amber-50 text-amber-700',
  'Premium Monthly': 'bg-blue-50 text-blue-700',
  'Basic Monthly': 'bg-emerald-50 text-emerald-700',
};

export default function MembersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery(
    ['members', { search, status, page }],
    () => membersApi.list({ search, status, page, limit: 20 }).then(r => r.data),
    { keepPreviousData: true }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Members</h1>
          <p className="text-sm text-gray-400">{data?.pagination?.total || 0} total members</p>
        </div>
        <Link to="/members/add"
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> Add Member
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Search name, phone, email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-gray-600">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Member', 'Code', 'Phone', 'Plan', 'Branch', 'Expires', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 font-medium py-3 px-4 first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : data?.members?.map((m) => {
              const daysLeft = dayjs(m.membership_end).diff(dayjs(), 'day');
              return (
                <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => navigate(`/members/${m.id}`)}>
                  <td className="py-3 px-4 pl-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-semibold text-emerald-700 flex-shrink-0">
                        {m.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-400">{m.member_code}</td>
                  <td className="py-3 px-4 text-gray-600">{m.phone}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${planColors[m.plan_name] || 'bg-gray-100 text-gray-600'}`}>
                      {m.plan_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{m.branch_name}</td>
                  <td className="py-3 px-4">
                    <span className={daysLeft <= 7 && m.status === 'active' ? 'text-amber-600 font-medium text-xs' : 'text-gray-500 text-xs'}>
                      {dayjs(m.membership_end).format('D MMM YY')}
                      {daysLeft <= 7 && m.status === 'active' && ` (${daysLeft}d)`}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColors[m.status] || 'bg-gray-100 text-gray-500'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 pr-5">
                    {(m.status === 'active' && daysLeft <= 14) || m.status === 'expired' ? (
                      <Link to={`/members/${m.id}/renew`}
                        onClick={e => e.stopPropagation()}
                        className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition-colors">
                        Renew
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              Showing {Math.min((page-1)*20+1, data.pagination.total)}–{Math.min(page*20, data.pagination.total)} of {data.pagination.total}
            </div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p+1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
