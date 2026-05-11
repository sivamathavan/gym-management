import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { membersApi } from '../utils/api';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function RenewalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery(['renewal', id], () =>
    membersApi.renewalInfo(id).then(r => r.data)
  );

  const handleRenew = async () => {
    if (!selectedPlan) return toast.error('Please select a plan');
    setLoading(true);
    try {
      const res = await membersApi.initiateRenewal(id, { plan_id: selectedPlan.id, use_points: usePoints });
      const order = res.data;

      if (typeof window.Razorpay === 'undefined') {
        // Load Razorpay script dynamically
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      const rzp = new window.Razorpay({
        key: order.razorpay_key,
        amount: order.amount * 100,
        currency: 'INR',
        name: 'FitCore Gym',
        description: `${selectedPlan.name} renewal`,
        order_id: order.order_id,
        prefill: { name: data.member.name, email: data.member.email, contact: data.member.phone },
        theme: { color: '#10b981' },
        handler: async (response) => {
          try {
            await membersApi.completeRenewal(id, {
              ...response,
              plan_id: selectedPlan.id,
              discount: order.discount,
              points_used: usePoints ? data.member.loyalty_points : 0
            });
            toast.success('Membership renewed successfully!');
            navigate(`/members/${id}`);
          } catch (err) {
            toast.error('Renewal verification failed');
          }
        },
        modal: { ondismiss: () => setLoading(false) }
      });
      rzp.open();
    } catch (err) {
      toast.error('Failed to initiate renewal');
      setLoading(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const { member, available_plans, visits_this_month, days_to_expiry, loyalty_discount } = data;
  const planId = selectedPlan?.id;
  const discount = usePoints ? loyalty_discount : 0;
  const total = selectedPlan ? selectedPlan.price - discount : 0;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-sm">← Back</button>
        <h1 className="text-xl font-semibold text-gray-900">Renew Membership</h1>
      </div>

      {/* Member info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-semibold text-emerald-700">
            {member.name.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{member.name}</div>
            <div className="text-xs text-gray-400">{member.current_plan_name} · {member.member_code}</div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${days_to_expiry < 0 ? 'text-red-500' : days_to_expiry <= 7 ? 'text-amber-500' : 'text-gray-500'}`}>
              {days_to_expiry < 0 ? 'Expired' : `${days_to_expiry} days left`}
            </div>
            <div className="text-xs text-gray-400">{dayjs(member.membership_end).format('D MMM YYYY')}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Visits this month', value: visits_this_month },
            { label: 'Loyalty points', value: member.loyalty_points },
            { label: 'Point value', value: `₹${loyalty_discount}` },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-gray-900">{s.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan selection */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-900 mb-3">Select Plan</div>
        <div className="space-y-2">
          {(available_plans || []).map(plan => (
            <div key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                planId === plan.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div>
                <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{plan.duration_days} days</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">₹{plan.price.toLocaleString()}</div>
                {planId === member.plan_id && <div className="text-[10px] text-emerald-500">Current plan</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loyalty points */}
      {member.loyalty_points > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-sm font-medium text-gray-900">Use loyalty points</div>
              <div className="text-xs text-gray-400 mt-0.5">{member.loyalty_points} points = ₹{loyalty_discount} discount</div>
            </div>
            <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded" />
          </label>
        </div>
      )}

      {/* Summary + pay */}
      {selectedPlan && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-medium text-gray-900 mb-3">Order Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">{selectedPlan.name}</span><span>₹{selectedPlan.price.toLocaleString()}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">Loyalty discount</span><span className="text-emerald-600">-₹{discount}</span></div>}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2 mt-2">
              <span>Total</span><span>₹{total.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={handleRenew} disabled={loading}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-3 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Processing...' : `Pay ₹${total.toLocaleString()}`}
          </button>
        </div>
      )}
    </div>
  );
}
