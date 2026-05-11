import React from 'react';
import { useQuery } from 'react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, CalendarDays, TrendingUp, ScanLine, AlertTriangle, Zap } from 'lucide-react';
import { dashboardApi, aiApi } from '../utils/api';
import useStore from '../store/useStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-dark-800 rounded-2xl border border-dark-600 p-5 transition-all duration-300 hover:border-dark-500 hover:shadow-lg hover:shadow-black/20">
    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
      <Icon size={16} className={color} /> {label}
    </div>
    <div className="text-3xl font-extrabold text-white transition-all duration-300">{value}</div>
    {sub && <div className="text-xs text-gray-500 mt-2">{sub}</div>}
  </div>
);

const Pill = ({ children, color = 'green' }) => {
  const colors = {
    green: 'bg-neon-500/10 text-neon-500 border border-neon-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    red: 'bg-red-500/10 text-red-500 border border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    gray: 'bg-dark-700 text-gray-400 border border-dark-600',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[color]}`}>{children}</span>;
};

export default function DashboardPage() {
  const { selectedBranch } = useStore();
  const { data, isLoading } = useQuery(['dashboard', selectedBranch], () => 
    dashboardApi.get({ branch_id: selectedBranch === 'all' ? undefined : selectedBranch }).then(r => r.data)
  );
  const { data: aiData } = useQuery(['ai-insights', selectedBranch], () => 
    aiApi.insights({ branch_id: selectedBranch === 'all' ? undefined : selectedBranch }).then(r => r.data), {
    staleTime: 300000
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-neon-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(179,255,64,0.5)]" />
    </div>
  );

  const revenue = data?.revenue;
  const growthPct = parseFloat(revenue?.growth_pct || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-dark-600/50 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Manage your <span className="relative">Fitness<span className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-full"></span></span> business
          </h1>
          <p className="text-sm text-gray-400 mt-2">{dayjs().format('D MMM YYYY, hh:mm a')}</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-dark-800 border border-dark-600 hover:bg-dark-700 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
            Manage Class
          </button>
          <button className="bg-neon-500 hover:bg-neon-400 text-dark-900 text-sm font-bold px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(179,255,64,0.3)] transition-all flex items-center gap-2">
            + New Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5">
        <StatCard label="Total Members" value={data?.members?.active?.toLocaleString() || 0}
          sub={
            <span className="flex items-center gap-1">
              <span className="bg-red-500/20 text-red-400 px-1.5 rounded-sm text-[10px] font-bold">-{data?.members?.expired || 0}</span>
              Active Members
            </span>
          } icon={Users} color="text-gray-400" />
        <StatCard label="Today's Visited" value={data?.attendance?.today?.toLocaleString() || 0}
          sub={
            <span className="flex items-center gap-1">
              <span className="bg-red-500/20 text-red-400 px-1.5 rounded-sm text-[10px] font-bold">-1.3%</span>
              Daily Average
            </span>
          } icon={ScanLine} color="text-gray-400" />
        <StatCard label="Revenue" value={`$${((revenue?.this_month || 0)/1000).toFixed(1)}k`}
          sub={
            <span className="flex items-center gap-1">
              <span className="bg-neon-500/20 text-neon-500 px-1.5 rounded-sm text-[10px] font-bold">+{growthPct}%</span>
              Month / {dayjs().format('MMM')}
            </span>
          } icon={TrendingUp} color="text-gray-400" />
        <StatCard label="Active Trainers" value={data?.classes?.branch_classes || 0}
          sub={
            <span className="flex items-center gap-1">
              <span className="bg-neon-500/20 text-neon-500 px-1.5 rounded-sm text-[10px] font-bold">+3.6%</span>
              Active Trainers
            </span>
          } icon={UserCheck} color="text-gray-400" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Weekly Attendance Chart */}
        <div className="col-span-2 bg-dark-800 rounded-2xl border border-dark-600 p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-bold text-white">Revenue Analytics</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.weekly_attendance || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#2A2A2A', radius: 8 }}
                contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderRadius: 8, color: '#fff', fontSize: 12 }} 
              />
              <Bar dataKey="count" radius={[20, 20, 20, 20]}>
                {
                  (data?.weekly_attendance || []).map((entry, index) => {
                    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#B3FF40', '#eab308'];
                    return <cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights */}
        <div className="col-span-1 bg-dark-800 rounded-2xl border border-dark-600 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={18} className="text-neon-500" />
              <span className="text-lg font-bold text-white">AI Insights</span>
            </div>
            <Pill color="green">Active</Pill>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {(aiData?.insights || []).map((insight) => (
              <div key={insight.id} className="bg-dark-700/50 rounded-xl p-4 border border-dark-600 hover:border-dark-500 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${
                    insight.type === 'warning' ? 'bg-amber-500' :
                    insight.type === 'opportunity' ? 'bg-neon-500' : 'bg-blue-500'
                  }`} />
                  <div className="font-bold text-white text-sm">{insight.title}</div>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed mb-2">{insight.message}</div>
                {insight.action && (
                  <div className="text-[10px] font-semibold text-neon-500 uppercase tracking-wide">{insight.action}</div>
                )}
              </div>
            ))}
            {!aiData?.insights?.length && (
              <div className="text-sm text-gray-500 text-center py-10">Waiting for insights...</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Expiring Soon */}
        <div className="bg-dark-800 rounded-2xl border border-dark-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-white">Expiring Memberships</span>
            <Pill color="amber">{data?.members?.expiring_soon} members</Pill>
          </div>
          <div className="space-y-1">
            {(data?.expiring_members || []).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0 hover:bg-dark-700/30 px-2 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-gray-300">
                    {m.name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{m.name}</div>
                    <div className="text-xs text-gray-400">{m.plan_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-bold ${m.days_left <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                    {m.days_left}d left
                  </div>
                  <div className="text-[10px] text-gray-500">{dayjs(m.membership_end).format('D MMM')}</div>
                </div>
              </div>
            ))}
            {!data?.expiring_members?.length && (
              <div className="text-sm text-gray-500 text-center py-6">No expiring memberships</div>
            )}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-dark-800 rounded-2xl border border-dark-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold text-white">Recent Sign-ups</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-500 border-b border-dark-700">
                  <th className="text-left pb-3 font-semibold">Member</th>
                  <th className="text-left pb-3 font-semibold">Plan</th>
                  <th className="text-right pb-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recent_signups || []).map((m) => (
                  <tr key={m.id} className="border-b border-dark-700 last:border-0 hover:bg-dark-700/30 transition-colors cursor-pointer">
                    <td className="py-3">
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-gray-500">{m.member_code}</div>
                    </td>
                    <td className="py-3"><Pill color="green">{m.plan_name}</Pill></td>
                    <td className="py-3 text-right text-gray-400 text-xs font-medium">{dayjs(m.created_at).fromNow()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
