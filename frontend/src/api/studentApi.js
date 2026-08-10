import axiosInstance from './axiosInstance';

export const removeFromBatch = (id) => axiosInstance.put(`/students/${id}/remove-batch`);
export const updateStudentStatus = (id, status) => axiosInstance.put(`/students/${id}/status`, { status });
export const permanentlyDeleteStudent = (id) => axiosInstance.delete(`/students/${id}/permanent`);

export const getStudents = () => axiosInstance.get('/students');
export const getStudentById = (id) => axiosInstance.get(`/students/${id}`);
export const createStudent = (data) => axiosInstance.post('/students', data);
export const updateStudent = (id, data) => axiosInstance.put(`/students/${id}`, data);
export const deleteStudent = (id) => axiosInstance.delete(`/students/${id}`);