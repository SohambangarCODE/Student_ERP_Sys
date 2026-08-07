import axiosInstance from './axiosInstance';

export const getNotices = () => axiosInstance.get('/notices');
export const createNotice = (data) => axiosInstance.post('/notices', data);
export const deleteNotice = (id) => axiosInstance.delete(`/notices/${id}`);