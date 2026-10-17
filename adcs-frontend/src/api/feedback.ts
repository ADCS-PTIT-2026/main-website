import axiosClient from './axiosClient';

export interface FeedbackCreatePayload {
  feedback_type: 'bug' | 'feature' | 'improvement' | 'other' | string;
  content: string;
}

export interface FeedbackItem {
  id: number;
  user_id?: string | null;
  feedback_type: string;
  content: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
}

export interface FeedbackListResponse {
  total: number;
  items: FeedbackItem[];
}

export const feedbackApi = {
  submitFeedback: async (data: FeedbackCreatePayload): Promise<FeedbackItem> => {
    const response = await axiosClient.post('/feedbacks', data);
    return response.data;
  },

  getAllFeedbacks: async (skip: number = 0, limit: number = 50): Promise<FeedbackListResponse> => {
    const response = await axiosClient.get('/feedbacks', {
      params: { skip, limit }
    });
    return response.data;
  }
};
