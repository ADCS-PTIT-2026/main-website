import React, { useState, useEffect } from 'react';
import { systemParameterAPI } from '../../api/systemParameter';

const AIConfigurationPage: React.FC = () => {
  const [promptTemplate, setPromptTemplate] = useState('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(0.9);
  const [topK, setTopK] = useState<number>(40);
  
  const [isLoading, setIsLoading] = useState(false);

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

  const handleResetDefaults = () => {
    if (window.confirm("Bạn có chắc muốn khôi phục về các giá trị cấu hình AI mặc định an toàn?")) {
      setTemperature(0.7);
      setMaxTokens(2048);
      setTopP(0.9);
      setTopK(40);
      setErrorMessage(null);
    }
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
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchConfig();
    } catch (error: any) {
      console.error('Lỗi khi cập nhật:', error);
      const detail = error?.response?.data?.detail || 'Cập nhật thất bại. Vui lòng thử lại!';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Main Header */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Cấu hình AI Hệ thống
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Thiết lập mẫu câu lệnh mặc định và tinh chỉnh các tham số sinh văn bản của mô hình.
            </p>
          </div>

          {/* Unified Section (Single Card) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            
            {/* Nội dung bên trong chia cột */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-10">
              
              {/* Left Column: Prompt Template */}
              <div className="lg:col-span-3 flex flex-col min-h-[500px]">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  <span className="material-symbols-outlined text-primary text-[20px]">edit_document</span>
                  SYSTEM INSTRUCTION (MẪU CÂU LỆNH)
                </label>
                <textarea
                  className="flex-1 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary p-4 resize-none leading-relaxed outline-none transition-all"
                  placeholder="Nhập hướng dẫn hệ thống tại đây..."
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                />
              </div>

              {/* Right Column: AI Parameters */}
              <div className="lg:col-span-2 flex flex-col min-h-[500px]">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                  <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                  THAM SỐ MÔ HÌNH (PARAMETERS)
                </label>
                
                <div className="space-y-8 flex-1">
                  {/* Slider: Temperature */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Temperature (Độ sáng tạo)
                      </label>
                      <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {temperature}
                      </span>
                    </div>
                    <input
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      max="1" min="0" step="0.1" type="range"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Chính xác (0.0)</span>
                      <span>Sáng tạo (1.0)</span>
                    </div>
                  </div>

                  {/* Slider: Max Tokens */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Max Tokens (Độ dài tối đa)
                      </label>
                      <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {maxTokens}
                      </span>
                    </div>
                    <input
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      max="4096" min="256" step="256" type="range"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>256</span>
                      <span>4096</span>
                    </div>
                  </div>

                  {/* Inputs: Top P & Top K */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Top P</label>
                      <input
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary p-2.5 outline-none transition-all text-slate-700 dark:text-slate-200"
                        step="0.1" min="0" max="1" type="number"
                        value={topP}
                        onChange={(e) => setTopP(parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Top K</label>
                      <input
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary p-2.5 outline-none transition-all text-slate-700 dark:text-slate-200"
                        type="number" min="1"
                        value={topK}
                        onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                      />
                    </div>
                  </div>
                </div>

                {/* Messages Banner */}
                {errorMessage && (
                  <div className="mt-4 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 animate-fade-in">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Warning Message Box */}
                <div className="mt-auto pt-6">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-xl">info</span>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Lưu ý: Các tham số này ảnh hưởng trực tiếp đến chất lượng phản hồi, độ dài sinh văn bản và chi phí sử dụng API.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
              <button 
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/40 transition-colors flex items-center gap-1.5 outline-none"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Khôi phục mặc định
              </button>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleCancelChanges}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none"
                >
                  Hủy thay đổi
                </button>
                <button 
                  type="button"
                  onClick={handleUpdateSystem}
                  disabled={isLoading}
                  className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
        </div>
      </main>
    </div>
  );
};

export default AIConfigurationPage;