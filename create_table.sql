-- Hỗ trợ tạo UUID tự động và lưu trữ Vector cho AI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE public.departments (
    department_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text,
    description text,
    parent_id uuid REFERENCES public.departments(department_id),
    created_at timestamptz DEFAULT now(),
    CONSTRAINT chk_no_self_parent CHECK (parent_id IS NULL OR parent_id <> department_id)
);

CREATE TABLE public.roles (
    role_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.permissions (
    permission_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    description text
);

CREATE TABLE public.role_permissions (
    role_id uuid REFERENCES public.roles(role_id) ON DELETE CASCADE,
    permission_id uuid REFERENCES public.permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.sources (
    source_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL, -- Email, Scanner, Portal, v.v.
    config jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text UNIQUE,
    email text UNIQUE,
    display_name text,
    password_hash text,
    auth_provider text DEFAULT 'local',
    department_id uuid REFERENCES public.departments(department_id) ON DELETE SET NULL,
    role_id uuid REFERENCES public.roles(role_id) ON DELETE SET NULL,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    last_login_at timestamptz
);

CREATE TABLE public.document_types (
    document_type_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text
);

CREATE TABLE public.documents (
    -- Định danh
    document_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id uuid REFERENCES public.sources(source_id) ON DELETE SET NULL,
    document_type_id uuid REFERENCES public.document_types(document_type_id) ON DELETE SET NULL,
    assigned_department_id uuid REFERENCES public.departments(department_id) ON DELETE SET NULL,
    assigned_user_id uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
    
    -- Metadata trích xuất (Extracted Fields)
    so_den varchar(255),
    so_ky_hieu varchar(255),
    trich_yeu text,
    hinh_thuc varchar(100),
    loai_van_ban_text varchar(100),
    don_vi_ban_hanh text,
    nguoi_ky varchar(255),
    chuc_vu_nguoi_ky varchar(255),
    ngay_van_ban date,
    ngay_den timestamptz,
    ngay_het_han date,
    do_khan varchar(50),
    noi_nhan jsonb,            -- Lưu danh sách đơn vị nhận
    can_cu_phap_ly jsonb,      -- Lưu danh sách các luật căn cứ
    yeu_cau_han_dong text,
    
    -- Kết quả AI (LLM Results)
    status text,
    summary text,
    key_points jsonb,          -- Lưu 3-5 điểm chính
    confidence real,           -- Điểm tin cậy (0.0 - 1.0)
    muc_tin_cay varchar(50),   -- high, medium, low
    de_xuat_xu_ly jsonb,       -- Toàn bộ object đề xuất xử lý
    goi_y_phong_ban jsonb,     -- Toàn bộ object gợi ý phòng ban
    
    -- Vận hành
    tong_so_chunk integer,
    processing_time real,      -- Thời gian AI xử lý (giây)
    is_chua_doc boolean DEFAULT true,
    thong_tin_ky_so jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-- Bảng hợp nhất giữa ATTACHMENTS và document_files
CREATE TABLE public.document_files (
    file_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.documents(document_id) ON DELETE CASCADE,
    file_name text,
    file_path text,
    mime_type text,
    size_bytes bigint,
    page_count integer,
    checksum text,
    
    -- Các trường OCR từ hình ảnh
    ocr_status varchar(50), -- Pending, Processing, Completed, Failed
    ocr_text text,
    
    uploaded_by uuid REFERENCES public.users(user_id) ON DELETE SET NULL,
    uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE public.document_routing_history (
    history_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.documents(document_id) ON DELETE CASCADE,
    from_department_id uuid REFERENCES public.departments(department_id),
    to_department_id uuid REFERENCES public.departments(department_id),
    from_user_id uuid REFERENCES public.users(user_id),
    to_user_id uuid REFERENCES public.users(user_id),
    
    -- Thông tin trạng thái chi tiết (Hợp nhất từ Processing History)
    action text, -- Ví dụ: 'CHUA_XU_LY', 'DANG_XU_LY', 'DA_XU_LY'
    comment text,
    action_at timestamptz DEFAULT now()
);

CREATE TABLE public.forwarding_matrix (
    matrix_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_type_id uuid REFERENCES public.document_types(document_type_id) ON DELETE CASCADE,
    from_department_id uuid REFERENCES public.departments(department_id),
    to_department_id uuid REFERENCES public.departments(department_id),
    priority smallint,
    rule_expr jsonb,
    created_at timestamptz DEFAULT now()
);

-- Bổ sung các bảng còn lại từ file SQL
CREATE TABLE public.tags (
    tag_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    created_by uuid REFERENCES public.users(user_id),
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.document_tags (
    document_id uuid REFERENCES public.documents(document_id) ON DELETE CASCADE,
    tag_id uuid REFERENCES public.tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

CREATE TABLE public.classification_results (
    classification_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.documents(document_id) ON DELETE CASCADE,
    predicted_label_id uuid REFERENCES public.document_types(document_type_id),
    score real,
    model_version text,
    classified_at timestamptz DEFAULT now()
);

CREATE TABLE public.bots (
    bot_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    token text,
    channel_type text, -- Telegram, Slack, v.v.
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
    notification_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.documents(document_id) ON DELETE SET NULL,
    bot_id uuid REFERENCES public.bots(bot_id) ON DELETE SET NULL,
    to_user_id uuid REFERENCES public.users(user_id),
    status text,
    sent_at timestamptz,
    delivered_at timestamptz
);

CREATE TABLE public.system_parameters (
    param_key text PRIMARY KEY,
    param_value text,
    description text,
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_documents_search ON public.documents (so_den, so_ky_hieu);

CREATE INDEX idx_chunks_vector ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_routing_doc ON public.document_routing_history (document_id);