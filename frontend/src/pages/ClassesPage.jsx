import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { classesApi, branchesApi } from '../utils/api';
import { Plus } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ClassesPage() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const qc = useQueryClient();

  const { data: sessions, isLoading } = useQuery(
    ['sessions', selectedDate],
    () => classesApi.sessions({ date: selectedDate }).then(r => r.data)
  );

  const fillColor = (booked, capacity) => {
    const pct = booked / capacity;
    if (pct >= 1) return 'bg-red-50 text-red-700';
    if (pct >= 0.85) return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  };

  const fillLabel = (booked, capacity) => {
    if (booked >= capacity) return 'Full';
    if (booked / capacity >= 0.85) return 'Almost full';
    return 'Open';
  };

  // Week navigation
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().startOf('week').add(i, 'day');
    return { label: DAYS[d.day()], date: d.format('YYYY-MM-DD'), day: d.date() };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-400">Schedule & bookings</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Plus size={15} /> New Class
        </button>
      </div>

      {/* Day selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-2 flex gap-1">
        {weekDays.map(d => (
          <button key={d.date} onClick={() => setSelectedDate(d.date)}
            className={`flex-1 py-2 rounded-lg text-center transition-colors ${
              selectedDate === d.date
                ? 'bg-emerald-500 text-white'
                : 'hover:bg-gray-50 text-gray-500'
            }`}>
            <div className="text-[10px] uppercase tracking-wide">{d.label}</div>
            <div className="text-sm font-medium mt-0.5">{d.day}</div>
          </button>
        ))}
      </div>

      {/* Sessions table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50/50">
              {['Time', 'Class', 'Trainer', 'Branch', 'Duration', 'Booked', 'Status', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 first:pl-5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : sessions?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No classes scheduled for this day</td></tr>
            ) : sessions?.map(s => {
              const booked = parseInt(s.booked || 0);
              return (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="py-3 px-4 pl-5 font-medium text-gray-900">
                    {s.start_time?.slice(0,5)}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 px-4 text-gray-500">{s.trainer_name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{s.branch_name}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{s.duration_min} min</td>
                  <td className="py-3 px-4">
                    <div className="text-xs text-gray-900 mb-1">{booked} / {s.capacity}</div>
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, (booked/s.capacity)*100)}%`,
                          background: booked >= s.capacity ? '#ef4444' : booked/s.capacity >= 0.85 ? '#f59e0b' : '#10b981' }} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${fillColor(booked, s.capacity)}`}>
                      {fillLabel(booked, s.capacity)}
                    </span>
                  </td>
                  <td className="py-3 px-4 pr-5">
                    {booked < s.capacity ? (
                      <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Book</button>
                    ) : (
                      <button className="text-xs text-gray-400 hover:text-gray-600">Waitlist</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
