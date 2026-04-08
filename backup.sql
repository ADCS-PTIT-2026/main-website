--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
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
-- Name: classification_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classification_results (
    classification_id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    predicted_label_id uuid,
    score real,
    model_version text,
    classified_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.classification_results OWNER TO postgres;

--
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
-- Name: document_files; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_files (
    file_id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    file_name text,
    file_path text,
    mime_type text,
    size_bytes bigint,
    page_count integer,
    checksum text,
    ocr_status character varying(50),
    ocr_text text,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.document_files OWNER TO postgres;

--
-- Name: document_routing_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_routing_history (
    history_id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid,
    from_department_id uuid,
    to_department_id uuid,
    from_user_id uuid,
    to_user_id uuid,
    action text,
    comment text,
    action_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.document_routing_history OWNER TO postgres;

--
-- Name: document_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_tags (
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


ALTER TABLE public.document_tags OWNER TO postgres;

--
-- Name: document_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_types (
    document_type_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.document_types OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    document_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid,
    document_type_id uuid,
    assigned_department_id uuid,
    assigned_user_id uuid,
    so_den character varying(255),
    so_ky_hieu character varying(255),
    trich_yeu text,
    hinh_thuc character varying(100),
    loai_van_ban_text character varying(100),
    muc character varying(100),
    do_khan character varying(50),
    do_mat character varying(50),
    don_vi_ban_hanh text,
    ngay_van_ban date,
    ngay_den timestamp with time zone,
    ngay_het_han date,
    vai_tro character varying(100),
    status text,
    priority smallint DEFAULT 0,
    confidence real,
    summary text,
    is_chua_doc boolean DEFAULT true,
    thong_tin_ky_so jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    nguoi_ky text,
    chuc_vu_nguoi_ky text,
    noi_nhan text[],
    can_cu_phap_ly text[],
    yeu_cau_han_dong text,
    key_points text[],
    muc_tin_cay text,
    de_xuat_xu_ly jsonb,
    goi_y_phong_ban jsonb,
    tong_so_chunk integer,
    processing_time real
);


ALTER TABLE public.documents OWNER TO postgres;

--
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
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    permission_id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    description text
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
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
-- Name: sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sources (
    source_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    config jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sources OWNER TO postgres;

--
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
    last_login_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: bots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bots (bot_id, name, token, channel_type, created_at) FROM stdin;
\.


--
-- Data for Name: classification_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classification_results (classification_id, document_id, predicted_label_id, score, model_version, classified_at) FROM stdin;
\.


--
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
-- Data for Name: document_files; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_files (file_id, document_id, file_name, file_path, mime_type, size_bytes, page_count, checksum, ocr_status, ocr_text, uploaded_by, uploaded_at) FROM stdin;
4760b9b2-1a02-4f0c-8ffc-74acb5b9522c	0534e39f-04a4-4d05-964f-6fd66efb20c8	441e4d29-58fb-4ee8-81e8-caa54183787c.pdf	uploads\\441e4d29-58fb-4ee8-81e8-caa54183787c.pdf	\N	2671960	\N	\N	Processing	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	2026-03-27 18:16:58.706862+07
ef073f0f-2a74-4b37-89fe-1d4d960bb00b	ebab0a1f-160d-4975-ba7f-58f927f15b58	d61d2e6f-d657-4278-94cb-bf3bbd978b06.pdf	uploads\\d61d2e6f-d657-4278-94cb-bf3bbd978b06.pdf	\N	2671960	\N	\N	Processing	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	2026-03-27 22:35:31.083713+07
72fed1b9-e7ae-446f-a8cc-91f45a0b6b3d	c7196511-96ed-4055-945a-5a29dc21dab8	9c8d7cf4-3209-4889-8aaf-6fe78a0eb224.pdf	uploads\\9c8d7cf4-3209-4889-8aaf-6fe78a0eb224.pdf	\N	2671960	\N	\N	Processing	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	2026-03-28 08:07:59.883256+07
0224b3c0-2c65-44ed-92b7-fea553781d4f	681a18ee-766b-4d34-a333-37162d07963b	76db38fd-5e47-40c4-9826-bebcc58cfa87.pdf	uploads\\76db38fd-5e47-40c4-9826-bebcc58cfa87.pdf	\N	2671960	\N	\N	Processing	\N	05657dbd-ceb8-4979-8cd5-d152e76c3db1	2026-03-28 09:40:43.891473+07
\.


--
-- Data for Name: document_routing_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_routing_history (history_id, document_id, from_department_id, to_department_id, from_user_id, to_user_id, action, comment, action_at) FROM stdin;
\.


--
-- Data for Name: document_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_tags (document_id, tag_id) FROM stdin;
\.


--
-- Data for Name: document_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_types (document_type_id, name, description) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (document_id, source_id, document_type_id, assigned_department_id, assigned_user_id, so_den, so_ky_hieu, trich_yeu, hinh_thuc, loai_van_ban_text, muc, do_khan, do_mat, don_vi_ban_hanh, ngay_van_ban, ngay_den, ngay_het_han, vai_tro, status, priority, confidence, summary, is_chua_doc, thong_tin_ky_so, created_at, updated_at, deleted_at, nguoi_ky, chuc_vu_nguoi_ky, noi_nhan, can_cu_phap_ly, yeu_cau_han_dong, key_points, muc_tin_cay, de_xuat_xu_ly, goi_y_phong_ban, tong_so_chunk, processing_time) FROM stdin;
56d01d22-803b-4525-86a5-4e941d7a859a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-24 16:48:49.270994+07	2026-03-24 16:48:49.270994+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7424aec2-9cd7-4609-af7e-3f007c1569ff	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-24 16:49:39.243759+07	2026-03-24 16:49:39.243759+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0534e39f-04a4-4d05-964f-6fd66efb20c8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-27 18:16:58.682052+07	2026-03-27 18:16:58.682052+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ebab0a1f-160d-4975-ba7f-58f927f15b58	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-27 22:35:31.063952+07	2026-03-27 22:35:31.063952+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c7196511-96ed-4055-945a-5a29dc21dab8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-28 08:07:59.853282+07	2026-03-28 08:07:59.853282+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
681a18ee-766b-4d34-a333-37162d07963b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-28 09:40:43.863275+07	2026-03-28 09:40:43.863275+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
121a1f6f-845f-464c-ba2b-15ec3cc25210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	pending	0	\N	\N	t	\N	2026-03-31 14:12:54.049307+07	2026-03-31 14:12:54.049307+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bff5fc80-ed86-4b64-8f94-0582233743fa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	failed	0	\N	\N	t	\N	2026-03-31 14:14:30.007051+07	2026-03-31 14:14:30.03233+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ce99fd1e-72bc-4ea4-bd0b-d7e916b4c890	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	failed	0	\N	\N	t	\N	2026-03-31 14:15:08.188476+07	2026-03-31 14:15:08.215198+07	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, document_id, bot_id, to_user_id, status, sent_at, delivered_at) FROM stdin;
\.


--
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
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, name, description, created_at) FROM stdin;
4d72e024-9343-4474-bd07-6ac5cebf3243	admin	Quản trị hệ thống	2026-03-27 14:10:40.554724+07
6a449204-dc9c-4e3c-8ad9-46ebbb2c8783	user	Người dùng thường	2026-03-27 14:10:40.554724+07
\.


--
-- Data for Name: sources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sources (source_id, name, type, config, created_at) FROM stdin;
\.


--
-- Data for Name: system_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_parameters (param_key, param_value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (tag_id, name, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, display_name, password_hash, auth_provider, department_id, role_id, phone, is_active, created_at, last_login_at) FROM stdin;
05657dbd-ceb8-4979-8cd5-d152e76c3db1	Nguyễn Vinh Hiển	hiennv@ptit.edu.vn	\N	$bcrypt-sha256$v=2,t=2b,r=12$BNuoaU5C1iEI6frcJ8wUc.$Rt.6UTQrrVZZc6d9ErnYl7oGE.5sdxK	local	a403a4b1-0bb5-41cb-9dab-ada7e217f038	4d72e024-9343-4474-bd07-6ac5cebf3243	\N	t	2026-03-27 15:00:11.575929+07	\N
38a15d56-8856-4cd2-a40b-f1729360929b	Trần Vũ Nhật Mai	mai@ptit.edu.vn	\N	$bcrypt-sha256$v=2,t=2b,r=12$8rRDnScs09yN5kTBHOZpL.$TNHAEIg3Jh7Ro.OmfvHN7BepoqvZBvi	local	\N	\N	\N	t	2026-03-27 18:20:54.566581+07	\N
\.


--
-- Name: bots bots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT bots_pkey PRIMARY KEY (bot_id);


--
-- Name: classification_results classification_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classification_results
    ADD CONSTRAINT classification_results_pkey PRIMARY KEY (classification_id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: document_files document_files_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_files
    ADD CONSTRAINT document_files_pkey PRIMARY KEY (file_id);


--
-- Name: document_routing_history document_routing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_routing_history
    ADD CONSTRAINT document_routing_history_pkey PRIMARY KEY (history_id);


--
-- Name: document_tags document_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_pkey PRIMARY KEY (document_id, tag_id);


--
-- Name: document_types document_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_types
    ADD CONSTRAINT document_types_pkey PRIMARY KEY (document_type_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (document_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (source_id);


--
-- Name: system_parameters system_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT system_parameters_pkey PRIMARY KEY (param_key);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_documents_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_search ON public.documents USING btree (so_den, so_ky_hieu);


--
-- Name: idx_routing_doc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_routing_doc ON public.document_routing_history USING btree (document_id);


--
-- Name: classification_results classification_results_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classification_results
    ADD CONSTRAINT classification_results_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;


--
-- Name: classification_results classification_results_predicted_label_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classification_results
    ADD CONSTRAINT classification_results_predicted_label_id_fkey FOREIGN KEY (predicted_label_id) REFERENCES public.document_types(document_type_id);


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(department_id);


--
-- Name: document_files document_files_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_files
    ADD CONSTRAINT document_files_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;


--
-- Name: document_files document_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_files
    ADD CONSTRAINT document_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: document_routing_history document_routing_history_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_routing_history
    ADD CONSTRAINT document_routing_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;


--
-- Name: document_routing_history document_routing_history_from_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_routing_history
    ADD CONSTRAINT document_routing_history_from_department_id_fkey FOREIGN KEY (from_department_id) REFERENCES public.departments(department_id);


--
-- Name: document_routing_history document_routing_history_from_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_routing_history
    ADD CONSTRAINT document_routing_history_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(user_id);


--
-- Name: document_routing_history document_routing_history_to_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_routing_history
    ADD CONSTRAINT document_routing_history_to_department_id_fkey FOREIGN KEY (to_department_id) REFERENCES public.departments(department_id);


--
-- Name: document_routing_history document_routing_history_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_routing_history
    ADD CONSTRAINT document_routing_history_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id);


--
-- Name: document_tags document_tags_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE CASCADE;


--
-- Name: document_tags document_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_tags
    ADD CONSTRAINT document_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


--
-- Name: documents documents_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: documents documents_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: documents documents_document_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_document_type_id_fkey FOREIGN KEY (document_type_id) REFERENCES public.document_types(document_type_id) ON DELETE SET NULL;


--
-- Name: documents documents_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id) ON DELETE SET NULL;


--
-- Name: notifications notifications_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(bot_id) ON DELETE SET NULL;


--
-- Name: notifications notifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE SET NULL;


--
-- Name: notifications notifications_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: tags tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

