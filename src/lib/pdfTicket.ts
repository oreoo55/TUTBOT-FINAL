import jsPDF from 'jspdf';

interface TicketData {
  landmarkName: string;
  landmarkImage?: string;
  region?: string;
  confirmationCode: string;
  bookingDate: string;
  adults: number;
  children: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  qrDataUrl: string;
  status?: string;
  userName?: string;
  createdAt?: string;
}

const NAVY = '#0F172A';
const GOLD = '#D4AF37';
const SAND = '#F3EFE6';

function hexRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b] as const;
}

const [NR, NG, NB] = hexRgb(NAVY);
const [SR, SG, SB] = hexRgb(SAND);

export async function downloadTicketPdf(data: TicketData, filename: string): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = pdf.internal.pageSize.getWidth();   // 210
  const ph = pdf.internal.pageSize.getHeight();  // 297
  const cx = pw / 2;

  // White page background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pw, ph, 'F');

  const ml = 24;
  const mr = 24;
  const cw = pw - ml - mr;

  // ── Checkmark circle ─────────────────────────────────
  let y = 28;
  pdf.setFillColor(220, 252, 231);       // green-100
  pdf.circle(cx, y, 14, 'F');
  pdf.setFillColor(34, 197, 94);         // green-500
  pdf.circle(cx, y, 11, 'F');
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(2.5);
  pdf.line(cx - 4.5, y + 1, cx - 1, y + 5);
  pdf.line(cx - 1, y + 5, cx + 5.5, y - 3.5);

  y = 52;

  // ── "Booking Confirmed!" ─────────────────────────────
  pdf.setFont('Times', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(NR, NG, NB);
  pdf.text('Booking Confirmed!', cx, y, { align: 'center' });

  y = 64;

  // ── Description ──────────────────────────────────────
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(111, 116, 127); // navy at 60% opacity
  const desc = `Your tickets for ${data.landmarkName} have been successfully booked.`;
  const words = desc.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (pdf.getTextWidth(test) > cw - 10) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  for (const l of lines) {
    pdf.text(l, cx, y, { align: 'center' });
    y += 5;
  }

  y += 12;

  // ── Details card ─────────────────────────────────────
  const pad = 16;
  const rowGap = 16;
  const rowCount = 4; // Reference, Date, Tickets, Total
  const cardH = pad * 2 + rowCount * rowGap;

  pdf.setFillColor(253, 252, 250);  // sand/20 over white
  pdf.setDrawColor(SR, SG, SB);     // sand border #F3EFE6
  pdf.roundedRect(ml, y, cw, cardH, 10, 10, 'FD');

  let cy = y + pad;

  // Row helper
  const row = (label: string, value: string, valSize = 10, valColor = NAVY) => {
    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(111, 116, 127); // navy at 60%
    pdf.text(label, ml + pad, cy);

    // Value
    const [vr, vg, vb] = hexRgb(valColor);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(valSize);
    pdf.setTextColor(vr, vg, vb);
    pdf.text(value, pw - mr - pad, cy, { align: 'right' });

    cy += rowGap;

    // Separator line (except last)
    if (label !== 'Total Paid') {
      pdf.setDrawColor(SR, SG, SB);
      pdf.line(ml + pad, cy - 4, pw - mr - pad, cy - 4);
    }
  };

  row('Booking Reference', data.confirmationCode);
  row('Date', data.bookingDate);
  const tix = `${data.adults} Adult${data.adults > 1 ? 's' : ''}${data.children > 0 ? `, ${data.children} Child${data.children > 1 ? 'ren' : ''}` : ''}`;
  row('Tickets', tix);
  row('Total Paid', `${data.total} ${data.currency}`, 14, GOLD);

  y += cardH + 16;

  // ── QR code ──────────────────────────────────────────
  const qs = 52;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(SR, SG, SB);
  pdf.roundedRect(cx - qs / 2 - 4, y - 4, qs + 8, qs + 8, 8, 8, 'FD');
  if (data.qrDataUrl) {
    try {
      pdf.addImage(data.qrDataUrl, 'PNG', cx - qs / 2, y, qs, qs);
    } catch {
      // skip
    }
  }

  y += qs + 14;

  // ── Caption ──────────────────────────────────────────
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(111, 116, 127);
  pdf.text('Show this QR code at the entrance', cx, y, { align: 'center' });

  // ── Footer ───────────────────────────────────────────
  y = ph - 14;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(180, 180, 180);
  pdf.text('TutBot — Egypt Travel Guide', cx, y, { align: 'center' });

  pdf.save(filename);
}
