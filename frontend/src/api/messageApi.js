import axiosInstance from './axiosInstance';

export const sendMessage = (data) => axiosInstance.post('/messages', data);
export const getThread = (studentId, params) => axiosInstance.get(`/messages/thread/${studentId}`, { params });
export const getAllThreads = () => axiosInstance.get('/messages/threads');
export const getAvailableContacts = (studentId) => axiosInstance.get(`/messages/contacts/${studentId}`);