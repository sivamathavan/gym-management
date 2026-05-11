import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { membersApi } from '../utils/api';
import dayjs from 'dayjs';

const statusColors = {
  active: 'bg-neon-500/10 text-neon-500 border border-neon-500/20',
  expired: 'bg-red-500/10 text-red-400 border border-red-500/20',
  suspended: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  cancelled: 'bg-gray-800 text-gray-400 border border-gray-700',
};

const planColors = {
  'Elite Monthly': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  'Elite Annual': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
  'Premium Monthly': 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  'Basic Monthly': 'bg-neon-500/10 text-neon-500 border border-neon-500/20',
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
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-dark-600/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">All Members</h1>
          <p className="text-sm text-gray-400 mt-2">{data?.pagination?.total || 0} total members</p>
        </div>
        <Link to="/members/add"
          className="bg-neon-500 hover:bg-neon-400 text-dark-900 text-sm font-bold px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(179,255,64,0.3)] transition-all flex items-center gap-2">
          <Plus size={16} /> New Member
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="w-full pl-11 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-full text-white text-sm focus:outline-none focus:border-neon-500 focus:ring-1 focus:ring-neon-500 transition-all placeholder:text-gray-600"
            placeholder="Search name, phone, email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-dark-800 border border-dark-600 rounded-full px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neon-500 transition-all appearance-none pr-8">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600 bg-dark-900/50">
                {['Member Name', 'Expired Date', 'Age', 'Status', 'Tel', 'Last Visited', ''].map((h, i) => (
                  <th key={i} className="text-left text-[10px] uppercase tracking-wider text-gray-500 font-bold py-4 px-5 first:pl-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500 font-medium">Loading members...</td></tr>
              ) : data?.members?.map((m) => {
                const daysLeft = dayjs(m.membership_end).diff(dayjs(), 'day');
                return (
                  <tr key={m.id} className="border-b border-dark-700 last:border-0 hover:bg-dark-700/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/members/${m.id}`)}>
                    <td className="py-4 px-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-dark-700 border border-dark-600 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                          {m.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{m.name}</div>
                          <div className="text-xs text-gray-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-400 font-medium">
                      {dayjs(m.membership_end).format('DD/MM/YY')}
                    </td>
                    <td className="py-4 px-5 text-gray-400 font-medium">
                      24 {/* Mocked Age */}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full capitalize ${statusColors[m.status] || 'bg-dark-700 text-gray-500'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-gray-400 font-medium">{m.phone}</td>
                    <td className="py-4 px-5 text-gray-400 font-medium">Yesterday</td> {/* Mocked Last Visited */}
                    <td className="py-4 px-5 pr-6 text-right">
                      {(m.status === 'active' && daysLeft <= 14) || m.status === 'expired' ? (
                        <Link to={`/members/${m.id}/renew`}
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] font-bold bg-neon-500/10 text-neon-500 border border-neon-500/20 px-3 py-1.5 rounded-full hover:bg-neon-500/20 transition-colors uppercase tracking-wide">
                          Renew
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-dark-600 bg-dark-900/20">
            <div className="text-xs font-medium text-gray-500">
              Showing {Math.min((page-1)*20+1, data.pagination.total)}–{Math.min(page*20, data.pagination.total)} of {data.pagination.total}
            </div>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-dark-700 border border-dark-600 rounded-full disabled:opacity-30 hover:bg-dark-600 transition-colors">← Prev</button>
              <button disabled={page >= data.pagination.pages} onClick={() => setPage(p => p+1)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-dark-700 border border-dark-600 rounded-full disabled:opacity-30 hover:bg-dark-600 transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
