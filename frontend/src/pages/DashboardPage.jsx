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
  <div className="bg-white rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:shadow-md">
    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
      <Icon size={14} className={color} /> {label}
    </div>
    <div className="text-2xl font-semibold text-gray-900 transition-all duration-300">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

const Pill = ({ children, color = 'green' }) => {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[color]}`}>{children}</span>;
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
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const revenue = data?.revenue;
  const growthPct = parseFloat(revenue?.growth_pct || 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400">{dayjs().format('dddd, D MMMM YYYY')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Members" value={data?.members?.active?.toLocaleString() || 0}
          sub={`+${data?.members?.new_this_month || 0} this month`} icon={Users} color="text-emerald-500" />
        <StatCard label="Today's Check-ins" value={data?.attendance?.today?.toLocaleString() || 0}
          sub={`${data?.attendance?.this_week || 0} this week`} icon={ScanLine} color="text-blue-500" />
        <StatCard label="Monthly Revenue" value={`₹${((revenue?.this_month || 0)/100000).toFixed(1)}L`}
          sub={`${growthPct >= 0 ? '+' : ''}${growthPct}% vs last month`} icon={TrendingUp} color="text-amber-500" />
        <StatCard label="Active Classes" value={data?.classes?.active_classes || 0}
          sub="Across all branches" icon={CalendarDays} color="text-purple-500" />
      </div>

      {/* AI Insights */}
      {aiData?.insights?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-900">AI Insights</span>
            <Pill color="blue">Claude-powered</Pill>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {aiData.insights.map((insight) => (
              <div key={insight.id} className={`rounded-lg p-3 text-sm ${
                insight.type === 'warning' ? 'bg-amber-50 border border-amber-100' :
                insight.type === 'opportunity' ? 'bg-emerald-50 border border-emerald-100' :
                'bg-blue-50 border border-blue-100'
              }`}>
                <div className="font-medium text-gray-900 mb-1 text-[12px]">{insight.title}</div>
                <div className="text-[11px] text-gray-600 leading-relaxed">{insight.message}</div>
                <div className="text-[10px] text-gray-400 mt-1">{insight.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Attendance */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-900">Weekly Attendance</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data?.weekly_attendance || []}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: 'none', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">Expiring Soon</span>
            <Pill color="amber">{data?.members?.expiring_soon} members</Pill>
          </div>
          <div className="space-y-2">
            {(data?.expiring_members || []).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">{m.name}</div>
                  <div className="text-xs text-gray-400">{m.plan_name}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${m.days_left <= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                    {m.days_left}d left
                  </div>
                  <div className="text-[10px] text-gray-400">{dayjs(m.membership_end).format('D MMM')}</div>
                </div>
              </div>
            ))}
            {!data?.expiring_members?.length && (
              <div className="text-sm text-gray-400 text-center py-4">No expiring memberships</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">Recent Sign-ups</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left py-2 font-medium">Member</th>
              <th className="text-left py-2 font-medium">Code</th>
              <th className="text-left py-2 font-medium">Plan</th>
              <th className="text-left py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recent_signups || []).map((m) => (
              <tr key={m.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 font-medium text-gray-900">{m.name}</td>
                <td className="py-2.5 text-gray-400 text-xs">{m.member_code}</td>
                <td className="py-2.5"><Pill>{m.plan_name}</Pill></td>
                <td className="py-2.5 text-gray-400 text-xs">{dayjs(m.created_at).fromNow()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
