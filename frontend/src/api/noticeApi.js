import axiosInstance from './axiosInstance';

export const createNotice = (data) => axiosInstance.post('/notices', data);
export const deleteNotice = (id) => axiosInstance.delete(`/notices/${id}`);

export const getNotices = (params = {}) => axiosInstance.get('/notices', { params });