import axiosInstance from './axiosInstance';

export const getMe = () => axiosInstance.get('/users/me');
export const updateMe = (data) => axiosInstance.put('/users/me', data);
export const changePassword = (data) => axiosInstance.put('/users/me/password', data);