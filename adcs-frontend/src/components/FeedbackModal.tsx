import React, { useState } from 'react';
import { feedbackApi } from '../api/feedback';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Báo lỗi', icon: 'bug_report', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' },
  { id: 'feature', label: 'Tính năng mới', icon: 'lightbulb', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { id: 'improvement', label: 'Cải tiến', icon: 'auto_awesome', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  { id: 'other', label: 'Khác', icon: 'chat_bubble', color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedbackType, setFeedbackType] = useState<string>('improvement');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung ý kiến đóng góp!');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Đang gửi ý kiến đóng góp...');
    try {
      await feedbackApi.submitFeedback({
        feedback_type: feedbackType,
        content: content.trim()
      });
      toast.success('Cảm ơn bạn! Ý kiến đóng góp đã được gửi đến đội ngũ phát triển.', { id: toastId });
      setContent('');
      setFeedbackType('improvement');
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi gửi góp ý:', err);
      toast.error(err.response?.data?.detail || 'Không thể gửi góp ý lúc này. Vui lòng thử lại!', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">rate_review</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Gửi ý kiến đóng góp</h3>
              <p className="text-xs text-slate-500 mt-0.5">Phản hồi của bạn giúp chúng tôi nâng cấp hệ thống tốt hơn.</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer outline-none"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Chọn Loại góp ý */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Phân loại góp ý
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FEEDBACK_TYPES.map((type) => {
                const isSelected = feedbackType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nhập nội dung */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nội dung góp ý <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Chia sẻ chi tiết vấn đề bạn gặp phải, hoặc ý tưởng tính năng bạn mong muốn hệ thống hỗ trợ..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
              required
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-lg ${isSubmitting ? 'animate-spin' : ''}`}>
                {isSubmitting ? 'progress_activity' : 'send'}
              </span>
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi góp ý'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
