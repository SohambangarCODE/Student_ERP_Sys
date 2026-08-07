import axiosInstance from './axiosInstance';

export const getStaff = () => axiosInstance.get('/staff');
export const createStaff = (data) => axiosInstance.post('/staff', data);
export const updateStaff = (id, data) => axiosInstance.put(`/staff/${id}`, data);
export const deactivateStaff = (id) => axiosInstance.delete(`/staff/${id}`);