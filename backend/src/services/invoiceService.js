const PDFDocument = require('pdfkit');
const { query } = require('../config/db');
const dayjs = require('dayjs');

async function generate(payment, member, plan) {
  // In production: upload to S3 and return URL
  const buffer = await generateBuffer({ ...payment, member_name: member.name, plan_name: plan.name });
  // TODO: upload buffer to S3
  const mockUrl = `https://invoices.fitcore.in/${payment.invoice_number}.pdf`;
  await query('UPDATE payments SET invoice_url = $1 WHERE id = $2', [mockUrl, payment.id]);
  return mockUrl;
}

async function generateBuffer(payment) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const green = '#1D9E75';
    const dark = '#1A1A1A';
    const gray = '#6B6B6B';

    // ── Header ───────────────────────────────
    doc.rect(0, 0, 595, 90).fill(green);
    doc.fillColor('#fff').fontSize(22).font('Helvetica-Bold').text('FITCORE', 50, 28);
    doc.fontSize(9).font('Helvetica').text('Gym Management System', 50, 52);
    doc.text('GSTIN: 33AABCK1234D1Z5', 50, 64);
    doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', 380, 35);
    doc.fontSize(9).font('Helvetica').fillColor('#e8f8f2').text('Original for Recipient', 415, 58);

    // ── Invoice meta ──────────────────────────
    doc.fillColor(dark);
    doc.rect(50, 110, 495, 80).stroke('#E0E0E0');
    doc.fontSize(8).fillColor(gray).text('Invoice Number', 65, 122);
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold').text(payment.invoice_number || 'INV-0001', 65, 134);

    doc.fontSize(8).fillColor(gray).font('Helvetica').text('Invoice Date', 200, 122);
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold')
      .text(dayjs(payment.created_at).format('DD MMM YYYY'), 200, 134);

    doc.fontSize(8).fillColor(gray).font('Helvetica').text('Member Code', 350, 122);
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold')
      .text(payment.member_code || 'FC-001', 350, 134);

    doc.fontSize(8).fillColor(gray).font('Helvetica').text('Valid Till', 65, 158);
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold')
      .text(dayjs(payment.created_at).add(30, 'day').format('DD MMM YYYY'), 65, 170);

    doc.fontSize(8).fillColor(gray).font('Helvetica').text('Payment Method', 200, 158);
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold')
      .text((payment.method || 'UPI').toUpperCase(), 200, 170);

    doc.fontSize(8).fillColor(gray).font('Helvetica').text('Status', 350, 158);
    doc.fontSize(10).fillColor(green).font('Helvetica-Bold').text('PAID', 350, 170);

    // ── Bill to ──────────────────────────────
    doc.fillColor(gray).fontSize(8).font('Helvetica').text('BILL TO', 50, 215);
    doc.fillColor(dark).fontSize(12).font('Helvetica-Bold').text(payment.member_name || 'Member', 50, 228);
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text(payment.email || '', 50, 244)
      .text(payment.phone || '', 50, 257)
      .text(payment.address || 'Chennai, Tamil Nadu', 50, 270);

    // ── Items table header ────────────────────
    doc.rect(50, 300, 495, 24).fill('#F5F5F5');
    doc.fillColor(gray).fontSize(8).font('Helvetica-Bold')
      .text('DESCRIPTION', 65, 310)
      .text('HSN/SAC', 280, 310)
      .text('AMOUNT', 370, 310)
      .text('GST (18%)', 440, 310)
      .text('TOTAL', 510, 310);

    // ── Items ─────────────────────────────────
    const baseAmount = parseFloat(payment.final_amount) / 1.18;
    const gst = parseFloat(payment.final_amount) - baseAmount;

    doc.rect(50, 324, 495, 1).fill('#E0E0E0');
    doc.fillColor(dark).fontSize(9).font('Helvetica')
      .text(payment.plan_name || 'Membership Plan', 65, 335)
      .text('999312', 280, 335)
      .text(`₹${baseAmount.toFixed(2)}`, 365, 335)
      .text(`₹${gst.toFixed(2)}`, 440, 335)
      .text(`₹${payment.final_amount}`, 505, 335);

    if (payment.discount > 0) {
      doc.rect(50, 355, 495, 1).fill('#E0E0E0');
      doc.fillColor(green).fontSize(9)
        .text('Loyalty Points Discount', 65, 365)
        .text(`-₹${payment.discount}`, 505, 365);
    }

    // ── Totals ────────────────────────────────
    doc.rect(350, 400, 195, 80).stroke('#E0E0E0');
    doc.fillColor(gray).fontSize(8).font('Helvetica')
      .text('Subtotal (excl. GST):', 360, 413)
      .text('CGST (9%):', 360, 430)
      .text('SGST (9%):', 360, 447);

    const halfGst = gst / 2;
    doc.fillColor(dark).fontSize(8)
      .text(`₹${baseAmount.toFixed(2)}`, 505, 413, { align: 'right', width: 30 })
      .text(`₹${halfGst.toFixed(2)}`, 505, 430, { align: 'right', width: 30 })
      .text(`₹${halfGst.toFixed(2)}`, 505, 447, { align: 'right', width: 30 });

    doc.rect(350, 465, 195, 24).fill(green);
    doc.fillColor('#fff').fontSize(10).font('Helvetica-Bold')
      .text('TOTAL:', 360, 473)
      .text(`₹${payment.final_amount}`, 430, 473, { align: 'right', width: 100 });

    // ── Footer ────────────────────────────────
    doc.rect(50, 640, 495, 1).fill('#E0E0E0');
    doc.fillColor(gray).fontSize(8).font('Helvetica')
      .text('FitCore Gym Management · www.fitcore.in · support@fitcore.in · +91 44 2345 6789', 50, 655, { align: 'center', width: 495 })
      .text('This is a computer-generated invoice and does not require a signature.', 50, 668, { align: 'center', width: 495 });

    doc.end();
  });
}

module.exports = { generate, generateBuffer };
