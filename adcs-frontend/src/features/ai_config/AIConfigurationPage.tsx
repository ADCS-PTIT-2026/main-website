import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { systemParameterAPI } from '../../api/systemParameter';

const AIConfigurationPage: React.FC = () => {
  const [promptTemplate, setPromptTemplate] = useState('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(0.9);
  const [topK, setTopK] = useState<number>(40);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [initialData, setInitialData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      const data = await systemParameterAPI.getAll(); 
      setInitialData(data);
      if (data.promptTemplate) setPromptTemplate(data.promptTemplate);
      if (data.temperature) setTemperature(parseFloat(data.temperature));
      if (data.maxTokens) setMaxTokens(parseInt(data.maxTokens, 10));
      if (data.topP) setTopP(parseFloat(data.topP));
      if (data.topK) setTopK(parseInt(data.topK, 10));
    } catch (error) {
      console.error("Lỗi khi tải cấu hình:", error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const confirmResetDefaults = () => {
    setTemperature(0.7);
    setMaxTokens(2048);
    setTopP(0.9);
    setTopK(40);
    setErrorMessage(null);
    setShowResetModal(false);
    toast.success('Đã khôi phục các tham số về mức mặc định an toàn!');
  };

  const handleCancelChanges = () => {
    if (initialData) {
      if (initialData.promptTemplate) setPromptTemplate(initialData.promptTemplate);
      if (initialData.temperature) setTemperature(parseFloat(initialData.temperature));
      if (initialData.maxTokens) setMaxTokens(parseInt(initialData.maxTokens, 10));
      if (initialData.topP) setTopP(parseFloat(initialData.topP));
      if (initialData.topK) setTopK(parseInt(initialData.topK, 10));
      setErrorMessage(null);
      setSuccessMessage(null);
      toast('Đã hoàn tác các thay đổi chưa lưu.');
    }
  };

  const handleUpdateSystem = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client validation
    if (temperature < 0 || temperature > 1) {
      setErrorMessage("Temperature phải nằm trong khoảng từ 0.0 đến 1.0");
      return;
    }
    if (topP < 0 || topP > 1) {
      setErrorMessage("Top P phải nằm trong khoảng từ 0.0 đến 1.0");
      return;
    }
    if (maxTokens < 256 || maxTokens > 8192) {
      setErrorMessage("Max Tokens phải nằm trong khoảng từ 256 đến 8192");
      return;
    }
    if (topK < 1 || topK > 100) {
      setErrorMessage("Top K phải nằm trong khoảng từ 1 đến 100");
      return;
    }
    if (promptTemplate.trim().length > 0 && promptTemplate.trim().length < 10) {
      setErrorMessage("System prompt phải có độ dài tối thiểu 10 ký tự");
      return;
    }

    setIsLoading(true);
    
    const configData = {
      promptTemplate,
      temperature: temperature.toString(),
      maxTokens: maxTokens.toString(),
      topP: topP.toString(),
      topK: topK.toString(),
    };

    try {
      await systemParameterAPI.update(configData);
      setSuccessMessage('Đã cập nhật cấu hình hệ thống AI thành công!');
      toast.success('Đã cập nhật cấu hình hệ thống AI thành công!');
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchConfig();
    } catch (error: any) {
      console.error('Lỗi khi cập nhật:', error);
      const detail = error?.response?.data?.detail || 'Cập nhật thất bại. Vui lòng thử lại!';
      setErrorMessage(detail);
      toast.error(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-display text-slate-900 dark:text-slate-100 animate-fade-in">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <span className="material-symbols-outlined text-primary text-[28px]">psychology</span>
            Cấu hình AI Hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập mẫu câu lệnh mặc định (System Instruction) và tinh chỉnh các tham số sinh văn bản của mô hình LLM.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">LLM Engine Ready</span>
        </div>
      </div>

      {/* Unified Section (Single Card) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        {/* Nội dung bên trong chia cột */}
        <div className="p-5 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Left Column: Prompt Template */}
          <div className="lg:col-span-3 flex flex-col min-h-[360px] lg:min-h-[480px]">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <span className="material-symbols-outlined text-primary text-[20px]">edit_document</span>
                System Instruction (Mẫu câu lệnh)
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                {promptTemplate.length} ký tự
              </span>
            </div>
            <textarea
              className="flex-1 w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary p-4 resize-none leading-relaxed outline-none transition-all font-mono text-slate-800 dark:text-slate-200"
              placeholder="Nhập hướng dẫn hệ thống tại đây..."
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
            />
          </div>

          {/* Right Column: AI Parameters */}
          <div className="lg:col-span-2 flex flex-col">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-5">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              Tham số mô hình (Parameters)
            </label>
            
            <div className="space-y-7 flex-1">
              {/* Slider: Temperature */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Temperature (Độ sáng tạo)
                  </label>
                  <span className="text-xs font-black px-2.5 py-0.5 bg-primary/10 text-primary rounded-md">
                    {temperature}
                  </span>
                </div>
                <input
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  max="1" min="0" step="0.1" type="range"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>Chính xác (0.0)</span>
                  <span>Cân bằng (0.5)</span>
                  <span>Sáng tạo (1.0)</span>
                </div>
              </div>

              {/* Slider: Max Tokens */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Max Tokens (Độ dài tối đa)
                  </label>
                  <span className="text-xs font-black px-2.5 py-0.5 bg-primary/10 text-primary rounded-md">
                    {maxTokens}
                  </span>
                </div>
                <input
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  max="4096" min="256" step="256" type="range"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>256 tokens</span>
                  <span>2048 tokens</span>
                  <span>4096 tokens</span>
                </div>
              </div>

              {/* Inputs: Top P & Top K */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top P</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary p-2.5 outline-none transition-all text-slate-800 dark:text-slate-200"
                    step="0.1" min="0" max="1" type="number"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top K</label>
                  <input
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary p-2.5 outline-none transition-all text-slate-800 dark:text-slate-200"
                    type="number" min="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
            </div>

            {/* Messages Banner */}
            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Warning Message Box */}
            <div className="mt-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/15 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl shrink-0">info</span>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Lưu ý: Các tham số này ảnh hưởng trực tiếp đến chất lượng phản hồi, độ dài sinh văn bản và chi phí sử dụng API toàn hệ thống.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 lg:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
          <button 
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50 transition-colors flex items-center gap-1.5 outline-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Khôi phục mặc định
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button 
              type="button"
              onClick={handleCancelChanges}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors outline-none cursor-pointer"
            >
              Hủy thay đổi
            </button>
            <button 
              type="button"
              onClick={handleUpdateSystem}
              disabled={isLoading}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Cập nhật hệ thống
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận khôi phục mặc định */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">restart_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Khôi phục tham số mặc định?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Các tham số Temperature (0.7), Max Tokens (2048), Top P (0.9) và Top K (40) sẽ được đặt lại về ngưỡng khuyến nghị an toàn. Bạn cần nhấn <strong>Cập nhật hệ thống</strong> để lưu chính thức.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmResetDefaults}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfigurationPage;