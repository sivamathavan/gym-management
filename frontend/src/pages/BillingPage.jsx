// BillingPage.jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { billingApi } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

export default function BillingPage() {
  const [page, setPage] = useState(1);
  const { data } = useQuery(['payments', page], () => billingApi.list({ page, limit: 20 }).then(r => r.data));
  const { data: stats } = useQuery('billing-stats', () => billingApi.stats().then(r => r.data));

  const statusPill = (s) => ({
    captured: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
  }[s] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Billing</h1>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'This month', value: `₹${((stats?.today_stats?.this_month||0)/100000).toFixed(1)}L` },
          { label: 'Today', value: `₹${((stats?.today_stats?.today||0)/1000).toFixed(0)}K` },
          { label: 'Failed payments', value: stats?.today_stats?.failed_today || 0 },
          { label: 'Refunded', value: `₹${(stats?.today_stats?.refunded_this_month||0).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-medium text-gray-900 mb-4">Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={(stats?.monthly_revenue||[]).map(r=>({
              month: dayjs(r.month).format('MMM'), revenue: parseFloat(r.revenue)/100000
            }))}>
              <XAxis dataKey="month" tick={{fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`₹${v}L`} />
              <Tooltip formatter={v=>`₹${v.toFixed(1)}L`} contentStyle={{fontSize:12,borderRadius:8,border:'none',boxShadow:'0 2px 10px rgba(0,0,0,.1)'}} />
              <Bar dataKey="revenue" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-medium text-gray-900 mb-3">Revenue by Plan</div>
          {(stats?.plan_breakdown||[]).map(p => (
            <div key={p.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <div>
                <div className="font-medium text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-400">{p.count} payments</div>
              </div>
              <div className="font-semibold text-gray-900">₹{parseFloat(p.revenue).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="text-sm font-medium text-gray-900">Transactions</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
              {['Member', 'Plan', 'Amount', 'Method', 'Invoice', 'Date', 'Status'].map(h => (
                <th key={h} className="text-left py-3 px-4 first:pl-5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.payments||[]).map(p => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td className="py-3 px-4 pl-5">
                  <div className="font-medium text-gray-900">{p.member_name}</div>
                  <div className="text-xs text-gray-400">{p.member_code}</div>
                </td>
                <td className="py-3 px-4 text-xs text-gray-500">{p.plan_name}</td>
                <td className="py-3 px-4 font-medium">₹{parseFloat(p.final_amount).toLocaleString()}</td>
                <td className="py-3 px-4 text-xs capitalize text-gray-500">{p.method || '—'}</td>
                <td className="py-3 px-4 text-xs text-blue-600">{p.invoice_number}</td>
                <td className="py-3 px-4 text-xs text-gray-400">{dayjs(p.created_at).format('D MMM YY')}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusPill(p.status)}`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
