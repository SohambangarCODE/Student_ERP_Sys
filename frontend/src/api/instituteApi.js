import axiosInstance from './axiosInstance';
export const getMyInstitute = () => axiosInstance.get('/institutes/me');
export const updateMyInstitute = (data) => axiosInstance.put('/institutes/me', data);
export const uploadLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return axiosInstance.post('/institutes/me/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};