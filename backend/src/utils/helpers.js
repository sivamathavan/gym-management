const dayjs = require('dayjs');

async function generateMemberCode(client) {
  const result = await client.query(
    `SELECT COALESCE(MAX(CAST(SPLIT_PART(member_code,'-',2) AS INTEGER)),0)+1 as next FROM members`
  );
  const num = String(result.rows[0].next).padStart(4, '0');
  return `FC-${num}`;
}

async function generateInvoiceNumber(client) {
  const result = await client.query(
    `SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number,'-',3) AS INTEGER)),0)+1 as next FROM payments WHERE invoice_number IS NOT NULL`
  );
  const num = String(result.rows[0].next).padStart(4, '0');
  return `INV-${dayjs().format('YYYY')}-${num}`;
}

function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { limit: l, offset: (p - 1) * l };
}

module.exports = { generateMemberCode, generateInvoiceNumber, paginate };
