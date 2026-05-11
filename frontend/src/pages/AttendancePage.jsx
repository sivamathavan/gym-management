// AttendancePage.jsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { attendanceApi } from '../utils/api';
import { QrCode, ScanLine } from 'lucide-react';
import dayjs from 'dayjs';

export default function AttendancePage() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const { data: today } = useQuery('attendance-today', () => attendanceApi.today().then(r => r.data));
  const { data: logs } = useQuery(['attendance', date], () => attendanceApi.list({ date, limit: 50 }).then(r => r.data));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-400">Real-time check-ins</p>
        </div>
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-gray-400" />
          <span className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's check-ins", value: today?.total_checkins || 0 },
          { label: 'Unique members', value: today?.unique_members || 0 },
          { label: 'Morning (6–9 AM)', value: today?.morning || 0 },
          { label: 'Evening (5–9 PM)', value: today?.evening || 0 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-900">Check-in Log</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              {['Member', 'Time', 'Branch', 'Method'].map(h => (
                <th key={h} className="text-left py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs?.attendance || []).map((a, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5">
                  <div className="font-medium text-gray-900">{a.member_name}</div>
                  <div className="text-xs text-gray-400">{a.member_code}</div>
                </td>
                <td className="py-2.5 text-gray-600">{dayjs(a.check_in_at).format('h:mm A')}</td>
                <td className="py-2.5 text-gray-500 text-xs">{a.branch_name}</td>
                <td className="py-2.5">
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a.method}</span>
                </td>
              </tr>
            ))}
            {!logs?.attendance?.length && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No check-ins for this date</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
