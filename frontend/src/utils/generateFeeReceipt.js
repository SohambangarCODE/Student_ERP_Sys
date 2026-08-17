import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = [79, 70, 229];
const BRAND_LIGHT = [238, 242, 255];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// payment: the just-created FeePayment record
// feeStructure: { totalAmount, totalPaid, balanceDue } — the UPDATED totals, after this payment
export async function generateFeeReceipt({ institute, student, payment, feeStructure }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  let logoImg = null;
  if (institute?.logoUrl) {
    try {
      logoImg = await loadImage(institute.logoUrl);
    } catch {
      logoImg = null;
    }
  }

  // ---- Header banner ----
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(institute?.name || 'Institute Name', 15, 15);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Fee Payment Receipt', 15, 22);

  if (logoImg) {
    doc.addImage(logoImg, 'PNG', pageWidth - 35, 4, 22, 22);
  }

  // ---- Contact info strip ----
  doc.setFillColor(...BRAND_LIGHT);
  doc.rect(0, 32, pageWidth, 8, 'F');
  doc.setTextColor(...BRAND);
  doc.setFontSize(8);
  const contactParts = [institute?.address, institute?.contactEmail, institute?.contactPhone].filter(Boolean);
  doc.text(contactParts.join('  |  ') || 'Institute contact details not set', 15, 37.5);

  // ---- Receipt + student info ----
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Receipt No.:', 15, 50);
  doc.text('Payment Date:', 110, 50);
  doc.text('Student Name:', 15, 57);
  doc.text('Admission No.:', 110, 57);
  doc.text('Payment Method:', 15, 64);

  doc.setFont(undefined, 'normal');
  doc.text(payment.receiptNumber, 48, 50);
  doc.text(new Date(payment.paymentDate).toLocaleDateString(), 145, 50);
  doc.text(student.name, 48, 57);
  doc.text(student.admissionNumber, 145, 57);
  doc.text(payment.paymentMethod.toUpperCase(), 48, 64);

  doc.setDrawColor(220);
  doc.line(15, 70, pageWidth - 15, 70);

  // ---- Payment summary table ----
  autoTable(doc, {
    startY: 78,
    head: [['Description', 'Amount']],
    body: [
      ['Total Fee', `Rs. ${feeStructure.totalAmount.toLocaleString()}`],
      ['Amount Paid (this receipt)', `Rs. ${payment.amountPaid.toLocaleString()}`],
      ['Total Paid to Date', `Rs. ${feeStructure.totalPaid.toLocaleString()}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND, fontSize: 9 },
    styles: { fontSize: 9 },
  });

  // ---- Balance due — highlighted, since this is the number that matters most ----
  const y = doc.lastAutoTable.finalY + 10;
  const balanceColor = feeStructure.balanceDue > 0 ? [220, 38, 38] : [22, 163, 74]; // red if owed, green if fully paid
  doc.setFillColor(...(feeStructure.balanceDue > 0 ? [254, 242, 242] : [240, 253, 244]));
  doc.rect(15, y, pageWidth - 30, 14, 'F');
  doc.setTextColor(...balanceColor);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(
    feeStructure.balanceDue > 0
      ? `Remaining Balance: Rs. ${feeStructure.balanceDue.toLocaleString()}`
      : 'Fully Paid — No Balance Due',
    pageWidth / 2,
    y + 9,
    { align: 'center' }
  );

  // ---- Transaction reference, if paid via Razorpay ----
  if (payment.transactionRef) {
    doc.setTextColor(100);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Transaction Reference: ${payment.transactionRef}`, 15, y + 22);
  }

  // ---- Footer ----
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, doc.internal.pageSize.height - 10);
  doc.text('This is a computer-generated receipt.', pageWidth - 15, doc.internal.pageSize.height - 10, { align: 'right' });

  doc.save(`Receipt_${payment.receiptNumber}_${student.name.replace(/\s+/g, '_')}.pdf`);
}