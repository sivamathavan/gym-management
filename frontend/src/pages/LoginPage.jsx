import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Zap, Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [showPass, setShowPass] = useState(false);

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Zap size={32} className="text-white fill-white/20" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">FitCore</h1>
          <p className="text-gray-400 mt-2 font-medium">Enterprise Gym Management</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-gray-400">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-gray-600"
                placeholder="admin@fitcore.in"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-xs text-red-400 mt-2 ml-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-gray-600 pr-12"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-2 ml-1 font-medium">{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                  <Zap size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Demo Access</p>
                  <p className="text-xs text-gray-300 font-mono">
                    <span className="text-emerald-400/70">UID:</span> admin@fitcore.in <br/>
                    <span className="text-emerald-400/70">PWD:</span> admin123
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-gray-500 text-xs mt-8">
          &copy; 2024 FitCore Tech. All rights reserved.
        </p>
      </div>
    </div>
  );
}
