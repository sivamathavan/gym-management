import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { authApi } from '../utils/api';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import { Lock, Bell, Plug, Users } from 'lucide-react';

const Toggle = ({ label, desc, defaultChecked = true }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => setOn(!on)}
        className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${on ? 'bg-emerald-500' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
};

export default function SettingsPage() {
  const { user } = useStore();
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm();

  const pwMutation = useMutation(authApi.changePassword, {
    onSuccess: () => toast.success('Password changed!'),
    onError: () => toast.error('Current password is incorrect'),
  });

  const integrations = [
    { name: 'Razorpay', desc: 'Payment gateway — UPI, cards, mandates', status: 'connected' },
    { name: 'Twilio WhatsApp', desc: 'Automated notifications & reminders', status: 'connected' },
    { name: 'Twilio SMS', desc: 'SMS fallback for notifications', status: 'partial' },
    { name: 'Biometric Device', desc: 'Hardware check-in at gate', status: 'connected' },
    { name: 'Google Calendar', desc: 'Sync class schedule', status: 'disconnected' },
    { name: 'Claude AI', desc: 'Smart insights & forecasting', status: 'connected' },
  ];

  const statusPill = (s) => ({
    connected: 'bg-emerald-50 text-emerald-700',
    partial: 'bg-amber-50 text-amber-700',
    disconnected: 'bg-gray-100 text-gray-500',
  }[s]);

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Account Info</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Name', user?.name], ['Email', user?.email],
            ['Role', user?.role?.replace(/_/g,' ')], ['Branch', user?.branch_id || 'All branches']
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-xs text-gray-400 mb-1">{k}</div>
              <div className="text-sm font-medium text-gray-900 capitalize">{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Change Password</span>
        </div>
        <form onSubmit={handleSubmit(d => pwMutation.mutate(d))} className="space-y-3">
          {[
            { name: 'current_password', label: 'Current Password' },
            { name: 'new_password', label: 'New Password' },
            { name: 'confirm_password', label: 'Confirm New Password' },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
              <input type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                {...register(f.name, { required: true, minLength: f.name !== 'current_password' ? 8 : 1 })} />
            </div>
          ))}
          <button type="submit" disabled={isSubmitting}
            className="w-full py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60 transition-colors">
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Notifications</span>
        </div>
        <Toggle label="Membership expiry alerts" desc="3 days & 7 days before expiry" />
        <Toggle label="New member welcome" desc="Auto WhatsApp on sign-up" />
        <Toggle label="Payment failure alerts" desc="Notify admin on failed payments" />
        <Toggle label="Class booking confirmations" desc="Send WhatsApp on booking" />
        <Toggle label="Re-engagement campaign" desc="Auto message after 21 days inactive" />
        <Toggle label="Daily attendance digest" desc="8 PM summary via email" defaultChecked={false} />
      </div>

      {/* Integrations */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plug size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">Integrations</span>
        </div>
        <div className="space-y-0">
          {integrations.map(intg => (
            <div key={intg.name} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-900">{intg.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{intg.desc}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${statusPill(intg.status)}`}>
                  {intg.status}
                </span>
                <button className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-0.5 rounded-lg">
                  {intg.status === 'disconnected' ? 'Connect' : 'Configure'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
