import requests
import os
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.models.human_resource import HumanResource
from app.models.department import Department
from app.db.session import SessionLocal

load_dotenv()

QLVB_API_KEY = os.getenv("QLVB_API_KEY")

def fetch_all_users():
    base_url = "https://test.qlvb.ript.vn/api/qlvb/users"
    headers = {"x-gw-api-key": QLVB_API_KEY}
    all_users = []
    page = 1
    limit = 100
    total_pages = 1
    
    print("Đang tải dữ liệu nhân sự...")
    while page <= total_pages:
        try:
            response = requests.get(f"{base_url}?page={page}&limit={limit}", headers=headers)
            response.raise_for_status()
            api_response = response.json()
            if not api_response.get('success'):
                break
            data = api_response.get('data', {})
            records = data.get('records', [])
            all_users.extend(records)
            if page == 1:
                total_pages = data.get('total_pages', 1)
            print(f" - Đã tải xong trang {page}/{total_pages}")
            page += 1
        except Exception as e:
            print(f"Lỗi khi gọi API: {e}")
            break
    return all_users


def sync_human_resources(db: Session):
    users_data = fetch_all_users()
    if not users_data:
        print("Không có dữ liệu nhân sự để đồng bộ.")
        return

    print("Đang kiểm tra đối chiếu dữ liệu phòng ban...")
    valid_dept_ids = {row[0] for row in db.query(Department.id).filter(Department.id.isnot(None)).all()}

    print(f"Bắt đầu đồng bộ {len(users_data)} nhân sự vào database...")

    values_to_insert = []
    for user in users_data:
        unit_current = user.get('unit_current')
        department_id = unit_current.get('id') if unit_current else None

        # nếu department_id không có trong DB, gán bằng None
        if department_id is not None and department_id not in valid_dept_ids:
            print(f"[Cảnh báo] Nhân sự '{user.get('name')}' (ID: {user.get('id')}) có department_id={department_id} không tồn tại trong DB. Tạm gán thành null.")
            department_id = None

        values_to_insert.append({
            "id": user.get("id"),
            "name": user.get("name"),
            "login": user.get("login"),
            "email": user.get("email"),
            "ma_can_bo": user.get("ma_can_bo"),
            "ten_hien_thi": user.get("ten_hien_thi"),
            "chuc_danh": user.get("chuc_danh"),
            "oauth_uid": user.get("oauth_uid"),
            "is_role_qlvb": user.get("is_role_qlvb"),
            "active": user.get("active"),
            "department_id": department_id
        })

    BATCH_SIZE = 500
    exclude_cols = ['id', 'human_resource_id', 'created_at']

    for i in range(0, len(values_to_insert), BATCH_SIZE):
        batch = values_to_insert[i:i + BATCH_SIZE]
        
        try:
            with db.begin_nested():
                stmt = insert(HumanResource).values(batch)
                update_dict = {c.name: c for c in stmt.excluded if c.name not in exclude_cols}
                upsert_stmt = stmt.on_conflict_do_update(
                    index_elements=['id'],
                    set_=update_dict
                )
                db.execute(upsert_stmt)
            print(f" - Đã lưu batch {i // BATCH_SIZE + 1} (gồm {len(batch)} bản ghi)")

        except Exception as batch_error:
            print(f"\n[!] PHÁT HIỆN LỖI Ở BATCH {i // BATCH_SIZE + 1}. Đang chuyển sang debug từng dòng...")
            error_found = False
            for row in batch:
                try:
                    with db.begin_nested():
                        single_stmt = insert(HumanResource).values([row])
                        single_update_dict = {c.name: c for c in single_stmt.excluded if c.name not in exclude_cols}
                        single_upsert_stmt = single_stmt.on_conflict_do_update(
                            index_elements=['id'],
                            set_=single_update_dict
                        )
                        db.execute(single_upsert_stmt)
                except Exception as row_error:
                    print(f"\n{'='*50}")
                    print(f"ID nhân sự: {row.get('id')} - Tên: {row.get('name')}")
                    print(f"Dữ liệu gửi đi: {row}")
                    print(f"Chi tiết lỗi Database:\n{row_error}")
                    print(f"{'='*50}\n")
                    error_found = True
            
            if error_found:
                print("Dừng đồng bộ để xử lý lỗi dữ liệu.")
                return 

    try:
        db.commit()
        print("Đồng bộ nhân sự hoàn tất thành công!")
    except Exception as e:
        db.rollback()
        print(f"Lỗi khi commit dữ liệu cuối: {e}")

if __name__ == "__main__":
    db_session = SessionLocal()
    try:
        sync_human_resources(db_session)
    finally:
        db_session.close()