import axiosClient from './axiosClient';

export const systemParameterAPI = {
  getAll: (): Promise<Record<string, string>> => {
    return axiosClient.get('/system-parameters');
  },
  
  update: (data: Record<string, string>): Promise<Record<string, string>> => {
    return axiosClient.put('/system-parameters', data);
  },
};