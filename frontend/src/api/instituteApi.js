import axiosInstance from './axiosInstance';
export const getMyInstitute = () => axiosInstance.get('/institutes/me');