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
}

const GOLD = '#b8914a';
const NAVY = '#1e293b';
const WHITE = '#ffffff';
const MG = 20;

export async function downloadTicketPdf(data: TicketData, filename: string): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();

  // ── Background ──────────────────────────────────────────────
  pdf.setFillColor(249, 245, 239);
  pdf.rect(0, 0, pw, ph, 'F');

  // ── Gold header bar ─────────────────────────────────────────
  pdf.setFillColor(184, 145, 74);
  pdf.rect(0, 0, pw, 10, 'F');
  pdf.setTextColor(WHITE);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  let xOff = MG;
  pdf.text('TUTBOT', xOff, 7);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text('Entry Ticket', pw - MG, 7, { align: 'right' });

  // ── White card ──────────────────────────────────────────────
  const cardY = 18;
  const cardH = 235;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 210, 195);
  pdf.roundedRect(MG, cardY, pw - 2 * MG, cardH, 4, 4, 'FD');

  let y = cardY + 12;
  const cx = pw / 2;

  // ── Landmark header area ────────────────────────────────────
  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(MG + 8, y, pw - 2 * MG - 16, 36, 3, 3, 'F');
  pdf.setTextColor(WHITE);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(data.landmarkName, cx, y + 14, { align: 'center' });
  if (data.region) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(203, 190, 170);
    pdf.text(data.region, cx, y + 27, { align: 'center' });
  }
  y += 48;

  // ── Status + Confirmation code ──────────────────────────────
  pdf.setFillColor(236, 253, 245);
  pdf.setDrawColor(187, 247, 208);
  pdf.roundedRect(MG + 8, y, 32, 9, 3, 3, 'FD');
  pdf.setTextColor(22, 163, 74);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('VALID', MG + 11, y + 6.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(NAVY);
  pdf.text(data.confirmationCode, pw - MG - 8, y + 7, { align: 'right' });
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Reference Code', pw - MG - 8, y + 1.5, { align: 'right' });

  y += 18;
  pdf.setDrawColor(220, 210, 195);
  pdf.line(MG + 16, y, pw - MG - 16, y);
  y += 10;

  // ── 4-column detail grid ────────────────────────────────────
  const colW = (pw - 2 * MG - 24) / 4;
  const colX = (i: number) => MG + 16 + i * colW;

  const detailRows: [string, string][] = [
    ['Date', data.bookingDate],
    ['Tickets', `${data.adults} Adult${data.adults > 1 ? 's' : ''}${data.children > 0 ? `, ${data.children} Child${data.children > 1 ? 'ren' : ''}` : ''}`],
    ['Payment', `${data.paymentMethod.charAt(0).toUpperCase() + data.paymentMethod.slice(1)} (${data.paymentStatus})`],
    ['Total', `${data.total} ${data.currency}`],
  ];

  detailRows.forEach(([label, value], i) => {
    const xx = colX(i);
    pdf.setFillColor(249, 245, 239);
    pdf.roundedRect(xx, y, colW - 4, 20, 3, 3, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(label, xx + 4, y + 6);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(NAVY);
    const v = i === 3 ? `${data.total} ${data.currency}` : value;
    pdf.text(v, xx + 4, y + 15);
  });

  y += 30;

  // ── Price breakdown ─────────────────────────────────────────
  pdf.setFillColor(249, 245, 239);
  pdf.roundedRect(MG + 8, y, pw - 2 * MG - 16, data.children > 0 ? 48 : 38, 3, 3, 'F');

  let py = y + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(30, 41, 59);
  pdf.text('PRICE BREAKDOWN', MG + 16, py);

  py += 7;
  const priceX1 = MG + 16;
  const priceX2 = pw - MG - 16;

  const childPrice = data.children > 0
    ? Math.round(data.children * (data.subtotal / (data.adults + data.children * 0.5)) * 0.5)
    : 0;
  const adultPrice = data.subtotal - childPrice;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);

  pdf.text(`${data.adults}x Adult Ticket`, priceX1, py);
  pdf.text(`${adultPrice} ${data.currency}`, priceX2, py, { align: 'right' });
  py += 6;
  if (data.children > 0) {
    pdf.text(`${data.children}x Child Ticket (50%)`, priceX1, py);
    pdf.text(`${childPrice} ${data.currency}`, priceX2, py, { align: 'right' });
    py += 6;
  }
  pdf.text('Service Fee', priceX1, py);
  pdf.text(`${data.serviceFee} ${data.currency}`, priceX2, py, { align: 'right' });
  py += 5;
  pdf.setDrawColor(200, 190, 175);
  pdf.line(priceX1, py, priceX2, py);
  py += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(GOLD);
  pdf.text('Total', priceX1, py);
  pdf.text(`${data.total} ${data.currency}`, priceX2, py, { align: 'right' });

  y += (data.children > 0 ? 48 : 38) + 14;

  // ── QR code ─────────────────────────────────────────────────
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(220, 210, 195);
  const qrSize = 48;
  const qrX = cx - qrSize / 2;
  pdf.roundedRect(qrX, y, qrSize, qrSize, 3, 3, 'FD');
  if (data.qrDataUrl) {
    try {
      pdf.addImage(data.qrDataUrl, 'PNG', qrX + 2, y + 2, qrSize - 4, qrSize - 4);
    } catch {
      // QR image may fail in some PDF viewers
    }
  }
  y += qrSize + 4;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Show this QR code at the entrance', cx, y + 2, { align: 'center' });

  y += 12;

  // ── Payer & User info ───────────────────────────────────────
  pdf.setDrawColor(220, 210, 195);
  pdf.line(MG + 16, y, pw - MG - 16, y);
  y += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(30, 41, 59);
  pdf.text('PAYER', MG + 16, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(71, 85, 105);
  pdf.text(data.payerName, MG + 16, y + 5);
  if (data.payerEmail) pdf.text(data.payerEmail, MG + 16, y + 10);
  if (data.payerPhone) pdf.text(data.payerPhone, MG + 16, y + 15);

  if (data.userName) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 41, 59);
    pdf.text('BOOKED BY', pw - MG - 16, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    pdf.text(data.userName, pw - MG - 16, y + 5, { align: 'right' });
  }

  y += data.payerPhone ? 22 : 16;

  // ── Footer bar ──────────────────────────────────────────────
  pdf.setFillColor(184, 145, 74);
  pdf.rect(0, ph - 8, pw, 8, 'F');
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  pdf.text('TUTBOT — Egyptian Tourism Booking Platform', cx, ph - 3, { align: 'center' });

  pdf.save(filename);
}
