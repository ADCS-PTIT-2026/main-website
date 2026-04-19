--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2026-04-19 18:31:40

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 36511)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 3 (class 3079 OID 36522)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 37097)
-- Name: bots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bots (
    bot_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    token text,
    channel_type text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bots OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 36850)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_no_self_parent CHECK (((parent_id IS NULL) OR (parent_id <> department_id)))
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 45427)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    document_id uuid DEFAULT gen_random_uuid() NOT NULL,
    assigned_department_id uuid,
    assigned_user_id uuid,
    so_den character varying(255),
    so_ky_hieu character varying(255),
    trich_yeu text,
    hinh_thuc character varying(100),
    loai_van_ban_text character varying(100),
    don_vi_ban_hanh text,
    nguoi_ky character varying(255),
    chuc_vu_nguoi_ky character varying(255),
    ngay_van_ban date,
    ngay_den timestamp with time zone,
    ngay_het_han date,
    do_khan character varying(50),
    noi_nhan jsonb,
    can_cu_phap_ly jsonb,
    yeu_cau_hanh_dong text,
    status text,
    summary text,
    key_points jsonb,
    confidence real,
    muc_tin_cay character varying(50),
    loai_van_ban jsonb,
    de_xuat_xu_ly jsonb,
    goi_y_phong_ban jsonb,
    tong_so_chunk integer,
    total_chunks_processed integer,
    source_pages integer,
    storage_info jsonb,
    processing_time real,
    is_chua_doc boolean DEFAULT true,
    thong_tin_ky_so jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    uploaded_by_user_id uuid NOT NULL,
    related_documents jsonb
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 45448)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    bot_id uuid,
    to_user_id uuid,
    status text,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 36876)
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    permission_id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 36886)
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 36865)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 37129)
-- Name: system_parameters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_parameters (
    param_key text NOT NULL,
    param_value text,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_parameters OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 37047)
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    tag_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 36910)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text,
    email text,
    display_name text,
    password_hash text,
    auth_provider text DEFAULT 'local'::text,
    department_id uuid,
    role_id uuid,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    telegram_chat_id text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5239 (class 0 OID 37097)
-- Dependencies: 225
-- Data for Name: bots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bots (bot_id, name, token, channel_type, created_at) FROM stdin;
5b313ece-9380-4f82-a33f-4a873d4b6cf7	ptit_adcs_bot	8712790689:AAE-cSEzuC4U2saVtExjCaSk2yKYnk9kmvA	telegram	2026-04-06 13:45:04.060849+07
\.


--
-- TOC entry 5233 (class 0 OID 36850)
-- Dependencies: 219
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, name, code, description, parent_id, created_at) FROM stdin;
d31bc680-f53d-45f2-98e7-d762e568cb0d	Hội đồng Học viện	\N	\N	\N	2026-03-26 14:21:43.047167+07
87f6bdad-86aa-4bd6-88b9-56f57211923c	Đảng ủy, Công đoàn, Đoàn TN	\N	\N	92100499-0628-4a23-92be-9022f66e1766	2026-03-26 14:21:43.047167+07
a75661a3-39fc-44b0-88f9-363be4f446a7	Hội đồng Khoa học và Đào tạo	\N	\N	92100499-0628-4a23-92be-9022f66e1766	2026-03-26 14:21:43.047167+07
08fbeead-b76c-4ba8-af63-a61350b3524b	Phòng/Ban chức năng	\N	\N	92100499-0628-4a23-92be-9022f66e1766	2026-03-26 14:21:43.047167+07
2e29eac3-3497-49d6-822e-1fbeb3af8110	Văn phòng	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
30c0be7f-76ac-4625-965c-f449875d5881	Phòng Đào tạo	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
3166e9e0-72a8-4abb-8a50-954bd3f256e4	Phòng Giáo vụ	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
096de96e-e96e-45c3-8095-2a9f0d445017	Phòng Chính trị & Công tác Sinh viên	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
da8854be-1bf1-46c4-ab58-04103e8a3d13	Khoa Đào tạo Sau đại học	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
e75e04aa-c26f-43ba-99f3-fe757f7be2fb	Phòng Tài chính Kế toán	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
2fdca717-5816-4af2-a92f-71da66ae3aa4	Phòng Quản lý Khoa học công nghệ & HTQT	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
13e94c9f-fa7f-4b44-8f29-3e161d70b385	Phòng Kế hoạch đầu tư	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
ff30bb08-92e6-490a-ae4a-0a2662ba9677	Phòng Tổ chức Cán bộ Lao động	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
97f6e047-2f19-41d2-bf4d-8f20873e768a	Trung tâm Khảo thí và Đảm bảo CLGD	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
f9c481ea-c859-4bcd-9628-906f7ce7782b	Trung tâm Thí nghiệm Thực hành	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
ae2ac98d-a444-4d12-9741-64fc91032fc1	Trung tâm Đào tạo quốc tế	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
6e35bcd3-2012-497e-b763-70b87f895170	Trung tâm Dịch vụ	\N	\N	08fbeead-b76c-4ba8-af63-a61350b3524b	2026-03-26 14:21:43.047167+07
e81c4fc6-d826-431f-a0d9-85b2efd84f0c	Khối Nghiên cứu và Đào tạo	\N	\N	92100499-0628-4a23-92be-9022f66e1766	2026-03-26 14:21:43.047167+07
ff0e8f09-30e3-4ae9-a18c-5abbca682bb2	Viện Khoa học Kỹ thuật Bưu Điện	RIPT	122, Hoàng Quốc Việt – Cầu Giấy – Hà Nội	e81c4fc6-d826-431f-a0d9-85b2efd84f0c	2026-03-26 14:21:43.047167+07
ed6a995a-bba2-4365-9c9d-cdf977995997	Viện Kinh tế Bưu điện	ERIPT	122, Hoàng Quốc Việt – Cầu Giấy – Hà Nội; bao gồm Bộ môn Marketing, Bộ môn Phát triển kỹ năng (tầng 10 - Nhà A2)	e81c4fc6-d826-431f-a0d9-85b2efd84f0c	2026-03-26 14:21:43.047167+07
f91eab1c-ae75-4357-9275-9321d5dca16b	Viện Công nghệ Thông tin – Truyền thông	CDIT	tầng 3 - Nhà A1 – Cơ sở đào tạo Hà Nội	e81c4fc6-d826-431f-a0d9-85b2efd84f0c	2026-03-26 14:21:43.047167+07
0d46f9f1-7351-40c9-bdd8-8906c3558190	Khối Đào tạo	\N	\N	92100499-0628-4a23-92be-9022f66e1766	2026-03-26 14:21:43.047167+07
fb2d4fe1-ccc5-4669-add0-f1f8daf96393	Cơ sở Hà Nội	\N	\N	0d46f9f1-7351-40c9-bdd8-8906c3558190	2026-03-26 14:21:43.047167+07
32573959-781f-44ae-bcf0-0938697249c8	Khoa Cơ bản 1	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
ed3c9ee8-d8dc-437a-a99e-581db931f00d	Khoa Viễn thông 1	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
ac34c59d-c65f-427d-b13c-7dfae88740b8	Khoa KTĐT 1	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
05f8ac23-49da-4f81-88ee-59d88ffd1414	Khoa QTKD 1	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
314c67e9-b588-4626-9d60-45584d8feb02	Khoa Tài chính Kế toán	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
435cc6ca-33a4-4c3a-8e3b-3687f30484ef	Khoa Đa phương tiện	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
6d7fe978-9e29-4391-bf21-b00ef17bf947	Khoa An toàn Thông tin	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
a403a4b1-0bb5-41cb-9dab-ada7e217f038	Khoa Trí tuệ Nhân tạo	\N	\N	fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
aa79abdb-7da1-442d-9119-755760886d3f	Cơ sở TP. Hồ Chí Minh	\N	\N	0d46f9f1-7351-40c9-bdd8-8906c3558190	2026-03-26 14:21:43.047167+07
8dc3e1da-24b8-4cfa-9d0e-26dc07fe9d57	Khoa Cơ bản 2	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
50ecc0ae-9af6-4e6e-81fe-083fbc743193	Khoa Viễn thông 2	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
f5091053-52dc-4e68-8a2d-2171bf49bc55	Khoa Công nghệ Thông tin 2	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
5866a07e-8481-46fe-8cb9-a0ecf9e9f0a1	Khoa Kỹ thuật Điện tử 2	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
49e3e551-fdcd-453f-82a7-f954b6a61e29	Khoa Quản trị Kinh doanh 2	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
6f7c6d0e-8d71-4f36-b7d6-7b5f32403f9c	Phòng Hành chính (HCM)	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
26d4d19d-9320-43d0-bca5-fd208d8071e3	Phòng Kinh tế - Tài chính (HCM)	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
7fc89880-54a0-48ac-8cd2-c1ec2f34a7ff	Phòng Đào tạo & KHCN (HCM)	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
67cca5bc-dae3-46e6-8701-a719190f811c	Phòng Giáo vụ (HCM)	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
de84f99c-b9bf-4815-a447-1ed346e71c0d	Phòng CTSV (HCM)	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
d04c46b6-7564-4d73-aa49-8b4d3d8047e9	Trung tâm Khảo thí và ĐBCLGD (HCM)	\N	\N	aa79abdb-7da1-442d-9119-755760886d3f	2026-03-26 14:21:43.047167+07
adb70349-c657-42e7-b8ed-ecf2ea60b78e	Trung tâm Bồi dưỡng	\N	\N	92100499-0628-4a23-92be-9022f66e1766	2026-03-26 14:21:43.047167+07
6bc8ec3b-c475-43bd-ac00-a1b0e10d2521	Trung tâm Đào tạo Bưu chính Viễn thông 1	PTTC1	tầng 4 - Nhà A1 – Cơ sở đào tạo Hà Nội	adb70349-c657-42e7-b8ed-ecf2ea60b78e	2026-03-26 14:21:43.047167+07
b910c7ee-47b6-4f2e-aa82-239bced301b1	Trung tâm Đào tạo Bưu chính Viễn thông 2	PTTC2	11, Nguyễn Đình Chiểu, Quận I, Tp. HCM	adb70349-c657-42e7-b8ed-ecf2ea60b78e	2026-03-26 14:21:43.047167+07
92100499-0628-4a23-92be-9022f66e1766	Ban Giám đốc	HĐHV		d31bc680-f53d-45f2-98e7-d762e568cb0d	2026-03-26 14:21:43.047167+07
02b57ed0-f4e3-444a-a89c-8763e9fcff74	Khoa CNTT 1	CNTT1		fb2d4fe1-ccc5-4669-add0-f1f8daf96393	2026-03-26 14:21:43.047167+07
\.


--
-- TOC entry 5241 (class 0 OID 45427)
-- Dependencies: 227
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (document_id, assigned_department_id, assigned_user_id, so_den, so_ky_hieu, trich_yeu, hinh_thuc, loai_van_ban_text, don_vi_ban_hanh, nguoi_ky, chuc_vu_nguoi_ky, ngay_van_ban, ngay_den, ngay_het_han, do_khan, noi_nhan, can_cu_phap_ly, yeu_cau_hanh_dong, status, summary, key_points, confidence, muc_tin_cay, loai_van_ban, de_xuat_xu_ly, goi_y_phong_ban, tong_so_chunk, total_chunks_processed, source_pages, storage_info, processing_time, is_chua_doc, thong_tin_ky_so, created_at, updated_at, deleted_at, uploaded_by_user_id, related_documents) FROM stdin;
a97d93aa-22de-4a21-8eba-6c8d9f420b0f	ff30bb08-92e6-490a-ae4a-0a2662ba9677	\N	\N	\N	Về việc Tuyển dụng nhân sự trung tâm	\N	tomo_trinh	HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG	Trần Tiến Công	TRƯỞNG TRUNG TÂM	\N	\N	\N	thuong	["PGS.TS Đặng Hoài Bắc, Giám đốc Học viện"]	["Quyết định số 3100/QĐ-HV ngày 17/12/2025 của Giám đốc Học viện về việc thành lập Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu", "Nghị quyết số 57-NQ/TW ngày 22/12/2024 của Bộ Chính trị về đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số quốc gia"]	Xin Giám đốc Học viện xem xét và phê duyệt việc tuyển dụng 05 cộng tác viên trợ lý và 04 kỹ sư (Học viên cao học) làm trưởng nhóm năm 2025	processed	Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu đã soạn thảo tờ trình đề xuất tuyển dụng nhân sự để hỗ trợ hoạt động và thực hiện nhiệm vụ trong kế hoạch năm 2025. Văn bản được xây dựng dựa trên Quyết định thành lập trung tâm và Nghị quyết số 57-NQ/TW của Bộ Chính trị về phát triển khoa học công nghệ. Nội dung chính của tờ trình là xin phê duyệt việc tuyển dụng 05 cộng tác viên trợ lý và 04 kỹ sư (dự kiến là học viên cao học) làm trưởng nhóm, tổng cộng 09 vị trí đã được sàng lọc. Mục đích của việc tuyển dụng nhằm hỗ trợ thiết lập trung tâm, truyền thông, phát triển sản phẩm AI và đào tạo nguồn nhân lực chất lượng cao. Văn bản kèm theo các phụ lục chi tiết thông tin ứng viên để Giám đốc Học viện xem xét. Người ký văn bản là Trưởng trung tâm, gửi thẳng đến Giám đốc Học viện để ra quyết định. Đây là bước đi quan trọng nhằm hiện thực hóa các chỉ đạo về chuyển đổi số và đổi mới sáng tạo tại Học viện. Việc bổ sung nhân sự này sẽ giúp trung tâm vận hành hiệu quả hơn trong các nhiệm vụ trọng tâm năm 2025.	["Đề xuất tuyển dụng 09 nhân sự (05 cộng tác viên và 04 kỹ sư) cho Trung tâm AI.", "Căn cứ pháp lý gồm Quyết định thành lập trung tâm và Nghị quyết 57-NQ/TW.", "Mục tiêu hỗ trợ thiết lập trung tâm, phát triển sản phẩm AI và đào tạo nhân lực."]	0.85	medium	{"nhan": "tomo_trinh", "diem_tin_cay": 0.9}	{"ly_do": "Văn bản là Tờ trình (tomo_trinh) thuộc loại 'other' theo quy tắc với thời gian mặc định 7 ngày. Tuy nhiên, nội dung liên quan đến tuyển dụng nhân sự cấp thiết cho kế hoạch năm 2025 và có tính chất 'thường' nhưng yêu cầu ra quyết định nhanh để triển khai, nên giảm nhẹ còn 5 ngày để đảm bảo tiến độ công việc.", "muc_uu_tien": "bình thường", "so_ngay_de_xuat": 5}	{"ly_do": "Văn bản đề xuất tuyển dụng nhân sự, đây là chức năng chính thuộc thẩm quyền của Phòng Tổ chức Cán bộ Lao động trong việc quản lý, tuyển dụng và sử dụng cán bộ, công chức, viên chức.", "phong_ban": "Phòng/Ban chức năng > Phòng Tổ chức Cán bộ Lao động", "diem_tin_cay": 0.95, "ten_hien_thi": "Phòng Tổ chức Cán bộ Lao động", "nguoi_xu_ly_de_xuat": "Trưởng phòng Tổ chức Cán bộ Lao động"}	1	1	3	{"stored": true, "message": "Đã tạo document_id=2, 28 chunks, file: /mnt/data2tb/adcs/uploads/doc_2/att_2_TTr nhan su.pdf", "num_chunks": 28, "chunk_types": {"text": 6, "header": 20, "summary": 1, "key_point": 1}, "total_chars": 3257, "save_document": true}	21.281	t	\N	2026-04-19 08:33:49.125355+07	2026-04-19 08:34:11.366488+07	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	[]
b1435332-1260-4ff1-a090-7b80c61f7109	ff30bb08-92e6-490a-ae4a-0a2662ba9677	\N	\N	\N	Về việc Tuyển dụng nhân sự trung tâm	\N	to_trinh	HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG	Trần Tiến Công	TRƯỞNG TRUNG TÂM	\N	\N	\N	\N	["PGS.TS Đặng Hoài Bắc, Giám đốc Học viện", "TCCB-LĐ", "TCKT", "KHĐT", "VPHV"]	["Quyết định số 3100/QĐ-HV ngày 17/12/2025 của Giám đốc Học viện", "Nghị quyết số 57-NQ/TW ngày 22/12/2024 của Bộ Chính trị"]	Xem xét và phê duyệt việc tuyển dụng 09 nhân sự (05 cộng tác viên trợ lý và 04 kỹ sư) cho Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu.	processed	Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu thuộc Học viện Công nghệ Bưu chính Viễn thông đã trình Giám đốc Học viện về kế hoạch tuyển dụng nhân sự nhằm triển khai nhiệm vụ theo kế hoạch hoạt động năm 2025. Việc đề xuất này dựa trên Quyết định thành lập trung tâm, Nghị quyết số 57-NQ/TW của Bộ Chính trị và các chỉ đạo về phát triển khoa học công nghệ của lãnh đạo. Trung tâm đề xuất tuyển dụng tổng cộng 09 nhân sự bao gồm 05 cộng tác viên trợ lý và 04 kỹ sư (là Học viên cao học) đóng vai trò trưởng nhóm. Mục đích của đợt tuyển dụng này là hỗ trợ thiết lập hoạt động cho trung tâm trong giai đoạn đầu, đồng thời phát triển các sản phẩm trí tuệ nhân tạo và đào tạo nguồn nhân lực chất lượng cao. Thông tin chi tiết về hồ sơ của 09 ứng viên đề xuất sẽ được cung cấp kèm theo hai phụ lục của văn bản. Văn bản được trình lên PGS.TS Đặng Hoài Bắc, Giám đốc Học viện để xem xét và phê duyệt. Ngoài ra, văn bản cũng được gửi đến các phòng ban chức năng liên quan như Tổ chức Cán bộ - Lao động, Tài chính Kế toán, Kế hoạch Đầu tư và Văn phòng Học viện để phối hợp thực hiện. Đây là bước đi quan trọng để hiện thực hóa mục tiêu phát triển khoa học công nghệ và nâng cao năng lực nhân sự của Học viện trong lĩnh vực AI.	["Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu đề xuất tuyển dụng 09 nhân sự cho năm 2025.", "Việc tuyển dụng bao gồm 05 cộng tác viên trợ lý và 04 kỹ sư làm trưởng nhóm.", "Văn bản yêu cầu Giám đốc Học viện xem xét, phê duyệt và các phòng ban chức năng phối hợp thực hiện."]	0.92	high	{"nhan": "to_trinh", "diem_tin_cay": 0.95}	{"ly_do": "Văn bản là loại 'to_trinh' (tương đương báo cáo/tờ trình), loại văn bản này thường cần thời gian để lãnh đạo xem xét, thảo luận và ra quyết định. Do không có dấu hiệu khẩn cấp (do_khan = null) và đây là công việc quy trình tuyển dụng nhân sự, thời gian 5 ngày là hợp lý để hoàn tất quy trình phê duyệt.", "muc_uu_tien": "bình thường", "so_ngay_de_xuat": 5}	{"ly_do": "Nội dung văn bản là đề xuất tuyển dụng nhân sự, đây là chức năng chính thuộc phạm vi quản lý của Phòng Tổ chức Cán bộ Lao động. Sau khi Giám đốc phê duyệt, phòng này sẽ là đơn vị chủ trì tổ chức các thủ tục tuyển dụng.", "phong_ban": "Phòng/Ban chức năng > Phòng Tổ chức Cán bộ Lao động", "diem_tin_cay": 0.98, "ten_hien_thi": "Phòng Tổ chức Cán bộ Lao động", "nguoi_xu_ly_de_xuat": null}	1	1	3	{"stored": true, "message": "Tài liệu đã tồn tại (doc_id=2), không lưu mới", "num_chunks": 28, "chunk_types": {}, "total_chars": 0, "save_document": true}	21.213	t	\N	2026-04-19 17:50:42.702214+07	2026-04-19 17:51:04.833168+07	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	[]
c1b197aa-2767-4b69-8891-3405ecf4359b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	failed	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	2026-04-11 17:11:46.659761+07	2026-04-11 17:13:48.151441+07	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	\N
45296ee7-5623-4869-a2e6-015ef129731b	ff30bb08-92e6-490a-ae4a-0a2662ba9677	\N	\N	\N	Về việc Tuyển dụng nhân sự trung tâm	\N	ke_hoach	TRUNG TÂM ĐÀO TẠO TRÍ TUỆ NHÂN TẠO CHUYÊN SÂU	Trần Tiến Công	TRƯỞNG TRUNG TÂM	2025-12-25	\N	\N	thuong	["PGS.TS Đặng Hoài Bắc, Giám đốc Học viện"]	["Quyết định số 3100/QĐ-HV ngày 17/12/2025 của Giám đốc Học viện về việc thành lập Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu", "Nghị quyết số 57-NQ/TW ngày 22/12/2024 của Bộ Chính trị về đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số quốc gia"]	Xin phê duyệt việc tuyển dụng 09 nhân sự (05 cộng tác viên trợ lý và 04 kỹ sư) cho Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu năm 2025	processed	Tờ trình này được Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu gửi lên Giám đốc Học viện Bưu chính Viễn thông nhằm đề xuất kế hoạch tuyển dụng nhân sự mới cho năm 2025. Căn cứ vào Quyết định thành lập trung tâm và Nghị quyết của Bộ Chính trị về phát triển khoa học công nghệ, văn bản nêu rõ nhu cầu bổ sung 09 nhân sự gồm 05 cộng tác viên trợ lý và 04 kỹ sư làm trưởng nhóm. Mục đích của việc tuyển dụng là hỗ trợ thiết lập hoạt động trung tâm, thực hiện công tác truyền thông và phát triển nguồn nhân lực AI thông qua các lớp đào tạo ngắn hạn. Các thông tin chi tiết về hồ sơ và tiêu chuẩn ứng viên đã được đề cập trong các phụ lục kèm theo tờ trình. Văn bản yêu cầu Giám đốc Học viện xem xét và phê duyệt kế hoạch tuyển dụng này để triển khai kịp thời. Việc bổ sung nhân sự được kỳ vọng sẽ góp phần hiện thực hóa các mục tiêu đột phá về công nghệ và chuyển đổi số tại Học viện. Nội dung tờ trình thể hiện sự chuẩn bị kỹ lưỡng và tuân thủ các quy định pháp lý hiện hành. Đây là văn bản hành chính quan trọng liên quan đến công tác tổ chức cán bộ và phát triển nguồn nhân lực của đơn vị.	["Trung tâm Đào tạo Trí tuệ nhân tạo chuyên sâu đề xuất tuyển dụng 09 nhân sự cho năm 2025.", "Việc tuyển dụng gồm 05 cộng tác viên trợ lý và 04 kỹ sư trưởng nhóm nhằm hỗ trợ thiết lập trung tâm.", "Văn bản căn cứ vào Quyết định thành lập trung tâm và Nghị quyết 57-NQ/TW của Bộ Chính trị."]	0.9	high	{"nhan": "ke_hoach", "diem_tin_cay": 0.9}	{"ly_do": "Văn bản thuộc loại kế hoạch tuyển dụng nhân sự, yêu cầu xem xét và phê duyệt. Dựa trên quy tắc chung cho loại 'ke_hoach' là 5-10 ngày và độ khẩn 'thuong' (giữ nguyên), thời gian xử lý hợp lý là 7 ngày để Hội đồng Khoa học và Đào tạo hoặc Ban Giám đốc rà soát hồ sơ và trình ký.", "muc_uu_tien": "bình thường", "so_ngay_de_xuat": 7}	{"ly_do": "Văn bản liên quan trực tiếp đến công tác tuyển dụng, bổ sung nhân sự và tổ chức cán bộ, đây là chức năng chính của Phòng Tổ chức Cán bộ Lao động trong việc tham mưu, tổng hợp hồ sơ và trình lãnh đạo phê duyệt.", "phong_ban": "Phòng/Ban chức năng > Phòng Tổ chức Cán bộ Lao động", "diem_tin_cay": 0.95, "ten_hien_thi": "Phòng Tổ chức Cán bộ Lao động", "nguoi_xu_ly_de_xuat": null}	1	1	3	{"stored": true, "message": "Đã tạo document_id=1, 28 chunks, file: /mnt/data2tb/adcs/uploads/doc_1/att_1_TTr nhan su.pdf", "num_chunks": 28, "chunk_types": {"text": 6, "header": 20, "summary": 1, "key_point": 1}, "total_chars": 3381, "save_document": true}	22.358	t	\N	2026-04-19 08:29:37.745521+07	2026-04-19 08:30:01.207883+07	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	[]
\.


--
-- TOC entry 5242 (class 0 OID 45448)
-- Dependencies: 228
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, document_id, bot_id, to_user_id, status, sent_at, delivered_at) FROM stdin;
\.


--
-- TOC entry 5235 (class 0 OID 36876)
-- Dependencies: 221
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (permission_id, code, description) FROM stdin;
3fbf5bf7-88aa-4a8b-a4b2-2793667f779e	user.create	Tạo user
2cee474b-9ee0-469e-b95d-00c76f77e728	user.update	Cập nhật user
f58cf2f6-813c-4222-bd48-b55cceba5690	user.delete	Xóa user
e29b827f-00be-4ce4-a005-083f2f461e20	department.create	Tạo phòng ban
54763560-d0dd-46c2-b1d1-2f09c0dd3875	department.update	Cập nhật phòng ban
55af2541-c6cd-4f95-a436-dfbcffd75816	department.delete	Xóa phòng ban
814199af-2aab-43bd-ad31-68752e5e2703	role.create	Tạo role
4b5aabc0-62d9-460d-be12-a5de59a95921	role.update	Cập nhật role
039b9d09-f14b-4086-bf88-6af6096875da	role.delete	Xóa role
a05572c2-b7c5-4927-83fe-377608579732	file.create	Tạo file
3211425b-ecb5-4285-89a7-83f7beb6fbdf	file.update	Cập nhật file
62732862-4006-4c2b-9e71-1df9d1746a4e	file.delete	Xóa file
\.


--
-- TOC entry 5236 (class 0 OID 36886)
-- Dependencies: 222
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
4d72e024-9343-4474-bd07-6ac5cebf3243	3fbf5bf7-88aa-4a8b-a4b2-2793667f779e
4d72e024-9343-4474-bd07-6ac5cebf3243	2cee474b-9ee0-469e-b95d-00c76f77e728
4d72e024-9343-4474-bd07-6ac5cebf3243	f58cf2f6-813c-4222-bd48-b55cceba5690
4d72e024-9343-4474-bd07-6ac5cebf3243	e29b827f-00be-4ce4-a005-083f2f461e20
4d72e024-9343-4474-bd07-6ac5cebf3243	54763560-d0dd-46c2-b1d1-2f09c0dd3875
4d72e024-9343-4474-bd07-6ac5cebf3243	55af2541-c6cd-4f95-a436-dfbcffd75816
4d72e024-9343-4474-bd07-6ac5cebf3243	814199af-2aab-43bd-ad31-68752e5e2703
4d72e024-9343-4474-bd07-6ac5cebf3243	4b5aabc0-62d9-460d-be12-a5de59a95921
4d72e024-9343-4474-bd07-6ac5cebf3243	039b9d09-f14b-4086-bf88-6af6096875da
4d72e024-9343-4474-bd07-6ac5cebf3243	a05572c2-b7c5-4927-83fe-377608579732
4d72e024-9343-4474-bd07-6ac5cebf3243	3211425b-ecb5-4285-89a7-83f7beb6fbdf
4d72e024-9343-4474-bd07-6ac5cebf3243	62732862-4006-4c2b-9e71-1df9d1746a4e
6a449204-dc9c-4e3c-8ad9-46ebbb2c8783	3211425b-ecb5-4285-89a7-83f7beb6fbdf
6a449204-dc9c-4e3c-8ad9-46ebbb2c8783	62732862-4006-4c2b-9e71-1df9d1746a4e
\.


--
-- TOC entry 5234 (class 0 OID 36865)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, name, description, created_at) FROM stdin;
4d72e024-9343-4474-bd07-6ac5cebf3243	admin	Quản trị hệ thống	2026-03-27 14:10:40.554724+07
6a449204-dc9c-4e3c-8ad9-46ebbb2c8783	user	Người dùng thường	2026-03-27 14:10:40.554724+07
\.


--
-- TOC entry 5240 (class 0 OID 37129)
-- Dependencies: 226
-- Data for Name: system_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_parameters (param_key, param_value, description, updated_at) FROM stdin;
\.


--
-- TOC entry 5238 (class 0 OID 37047)
-- Dependencies: 224
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (tag_id, name, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5237 (class 0 OID 36910)
-- Dependencies: 223
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, display_name, password_hash, auth_provider, department_id, role_id, phone, is_active, created_at, last_login_at, telegram_chat_id) FROM stdin;
05657dbd-ceb8-4979-8cd5-d152e76c3db1	Nguyễn Vinh Hiển	hiennv@ptit.edu.vn	\N	$bcrypt-sha256$v=2,t=2b,r=12$BNuoaU5C1iEI6frcJ8wUc.$Rt.6UTQrrVZZc6d9ErnYl7oGE.5sdxK	local	a403a4b1-0bb5-41cb-9dab-ada7e217f038	4d72e024-9343-4474-bd07-6ac5cebf3243	\N	t	2026-03-27 15:00:11.575929+07	\N	6733536444
\.


--
-- TOC entry 5069 (class 2606 OID 37105)
-- Name: bots bots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT bots_pkey PRIMARY KEY (bot_id);


--
-- TOC entry 5047 (class 2606 OID 36859)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 5073 (class 2606 OID 45437)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (document_id);


--
-- TOC entry 5075 (class 2606 OID 45455)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5053 (class 2606 OID 36885)
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- TOC entry 5055 (class 2606 OID 36883)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- TOC entry 5057 (class 2606 OID 36890)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5049 (class 2606 OID 36875)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5051 (class 2606 OID 36873)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5071 (class 2606 OID 37136)
-- Name: system_parameters system_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT system_parameters_pkey PRIMARY KEY (param_key);


--
-- TOC entry 5065 (class 2606 OID 37057)
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- TOC entry 5067 (class 2606 OID 37055)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 5059 (class 2606 OID 36924)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5061 (class 2606 OID 36920)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5063 (class 2606 OID 36922)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5076 (class 2606 OID 36860)
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(department_id);


--
-- TOC entry 5082 (class 2606 OID 45438)
-- Name: documents documents_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5083 (class 2606 OID 45443)
-- Name: documents documents_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5084 (class 2606 OID 45471)
-- Name: documents documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(user_id) NOT VALID;


--
-- TOC entry 5085 (class 2606 OID 45461)
-- Name: notifications notifications_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(bot_id) ON DELETE SET NULL;


--
-- TOC entry 5086 (class 2606 OID 45456)
-- Name: notifications notifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE SET NULL;


--
-- TOC entry 5087 (class 2606 OID 45466)
-- Name: notifications notifications_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5077 (class 2606 OID 36896)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- TOC entry 5078 (class 2606 OID 36891)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 5081 (class 2606 OID 37058)
-- Name: tags tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5079 (class 2606 OID 36925)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5080 (class 2606 OID 36930)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE SET NULL;


-- Completed on 2026-04-19 18:31:41

--
-- PostgreSQL database dump complete
--

