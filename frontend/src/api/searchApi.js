import axiosInstance from './axiosInstance';
export const search = (q) => axiosInstance.get('/search', { params: { q } });