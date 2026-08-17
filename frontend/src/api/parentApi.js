import axiosInstance from './axiosInstance';


export const createParent = (data) => axiosInstance.post('/parents', data);
export const getMyChildren = () => axiosInstance.get('/parents/me/children');
export const getChildSummary = (studentId) => axiosInstance.get(`/parents/me/children/${studentId}/summary`);
export const getChildFeeDetails = (studentId) => axiosInstance.get(`/parents/me/children/${studentId}/fees`);


export const getChildResults = (studentId) => axiosInstance.get(`/exams/results/student/${studentId}`);
export const getChildAttendance = (studentId) => axiosInstance.get(`/attendance/student/${studentId}`);

export const searchParentByEmail = (email) => axiosInstance.get('/parents/search', { params: { email } });
export const linkExistingParent = (parentId, studentId) => axiosInstance.put('/parents/link', { parentId, studentId });