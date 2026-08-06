import axiosInstance from './axiosInstance';

export const markBulkAttendance = (data) => axiosInstance.post('/attendance/bulk', data);
export const getAttendanceByBatchAndDate = (batchId, date) =>
  axiosInstance.get(`/attendance/batch/${batchId}/date/${date}`);
export const getStudentAttendanceSummary = (studentId) =>
  axiosInstance.get(`/attendance/student/${studentId}/summary`);