import axiosInstance from './axiosInstance';

export const createRazorpayOrder = (amount) => axiosInstance.post('/fees/razorpay/order', { amount });
export const verifyRazorpayPayment = (data) => axiosInstance.post('/fees/razorpay/verify', data);