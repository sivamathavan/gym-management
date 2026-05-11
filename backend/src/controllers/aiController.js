const { query, queryOne, getIsConnected } = require('../config/db');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const getInsights = async (req, res) => {
  if (!getIsConnected()) {
    return res.json({
      insights: [
        {
          id: 'demo-info',
          type: 'info',
          title: 'Demo Mode Active',
          message: 'The system is running in demo mode with sample data. Connect to a database for real-time AI analysis.',
          action: 'Contact support',
          impact: 'Insights will improve with real member data'
        }
      ],
      raw_data: {}
    });
  }

  // Gather gym data to feed into Claude
  const [churnRisk, revenueData, classPerformance, trainerStats] = await Promise.all([
    query(`SELECT m.id, m.name, m.phone, m.status, mp.name as plan,
             (NOW() - MAX(a.check_in_at)) as days_since_visit,
             COUNT(a.id) as total_visits_30d
           FROM members m
           LEFT JOIN membership_plans mp ON m.plan_id = mp.id
           LEFT JOIN attendance a ON a.member_id = m.id
             AND a.check_in_at >= NOW() - INTERVAL '30 days'
           WHERE m.status = 'active'
           GROUP BY m.id, mp.name
           HAVING MAX(a.check_in_at) < NOW() - INTERVAL '14 days'
              OR MAX(a.check_in_at) IS NULL
           LIMIT 20`),

    queryOne(`SELECT
       SUM(final_amount) FILTER (WHERE created_at >= date_trunc('month',NOW())) as this_month,
       SUM(final_amount) FILTER (WHERE created_at >= date_trunc('month',NOW())-INTERVAL '1 month'
         AND created_at < date_trunc('month',NOW())) as last_month,
       COUNT(*) FILTER (WHERE status='failed' AND created_at >= date_trunc('month',NOW())) as failed_payments
     FROM payments`),

    query(`SELECT c.name, AVG(booked::float/c.capacity)*100 as avg_fill_rate,
             COUNT(cs.id) as sessions
           FROM classes c
           JOIN class_sessions cs ON cs.class_id = c.id
           LEFT JOIN (
             SELECT session_id, COUNT(*) as booked FROM class_bookings
             WHERE status='confirmed' GROUP BY session_id
           ) cb ON cb.session_id = cs.id
           WHERE cs.session_date >= NOW()-INTERVAL '30 days'
           GROUP BY c.id ORDER BY avg_fill_rate DESC LIMIT 10`),

    query(`SELECT u.name, COUNT(cs.id) as classes_held,
             AVG(t.rating) as avg_rating
           FROM trainers t
           JOIN users u ON t.user_id = u.id
           LEFT JOIN classes c ON c.trainer_id = t.id
           LEFT JOIN class_sessions cs ON cs.class_id = c.id
             AND cs.session_date >= NOW()-INTERVAL '30 days'
           GROUP BY u.name, t.rating`),
  ]);

  const gymContext = {
    churn_risk_members: churnRisk.rows.length,
    revenue_this_month: revenueData.this_month,
    revenue_last_month: revenueData.last_month,
    failed_payments: revenueData.failed_payments,
    top_classes: classPerformance.rows.slice(0, 3),
    low_fill_classes: classPerformance.rows.filter(c => c.avg_fill_rate < 50),
    trainer_count: trainerStats.rows.length,
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are an AI assistant for FitCore gym management system.
          
Here is the current gym data:
${JSON.stringify(gymContext, null, 2)}

Generate 3 actionable business insights in JSON format:
{
  "insights": [
    {
      "type": "warning|opportunity|info",
      "title": "Short title",
      "message": "Actionable insight (2 sentences max)",
      "action": "Recommended action",
      "impact": "Estimated business impact"
    }
  ],
  "revenue_forecast": "Brief revenue forecast for next month",
  "top_priority": "Single most important action to take today"
}

Return only valid JSON.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.json({ ...parsed, raw_data: gymContext });
  } catch (err) {
    console.error('AI insights error:', err);
    res.json({
      insights: [
        {
          type: 'warning',
          title: 'Churn Risk',
          message: `${churnRisk.rows.length} members haven't visited in 14+ days.`,
          action: 'Send re-engagement WhatsApp campaign',
          impact: 'Potential ₹' + (churnRisk.rows.length * 3000) + ' revenue recovery'
        }
      ],
      raw_data: gymContext
    });
  }
};

const askAI = async (req, res) => {
  const { question, context } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'messages-2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      stream: true,
      system: 'You are FitCore AI, a gym management assistant. Be concise and actionable. Context: ' + JSON.stringify(context || {}),
      messages: [{ role: 'user', content: question }]
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value));
  }
  res.end();
};

module.exports = { getInsights, askAI };
