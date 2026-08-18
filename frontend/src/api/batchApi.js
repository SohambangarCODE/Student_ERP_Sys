import axiosInstance from './axiosInstance';

export const getBatches = () => axiosInstance.get('/batches');
export const getBatchById = (id) => axiosInstance.get(`/batches/${id}`);
export const createBatch = (data) => axiosInstance.post('/batches', data);
export const updateBatch = (id, data) => axiosInstance.put(`/batches/${id}`, data);
export const deleteBatch = (id) => axiosInstance.delete(`/batches/${id}`);
