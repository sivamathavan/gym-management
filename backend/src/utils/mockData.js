const dayjs = require('dayjs');

const branches = [
  { id: 1, name: 'FitCore HSR Layout', address: '123 Main St, HSR Layout', city: 'Bangalore', phone: '9876543210', email: 'hsr@fitcore.in', is_active: true, active_members: 142, active_classes: 12, trainer_count: 8 },
  { id: 2, name: 'FitCore Indiranagar', address: '456 Cross Rd, Indiranagar', city: 'Bangalore', phone: '9876543211', email: 'indiranagar@fitcore.in', is_active: true, active_members: 98, active_classes: 8, trainer_count: 5 },
  { id: 3, name: 'FitCore Koramangala', address: '789 80ft Rd, Koramangala', city: 'Bangalore', phone: '9876543212', email: 'koramangala@fitcore.in', is_active: true, active_members: 120, active_classes: 10, trainer_count: 6 }
];

const plans = [
  { id: 1, name: 'Basic Monthly', price: 2999, duration_days: 30, is_active: true },
  { id: 2, name: 'Premium Monthly', price: 4999, duration_days: 30, is_active: true },
  { id: 3, name: 'Annual Elite', price: 24999, duration_days: 365, is_active: true }
];

const members = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9000000001', member_code: 'FC101', status: 'active', plan_name: 'Premium Monthly', plan_price: 4999, branch_name: 'FitCore HSR Layout', membership_start: dayjs().subtract(15, 'day').format('YYYY-MM-DD'), membership_end: dayjs().add(15, 'day').format('YYYY-MM-DD'), loyalty_points: 450, total_visits: 120, auto_renewal: true, visits_this_month: 8 },
  { id: 2, name: 'Priya Singh', email: 'priya@example.com', phone: '9000000002', member_code: 'FC102', status: 'active', plan_name: 'Annual Elite', plan_price: 24999, branch_name: 'FitCore Indiranagar', membership_start: dayjs().subtract(6, 'month').format('YYYY-MM-DD'), membership_end: dayjs().add(6, 'month').format('YYYY-MM-DD'), loyalty_points: 1200, total_visits: 85, auto_renewal: false, visits_this_month: 4 },
  { id: 3, name: 'Amit Kumar', email: 'amit@example.com', phone: '9000000003', member_code: 'FC103', status: 'expired', plan_name: 'Basic Monthly', plan_price: 2999, branch_name: 'FitCore HSR Layout', membership_start: dayjs().subtract(2, 'month').format('YYYY-MM-DD'), membership_end: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), loyalty_points: 150, total_visits: 40, auto_renewal: false, visits_this_month: 0 },
  { id: 4, name: 'Sneha Patel', email: 'sneha@example.com', phone: '9000000004', member_code: 'FC104', status: 'active', plan_name: 'Premium Monthly', plan_price: 4999, branch_name: 'FitCore Koramangala', membership_start: dayjs().subtract(20, 'day').format('YYYY-MM-DD'), membership_end: dayjs().add(10, 'day').format('YYYY-MM-DD'), loyalty_points: 300, total_visits: 65, auto_renewal: true, visits_this_month: 12 },
  { id: 5, name: 'Vikram Rao', email: 'vikram@example.com', phone: '9000000005', member_code: 'FC105', status: 'active', plan_name: 'Annual Elite', plan_price: 24999, branch_name: 'FitCore HSR Layout', membership_start: dayjs().subtract(10, 'month').format('YYYY-MM-DD'), membership_end: dayjs().add(2, 'month').format('YYYY-MM-DD'), loyalty_points: 800, total_visits: 150, auto_renewal: true, visits_this_month: 15 }
];

const trainers = [
  { id: 1, user_id: 10, name: 'John Doe', email: 'john@fitcore.in', phone: '9888888881', specialties: ['Weightlifting', 'HIIT'], bio: '10 years experience in fitness training.', is_available: true, branch_name: 'FitCore HSR Layout', class_count: 5, sessions_this_month: 24 },
  { id: 2, user_id: 11, name: 'Sarah Connor', email: 'sarah@fitcore.in', phone: '9888888882', specialties: ['Yoga', 'Pilates'], bio: 'Specialist in mindful movement and flexibility.', is_available: true, branch_name: 'FitCore Indiranagar', class_count: 3, sessions_this_month: 12 },
  { id: 3, user_id: 12, name: 'Mike Tyson', email: 'mike@fitcore.in', phone: '9888888883', specialties: ['Boxing', 'MMA'], bio: 'Professional boxing coach.', is_available: false, branch_name: 'FitCore Koramangala', class_count: 4, sessions_this_month: 20 }
];

const classes = [
  { id: 1, name: 'Morning Power HIIT', description: 'High intensity interval training to start your day.', trainer_name: 'John Doe', branch_name: 'FitCore HSR Layout', start_time: '07:00:00', duration_min: 45, capacity: 20, today_booked: 15 },
  { id: 2, name: 'Zen Yoga Flow', description: 'Relaxing yoga session for all levels.', trainer_name: 'Sarah Connor', branch_name: 'FitCore Indiranagar', start_time: '08:30:00', duration_min: 60, capacity: 15, today_booked: 8 },
  { id: 3, name: 'Boxing Basics', description: 'Learn the fundamentals of boxing.', trainer_name: 'Mike Tyson', branch_name: 'FitCore Koramangala', start_time: '18:00:00', duration_min: 60, capacity: 12, today_booked: 12 }
];

const attendance = [
  { id: 1, member_id: 1, member_name: 'Rahul Sharma', member_code: 'FC101', branch_name: 'FitCore HSR Layout', check_in_at: dayjs().subtract(1, 'hour').toDate(), check_out_at: null, method: 'qr' },
  { id: 2, member_id: 2, member_name: 'Priya Singh', member_code: 'FC102', branch_name: 'FitCore Indiranagar', check_in_at: dayjs().subtract(2, 'hour').toDate(), check_out_at: dayjs().subtract(1, 'hour').toDate(), method: 'manual' },
  { id: 3, member_id: 4, member_name: 'Sneha Patel', member_code: 'FC104', branch_name: 'FitCore Koramangala', check_in_at: dayjs().subtract(3, 'hour').toDate(), check_out_at: null, method: 'qr' }
];

const payments = [
  { id: 1, member_name: 'Rahul Sharma', member_code: 'FC101', plan_name: 'Premium Monthly', amount: 4999, final_amount: 4999, status: 'captured', method: 'upi', created_at: dayjs().subtract(2, 'day').toDate() },
  { id: 2, member_name: 'Priya Singh', member_code: 'FC102', plan_name: 'Annual Elite', amount: 24999, final_amount: 22000, status: 'captured', method: 'card', created_at: dayjs().subtract(15, 'day').toDate() },
  { id: 3, member_name: 'Amit Kumar', member_code: 'FC103', plan_name: 'Basic Monthly', amount: 2999, final_amount: 2999, status: 'failed', method: 'upi', created_at: dayjs().subtract(1, 'hour').toDate() }
];

module.exports = {
  branches,
  plans,
  members,
  trainers,
  classes,
  attendance,
  payments
};
