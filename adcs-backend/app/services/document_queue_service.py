import os
import asyncio
import io
import json
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.document import Document
from app.crud.document import claim_next_document_for_processing, recover_interrupted_documents
from app.core.logger import logger
from app.core.document_websocket import manager
from app.services.document_service import send_to_ai_service, parse_date_string, repair_truncated_json, send_document_to_qlvb
from app.models.department import Department

MAX_CONCURRENT_DOCUMENTS = int(os.getenv("MAX_CONCURRENT_DOCUMENTS", 1))

def _merge_field(existing, ai_value, from_crawler: bool):
    """Văn bản crawler: giữ metadata đang có, AI chỉ điền chỗ trống. Văn bản khác: lấy kết quả AI như trước."""
    if from_crawler:
        return existing or ai_value
    return ai_value


class DocumentQueueManager:
    def __init__(self):
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOCUMENTS)
        self.is_running = False
        self.worker_task: Optional[asyncio.Task] = None
        self.trigger_event = asyncio.Event()

    def start(self):
        """Khởi động tiến trình worker nền"""
        if not self.is_running:
            self.is_running = True
            db = SessionLocal()
            try:
                recovered = recover_interrupted_documents(db)
                if recovered > 0:
                    logger.info(f"🔄 [Queue] Đã tự động khôi phục {recovered} văn bản bị gián đoạn do khởi động lại hệ thống.")
            finally:
                db.close()
            self.worker_task = asyncio.create_task(self._worker_loop())
            logger.info(f"🚀 [Queue] Đã khởi chạy tiến trình xử lý nền (Tối đa {MAX_CONCURRENT_DOCUMENTS} văn bản đồng thời).")

    async def stop(self):
        """Dừng tiến trình worker an toàn"""
        self.is_running = False
        self.notify()
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 [Queue] Đã dừng tiến trình xử lý nền.")

    def notify(self):
        """Đánh thức worker khi có văn bản mới được thêm vào hàng đợi"""
        self.trigger_event.set()

    async def _worker_loop(self):
        """Vòng lặp giám sát hàng đợi PostgreSQL liên tục"""
        while self.is_running:
            try:
                # Chờ slot rảnh từ Semaphore
                await self.semaphore.acquire()
                
                db = SessionLocal()
                doc = None
                try:
                    # Khóa 1 văn bản ưu tiên nhất bằng FOR UPDATE SKIP LOCKED
                    doc = claim_next_document_for_processing(db)
                except Exception as e:
                    logger.error(f"[Queue Worker DB Error] Lỗi khi nhận việc từ hàng đợi: {e}")
                finally:
                    db.close()

                if doc:
                    # Khởi chạy xử lý văn bản trong task riêng
                    asyncio.create_task(self._process_single_document(str(doc.document_id)))
                else:
                    # Không có văn bản nào trong hàng đợi -> nhả semaphore và chờ
                    self.semaphore.release()
                    try:
                        await asyncio.wait_for(self.trigger_event.wait(), timeout=2.0)
                        self.trigger_event.clear()
                    except asyncio.TimeoutError:
                        pass

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[Queue Worker Loop Crash]: {e}", exc_info=True)
                await asyncio.sleep(2.0)

    async def _process_single_document(self, document_id: str):
        """Xử lý một tài liệu đơn lẻ và giải phóng semaphore ngay khi hoàn thành"""
        try:
            logger.info(f"▶️ [Queue] Bắt đầu xử lý văn bản document_id={document_id}")
            db = SessionLocal()
            doc = None
            try:
                doc = db.query(Document).filter(Document.document_id == document_id).first()
            finally:
                db.close()

            if not doc:
                logger.warning(f"[Queue] Không tìm thấy document_id={document_id} trong DB")
                return

            # Đọc nội dung file từ ổ đĩa
            file_path = doc.file_path
            if not file_path or not os.path.exists(file_path):
                logger.error(f"[Queue] File vật lý không tồn tại tại đường dẫn: {file_path}")
                self._update_doc_status(document_id, "failed", error_message="Không tìm thấy tệp vật lý trên máy chủ")
                return

            with open(file_path, "rb") as f:
                file_content = f.read()

            filename = doc.original_filename or os.path.basename(file_path)
            page_count = doc.page_count or 1
            
            # Tính timeout động theo số trang: 30s base + 15s/trang (tối thiểu 60s, tối đa 1800s)
            dynamic_timeout = max(60.0, min(1800.0, 30.0 + page_count * 15.0))
            logger.info(f"⏱️ [Queue] Thiết lập timeout cho {filename} ({page_count} trang): {dynamic_timeout:.1f}s")

            # Gọi AI Service
            ai_res = await send_to_ai_service(
                file_content=file_content,
                filename=filename,
                # Văn bản crawler (priority 3) lưu luôn vào kho Data Service như crawler cũ (save_document=true);
                # Data Service tự nhận ra văn bản trùng
                is_save_file=(doc.priority == 3),
                timeout=dynamic_timeout,
                db=db,
                document_id=str(document_id),
                page_count=page_count
            )

            # Sửa chuỗi JSON bị cắt cụt nếu có
            if ai_res and "key_information" in ai_res and isinstance(ai_res["key_information"], str):
                try:
                    info_dict = json.loads(ai_res["key_information"])
                    ai_res.update(info_dict)
                except Exception:
                    repaired = repair_truncated_json(ai_res["key_information"])
                    try:
                        info_dict = json.loads(repaired)
                        ai_res.update(info_dict)
                    except Exception:
                        pass

            client_id = str(doc.uploaded_by_user_id) if doc.uploaded_by_user_id else "system_user"

            db = SessionLocal()
            try:
                doc = db.query(Document).filter(Document.document_id == document_id).first()
                if not doc:
                    return

                if ai_res and ai_res.get("trang_thai") == "success":
                    doc.status = "processed"
                    doc.summary = ai_res.get("tom_tat")
                    doc.key_points = ai_res.get("key_points")
                    doc.confidence = ai_res.get("diem_tin_cay")
                    doc.muc_tin_cay = ai_res.get("muc_tin_cay")
                    doc.loai_van_ban = ai_res.get("loai_van_ban")
                    doc.de_xuat_xu_ly = ai_res.get("de_xuat_thoi_han_xu_ly")
                    doc.storage_info = ai_res.get("storage_info")

                    ext = ai_res.get("extracted_fields", {})
                    # Văn bản crawler (priority 3) đã có metadata do văn thư nhập trên iOffice: giữ nguyên,
                    # AI chỉ điền chỗ còn trống. Văn bản khác: lấy kết quả AI như trước.
                    from_crawler = doc.priority == 3
                    doc.so_ky_hieu = _merge_field(doc.so_ky_hieu, ext.get("so_hieu_van_ban"), from_crawler)
                    doc.don_vi_ban_hanh = _merge_field(doc.don_vi_ban_hanh, ext.get("co_quan_ban_hanh"), from_crawler)
                    doc.ngay_van_ban = _merge_field(doc.ngay_van_ban, parse_date_string(ext.get("ngay_ban_hanh")), from_crawler)
                    doc.trich_yeu = _merge_field(doc.trich_yeu, ext.get("trich_yeu"), from_crawler)
                    doc.do_khan = _merge_field(doc.do_khan, ext.get("do_khan"), from_crawler)
                    doc.nguoi_ky = ext.get("nguoi_ky")
                    doc.chuc_vu_nguoi_ky = ext.get("chuc_vu_nguoi_ky")
                    doc.noi_nhan = ext.get("noi_nhan")
                    doc.can_cu_phap_ly = ext.get("can_cu_phap_ly")
                    doc.yeu_cau_hanh_dong = ext.get("yeu_cau_hanh_dong")

                    goi_y_pb = ai_res.get("goi_y_phong_ban", {})
                    doc.goi_y_phong_ban = goi_y_pb
                    
                    suggested_code = None
                    suggested_name = None
                    if isinstance(goi_y_pb, dict):
                        suggested_code = goi_y_pb.get("department_code") or goi_y_pb.get("code") or goi_y_pb.get("ma_phong_ban")
                        suggested_name = goi_y_pb.get("ten_hien_thi") or goi_y_pb.get("name") or goi_y_pb.get("ten_phong_ban")

                    suggested_list = ai_res.get("suggested_departments", [])
                    if suggested_list and isinstance(suggested_list, list) and len(suggested_list) > 0:
                        first_pick = suggested_list[0]
                        if isinstance(first_pick, dict):
                            suggested_code = suggested_code or first_pick.get("department_code") or first_pick.get("code")
                            suggested_name = suggested_name or first_pick.get("department_name") or first_pick.get("name")

                    department = None
                    if suggested_code:
                        department = db.query(Department).filter(Department.code == str(suggested_code).strip()).first()
                        if not department and str(suggested_code).isdigit():
                            department = db.query(Department).filter(Department.id == int(suggested_code)).first()

                    if not department and suggested_name:
                        department = db.query(Department).filter(
                            (Department.name.ilike(f"%{suggested_name}%")) | 
                            (Department.ten_hien_thi.ilike(f"%{suggested_name}%"))
                        ).first()

                    if department:
                        doc.assigned_department_id = str(department.department_id)
                    else:
                        doc.assigned_department_id = None

                    # Top-3 Suggested Departments
                    if not suggested_list and (department or goi_y_pb):
                        pb_name = (department.name if department else suggested_name) or "Phòng ban chuyên trách"
                        pb_code = (department.code if department else suggested_code) or ""
                        pb_score = doc.confidence or 0.88
                        pb_reason = goi_y_pb.get("ly_do") or goi_y_pb.get("reasoning") or f"Văn bản phù hợp với chức năng nhiệm vụ tiếp nhận và xử lý của {pb_name}."
                        suggested_list = [{
                            "department_code": pb_code,
                            "department_name": pb_name,
                            "confidence_score": pb_score,
                            "reasoning": pb_reason
                        }]
                    doc.suggested_departments = suggested_list

                    # Proposed Assignees
                    proposed_assignees = ai_res.get("proposed_assignees", [])
                    if not proposed_assignees and department and department.id:
                        try:
                            from app.models.human_resource import HumanResource
                            hr_list = db.query(HumanResource).filter(
                                HumanResource.department_id == department.id,
                                HumanResource.active == True
                            ).limit(3).all()
                            if hr_list:
                                proposed_assignees = [
                                    {
                                        "name": hr.ten_hien_thi or hr.name,
                                        "position": hr.chuc_danh or "Cán bộ chuyên môn",
                                        "department_code": department.code or str(department.id),
                                        "email": hr.email,
                                        "reasoning": f"Cán bộ chuyên trách thuộc {department.name}"
                                    }
                                    for hr in hr_list
                                ]
                        except Exception as hr_err:
                            logger.warning(f"Lỗi tìm cán bộ đề xuất: {hr_err}")
                    doc.proposed_assignees = proposed_assignees

                    if ai_res.get("loai_van_ban"):
                        doc.loai_van_ban_text = ai_res.get("loai_van_ban", {}).get("nhan")

                    doc.tong_so_chunk = ai_res.get("tong_so_chunk")
                    doc.total_chunks_processed = ai_res.get("total_chunks_processed")
                    doc.source_pages = ai_res.get("source_pages") or page_count
                    doc.processing_time = ai_res.get("processing_time")
                    doc.related_documents = ai_res.get("related_documents", [])

                    de_xuat = ai_res.get("de_xuat_thoi_han_xu_ly", {})
                    if de_xuat.get("ngay_het_han_du_kien"):
                        try:
                            doc.ngay_het_han = datetime.strptime(de_xuat["ngay_het_han_du_kien"], "%Y-%m-%d").date()
                        except Exception:
                            pass

                    db.commit()
                    logger.info(f"✅ [Queue] Xử lý thành công văn bản {document_id}")

                    # Gửi QLVB nếu cần
                    try:
                        await send_document_to_qlvb(db, doc, file_content, filename)
                    except Exception as qlvb_err:
                        logger.warning(f"Lỗi gửi QLVB: {qlvb_err}")

                    await manager.send_personal_message({
                        "type": "DOCUMENT_PROCESSED",
                        "document_id": str(document_id),
                        "status": "success",
                        "message": "AI đã xử lý xong tài liệu!"
                    }, client_id)

                else:
                    # Xử lý thất bại hoặc lỗi AI
                    retry_count = (doc.retry_count or 0) + 1
                    doc.retry_count = retry_count
                    if retry_count < 3:
                        doc.status = "queued"
                        doc.error_message = f"AI Service phản hồi lỗi (lần {retry_count}), tự động xếp hàng thử lại."
                        logger.warning(f"⚠️ [Queue] Thử lại văn bản {document_id} lần {retry_count}")
                    else:
                        doc.status = "failed"
                        doc.error_message = "AI Service không thể phân tích văn bản sau 3 lần thử."
                        logger.error(f"❌ [Queue] Thất bại vĩnh viễn văn bản {document_id}")

                    db.commit()

                    await manager.send_personal_message({
                        "type": "DOCUMENT_FAILED",
                        "document_id": str(document_id),
                        "status": doc.status,
                        "message": doc.error_message
                    }, client_id)

            except Exception as e:
                logger.error(f"[Queue] Lỗi khi cập nhật kết quả vào DB: {e}", exc_info=True)
                db.rollback()
            finally:
                db.close()

        except Exception as e:
            logger.error(f"[Queue] Lỗi không mong muốn khi xử lý document {document_id}: {e}", exc_info=True)
            self._update_doc_status(document_id, "failed", error_message=str(e))
        finally:
            # Giải phóng Semaphore ngay lập tức để văn bản tiếp theo vào xử lý
            self.semaphore.release()
            logger.info(f"⏹️ [Queue] Hoàn thành lượt xử lý document_id={document_id}, giải phóng slot worker.")

    def _update_doc_status(self, document_id: str, status: str, error_message: str = None):
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.document_id == document_id).first()
            if doc:
                doc.status = status
                if error_message:
                    doc.error_message = error_message
                db.commit()
        except Exception as e:
            logger.error(f"Lỗi cập nhật status document {document_id}: {e}")
        finally:
            db.close()

# Singleton instance
document_queue = DocumentQueueManager()
