import axiosInstance from './axiosInstance';

export const sendMessage = (data) => axiosInstance.post('/messages', data);
export const getThread = (studentId, parentId) =>
  axiosInstance.get(`/messages/thread/${studentId}`, { params: parentId ? { parentId } : {} });
export const getAllThreads = () => axiosInstance.get('/messages/threads');