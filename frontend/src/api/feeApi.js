import axiosInstance from './axiosInstance';


export const getFeeStructureForStudent = (studentId) => axiosInstance.get(`/fees/structure/for-student/${studentId}`);

export const getFeeStructures = () => axiosInstance.get('/fees/structure');
export const createFeeStructure = (data) => axiosInstance.post('/fees/structure', data);

export const recordPayment = (data) => axiosInstance.post('/fees/payment', data);
export const getPaymentsByStudent = (studentId) => axiosInstance.get(`/fees/payment/student/${studentId}`);

export const getDefaulters = () => axiosInstance.get('/fees/defaulters');

export const updateFeeStructure = (id, data) => axiosInstance.put(`/fees/structure/${id}`, data);