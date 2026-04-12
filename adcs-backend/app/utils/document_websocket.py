from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: dict, client_id: str):
        websocket = self.active_connections.get(client_id)
        if websocket:
            await websocket.send_json(message)

manager = ConnectionManager()

department_list = [
  "Hội đồng Học viện",
  "Ban Giám đốc > Đảng ủy, Công đoàn, Đoàn TN",
  "Ban Giám đốc > Hội đồng Khoa học và Đào tạo",
  "Phòng/Ban chức năng > Văn phòng",
  "Phòng/Ban chức năng > Phòng Đào tạo",
  "Phòng/Ban chức năng > Phòng Giáo vụ",
  "Phòng/Ban chức năng > Phòng Chính trị & Công tác Sinh viên",
  "Phòng/Ban chức năng > Khoa Đào tạo Sau đại học",
  "Phòng/Ban chức năng > Phòng Tài chính Kế toán",
  "Phòng/Ban chức năng > Phòng Quản lý Khoa học công nghệ & HTQT",
  "Phòng/Ban chức năng > Phòng Kế hoạch đầu tư",
  "Phòng/Ban chức năng > Phòng Tổ chức Cán bộ Lao động",
  "Phòng/Ban chức năng > Trung tâm Khảo thí và Đảm bảo CLGD",
  "Phòng/Ban chức năng > Trung tâm Thí nghiệm Thực hành",
  "Phòng/Ban chức năng > Trung tâm Đào tạo quốc tế",
  "Phòng/Ban chức năng > Trung tâm Dịch vụ",
  "Khối Nghiên cứu và Đào tạo > Viện Khoa học Kỹ thuật Bưu Điện",
  "Khối Nghiên cứu và Đào tạo > Viện Kinh tế Bưu điện",
  "Khối Nghiên cứu và Đào tạo > Viện Công nghệ Thông tin – Truyền thông",
  "Cơ sở Hà Nội > Khoa Cơ bản 1",
  "Cơ sở Hà Nội > Khoa Viễn thông 1",
  "Cơ sở Hà Nội > Khoa CNTT 1",
  "Cơ sở Hà Nội > Khoa KTĐT 1",
  "Cơ sở Hà Nội > Khoa QTKD 1",
  "Cơ sở Hà Nội > Khoa Tài chính Kế toán",
  "Cơ sở Hà Nội > Khoa Đa phương tiện",
  "Cơ sở Hà Nội > Khoa An toàn Thông tin",
  "Cơ sở Hà Nội > Khoa Trí tuệ Nhân tạo",
  "Cơ sở TP. Hồ Chí Minh > Khoa Cơ bản 2",
  "Cơ sở TP. Hồ Chí Minh > Khoa Viễn thông 2",
  "Cơ sở TP. Hồ Chí Minh > Khoa Công nghệ Thông tin 2",
  "Cơ sở TP. Hồ Chí Minh > Khoa Kỹ thuật Điện tử 2",
  "Cơ sở TP. Hồ Chí Minh > Khoa Quản trị Kinh doanh 2",
  "Cơ sở TP. Hồ Chí Minh > Phòng Hành chính (HCM)",
  "Cơ sở TP. Hồ Chí Minh > Phòng Kinh tế - Tài chính (HCM)",
  "Cơ sở TP. Hồ Chí Minh > Phòng Đào tạo & KHCN (HCM)",
  "Cơ sở TP. Hồ Chí Minh > Phòng Giáo vụ (HCM)",
  "Cơ sở TP. Hồ Chí Minh > Phòng CTSV (HCM)",
  "Cơ sở TP. Hồ Chí Minh > Trung tâm Khảo thí và ĐBCLGD (HCM)",
  "Trung tâm Bồi dưỡng > Trung tâm Đào tạo Bưu chính Viễn thông 1",
  "Trung tâm Bồi dưỡng > Trung tâm Đào tạo Bưu chính Viễn thông 2"
]