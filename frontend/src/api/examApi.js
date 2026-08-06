import axiosInstance from './axiosInstance';

export const getExams = (batchId) =>
  axiosInstance.get('/exams', { params: batchId ? { batchId } : {} });
export const createExam = (data) => axiosInstance.post('/exams', data);
export const enterMarks = (examId, data) => axiosInstance.post(`/exams/${examId}/marks`, data);
export const getExamRankings = (examId) => axiosInstance.get(`/exams/${examId}/rankings`);