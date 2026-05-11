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

  const { data: member, isLoading } = useQuery(['member', id], () => membersApi.get(id).then(r => r.data));

  const generateQR = async () => {
    try {
      const res = await attendanceApi.generateQR(id);
      setQrData(res.data);
      setShowQr(true);
    } catch (err) {
      toast.error('Failed to generate QR code');
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-500 font-medium">Loading member...</div>;
  if (!member) return <div className="text-center py-20 text-gray-500 font-medium">Member not found</div>;

  const daysLeft = dayjs(member.membership_end).diff(dayjs(), 'day');
  const isExpiringSoon = daysLeft <= 14 && member.status === 'active';
  const isExpired = member.status === 'expired';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/members')} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">← Back to Members</button>
      </div>

      <div className="bg-dark-800 rounded-2xl border border-dark-600 p-8 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-dark-700 border border-dark-600 flex items-center justify-center text-xl font-bold text-gray-300">
              {member.name.slice(0,2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{member.name}</h1>
              <div className="text-sm text-gray-400 font-medium">{member.member_code} • {member.branch_name}</div>
              <span className={`inline-flex mt-2 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                member.status === 'active' ? 'bg-neon-500/10 text-neon-500 border border-neon-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {member.status}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={generateQR}
              className="flex items-center gap-2 bg-dark-700 border border-dark-600 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-dark-600 hover:border-dark-500 transition-colors">
              Generate QR
            </button>
            {(isExpiringSoon || isExpired) && (
              <Link to={`/members/${id}/renew`}
                className="bg-neon-500 text-dark-900 text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neon-400 transition-all shadow-[0_0_15px_rgba(179,255,64,0.2)]">
                Renew Plan
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Check-in QR Code</h3>
            <div className="bg-white rounded-2xl p-5 flex justify-center shadow-[0_0_30px_rgba(179,255,64,0.15)]">
              <img src={qrData?.qr} alt="QR Code" className="w-52 h-52" />
            </div>
            <div className="text-xs font-medium text-gray-500">Valid for 5 minutes</div>
            <button onClick={() => setShowQr(false)} className="w-full py-3 bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-full text-sm font-bold text-white transition-colors">Close</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Visits this month', value: member.visits_this_month },
          { label: 'Total visits', value: member.total_visits },
          { label: 'Loyalty points', value: member.loyalty_points },
        ].map(s => (
          <div key={s.label} className="bg-dark-800 rounded-2xl border border-dark-600 p-6 text-center hover:border-dark-500 transition-colors">
            <div className="text-3xl font-extrabold text-white">{s.value}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-gray-500 mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-dark-800 rounded-2xl border border-dark-600 p-7">
          <div className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5">Membership Details</div>
          {[
            ['Plan', <span className="bg-neon-500/10 text-neon-500 border border-neon-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{member.plan_name}</span>],
            ['Price', `₹${member.plan_price}/period`],
            ['Start', dayjs(member.membership_start).format('D MMM YYYY')],
            ['Expires', dayjs(member.membership_end).format('D MMM YYYY')],
            ['Days remaining', isExpired ? <span className="text-red-400">Expired</span> : <span className="text-amber-400">{daysLeft} days</span>],
            ['Auto-renewal', member.auto_renewal ? <span className="text-neon-500">Enabled</span> : 'Disabled'],
          ].map(([k, v], i) => (
            <div key={i} className="flex justify-between py-3 border-b border-dark-700 last:border-0 text-sm">
              <span className="text-gray-400 font-medium">{k}</span>
              <span className="font-bold text-white">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-dark-800 rounded-2xl border border-dark-600 p-7">
          <div className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5">Contact Info</div>
          {[
            ['Phone', member.phone],
            ['Email', member.email || '—'],
            ['Gender', member.gender || '—'],
            ['DOB', member.date_of_birth ? dayjs(member.date_of_birth).format('D MMM YYYY') : '—'],
            ['Emergency', member.emergency_contact || '—'],
            ['Address', member.address || '—'],
          ].map(([k, v], i) => (
            <div key={i} className="flex justify-between py-3 border-b border-dark-700 last:border-0 text-sm">
              <span className="text-gray-400 font-medium">{k}</span>
              <span className="font-medium text-white text-right max-w-[200px] truncate">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent attendance */}
      <div className="bg-dark-800 rounded-2xl border border-dark-600 p-7">
        <div className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5">Recent Attendance</div>
        {member.recent_attendance?.length > 0 ? (
          <div className="space-y-1">
            {member.recent_attendance.map((a, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-3 border-b border-dark-700 last:border-0 hover:bg-dark-700/30 px-3 rounded-lg transition-colors cursor-default">
                <span className="font-medium text-white">{dayjs(a.check_in_at).format('D MMM YYYY, h:mm A')}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-dark-700 px-2 py-1 rounded">{a.method}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm font-medium text-gray-500 py-4 text-center">No attendance records yet</div>
        )}
      </div>
    </div>
  );
}
