import React, { useState, useEffect } from 'react';
import { systemParameterAPI } from '../../api/systemParameter';

const AIConfigurationPage: React.FC = () => {
  const [promptTemplate, setPromptTemplate] = useState('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(0.9);
  const [topK, setTopK] = useState<number>(40);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await systemParameterAPI.getAll(); 
        
        if (data.promptTemplate) setPromptTemplate(data.promptTemplate);
        if (data.temperature) setTemperature(parseFloat(data.temperature));
        if (data.maxTokens) setMaxTokens(parseInt(data.maxTokens, 10));
        if (data.topP) setTopP(parseFloat(data.topP));
        if (data.topK) setTopK(parseInt(data.topK, 10));
        
      } catch (error) {
        console.error("Lỗi khi tải cấu hình:", error);
      }
    };

    fetchConfig();
  }, []);

  const handleUpdateSystem = async () => {
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
      alert('Đã cập nhật hệ thống thành công');
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      alert('Cập nhật thất bại. Vui lòng thử lại!');
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

                {/* Warning Message Box */}
                <div className="mt-auto pt-6">
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-xl">info</span>
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Lưu ý: Các tham số này ảnh hưởng trực tiếp đến chất lượng phản hồi và chi phí sử dụng API.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-xl flex justify-end gap-3">
              <button 
                type="button"
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none"
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
      </main>
    </div>
  );
};

export default AIConfigurationPage;