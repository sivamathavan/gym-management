const { query, queryOne, getIsConnected } = require('../config/db');
const { get, set } = require('../config/redis');

const getDashboard = async (req, res) => {
  // Mock data for demo if DB is not connected
  if (!getIsConnected()) {
    const isFiltered = !!req.branchFilter;
    return res.json({
      members: { 
        active: isFiltered ? 45 : 142, 
        expired: isFiltered ? 4 : 12, 
        new_this_month: isFiltered ? 8 : 28, 
        expiring_soon: isFiltered ? 2 : 5 
      },
      revenue: { 
        this_month: isFiltered ? 25000 : 85400, 
        today: isFiltered ? 1200 : 4200, 
        last_month: isFiltered ? 22000 : 72000, 
        growth_pct: isFiltered ? "13.6" : "18.6" 
      },
      attendance: { today: isFiltered ? 15 : 45, this_week: isFiltered ? 70 : 210 },
      classes: { active_classes: 12, branch_classes: isFiltered ? 4 : 12 },
      expiring_members: isFiltered ? [
        { id: 1, name: "Rahul Sharma", member_code: "FC102", days_left: 3, plan_name: "Premium Monthly", membership_end: dayjs().add(3, 'day').format('YYYY-MM-DD') }
      ] : [
        { id: 1, name: "Rahul Sharma", member_code: "FC102", days_left: 3, plan_name: "Premium Monthly", membership_end: dayjs().add(3, 'day').format('YYYY-MM-DD') },
        { id: 2, name: "Priya Singh", member_code: "FC145", days_left: 5, plan_name: "Annual Elite", membership_end: dayjs().add(5, 'day').format('YYYY-MM-DD') }
      ],
      recent_signups: isFiltered ? [
        { id: 3, name: "Amit Kumar", member_code: "FC288", plan_name: "Basic Monthly", created_at: dayjs().subtract(1, 'hour').toISOString() }
      ] : [
        { id: 3, name: "Amit Kumar", member_code: "FC288", plan_name: "Basic Monthly", created_at: dayjs().subtract(1, 'hour').toISOString() },
        { id: 4, name: "Sneha Patel", member_code: "FC287", plan_name: "Premium Monthly", created_at: dayjs().subtract(3, 'hour').toISOString() }
      ],
      weekly_attendance: isFiltered ? [
        { day: "Mon", count: 12 }, { day: "Tue", count: 10 }, { day: "Wed", count: 15 },
        { day: "Thu", count: 14 }, { day: "Fri", count: 18 }, { day: "Sat", count: 20 }, { day: "Sun", count: 8 }
      ] : [
        { day: "Mon", count: 42 }, { day: "Tue", count: 38 }, { day: "Wed", count: 51 },
        { day: "Thu", count: 47 }, { day: "Fri", count: 55 }, { day: "Sat", count: 62 }, { day: "Sun", count: 28 }
      ],
    });
  }

  const cacheKey = `dashboard:${req.branchFilter || 'all'}`;
  const cached = await get(cacheKey);
  if (cached) return res.json(cached);

  const branchFilter = req.branchFilter ? `AND branch_id = '${req.branchFilter}'` : '';
  const branchJoin = req.branchFilter ? `AND m.branch_id = '${req.branchFilter}'` : '';

  const [memberStats, revenueStats, attendanceStats, classStats, expiringMembers, recentSignups] =
    await Promise.all([
      queryOne(`SELECT
        COUNT(*) FILTER (WHERE status='active' ${branchFilter}) as active,
        COUNT(*) FILTER (WHERE status='expired' ${branchFilter}) as expired,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month',NOW()) ${branchFilter}) as new_this_month,
        COUNT(*) FILTER (WHERE membership_end BETWEEN NOW() AND NOW()+INTERVAL '7 days' ${branchFilter}) as expiring_soon
        FROM members`),

      queryOne(`SELECT
        SUM(final_amount) FILTER (WHERE status='captured' AND created_at >= date_trunc('month',NOW())) as this_month,
        SUM(final_amount) FILTER (WHERE status='captured' AND created_at >= CURRENT_DATE) as today,
        SUM(final_amount) FILTER (WHERE status='captured' AND created_at >= date_trunc('month',NOW())-INTERVAL '1 month'
          AND created_at < date_trunc('month',NOW())) as last_month
        FROM payments`),

      queryOne(`SELECT
        COUNT(*) FILTER (WHERE DATE(check_in_at)=CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE check_in_at >= NOW()-INTERVAL '7 days') as this_week
        FROM attendance ${req.branchFilter ? `WHERE branch_id='${req.branchFilter}'` : ''}`),

      queryOne(`SELECT
        COUNT(*) FILTER (WHERE is_active=TRUE) as active_classes,
        COUNT(*) FILTER (WHERE is_active=TRUE ${branchFilter}) as branch_classes
        FROM classes`),

      query(`SELECT m.id, m.name, m.member_code, m.membership_end, mp.name as plan_name,
               m.status, (m.membership_end - CURRENT_DATE) as days_left
             FROM members m LEFT JOIN membership_plans mp ON m.plan_id = mp.id
             WHERE m.membership_end BETWEEN NOW() AND NOW()+INTERVAL '14 days'
               AND m.status = 'active' ${branchJoin}
             ORDER BY m.membership_end LIMIT 5`),

      query(`SELECT m.id, m.name, m.member_code, m.created_at, mp.name as plan_name
             FROM members m LEFT JOIN membership_plans mp ON m.plan_id = mp.id
             WHERE 1=1 ${branchJoin}
             ORDER BY m.created_at DESC LIMIT 5`),
    ]);

  const weeklyAttendance = await query(
    `SELECT TO_CHAR(DATE(check_in_at),'Dy') as day,
       EXTRACT(DOW FROM check_in_at) as dow,
       COUNT(*) as count
     FROM attendance
     WHERE check_in_at >= NOW() - INTERVAL '7 days'
     GROUP BY 1,2 ORDER BY 2`
  );

  const data = {
    members: memberStats,
    revenue: {
      ...revenueStats,
      growth_pct: revenueStats.last_month > 0
        ? (((revenueStats.this_month - revenueStats.last_month) / revenueStats.last_month) * 100).toFixed(1)
        : 0
    },
    attendance: attendanceStats,
    classes: classStats,
    expiring_members: expiringMembers.rows,
    recent_signups: recentSignups.rows,
    weekly_attendance: weeklyAttendance.rows,
  };

  await set(cacheKey, data, 120);
  res.json(data);
};

module.exports = { getDashboard };
