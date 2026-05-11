// MemberDetailPage.jsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { membersApi, attendanceApi } from '../utils/api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qrData, setQrData] = React.useState(null);
  const [showQr, setShowQr] = React.useState(false);

  const generateQR = async () => {
    try {
      const res = await attendanceApi.generateQR(id);
      setQrData(res.data);
      setShowQr(true);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading member...</div>;
  if (!member) return <div className="text-center py-20 text-gray-400">Member not found</div>;

  const daysLeft = dayjs(member.membership_end).diff(dayjs(), 'day');
  const isExpiringSoon = daysLeft <= 14 && member.status === 'active';
  const isExpired = member.status === 'expired';

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/members')} className="text-gray-400 hover:text-gray-700 text-sm">← Members</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-semibold text-emerald-700">
              {member.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{member.name}</h1>
              <div className="text-sm text-gray-400">{member.member_code} · {member.branch_name}</div>
              <span className={`inline-flex mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                member.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {member.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateQR}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Generate QR
            </button>
            {(isExpiringSoon || isExpired) && (
              <Link to={`/members/${id}/renew`}
                className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                Renew
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full text-center space-y-4">
            <h3 className="text-lg font-semibold">Check-in QR Code</h3>
            <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
              <img src={qrData?.qr} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="text-xs text-gray-400">Valid for 5 minutes</div>
            <button onClick={() => setShowQr(false)} className="w-full py-2 bg-gray-100 rounded-lg text-sm font-medium">Close</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Visits this month', value: member.visits_this_month },
          { label: 'Total visits', value: member.total_visits },
          { label: 'Loyalty points', value: member.loyalty_points },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-medium text-gray-900 mb-3">Membership</div>
          {[
            ['Plan', member.plan_name],
            ['Price', `₹${member.plan_price}/period`],
            ['Start', dayjs(member.membership_start).format('D MMM YYYY')],
            ['Expires', dayjs(member.membership_end).format('D MMM YYYY')],
            ['Days remaining', isExpired ? 'Expired' : `${daysLeft} days`],
            ['Auto-renewal', member.auto_renewal ? 'Enabled' : 'Disabled'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-900">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-medium text-gray-900 mb-3">Contact Info</div>
          {[
            ['Phone', member.phone],
            ['Email', member.email || '—'],
            ['Gender', member.gender || '—'],
            ['DOB', member.date_of_birth ? dayjs(member.date_of_birth).format('D MMM YYYY') : '—'],
            ['Emergency', member.emergency_contact || '—'],
            ['Address', member.address || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
              <span className="text-gray-400">{k}</span>
              <span className="font-medium text-gray-900 text-right max-w-48 truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent attendance */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-900 mb-3">Recent Attendance</div>
        {member.recent_attendance?.length > 0 ? (
          <div className="space-y-2">
            {member.recent_attendance.map((a, i) => (
              <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-900">{dayjs(a.check_in_at).format('D MMM YYYY, h:mm A')}</span>
                <span className="text-xs text-gray-400 capitalize">{a.method}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">No attendance records yet</div>
        )}
      </div>
    </div>
  );
}
