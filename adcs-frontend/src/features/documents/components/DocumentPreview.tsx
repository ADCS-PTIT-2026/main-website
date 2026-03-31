interface DocumentPreviewProps {
  url: string;
  type: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ url, type }) => {
  const isImage = ['png', 'jpg', 'jpeg'].includes(type);
  const isPdf = type === 'pdf';
  const isWord = ['doc', 'docx'].includes(type);

  if (isImage) {
    return (
      <img
        src={url}
        alt="Document Preview"
        className="w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
      />
    );
  }

  if (isPdf) {
    // Dùng object hoặc iframe để render PDF (hầu hết browser hỗ trợ sẵn)
    return (
      <object
        data={url}
        type="application/pdf"
        className="w-full h-full"
      >
        <p className="p-4 text-center text-sm text-slate-500">
          Trình duyệt của bạn không hỗ trợ xem PDF trực tiếp. 
          <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline ml-1">
            Tải xuống để xem
          </a>
        </p>
      </object>
    );
  }

  if (isWord) {
    // Với Word doc (nếu URL là blob:// từ local file thì Office Viewer online sẽ KHÔNG xem được)
    // Cách an toàn nhất cho local file word là hiển thị icon báo hiệu thành công
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 dark:bg-blue-900/10">
        <span className="material-symbols-outlined text-8xl text-blue-500 mb-4">
          description
        </span>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
          Tài liệu Word
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Đã tải lên thành công.
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
          (Trình duyệt không hỗ trợ xem trước file Word cục bộ. Vui lòng dựa vào dữ liệu trích xuất bên dưới)
        </p>
      </div>
    );
  }

  // Fallback cho các loại file không xác định
  return (
    <div className="w-full h-full flex items-center justify-center text-slate-500">
      <p>Không có bản xem trước cho định dạng file này (.{type})</p>
    </div>
  );
};