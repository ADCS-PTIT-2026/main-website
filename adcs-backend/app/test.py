import asyncio
import httpx
import json
import os
from datetime import datetime

AI_SERVICE_URL = "http://203.162.88.102:12006/api/v1/analyze-document"

department_list = [
  "Hội đồng Học viện",
  "Ban Giám đốc / Đảng ủy, Công đoàn, Đoàn TN",
  "Ban Giám đốc / Hội đồng Khoa học và Đào tạo",
  "Phòng/Ban chức năng / Văn phòng",
  "Phòng/Ban chức năng / Phòng Đào tạo",
  "Phòng/Ban chức năng / Phòng Giáo vụ",
  "Phòng/Ban chức năng / Phòng Chính trị & Công tác Sinh viên",
  "Phòng/Ban chức năng / Khoa Đào tạo Sau đại học",
  "Phòng/Ban chức năng / Phòng Tài chính Kế toán",
  "Phòng/Ban chức năng / Phòng Quản lý Khoa học công nghệ & HTQT",
  "Phòng/Ban chức năng / Phòng Kế hoạch đầu tư",
  "Phòng/Ban chức năng / Phòng Tổ chức Cán bộ Lao động",
  "Phòng/Ban chức năng / Trung tâm Khảo thí và Đảm bảo CLGD",
  "Phòng/Ban chức năng / Trung tâm Thí nghiệm Thực hành",
  "Phòng/Ban chức năng / Trung tâm Đào tạo quốc tế",
  "Phòng/Ban chức năng / Trung tâm Dịch vụ",
  "Khối Nghiên cứu và Đào tạo / Viện Khoa học Kỹ thuật Bưu Điện",
  "Khối Nghiên cứu và Đào tạo / Viện Kinh tế Bưu điện",
  "Khối Nghiên cứu và Đào tạo / Viện Công nghệ Thông tin – Truyền thông",
  "Cơ sở Hà Nội / Khoa Cơ bản 1",
  "Cơ sở Hà Nội / Khoa Viễn thông 1",
  "Cơ sở Hà Nội / Khoa CNTT 1",
  "Cơ sở Hà Nội / Khoa KTĐT 1",
  "Cơ sở Hà Nội / Khoa QTKD 1",
  "Cơ sở Hà Nội / Khoa Tài chính Kế toán",
  "Cơ sở Hà Nội / Khoa Đa phương tiện",
  "Cơ sở Hà Nội / Khoa An toàn Thông tin",
  "Cơ sở Hà Nội / Khoa Trí tuệ Nhân tạo",
  "Cơ sở TP. Hồ Chí Minh / Khoa Cơ bản 2",
  "Cơ sở TP. Hồ Chí Minh / Khoa Viễn thông 2",
  "Cơ sở TP. Hồ Chí Minh / Khoa Công nghệ Thông tin 2",
  "Cơ sở TP. Hồ Chí Minh / Khoa Kỹ thuật Điện tử 2",
  "Cơ sở TP. Hồ Chí Minh / Khoa Quản trị Kinh doanh 2",
  "Cơ sở TP. Hồ Chí Minh / Phòng Hành chính (HCM)",
  "Cơ sở TP. Hồ Chí Minh / Phòng Kinh tế - Tài chính (HCM)",
  "Cơ sở TP. Hồ Chí Minh / Phòng Đào tạo & KHCN (HCM)",
  "Cơ sở TP. Hồ Chí Minh / Phòng Giáo vụ (HCM)",
  "Cơ sở TP. Hồ Chí Minh / Phòng CTSV (HCM)",
  "Cơ sở TP. Hồ Chí Minh / Trung tâm Khảo thí và ĐBCLGD (HCM)",
  "Trung tâm Bồi dưỡng / Trung tâm Đào tạo Bưu chính Viễn thông 1",
  "Trung tâm Bồi dưỡng / Trung tâm Đào tạo Bưu chính Viễn thông 2"
]

async def send_to_ai_service(file_content: bytes, filename: str, is_save_file: bool, document_id: str=None):
    files = {"file": (filename, file_content)}
    data = {
        "save_document": "true" if is_save_file else "false", 
        "document_id": document_id, 
        "department_list": json.dumps(department_list, ensure_ascii=False)
    }
    
    print(f"--- Đang gửi file {filename} tới AI Service... ---")
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            response = await client.post(AI_SERVICE_URL, files=files, data=data)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"❌ AI Service trả về lỗi HTTP: {e.response.status_code}")
            print(f"Chi tiết: {e.response.text}")
            return None
        except Exception as e:
            print(f"❌ Lỗi kết nối httpx: {e}")
            return None

async def main():
    file_path = "file.pdf" 
    
    if not os.path.exists(file_path):
        print(f"❌ Không tìm thấy file tại: {os.path.abspath(file_path)}")
        return

    # Đọc file
    print("reading")
    with open(file_path, "rb") as f:
        file_content = f.read()

    # Gọi hàm test
    start_time = datetime.now()
    print("Startinggggg")
    result = await send_to_ai_service(
        file_content=file_content,
        filename="file.pdf",
        is_save_file=False,
        document_id=None
    )
    end_time = datetime.now()

    # Hiển thị kết quả
    if result:
        print("\n✅ KẾT QUẢ TỪ AI SERVICE:")
        print(json.dumps(result, indent=4, ensure_ascii=False))
        print(f"\n⏱️ Tổng thời gian xử lý: {end_time - start_time}")
    else:
        print("\n❌ Thất bại: Không nhận được phản hồi hợp lệ.")

if __name__ == "__main__":
    asyncio.run(main())