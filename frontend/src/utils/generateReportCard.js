import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = [79, 70, 229]; // indigo-600, matches your app's brand color
const BRAND_LIGHT = [238, 242, 255]; // indigo-50

function gradeFromPercentage(pct) {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}


export async function generateReportCard({ institute, student, examResult }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Load the logo as an image element first, if one exists — jsPDF needs actual image data, not just a URL
  let logoImg = null;
  if (institute?.logoUrl) {
    try {
      logoImg = await loadImage(`http://localhost:5000${institute.logoUrl}`);
    } catch {
      logoImg = null; // if it fails to load, just skip it rather than breaking the whole PDF
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
  doc.text('Student Report Card', 15, 22);

  const session = examResult.examId?.examDate
    ? `Academic Session: ${new Date(examResult.examId.examDate).getFullYear()}`
    : '';
  if (session) {
    doc.setFontSize(9);
    doc.text(session, pageWidth - 15, 15, { align: 'right' });
  }

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

  // ---- Student info ----
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Student Name:', 15, 50);
  doc.text('Admission No.:', 110, 50);
  doc.text('Exam:', 15, 57);
  doc.text('Exam Date:', 110, 57);

  doc.setFont(undefined, 'normal');
  doc.text(student.name, 48, 50);
  doc.text(student.admissionNumber, 145, 50);
  doc.text(examResult.examId?.name || '—', 48, 57);
  doc.text(examResult.examId?.examDate ? new Date(examResult.examId.examDate).toLocaleDateString() : '—', 145, 57);

  doc.setDrawColor(220);
  doc.line(15, 62, pageWidth - 15, 62);

  // ---- Academic Performance table ----
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...BRAND);
  doc.text('Academic Performance', 15, 70);

  // Cross-reference each subject's score against its max marks from the exam definition
  const subjectMaxMap = {};
  (examResult.examId?.subjects || []).forEach((s) => { subjectMaxMap[s.name] = s.maxMarks; });

  const subjectRows = examResult.marks.map((m) => {
    const max = subjectMaxMap[m.subjectName] || 100;
    const pct = Math.round((m.marksObtained / max) * 100);
    return [m.subjectName, m.marksObtained, max, `${pct}%`, gradeFromPercentage(pct)];
  });

  autoTable(doc, {
    startY: 75,
    head: [['Subject', 'Marks Obtained', 'Max Marks', 'Percentage', 'Grade']],
    body: subjectRows,
    theme: 'grid',
    headStyles: { fillColor: BRAND, fontSize: 9 },
    styles: { fontSize: 9 },
  });

  // ---- Overall Result ----
  const totalObtained = examResult.marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const totalMax = examResult.marks.reduce((sum, m) => sum + (subjectMaxMap[m.subjectName] || 100), 0);
  const overallPct = Math.round((totalObtained / totalMax) * 100);
  const overallGrade = gradeFromPercentage(overallPct);
  const result = overallPct >= 50 ? 'PASS' : 'NEEDS IMPROVEMENT';

  let y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...BRAND);
  doc.text('Overall Result', 15, y);

  autoTable(doc, {
    startY: y + 5,
    head: [['Total Max Marks', 'Marks Obtained', 'Overall %', 'Grade', 'Result']],
    body: [[totalMax, totalObtained, `${overallPct}%`, overallGrade, result]],
    theme: 'grid',
    headStyles: { fillColor: BRAND, fontSize: 9 },
    styles: { fontSize: 9, halign: 'center' },
  });

  // ---- Grading scale (static reference table) ----
  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...BRAND);
  doc.text('Grading Scale', 15, y);

  autoTable(doc, {
    startY: y + 5,
    head: [['Percentage', 'Grade']],
    body: [
      ['90–100%', 'A+'],
      ['80–89%', 'A'],
      ['70–79%', 'B'],
      ['60–69%', 'C'],
      ['50–59%', 'D'],
      ['Below 50%', 'F'],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND, fontSize: 9 },
    styles: { fontSize: 9 },
    tableWidth: 80,
  });

  // ---- Signatures ----
  y = doc.lastAutoTable.finalY + 20;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.line(15, y, 70, y);
  doc.line(90, y, 145, y);
  doc.line(165, y, 195, y);
  doc.text('Teacher', 15, y + 5);
  doc.text('Principal', 90, y + 5);
  doc.text('Parent', 165, y + 5);

  // ---- Footer ----
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    15,
    doc.internal.pageSize.height - 10
  );

  doc.save(`${student.name.replace(/\s+/g, '_')}_${examResult.examId?.name || 'ReportCard'}.pdf`);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}