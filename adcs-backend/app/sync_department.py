import requests
import os
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.db.session import SessionLocal
from app.models.department import Department

load_dotenv()

QLVB_API_KEY = os.getenv("QLVB_API_KEY")

def fetch_all_departments():
    base_url = "https://test.qlvb.ript.vn/api/qlvb/units"
    headers = {
        "x-gw-api-key": QLVB_API_KEY
    }
    
    all_records = []
    page = 1
    limit = 200
    total_pages = 1
    
    print("Đang gọi API lấy dữ liệu...")
    
    while page <= total_pages:
        try:
            response = requests.get(f"{base_url}?page={page}&limit={limit}", headers=headers)
            response.raise_for_status()
            api_response = response.json()
            
            if not api_response.get('success'):
                print(f"API trả về thất bại ở trang {page}!")
                break
                
            data = api_response.get('data', {})
            all_records.extend(data.get('records', []))
            
            if page == 1:
                total_pages = data.get('total_pages', 1)
                
            page += 1
            
        except requests.exceptions.RequestException as e:
            print(f"Lỗi khi gọi API ở trang {page}: {e}")
            break
            
    return all_records

def sync_departments(db: Session):
    flat_departments = fetch_all_departments()
    
    if not flat_departments:
        print("Không có dữ liệu để đồng bộ.")
        return

    # Sắp xếp theo level_number tăng dần
    flat_departments.sort(key=lambda x: x.get('level_number') or 999)
    print(f"Bắt đầu đồng bộ {len(flat_departments)} phòng ban vào database...")

    try:
        values_to_insert = []
        for dept in flat_departments:
            values_to_insert.append({
                "id": dept.get("id"),
                "name": dept.get("name"),
                "code": dept.get("ma_don_vi"),
                "ten_viet_tat": dept.get("ten_viet_tat"),
                "ten_hien_thi": dept.get("ten_hien_thi"),
                "loai_don_vi": dept.get("loai_don_vi"),
                "cap_don_vi": dept.get("cap_don_vi"),
                "level_number": dept.get("level_number"),
                "is_formal": dept.get("is_formal"),
                "has_seal": dept.get("has_seal"),
                "parent_id": dept.get("parent_id"),
                "parent_name": dept.get("parent_name"),
                "child_count": dept.get("child_count")
            })

        stmt = insert(Department).values(values_to_insert)

        exclude_cols = ['id', 'department_id', 'created_at']
        update_dict = {
            c.name: c for c in stmt.excluded if c.name not in exclude_cols
        }

        upsert_stmt = stmt.on_conflict_do_update(
            index_elements=['id'],
            set_=update_dict
        )

        db.execute(upsert_stmt)
        db.commit()
        print("Đồng bộ hoàn tất thành công!")

    except Exception as e:
        db.rollback()
        print(f"Lỗi khi lưu vào Database: {e}")

if __name__ == "__main__":
    db_session = SessionLocal()
    try:
        sync_departments(db_session)
    finally:
        db_session.close()