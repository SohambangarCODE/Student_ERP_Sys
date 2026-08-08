import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Builds and triggers a download of a report card PDF for one exam result.
// Kept as a standalone function (not inline in the component) so it's reusable —
// same principle as isolating triggerAbsentAlerts back in Step 7.
export function generateReportCard({ institute, student, examResult }) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(institute?.name || 'Institute', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text('Report Card', 105, 28, { align: 'center' });

  doc.setDrawColor(200);
  doc.line(15, 33, 195, 33);

  // Student + exam info
  doc.setFontSize(10);
  doc.text(`Student Name: ${student.name}`, 15, 42);
  doc.text(`Admission No: ${student.admissionNumber}`, 15, 48);
  doc.text(`Exam: ${examResult.examId?.name || '—'}`, 120, 42);
  doc.text(`Date: ${examResult.examId?.examDate ? new Date(examResult.examId.examDate).toLocaleDateString() : '—'}`, 120, 48);

  // Marks table
  const total = examResult.marks.reduce((sum, m) => sum + m.marksObtained, 0);
  autoTable(doc, {
    startY: 56,
    head: [['Subject', 'Marks Obtained']],
    body: examResult.marks.map((m) => [m.subjectName, m.marksObtained]),
    foot: [['Total', total]],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // matches your brand-600 indigo
  });

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, doc.internal.pageSize.height - 10);

  doc.save(`${student.name.replace(/\s+/g, '_')}_${examResult.examId?.name || 'ReportCard'}.pdf`);
}