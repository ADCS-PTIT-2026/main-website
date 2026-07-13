--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2026-06-17 09:56:09

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
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

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
    description text,
    created_at timestamp with time zone DEFAULT now(),
    id integer NOT NULL,
    parent_id integer,
    ten_viet_tat text,
    ten_hien_thi text,
    loai_don_vi text,
    cap_don_vi text,
    level_number integer,
    is_formal boolean,
    has_seal boolean,
    parent_name text,
    child_count integer,
    name text,
    code text,
    CONSTRAINT chk_no_self_parent CHECK (((parent_id IS NULL) OR (parent_id <> id)))
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
    related_documents jsonb,
    title text
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 70164)
-- Name: human_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.human_resources (
    human_resource_id uuid DEFAULT gen_random_uuid() NOT NULL,
    id integer NOT NULL,
    name text NOT NULL,
    login text,
    email text,
    ma_can_bo text,
    ten_hien_thi text,
    chuc_danh text,
    oauth_uid text,
    is_role_qlvb boolean DEFAULT false,
    active boolean DEFAULT true,
    department_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.human_resources OWNER TO postgres;

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
-- TOC entry 230 (class 1259 OID 78199)
-- Name: translation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.translation_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying(255) NOT NULL,
    file_type character varying(50) NOT NULL,
    file_hash character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    comment text,
    source_language character varying(50) DEFAULT 'vi'::character varying,
    target_language character varying(50) DEFAULT 'en'::character varying,
    result_file_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public.translation_logs OWNER TO postgres;

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
-- TOC entry 5269 (class 0 OID 37097)
-- Dependencies: 225
-- Data for Name: bots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bots (bot_id, name, token, channel_type, created_at) FROM stdin;
5b313ece-9380-4f82-a33f-4a873d4b6cf7	ptit_adcs_bot	8712790689:AAE-cSEzuC4U2saVtExjCaSk2yKYnk9kmvA	telegram	2026-04-06 13:45:04.060849+07
\.


--
-- TOC entry 5263 (class 0 OID 36850)
-- Dependencies: 219
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, description, created_at, id, parent_id, ten_viet_tat, ten_hien_thi, loai_don_vi, cap_don_vi, level_number, is_formal, has_seal, parent_name, child_count, name, code) FROM stdin;
d4fb9ec9-2e96-45a6-814c-c67d05077ae3	\N	2026-06-13 17:02:58.26552+07	42	\N		HVBC - Học viện			1	t	t		3	Học viện	HVBC
cb8668f7-4286-4ccf-8712-9ce68925e124	\N	2026-06-13 17:02:58.26552+07	76	\N		VKH2 - Cơ sở 2 tại Thành phố Hồ Chí Minh			1	t	f		0	Cơ sở 2 tại Thành phố Hồ Chí Minh	VKH2
205a7295-a802-415b-867b-0a9a299b22b4	\N	2026-06-13 17:02:58.26552+07	43	40		BGD1 - Lãnh đạo Học viện			2	t	f	HBVH - Học viện - Bắc	0	Lãnh đạo Học viện	BGD1
cc3d7844-f1e2-4e28-b094-ff9bbce2fd0b	\N	2026-06-13 17:02:58.26552+07	44	39		BGD2 - Lãnh đạo Học viện			2	t	f	HBVS - Học viện - Nam	0	Lãnh đạo Học viện	BGD2
76854513-2be8-4eb4-bc3c-4ae67b918411	\N	2026-06-13 17:02:58.26552+07	40	42		HBVH - Học viện - Bắc			2	f	f	HVBC - Học viện	6	Học viện - Bắc	HBVH
59987f8e-7371-4bc6-a6e1-8235762af71f	\N	2026-06-13 17:02:58.26552+07	39	42		HBVS - Học viện - Nam			2	f	f	HVBC - Học viện	5	Học viện - Nam	HBVS
5bab1435-8dd9-4e88-a334-09fa179081aa	\N	2026-06-13 17:02:58.26552+07	38	42		HDHV - Hội đồng Học viện			2	t	f	HVBC - Học viện	0	Hội đồng Học viện	HDHV
8fdc52bc-0a78-479d-bd4c-58b42ada61ff	\N	2026-06-13 17:02:58.26552+07	77	78		KAT1 - Khoa An toàn thông tin			2	t	f	KHOA1 - Các khoa phía bắc	3	Khoa An toàn thông tin	KAT1
90fce7f3-1758-4a6b-9cbc-a4b1ef50f718	\N	2026-06-13 17:02:58.26552+07	23	78		KCB1 - Khoa Cơ bản 1			2	t	f	KHOA1 - Các khoa phía bắc	6	Khoa Cơ bản 1	KCB1
c191eb45-e110-44d0-bfb4-31d3ad563635	\N	2026-06-13 17:02:58.26552+07	11	82		KCB2 - Khoa Cơ bản 2			2	t	f	KHOA2 - Các khoa phía Nam	5	Khoa Cơ bản 2	KCB2
d68f89c8-eef6-4f00-ab8c-5d4ba4b63b74	\N	2026-06-13 17:02:58.26552+07	22	78		KCN1 - Khoa Công nghệ thông tin 1			2	t	f	KHOA1 - Các khoa phía bắc	4	Khoa Công nghệ thông tin 1	KCN1
7a2e88bc-1ebb-4e04-adfd-c81c731f8192	\N	2026-06-13 17:02:58.26552+07	10	82		KCN2 - Khoa Công nghệ thông tin 2			2	t	f	KHOA2 - Các khoa phía Nam	10	Khoa Công nghệ thông tin 2	KCN2
904b150d-13e5-487d-8169-fd484adde28c	\N	2026-06-13 17:02:58.26552+07	18	78		KDP1 - Khoa Đa phương tiện			2	t	f	KHOA1 - Các khoa phía bắc	5	Khoa Đa phương tiện	KDP1
d47bec64-2bcb-4290-84e7-6f20f25da95f	\N	2026-06-13 17:02:58.26552+07	24	78		KDT1 - Khoa Kỹ thuật điện tử 1			2	t	f	KHOA1 - Các khoa phía bắc	4	Khoa Kỹ thuật điện tử 1	KDT1
acb72a4c-dafa-4217-bb41-2c5b2f766a0d	\N	2026-06-13 17:02:58.26552+07	9	82		KDT2 - Khoa Kỹ thuật điện tử 2			2	t	f	KHOA2 - Các khoa phía Nam	5	Khoa Kỹ thuật điện tử 2	KDT2
e3a2d8ac-0513-40d7-958b-c611e0bb7b80	\N	2026-06-13 17:02:58.26552+07	41	78		KHCN - Khoa học công nghệ			2	t	f	KHOA1 - Các khoa phía bắc	0	Khoa học công nghệ	KHCN
9c55deaa-3ab2-458e-88ed-b601b36772c2	\N	2026-06-13 17:02:58.26552+07	78	40		KHOA1 - Các khoa phía bắc			2	f	f	HBVH - Học viện - Bắc	11	Các khoa phía bắc	KHOA1
ebd725ef-acca-4b93-b08c-c38610047c43	\N	2026-06-13 17:02:58.26552+07	82	39		KHOA2 - Các khoa phía Nam			2	f	f	HBVS - Học viện - Nam	5	Các khoa phía Nam	KHOA2
875ab35b-a39a-4761-9b8f-06e4ebc2ecb5	\N	2026-06-13 17:02:58.26552+07	19	78		KQT1 - Khoa Quản trị kinh doanh 1			2	t	f	KHOA1 - Các khoa phía bắc	4	Khoa Quản trị kinh doanh 1	KQT1
85e3c882-079b-4c1c-a66d-8f56a97b1df1	\N	2026-06-13 17:02:58.26552+07	8	82		KQT2 - Khoa Quản trị kinh doanh 2			2	t	f	KHOA2 - Các khoa phía Nam	4	Khoa Quản trị kinh doanh 2	KQT2
6c02f78b-374b-4cf8-b416-510ee1acaca3	\N	2026-06-13 17:02:58.26552+07	25	78		KSD1 - Khoa Đào tạo Sau đại học			2	t	f	KHOA1 - Các khoa phía bắc	0	Khoa Đào tạo Sau đại học	KSD1
23bf3738-3368-4adf-8f70-d56aa4877e95	\N	2026-06-13 17:02:58.26552+07	20	78		KTC1 - Khoa Tài chính kế toán 1			2	t	f	KHOA1 - Các khoa phía bắc	4	Khoa Tài chính kế toán 1	KTC1
b2d3e01c-dd48-4c06-91b2-574a4ab5834f	\N	2026-06-13 17:02:58.26552+07	240	78		KTN1 - Khoa Trí tuệ nhân tạo			2	t	f	KHOA1 - Các khoa phía bắc	3	Khoa Trí tuệ nhân tạo	KTN1
e70d3d1b-a96c-4f1d-91ea-8b790223c051	\N	2026-06-13 17:02:58.26552+07	21	78		KVT1 - Khoa Viễn thông 1			2	t	f	KHOA1 - Các khoa phía bắc	6	Khoa Viễn thông 1	KVT1
14c1b281-8caf-482b-9c4a-71fc419d0a8f	\N	2026-06-13 17:02:58.26552+07	7	82		KVT2 - Khoa Viễn thông 2			2	t	f	KHOA2 - Các khoa phía Nam	4	Khoa Viễn thông 2	KVT2
7b78cf67-7cc4-436a-95fc-a249a24f5a5b	\N	2026-06-13 17:02:58.26552+07	34	81		PDT1 - Phòng Đào tạo			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Đào tạo	PDT1
e6911212-b626-4fcc-9be3-1c9ea1a1b59d	\N	2026-06-13 17:02:58.26552+07	15	84		PDT2 - Phòng Đào tạo và Khoa học công nghệ			2	t	f	PHONG2 - Các phòng phía Nam	0	Phòng Đào tạo và Khoa học công nghệ	PDT2
68bf09d8-d88f-45aa-83a8-d641c5874b49	\N	2026-06-13 17:02:58.26552+07	30	81		PGV1 - Phòng Giáo vụ			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Giáo vụ	PGV1
ad594c4f-0cf4-4676-ba5f-72b511cea57f	\N	2026-06-13 17:02:58.26552+07	14	84		PGV2 - Phòng Giáo vụ			2	t	f	PHONG2 - Các phòng phía Nam	0	Phòng Giáo vụ	PGV2
56e527c9-9831-4a47-8d7e-31f03978fb9d	\N	2026-06-13 17:02:58.26552+07	81	40		PHONG1 - Các phòng phía Bắc			2	f	f	HBVH - Học viện - Bắc	10	Các phòng phía Bắc	PHONG1
c189d087-321c-4b41-941e-5a77c2b8df46	\N	2026-06-13 17:02:58.26552+07	84	39		PHONG2 - Các phòng phía Nam			2	f	f	HBVS - Học viện - Nam	7	Các phòng phía Nam	PHONG2
30143347-6d59-44ba-a828-bb7ecfff7d99	\N	2026-06-13 17:02:58.26552+07	31	81		PKH1 - Phòng Kế hoạch - Đầu tư			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Kế hoạch - Đầu tư	PKH1
459bcbc5-b063-44a4-90a7-0be49341a6c8	\N	2026-06-13 17:02:58.26552+07	32	81		PKT1 - Phòng Tài chính - Kế toán			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Tài chính - Kế toán	PKT1
7d53e6d5-d2ef-4f6f-a9b1-672712036be7	\N	2026-06-13 17:02:58.26552+07	16	84		PKT2 - Phòng Kinh tế Tài chính			2	t	f	PHONG2 - Các phòng phía Nam	0	Phòng Kinh tế Tài chính	PKT2
c998e95e-ff2f-4f8e-958e-3c26f3238c58	\N	2026-06-13 17:02:58.26552+07	33	81		PQL1 - Phòng Quản lý Khoa học công nghệ và Hợp tác quốc tế			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Quản lý Khoa học công nghệ và Hợp tác quốc tế	PQL1
af151162-b94d-466a-8eb5-3f584f5b23e5	\N	2026-06-13 17:02:58.26552+07	35	81		PSV1 - Phòng Chính trị và Công tác sinh viên			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Chính trị và Công tác sinh viên	PSV1
214dc787-7853-4cb2-91f0-6643dacc6f31	\N	2026-06-13 17:02:58.26552+07	13	84		PSV2 - Phòng Công tác Sinh viên			2	t	f	PHONG2 - Các phòng phía Nam	0	Phòng Công tác Sinh viên	PSV2
388e662c-f67e-45c6-9107-8710dd1ff1ad	\N	2026-06-13 17:02:58.26552+07	36	81		PTC1 - Phòng Tổ chức cán bộ - Lao động			2	t	f	PHONG1 - Các phòng phía Bắc	0	Phòng Tổ chức cán bộ - Lao động	PTC1
96483e35-9dd0-45ee-be90-68b9a79c34de	\N	2026-06-13 17:02:58.26552+07	17	84		PTC2 - Phòng Tổ chức Hành chính			2	t	f	PHONG2 - Các phòng phía Nam	0	Phòng Tổ chức Hành chính	PTC2
0244937d-3dd7-4114-b861-2af247ac13cc	\N	2026-06-13 17:02:58.26552+07	239	84		PTH2 - Phòng Tổ chức - Hành chính - Quản trị			2	t	f	PHONG2 - Các phòng phía Nam	4	Phòng Tổ chức - Hành chính - Quản trị	PTH2
8b8044f1-c2f3-4f63-b7c8-5d1b3d47f1fd	\N	2026-06-13 17:02:58.26552+07	255	80		TDM1 - Trung tâm Đổi mới sáng tạo và Khởi nghiệp			2	t	f	TT1 - Các trung tâm phía Bắc	0	Trung tâm Đổi mới sáng tạo và Khởi nghiệp	TDM1
9f577f08-0d57-40d0-b0cc-bb1aeb531d06	\N	2026-06-13 17:02:58.26552+07	2	80		TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông			2	t	t	TT1 - Các trung tâm phía Bắc	7	Trung tâm Đào tạo Bưu chính Viễn thông	TDT1
76d5c3ae-c3d8-4481-aae5-be5e270d4159	\N	2026-06-13 17:02:58.26552+07	26	80		TDV1 - Trung tâm Dịch vụ			2	t	f	TT1 - Các trung tâm phía Bắc	4	Trung tâm Dịch vụ	TDV1
68e5435f-9d5e-4e43-a9ca-e24ce388f8b0	\N	2026-06-13 17:02:58.26552+07	29	81		TKT1 - Trung tâm Khảo thí và Đảm bảo chất lượng giáo dục			2	t	f	PHONG1 - Các phòng phía Bắc	0	Trung tâm Khảo thí và Đảm bảo chất lượng giáo dục	TKT1
08e3a428-753b-4194-9a8f-d8e73fef0443	\N	2026-06-13 17:02:58.26552+07	12	84		TKT2 - Trung tâm Khảo thí và Đảm bảo chất lượng giáo dục			2	t	f	PHONG2 - Các phòng phía Nam	0	Trung tâm Khảo thí và Đảm bảo chất lượng giáo dục	TKT2
af24256d-e278-4f61-9341-2e4a6213fb32	\N	2026-06-13 17:02:58.26552+07	27	80		TQT1 - Trung tâm Đào tạo Quốc tế			2	t	f	TT1 - Các trung tâm phía Bắc	0	Trung tâm Đào tạo Quốc tế	TQT1
de8d37d6-04c4-44bf-a524-e854c351e572	\N	2026-06-13 17:02:58.26552+07	80	40		TT1 - Các trung tâm phía Bắc			2	f	f	HBVH - Học viện - Bắc	4	Các trung tâm phía Bắc	TT1
bb71ef43-9a4d-46cc-903b-73175598a228	\N	2026-06-13 17:02:58.26552+07	83	39		TT2 - Các trung tâm phía Nam			2	t	f	HBVS - Học viện - Nam	1	Các trung tâm phía Nam	TT2
62021e5e-8aa8-4289-bfea-e0d7f981e96c	\N	2026-06-13 17:02:58.26552+07	28	81		TTN1 - Trung tâm Thí nghiệm - Thực hành			2	t	f	PHONG1 - Các phòng phía Bắc	0	Trung tâm Thí nghiệm - Thực hành	TTN1
94e4f87a-1675-46e3-bbe8-8a39470cd0e1	\N	2026-06-13 17:02:58.26552+07	3	79		VCN1 - Viện Công nghệ thông tin và Truyền thông			2	t	t	VIEN1 - Các viện	8	Viện Công nghệ thông tin và Truyền thông	VCN1
4a1edf6a-ac4c-4fab-afdd-2267f01b6f4e	\N	2026-06-13 17:02:58.26552+07	238	39		VCN2 - Viện Công nghệ thông tin và Truyền thông 2			2	t	f	HBVS - Học viện - Nam	0	Viện Công nghệ thông tin và Truyền thông 2	VCN2
5adf0bf8-64b2-4035-b59e-45306a62c6f2	\N	2026-06-13 17:02:58.26552+07	79	40		VIEN1 - Các viện			2	f	f	HBVH - Học viện - Bắc	3	Các viện	VIEN1
7374dd73-56e6-4c80-b7a5-3dd5e7f5ed3a	\N	2026-06-13 17:02:58.26552+07	91	79		VKH1 - Viện Khoa học Kỹ thuật Bưu điện			2	t	t	VIEN1 - Các viện	10	Viện Khoa học Kỹ thuật Bưu điện	VKH1
59f87c3a-5c47-4982-ad36-5a8ba8655a98	\N	2026-06-13 17:02:58.26552+07	4	79		VKT1 - Viện Kinh tế Bưu điện			2	t	t	VIEN1 - Các viện	8	Viện Kinh tế Bưu điện	VKT1
eeb10452-903d-4e64-a51c-9919a70a151e	\N	2026-06-13 17:02:58.26552+07	245	81		VLD1 - Viện Lãnh đạo, Quản trị và Quản lý Việt Nam			2	t	f	PHONG1 - Các phòng phía Bắc	0	Viện Lãnh đạo, Quản trị và Quản lý Việt Nam	VLD1
1d7422de-3c0d-45ce-8c5e-293653a7a11d	\N	2026-06-13 17:02:58.26552+07	37	40		VPH1 - Văn phòng Học viện			2	t	f	HBVH - Học viện - Bắc	0	Văn phòng Học viện	VPH1
3355d65f-c176-4ff5-b84b-a27e17af40a7	\N	2026-06-13 17:02:58.26552+07	187	10		CNDPT1 - Bộ môn Công nghệ Đa phương tiện			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Bộ môn Công nghệ Đa phương tiện	CNDPT1
66c1ea7a-89c6-4993-a725-e200e08e85a7	\N	2026-06-13 17:02:58.26552+07	188	10		CNPM1 - Bộ môn Công nghệ phần mềm			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Bộ môn Công nghệ phần mềm	CNPM1
543b2a27-f221-456b-b21c-ba26718ad532	\N	2026-06-13 17:02:58.26552+07	257	91		CTKV - Lab Công nghệ truyền thông không gian và vũ trụ			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Lab Công nghệ truyền thông không gian và vũ trụ	CTKV
ad30e77e-1a3d-4676-99e6-f7e5ec551f54	\N	2026-06-13 17:02:58.26552+07	218	77		KAT1-ATM - Bộ môn An toàn mạng			3	t	f	KAT1 - Khoa An toàn thông tin	0	Bộ môn An toàn mạng	KAT1-ATM
9faf14e9-665e-42af-8459-76376a88e5de	\N	2026-06-13 17:02:58.26552+07	219	77		KAT1-ATPM - Bộ môn An toàn phần mềm			3	t	f	KAT1 - Khoa An toàn thông tin	0	Bộ môn An toàn phần mềm	KAT1-ATPM
c7097719-7e01-47e5-b39b-181c63c309e6	\N	2026-06-13 17:02:58.26552+07	229	23		KCB1-CT - Bộ môn Lý luận Chính trị			3	t	f	KCB1 - Khoa Cơ bản 1	0	Bộ môn Lý luận Chính trị	KCB1-CT
41e2c470-7bab-4897-bc49-5e87322e96b8	\N	2026-06-13 17:02:58.26552+07	228	23		KCB1-GTQ - Bộ môn Giáo dục thể chất - Quốc phòng			3	t	f	KCB1 - Khoa Cơ bản 1	0	Bộ môn Giáo dục thể chất - Quốc phòng	KCB1-GTQ
e07c6bd9-6511-42d5-bc3e-90547658f50c	\N	2026-06-13 17:02:58.26552+07	231	23		KCB1-NN - Bộ môn Ngoại ngữ			3	t	f	KCB1 - Khoa Cơ bản 1	0	Bộ môn Ngoại ngữ	KCB1-NN
389cd2e2-ea4a-42c7-92a2-753a7f284a5c	\N	2026-06-13 17:02:58.26552+07	232	23		KCB1-TO - Bộ môn Toán			3	t	f	KCB1 - Khoa Cơ bản 1	0	Bộ môn Toán	KCB1-TO
e59b9dec-05fa-4903-85db-52d73ae40b60	\N	2026-06-13 17:02:58.26552+07	230	23		KCB1-VL - Bộ môn Vật lý			3	t	f	KCB1 - Khoa Cơ bản 1	0	Bộ môn Vật lý	KCB1-VL
e258a24f-4f54-4cc6-a0d0-ab22b7b04cd3	\N	2026-06-13 17:02:58.26552+07	192	11		KCB2-CGTQ - Bộ môn Chính trị - GDTC- QP			3	t	f	KCB2 - Khoa Cơ bản 2	0	Bộ môn Chính trị - GDTC- QP	KCB2-CGTQ
00d9eaf1-6583-4df0-a36d-6e53145b33a3	\N	2026-06-13 17:02:58.26552+07	194	11		KCB2-NN - Bộ môn Ngoại ngữ			3	t	f	KCB2 - Khoa Cơ bản 2	0	Bộ môn Ngoại ngữ	KCB2-NN
a2aca7a6-50c1-4dbd-8f9c-0553be053b05	\N	2026-06-13 17:02:58.26552+07	195	11		KCB2-TO - Bộ môn Toán			3	t	f	KCB2 - Khoa Cơ bản 2	0	Bộ môn Toán	KCB2-TO
abef43b9-57e2-43be-83da-11b65cac413b	\N	2026-06-13 17:02:58.26552+07	193	11		KCB2-VL - Bộ môn Vật lý			3	t	f	KCB2 - Khoa Cơ bản 2	0	Bộ môn Vật lý	KCB2-VL
0b1b0cf1-7d94-4c8f-ba2e-f9aba1ff6628	\N	2026-06-13 17:02:58.26552+07	223	22		KCN1-CNPM - Bộ môn Công nghệ phần mềm			3	t	f	KCN1 - Khoa Công nghệ thông tin 1	0	Bộ môn Công nghệ phần mềm	KCN1-CNPM
0542b9d2-2e38-4cf6-af4e-d5f7ec57598c	\N	2026-06-13 17:02:58.26552+07	222	22		KCN1-HTTT - Bộ môn Hệ thống thông tin			3	t	f	KCN1 - Khoa Công nghệ thông tin 1	0	Bộ môn Hệ thống thông tin	KCN1-HTTT
f4265cc3-b261-4f76-b0e6-a3e9cecec0e8	\N	2026-06-13 17:02:58.26552+07	221	22		KCN1-KHMT - Bộ môn Khoa học máy tính			3	t	f	KCN1 - Khoa Công nghệ thông tin 1	0	Bộ môn Khoa học máy tính	KCN1-KHMT
6d3ddc90-a4de-43f0-b7fa-9ccd791873c7	\N	2026-06-13 17:02:58.26552+07	189	10		KCN2-AT - Bộ môn An toàn thông tin			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Bộ môn An toàn thông tin	KCN2-AT
ec1337fc-72a5-4a65-8591-e7aa6df32132	\N	2026-06-13 17:02:58.26552+07	244	10		KCN2-KHMT - Bộ môn Khoa học máy tính			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Bộ môn Khoa học máy tính	KCN2-KHMT
edab8383-9b55-408e-9be0-083a803b3821	\N	2026-06-13 17:02:58.26552+07	190	10		KCN2-TM - Bộ môn Truyền thông và Mạng máy tính			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Bộ môn Truyền thông và Mạng máy tính	KCN2-TM
1cc2d63f-7170-4645-93b0-08c872d22b7f	\N	2026-06-13 17:02:58.26552+07	186	10		KCN2-ĐPT - Bộ môn Đa phương tiện			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Bộ môn Đa phương tiện	KCN2-ĐPT
e42bbe2c-c7ce-4b9e-a089-1e32fbaa2525	\N	2026-06-13 17:02:58.26552+07	199	18		KDP1-BC - Bộ môn Báo chí			3	t	f	KDP1 - Khoa Đa phương tiện	0	Bộ môn Báo chí	KDP1-BC
e8675de4-b17c-41b5-9a93-7bed1b036772	\N	2026-06-13 17:02:58.26552+07	200	18		KDP1-CN - Bộ môn Công nghệ Đa phương tiện			3	t	f	KDP1 - Khoa Đa phương tiện	0	Bộ môn Công nghệ Đa phương tiện	KDP1-CN
e7e10b77-6ee7-446d-a0d9-393b317c65e7	\N	2026-06-13 17:02:58.26552+07	198	18		KDP1-TK - Bộ môn Thiết kế Đa phương tiện			3	t	f	KDP1 - Khoa Đa phương tiện	0	Bộ môn Thiết kế Đa phương tiện	KDP1-TK
46a2b5d9-8bcd-4eea-8499-7760c88ab074	\N	2026-06-13 17:02:58.26552+07	201	18		KDP1-TT - Bộ môn Truyền thông Đa phương tiện			3	t	f	KDP1 - Khoa Đa phương tiện	0	Bộ môn Truyền thông Đa phương tiện	KDP1-TT
8735e851-a35c-4c39-a393-8f37e7e54802	\N	2026-06-13 17:02:58.26552+07	250	24		KDT1-DKTD - Bộ môn Điều khiển và Tự động hóa			3	t	f	KDT1 - Khoa Kỹ thuật điện tử 1	0	Bộ môn Điều khiển và Tự động hóa	KDT1-DKTD
0b7f1d06-f28c-41bb-b142-91438a947060	\N	2026-06-13 17:02:58.26552+07	226	24		KDT1-DTMT - Bộ môn Điện tử máy tính			3	t	f	KDT1 - Khoa Kỹ thuật điện tử 1	0	Bộ môn Điện tử máy tính	KDT1-DTMT
0601acdb-39d1-4892-99f6-cd13e984d69b	\N	2026-06-13 17:02:58.26552+07	225	24		KDT1-THTT - Bộ môn Xử lý tín hiệu và Truyền thông			3	t	f	KDT1 - Khoa Kỹ thuật điện tử 1	0	Bộ môn Xử lý tín hiệu và Truyền thông	KDT1-THTT
e567bc48-dd55-44e5-b660-0f6b025d2ec9	\N	2026-06-13 17:02:58.26552+07	180	9		KDT2-DKTD - Bộ môn Điều khiển tự động			3	t	f	KDT2 - Khoa Kỹ thuật điện tử 2	0	Bộ môn Điều khiển tự động	KDT2-DKTD
4417e44d-dcf3-4882-bdfd-5eafcc8d5579	\N	2026-06-13 17:02:58.26552+07	181	9		KDT2-DTMT - Bộ môn Điện tử máy tính			3	t	f	KDT2 - Khoa Kỹ thuật điện tử 2	0	Bộ môn Điện tử máy tính	KDT2-DTMT
d29b7a0d-f4c3-49a2-bf40-a1a5ad2206a9	\N	2026-06-13 17:02:58.26552+07	179	9		KDT2-THDT - Tổ thực hành điện tử			3	t	f	KDT2 - Khoa Kỹ thuật điện tử 2	0	Tổ thực hành điện tử	KDT2-THDT
360bd12d-092d-49d1-bb06-fb12e3583cae	\N	2026-06-13 17:02:58.26552+07	182	9		KDT2-THTT - Bộ môn Xử lý tín hiệu và Truyền thông			3	t	f	KDT2 - Khoa Kỹ thuật điện tử 2	0	Bộ môn Xử lý tín hiệu và Truyền thông	KDT2-THTT
65bec986-594e-4bcb-a13f-d8d832e4f402	\N	2026-06-13 17:02:58.26552+07	202	19		KPT - Không phân tổ			3	t	f	KQT1 - Khoa Quản trị kinh doanh 1	0	Không phân tổ	KPT
feedc10d-3b3b-4ebc-b0aa-7a194f4b8332	\N	2026-06-13 17:02:58.26552+07	205	19		KQT1-KT - Bộ môn Kinh tế			3	t	f	KQT1 - Khoa Quản trị kinh doanh 1	0	Bộ môn Kinh tế	KQT1-KT
cb1580fb-9ffc-4dee-9327-ab8085e27087	\N	2026-06-13 17:02:58.26552+07	204	19		KQT1-QT - Bộ môn Quản trị			3	t	f	KQT1 - Khoa Quản trị kinh doanh 1	0	Bộ môn Quản trị	KQT1-QT
7b6d71cc-b5a2-4d24-944e-1af91002b384	\N	2026-06-13 17:02:58.26552+07	177	8		KQT2-MAR - Bộ môn Marketing			3	t	f	KQT2 - Khoa Quản trị kinh doanh 2	0	Bộ môn Marketing	KQT2-MAR
5fc750a9-f020-48ef-a83b-0b9790e529f1	\N	2026-06-13 17:02:58.26552+07	175	8		KQT2-QT - Bộ môn Quản trị			3	t	f	KQT2 - Khoa Quản trị kinh doanh 2	0	Bộ môn Quản trị	KQT2-QT
341904bb-8ef7-41fa-a4fd-4cc9d61ba95c	\N	2026-06-13 17:02:58.26552+07	176	8		KQT2-TCKT - Bộ môn Tài chính - Kinh tế			3	t	f	KQT2 - Khoa Quản trị kinh doanh 2	0	Bộ môn Tài chính - Kinh tế	KQT2-TCKT
419086c7-cac4-423f-8904-0f6ba8db5869	\N	2026-06-13 17:02:58.26552+07	208	20		KTC1-KTKT - Bộ môn Kế toán - Kiểm toán			3	t	f	KTC1 - Khoa Tài chính kế toán 1	0	Bộ môn Kế toán - Kiểm toán	KTC1-KTKT
b80fbf33-66ce-4d0b-9900-1966c2ac17fa	\N	2026-06-13 17:02:58.26552+07	209	20		KTC1-TC - Bộ môn Tài chính			3	t	f	KTC1 - Khoa Tài chính kế toán 1	0	Bộ môn Tài chính	KTC1-TC
8d2a8604-793a-4b1c-b2d2-000c64ca153b	\N	2026-06-13 17:02:58.26552+07	253	240		KTN1-HM - Bộ môn Học máy			3	t	f	KTN1 - Khoa Trí tuệ nhân tạo	0	Bộ môn Học máy	KTN1-HM
3e988990-8a9d-4db7-803f-53c3bcfed037	\N	2026-06-13 17:02:58.26552+07	252	240		KTN1-TNU - Bộ môn Trí tuệ nhân tạo ứng dụng			3	t	f	KTN1 - Khoa Trí tuệ nhân tạo	0	Bộ môn Trí tuệ nhân tạo ứng dụng	KTN1-TNU
a9a97182-235f-4ef5-b24c-c796e80a0ff0	\N	2026-06-13 17:02:58.26552+07	212	21		KVT1-KTDL - Bộ môn Kỹ thuật Dữ liệu			3	t	f	KVT1 - Khoa Viễn thông 1	0	Bộ môn Kỹ thuật Dữ liệu	KVT1-KTDL
34272348-65a3-4b56-aeb4-e6660e3c80d6	\N	2026-06-13 17:02:58.26552+07	215	21		KVT1-MVT - Bộ môn Mạng viễn thông			3	t	f	KVT1 - Khoa Viễn thông 1	0	Bộ môn Mạng viễn thông	KVT1-MVT
e234a818-0ead-45ce-a074-a7a1460e3081	\N	2026-06-13 17:02:58.26552+07	213	21		KVT1-TH - Bộ môn Tín hiệu và Hệ thống			3	t	f	KVT1 - Khoa Viễn thông 1	0	Bộ môn Tín hiệu và Hệ thống	KVT1-TH
5a1a220b-9279-4a4a-b531-c89961176fd5	\N	2026-06-13 17:02:58.26552+07	214	21		KVT1-TTVT - Bộ môn Thông tin Vô tuyến			3	t	f	KVT1 - Khoa Viễn thông 1	0	Bộ môn Thông tin Vô tuyến	KVT1-TTVT
2c67f3a8-e6d0-41e4-abc2-482f5887fc1d	\N	2026-06-13 17:02:58.26552+07	173	7		KVT2-MVT - Bộ môn Mạng viễn thông			3	t	f	KVT2 - Khoa Viễn thông 2	0	Bộ môn Mạng viễn thông	KVT2-MVT
183af853-ccec-4258-96ce-87d6a1061c80	\N	2026-06-13 17:02:58.26552+07	171	7		KVT2-TTQ - Bộ môn Thông tin quang			3	t	f	KVT2 - Khoa Viễn thông 2	0	Bộ môn Thông tin quang	KVT2-TTQ
18e7c177-112f-4f1a-9dde-d10b94fdeea7	\N	2026-06-13 17:02:58.26552+07	172	7		KVT2-VT - Bộ môn Vô tuyến			3	t	f	KVT2 - Khoa Viễn thông 2	0	Bộ môn Vô tuyến	KVT2-VT
edc0b1b5-2978-44bd-8f75-6b92f840a610	\N	2026-06-13 17:02:58.26552+07	185	10		PTH - Phòng Thực hành			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Phòng Thực hành	PTH
d799ccd8-46fd-4ea4-aa77-127e442a36c8	\N	2026-06-13 17:02:58.26552+07	248	239		PTH2-BV - Tổ Bảo vệ			3	t	f	PTH2 - Phòng Tổ chức - Hành chính - Quản trị	0	Tổ Bảo vệ	PTH2-BV
26c1d1ac-27d2-4b37-a7da-c315f241e611	\N	2026-06-13 17:02:58.26552+07	247	239		PTH2-KT - Tổ Kỹ thuật			3	t	f	PTH2 - Phòng Tổ chức - Hành chính - Quản trị	0	Tổ Kỹ thuật	PTH2-KT
b32c1b57-1f31-470e-976a-b8ca737c8c1f	\N	2026-06-13 17:02:58.26552+07	249	239		PTH2-KTX - Tổ Quản lý ký túc xá			3	t	f	PTH2 - Phòng Tổ chức - Hành chính - Quản trị	0	Tổ Quản lý ký túc xá	PTH2-KTX
cce4dcff-1716-4022-83ca-30b91bfba579	\N	2026-06-13 17:02:58.26552+07	184	10		QLM - Quản lý mạng			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Quản lý mạng	QLM
c590c263-d0fd-4416-9c67-ff7b24fa14e5	\N	2026-06-13 17:02:58.26552+07	251	10		QLMPTH - Tổ quản lý mạng và phòng thực hành			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Tổ quản lý mạng và phòng thực hành	QLMPTH
cd71dbd0-10b3-4f80-9e5a-083bf7ae601f	\N	2026-06-13 17:02:58.26552+07	45	2		TDT1-BGD - Ban Giám đốc			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	0	Ban Giám đốc	TDT1-BGD
7eb0186a-40a9-489f-ae06-40a81e5f1615	\N	2026-06-13 17:02:58.26552+07	48	2		TDT1-DTDN - Phòng Đào tạo doanh nghiệp			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	0	Phòng Đào tạo doanh nghiệp	TDT1-DTDN
d94dcc81-58c5-407b-99aa-5898b1a6ee99	\N	2026-06-13 17:02:58.26552+07	47	2		TDT1-DTHN - Phòng Đào tạo hướng nghiệp			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	0	Phòng Đào tạo hướng nghiệp	TDT1-DTHN
39609803-c0de-413b-b0e3-03fe41f5d372	\N	2026-06-13 17:02:58.26552+07	246	2		TDT1-QDDB - Ban Quản lý các dự án đào tạo bồi dưỡng			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	0	Ban Quản lý các dự án đào tạo bồi dưỡng	TDT1-QDDB
0bc13da0-03d0-4b77-9215-1e12f837e8f1	\N	2026-06-13 17:02:58.26552+07	46	2		TDT1-TH - Phòng Tổng hợp			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	0	Phòng Tổng hợp	TDT1-TH
2e1f8e1f-831e-4e74-bee8-a8ecad1355d4	\N	2026-06-13 17:02:58.26552+07	49	2		TDT1-XDCT - Phòng Xây dựng chương trình			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	0	Phòng Xây dựng chương trình	TDT1-XDCT
0bc3d46f-af13-470f-a488-32383b6acd7f	\N	2026-06-13 17:02:58.26552+07	1	2		TDT2 - Cơ sở TT ĐTBCVT tại Tp HCM			3	t	f	TDT1 - Trung tâm Đào tạo Bưu chính Viễn thông	5	Cơ sở TT ĐTBCVT tại Tp HCM	TDT2
c805f302-a834-4ff8-9908-d6137cc5c057	\N	2026-06-13 17:02:58.26552+07	233	26		TDV1-GD - Bộ phận phục vụ giảng đường			3	t	f	TDV1 - Trung tâm Dịch vụ	0	Bộ phận phục vụ giảng đường	TDV1-GD
b3f680e8-26a0-4dce-aef4-cb4643a58953	\N	2026-06-13 17:02:58.26552+07	236	26		TDV1-HC - Bộ phận Hành chính			3	t	f	TDV1 - Trung tâm Dịch vụ	0	Bộ phận Hành chính	TDV1-HC
748ce4ae-5167-4a1c-8218-c05baade940d	\N	2026-06-13 17:02:58.26552+07	234	26		TDV1-KTX - Bộ phận phục vụ KTX			3	t	f	TDV1 - Trung tâm Dịch vụ	0	Bộ phận phục vụ KTX	TDV1-KTX
c4a60d0b-dfef-4fb8-ae40-d06f926eef4e	\N	2026-06-13 17:02:58.26552+07	235	26		TDV1-SDN - Bộ phận sửa chữa điện nước			3	t	f	TDV1 - Trung tâm Dịch vụ	0	Bộ phận sửa chữa điện nước	TDV1-SDN
e0e54288-2247-48a0-b0ea-ef8a6485ed89	\N	2026-06-13 17:02:58.26552+07	6	83		TDV2 - Trung tâm Cơ sở vật chất và Dịch vụ			3	t	f	TT2 - Các trung tâm phía Nam	0	Trung tâm Cơ sở vật chất và Dịch vụ	TDV2
875615f8-6680-4a02-a565-c666178f197e	\N	2026-06-13 17:02:58.26552+07	210	21		TGK1 - Trợ giảng tại Khoa VT1			3	t	f	KVT1 - Khoa Viễn thông 1	0	Trợ giảng tại Khoa VT1	TGK1
057b77ec-1c59-4dc0-95ec-b9552eb9904c	\N	2026-06-13 17:02:58.26552+07	207	20		TGK2 - Trợ giảng Khoa TCKT1			3	t	f	KTC1 - Khoa Tài chính kế toán 1	0	Trợ giảng Khoa TCKT1	TGK2
7a9439de-e1f0-45b8-9a15-ffa0b9bed4bc	\N	2026-06-13 17:02:58.26552+07	183	10		TKK - Thư ký khoa			3	t	f	KCN2 - Khoa Công nghệ thông tin 2	0	Thư ký khoa	TKK
c8f00857-192f-43f7-ba37-d6e7c0aaed74	\N	2026-06-13 17:02:58.26552+07	217	77		TLK1 - Trợ lý khoa			3	t	f	KAT1 - Khoa An toàn thông tin	0	Trợ lý khoa	TLK1
2ffd0f15-8c52-44fd-a03d-b469545ca8c2	\N	2026-06-13 17:02:58.26552+07	216	240		TLK2 - Trợ lý khoa			3	t	f	KTN1 - Khoa Trí tuệ nhân tạo	0	Trợ lý khoa	TLK2
24c1f570-1b04-4737-9d99-e49f5e993bdf	\N	2026-06-13 17:02:58.26552+07	211	21		TLK3 - Trợ lý khoa			3	t	f	KVT1 - Khoa Viễn thông 1	0	Trợ lý khoa	TLK3
ce11e5c9-e7b7-4256-9c9f-359a2bb9b648	\N	2026-06-13 17:02:58.26552+07	196	239		TQT - Tổ Quản trị			3	t	f	PTH2 - Phòng Tổ chức - Hành chính - Quản trị	0	Tổ Quản trị	TQT
6a314d23-4395-48b8-aed6-b074160908b9	\N	2026-06-13 17:02:58.26552+07	243	3		VCN1-DTKH - Phòng Quản lý Đào tạo và Nghiên cứu Khoa học công nghệ			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Phòng Quản lý Đào tạo và Nghiên cứu Khoa học công nghệ	VCN1-DTKH
ee19b115-92f7-4677-b377-7c02f94f223b	\N	2026-06-13 17:02:58.26552+07	57	3		VCN1-HCC - Phòng Hợp tác và Chuyển giao công nghệ			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Phòng Hợp tác và Chuyển giao công nghệ	VCN1-HCC
60e8c111-546b-4ef7-b253-79485c7efafe	\N	2026-06-13 17:02:58.26552+07	56	3		VCN1-HTDV - Tổ hỗ trợ dịch vụ			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Tổ hỗ trợ dịch vụ	VCN1-HTDV
46bfbd4e-c810-4713-b52a-4ef7ca449381	\N	2026-06-13 17:02:58.26552+07	54	3		VCN1-LD - Lãnh đạo Viện			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	1	Lãnh đạo Viện	VCN1-LD
e12a31be-51aa-4fa5-adf1-a12050935a48	\N	2026-06-13 17:02:58.26552+07	58	3		VCN1-NPD - Phòng Nghiên cứu Phát triển Dịch vụ			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Phòng Nghiên cứu Phát triển Dịch vụ	VCN1-NPD
81768de0-95d6-40d0-bbb7-2f5844c955ab	\N	2026-06-13 17:02:58.26552+07	59	3		VCN1-NPHAT - Phòng Nghiên cứu Phát triển Hạ tầng và An toàn thông tin			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Phòng Nghiên cứu Phát triển Hạ tầng và An toàn thông tin	VCN1-NPHAT
3df4312a-dfea-4147-a983-d5b29dc84a3f	\N	2026-06-13 17:02:58.26552+07	60	3		VCN1-NPUD - Phòng Nghiên cứu Phát triển Ứng dụng đa phương tiện			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Phòng Nghiên cứu Phát triển Ứng dụng đa phương tiện	VCN1-NPUD
3bb245b4-2948-45de-b4e4-e81a613304ab	\N	2026-06-13 17:02:58.26552+07	55	3		VCN1-TH - Phòng Tổng hợp			3	t	f	VCN1 - Viện Công nghệ thông tin và Truyền thông	0	Phòng Tổng hợp	VCN1-TH
86eaa167-e880-48cf-9d15-1b98ffcea3b5	\N	2026-06-13 17:02:58.26552+07	237	91		VKH1-CS2 - Cơ sở 2 tại Thành phố Hồ Chí Minh			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Cơ sở 2 tại Thành phố Hồ Chí Minh	VKH1-CS2
6c8d359a-d65c-4aea-b746-22587dec9f7a	\N	2026-06-13 17:02:58.26552+07	73	91		VKH1-DKTC - Phòng Đo lường, kiểm định và Tiêu chuẩn chất lượng			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Phòng Đo lường, kiểm định và Tiêu chuẩn chất lượng	VKH1-DKTC
85433549-4f05-4405-a5fe-ac33b8902ebe	\N	2026-06-13 17:02:58.26552+07	241	91		VKH1-LD - Lãnh đạo Viện			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Lãnh đạo Viện	VKH1-LD
36b8cbfd-7208-4c33-b725-09e5c3835a8d	\N	2026-06-13 17:02:58.26552+07	71	91		VKH1-NKDV - Phòng Nghiên cứu kỹ thuật và Dịch vụ viễn thông			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Phòng Nghiên cứu kỹ thuật và Dịch vụ viễn thông	VKH1-NKDV
15e3a572-eef0-4954-b465-ed07bce337a3	\N	2026-06-13 17:02:58.26552+07	75	91		VKH1-NPCS - Phòng Nghiên cứu phát triển Công nghệ số			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	1	Phòng Nghiên cứu phát triển Công nghệ số	VKH1-NPCS
70feb624-f05e-4298-a0f9-7d6acbb2259a	\N	2026-06-13 17:02:58.26552+07	70	91		VKH1-QKCD - Phòng Quản lý  Khoa học công nghệ và Đào tạo			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Phòng Quản lý  Khoa học công nghệ và Đào tạo	VKH1-QKCD
22bfb5ec-ef87-4cfd-b0cf-d9bb93b24b88	\N	2026-06-13 17:02:58.26552+07	69	91		VKH1-TH - Phòng Tổng hợp			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Phòng Tổng hợp	VKH1-TH
021d6a01-599a-4798-baa2-077449cb37d4	\N	2026-06-13 17:02:58.26552+07	72	91		VKH1-TVTK - Phòng Tư vấn Thiết kế			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Phòng Tư vấn Thiết kế	VKH1-TVTK
aaa8087d-dbf3-4725-9097-a27231012c4d	\N	2026-06-13 17:02:58.26552+07	74	91		VKH1-UCCG - Phòng Ứng dụng, Chuyển giao công nghệ và giáo dục			3	t	f	VKH1 - Viện Khoa học Kỹ thuật Bưu điện	0	Phòng Ứng dụng, Chuyển giao công nghệ và giáo dục	VKH1-UCCG
9fc57ad1-4b51-4eb4-a8e6-260387704810	\N	2026-06-13 17:02:58.26552+07	65	4		VKT1-DKC - Phòng Đào tạo và Khoa học Công nghệ			3	t	f	VKT1 - Viện Kinh tế Bưu điện	0	Phòng Đào tạo và Khoa học Công nghệ	VKT1-DKC
6c2bde7c-13ec-46c2-b373-0d5cde102485	\N	2026-06-13 17:02:58.26552+07	61	4		VKT1-LD - Lãnh đạo Viện			3	t	f	VKT1 - Viện Kinh tế Bưu điện	1	Lãnh đạo Viện	VKT1-LD
87cd9cd7-a283-4b1e-847f-c28ea4773290	\N	2026-06-13 17:02:58.26552+07	64	4		VKT1-MAR - Bộ môn Marketing			3	t	f	VKT1 - Viện Kinh tế Bưu điện	0	Bộ môn Marketing	VKT1-MAR
99d95d76-5dfe-41b5-b4b6-28acb37e55f7	\N	2026-06-13 17:02:58.26552+07	67	4		VKT1-NCQTDN - Phòng Nghiên cứu Quản trị doanh nghiệp và Hợp tác quốc tế			3	t	f	VKT1 - Viện Kinh tế Bưu điện	1	Phòng Nghiên cứu Quản trị doanh nghiệp và Hợp tác quốc tế	VKT1-NCQTDN
5d9b2ff6-2aad-491d-885a-801d3acaa205	\N	2026-06-13 17:02:58.26552+07	256	4		VKT1-NDHQ - Ban Nghiên cứu, Đào tạo và Hợp tác quốc tế			3	t	f	VKT1 - Viện Kinh tế Bưu điện	0	Ban Nghiên cứu, Đào tạo và Hợp tác quốc tế	VKT1-NDHQ
64275dba-43da-41b6-97c0-df4aa4159d93	\N	2026-06-13 17:02:58.26552+07	66	4		VKT1-NDKK - Phòng Nghiên cứu Định mức Kinh tế kỹ thuật			3	t	f	VKT1 - Viện Kinh tế Bưu điện	0	Phòng Nghiên cứu Định mức Kinh tế kỹ thuật	VKT1-NDKK
32e91d2b-dc6c-4a43-a118-3188c09d2da5	\N	2026-06-13 17:02:58.26552+07	63	4		VKT1-PTKN - Bộ môn Phát triển kỹ năng			3	t	f	VKT1 - Viện Kinh tế Bưu điện	0	Bộ môn Phát triển kỹ năng	VKT1-PTKN
b6a213b1-e22f-41e4-ab84-463c54270d37	\N	2026-06-13 17:02:58.26552+07	62	4		VKT1-TH - Phòng Tổng hợp			3	t	f	VKT1 - Viện Kinh tế Bưu điện	0	Phòng Tổng hợp	VKT1-TH
206c1bc7-4a36-4b90-9755-4cc8c5cba90c	\N	2026-06-13 17:02:58.26552+07	227	23		VPK1 - Văn phòng khoa			3	t	f	KCB1 - Khoa Cơ bản 1	0	Văn phòng khoa	VPK1
61d52789-5ffa-4a3e-94a8-c53e7bdb24f0	\N	2026-06-13 17:02:58.26552+07	170	7		VPK10 - Văn phòng khoa			3	t	f	KVT2 - Khoa Viễn thông 2	0	Văn phòng khoa	VPK10
005503be-d98c-411f-bed0-f4faca435763	\N	2026-06-13 17:02:58.26552+07	224	24		VPK2 - Văn phòng khoa			3	t	f	KDT1 - Khoa Kỹ thuật điện tử 1	0	Văn phòng khoa	VPK2
b2256e9b-a340-444d-97da-a4b4ff527231	\N	2026-06-13 17:02:58.26552+07	220	22		VPK3 - Văn phòng khoa			3	t	f	KCN1 - Khoa Công nghệ thông tin 1	0	Văn phòng khoa	VPK3
8097f4f8-bd0d-4d61-95a4-1a7d59cc57e7	\N	2026-06-13 17:02:58.26552+07	206	20		VPK4 - Văn phòng khoa			3	t	f	KTC1 - Khoa Tài chính kế toán 1	0	Văn phòng khoa	VPK4
12fb6287-9a5b-4ef9-a09c-1b4e2501eb65	\N	2026-06-13 17:02:58.26552+07	203	19		VPK5 - Văn phòng khoa			3	t	f	KQT1 - Khoa Quản trị kinh doanh 1	0	Văn phòng khoa	VPK5
1026eed6-3d87-40fc-9f8d-1acd97ea79e1	\N	2026-06-13 17:02:58.26552+07	197	18		VPK6 - Văn phòng khoa			3	t	f	KDP1 - Khoa Đa phương tiện	0	Văn phòng khoa	VPK6
2fa47b03-72b7-4388-a6ec-2365f3fdc8a1	\N	2026-06-13 17:02:58.26552+07	191	11		VPK7 - Văn phòng khoa			3	t	f	KCB2 - Khoa Cơ bản 2	0	Văn phòng khoa	VPK7
8ebca454-b358-4e74-b36b-c1a6585b1b1e	\N	2026-06-13 17:02:58.26552+07	178	9		VPK8 - Văn phòng khoa			3	t	f	KDT2 - Khoa Kỹ thuật điện tử 2	0	Văn phòng khoa	VPK8
89cf5478-677d-44af-b21f-a2243eec2031	\N	2026-06-13 17:02:58.26552+07	174	8		VPK9 - Văn phòng khoa			3	t	f	KQT2 - Khoa Quản trị kinh doanh 2	0	Văn phòng khoa	VPK9
cbe776ff-55da-4032-9973-c0bb6378efb3	\N	2026-06-13 17:02:58.26552+07	167	61		BMKT - Bộ môn Marketing			4	t	f	VKT1-LD - Lãnh đạo Viện	0	Bộ môn Marketing	BMKT
84a17290-ece4-4216-b6a9-0932f98f3157	\N	2026-06-13 17:02:58.26552+07	169	54		BMM1 - Bộ môn Marketing			4	t	f	VCN1-LD - Lãnh đạo Viện	0	Bộ môn Marketing	BMM1
440620ac-baed-4fad-af1a-05da344011f8	\N	2026-06-13 17:02:58.26552+07	168	67		BMM3 - Bộ môn Marketing			4	t	f	VKT1-NCQTDN - Phòng Nghiên cứu Quản trị doanh nghiệp và Hợp tác quốc tế	0	Bộ môn Marketing	BMM3
7aa6323f-7c02-4024-9c01-aaa9ce083004	\N	2026-06-13 17:02:58.26552+07	50	1		TDT2-BGD - Ban Giám đốc			4	t	f	TDT2 - Cơ sở TT ĐTBCVT tại Tp HCM	0	Ban Giám đốc	TDT2-BGD
88f97739-bc3e-463c-b27e-cacc1e1cbbe2	\N	2026-06-13 17:02:58.26552+07	52	1		TDT2-DT - Phòng Đào tạo			4	t	f	TDT2 - Cơ sở TT ĐTBCVT tại Tp HCM	0	Phòng Đào tạo	TDT2-DT
c50aa791-dce0-47a8-b34e-93decb5d6c9c	\N	2026-06-13 17:02:58.26552+07	51	1		TDT2-TH - Phòng Tổng hợp			4	t	f	TDT2 - Cơ sở TT ĐTBCVT tại Tp HCM	0	Phòng Tổng hợp	TDT2-TH
fd93f65f-bca4-498c-b714-659f55f217d9	\N	2026-06-13 17:02:58.26552+07	53	1		TDT2-TV - Phòng Tư vấn			4	t	f	TDT2 - Cơ sở TT ĐTBCVT tại Tp HCM	0	Phòng Tư vấn	TDT2-TV
4fba5ebb-d46f-4460-8bdc-f33d19060612	\N	2026-06-13 17:02:58.26552+07	254	75		Cộng tác viên phòng Công nghệ số			4	t	f	VKH1-NPCS - Phòng Nghiên cứu phát triển Công nghệ số	0	Cộng tác viên phòng Công nghệ số	
\.


--
-- TOC entry 5271 (class 0 OID 45427)
-- Dependencies: 227
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (document_id, assigned_department_id, assigned_user_id, so_den, so_ky_hieu, trich_yeu, hinh_thuc, loai_van_ban_text, don_vi_ban_hanh, nguoi_ky, chuc_vu_nguoi_ky, ngay_van_ban, ngay_den, ngay_het_han, do_khan, noi_nhan, can_cu_phap_ly, yeu_cau_hanh_dong, status, summary, key_points, confidence, muc_tin_cay, loai_van_ban, de_xuat_xu_ly, goi_y_phong_ban, tong_so_chunk, total_chunks_processed, source_pages, storage_info, processing_time, is_chua_doc, thong_tin_ky_so, created_at, updated_at, deleted_at, uploaded_by_user_id, related_documents, title) FROM stdin;
\.


--
-- TOC entry 5273 (class 0 OID 70164)
-- Dependencies: 229
-- Data for Name: human_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.human_resources (human_resource_id, id, name, login, email, ma_can_bo, ten_hien_thi, chuc_danh, oauth_uid, is_role_qlvb, active, department_id, created_at, updated_at) FROM stdin;
5de71156-dda0-482a-a4ca-f50742659597	953	Trần Hương	08f8d169-7ed8-4b04-b812-70350029fb31		TG0116	Trần Hương (TG0116)		08f8d169-7ed8-4b04-b812-70350029fb31	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
419e7a0c-ad93-4db5-a399-7d79c9fc8b13	1426	Trịnh Đức Lộc	LocTD.B24CC182@stu.ptit.edu.vn	tranglou1003@gmail.com		Trịnh Đức Lộc			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a9493714-0f45-4255-983d-36d73e42cfdc	1441	Giáo Vụ 1	cd0bcfdc-b8ce-4911-9f89-0e68887c98b8	qldt@ptit.edu.vn	GIAOVU01	Giáo Vụ 1 (GIAOVU01)		cd0bcfdc-b8ce-4911-9f89-0e68887c98b8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
66605a10-b764-410a-a63a-ba64124f0b38	917	Nguyễn Thị Nga 1	e45a926e-1e83-49a1-a96d-0b9ab383809b	tranglou1003@gmail.com	TG0098	Nguyễn Thị Nga 1 (TG0098)		e45a926e-1e83-49a1-a96d-0b9ab383809b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe87988e-ff4c-4626-a0af-3a56d2890462	871	Nguyễn Thị Thu Hà 1	f57a6076-72ac-4fa9-bb41-9ad581a0e2bf	hantt.tg@ptit.edu.vn	TG0110	Nguyễn Thị Thu Hà 1 (TG0110)		f57a6076-72ac-4fa9-bb41-9ad581a0e2bf	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c2937f26-c1bd-4b80-ac25-5d9f1074dccb	964	Nguyễn Đức Toàn 1	8a3a90f9-d3c9-4c8e-bf1f-b8f98a3fa627	toannd1.tg@ptit.edu.vn	TG0131	Nguyễn Đức Toàn 1 (TG0131)		8a3a90f9-d3c9-4c8e-bf1f-b8f98a3fa627	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
333f0dfe-c1e1-4946-aa1c-e1ba66e2213f	675	Thỉnh Giảng 1	e89ec3d5-089e-403c-aa70-ddc8557fdc03		TG204	Thỉnh Giảng 1 (TG204)		e89ec3d5-089e-403c-aa70-ddc8557fdc03	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ee3d862-c053-4c95-b08b-c81e14d8f93e	700	Thỉnh Giảng 10	b5e147a6-9e74-425d-9ba4-e0eee9f009f2		TG213	Thỉnh Giảng 10 (TG213)		b5e147a6-9e74-425d-9ba4-e0eee9f009f2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
84ca60cd-ca6d-4f9b-b667-fb5a0e20fe23	648	Lê Thanh Tùng 2	18172004-0abe-449e-9ba4-0591fd48eddc	tunglt2.tg@ptit.edu.vn	TG0584	Lê Thanh Tùng 2 (TG0584)		18172004-0abe-449e-9ba4-0591fd48eddc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
823f63dc-32bb-49be-8167-27e5fb808260	647	Nguyễn Thanh Tùng 2	da871d44-c114-4d6e-bc80-81210f653604		TG0585	Nguyễn Thanh Tùng 2 (TG0585)		da871d44-c114-4d6e-bc80-81210f653604	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
070caca1-0c28-4930-997f-40a20154ceea	632	Nguyễn Đức Toàn 2	0326b2bb-97e2-4d36-85cf-5b7db02e3742	toannd2.tg@ptit.edu.vn	TG0446	Nguyễn Đức Toàn 2 (TG0446)		0326b2bb-97e2-4d36-85cf-5b7db02e3742	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5f26987d-1664-4866-b152-dfddff25fffb	769	Thỉnh Giảng 2	10279e9b-7153-4844-bc17-ea90380e2b04		TG205	Thỉnh Giảng 2 (TG205)		10279e9b-7153-4844-bc17-ea90380e2b04	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
505bc682-8f50-4c89-b7d4-59790e27f241	688	Thỉnh Giảng 3	0a1cec02-a40a-429b-8086-42c0e72b1dfc		TG206	Thỉnh Giảng 3 (TG206)		0a1cec02-a40a-429b-8086-42c0e72b1dfc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b0f15f1d-2120-420d-8121-d345f5314e99	669	Thỉnh Giảng 4	40917873-6c3b-4631-9490-d3e772793524		TG207	Thỉnh Giảng 4 (TG207)		40917873-6c3b-4631-9490-d3e772793524	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
36a175be-99d8-4033-aef6-92ba304e0fbe	775	Thỉnh Giảng 5	d72ca731-c200-4201-b53e-704092e8e8d2		TG208	Thỉnh Giảng 5 (TG208)		d72ca731-c200-4201-b53e-704092e8e8d2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6bc4a62e-1376-4aab-aa6c-86b6ebfc2ef2	1331	Nguyễn Trường Giang 54	GiangNT.B23CC054@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Trường Giang 54		93c99944-c434-47f1-b562-06e90f0e3b9b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5e9d15ec-6833-4cc0-a835-711a4030daf8	81	Nguyễn Trường Giang 55	GiangNT.B23CC055@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Trường Giang 55		9b424a86-215d-4201-b86a-ccbdfc3f2a74	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
338029dc-ddd7-4dda-acee-6f183a089669	754	Thỉnh Giảng 6	b77b87de-2129-4811-bf9f-0cd51db7707e		TG209	Thỉnh Giảng 6 (TG209)		b77b87de-2129-4811-bf9f-0cd51db7707e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fb7ef115-04ca-4050-844d-bd19b3fee028	749	Thỉnh Giảng 7	8a6a5ab4-8568-4e48-b159-a92f4d84bd4e		TG210	Thỉnh Giảng 7 (TG210)		8a6a5ab4-8568-4e48-b159-a92f4d84bd4e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
56c80ec0-d735-454c-aca3-6a6fe5deb764	693	Thỉnh Giảng 8	5f94cfba-d75c-4878-b495-671e337cb219		TG211	Thỉnh Giảng 8 (TG211)		5f94cfba-d75c-4878-b495-671e337cb219	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fd968e45-4034-489c-ba13-0a4096498933	664	Thỉnh Giảng 9	90ae0ca9-83d9-4150-afec-617718b2b46f		TG212	Thỉnh Giảng 9 (TG212)		90ae0ca9-83d9-4150-afec-617718b2b46f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
54f5a5d8-2404-412f-b8b5-a8115cd2bf2c	6	Administrator	ript@gmail.com	tranglou1003@gmail.com		Administrator		adminqlvbript	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64ac7647-83e6-4bf1-a16e-f8a7fa643335	2	Administrator	admin	tranglou1003@gmail.com		Administrator - minhtq@ptit.edu.vn		ee661ac7-8abf-454b-a31f-8f551d6b27212	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
05449e48-4be1-406b-bce9-4d7c3faeb09a	1033	Bùi Lai An	71b28301-e222-4824-bbae-541df9ecc8a3	anbl@ptit.edu.vn	KVT100885	Bùi Lai An (KVT100885)		71b28301-e222-4824-bbae-541df9ecc8a3	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
11239b58-3a76-4286-a16c-465560f4a896	905	Chu Thị Hải An	a2110e42-3a58-49ff-9818-2663ff9f00e1		TG0210	Chu Thị Hải An (TG0210)		a2110e42-3a58-49ff-9818-2663ff9f00e1	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f0aea84-bc1e-4c2e-bec3-4cfbc36a2c12	984	Hứu Thị An	34d5ff4e-2b4e-4185-af95-94c6e1efc626		TG0058	Hứu Thị An (TG0058)		34d5ff4e-2b4e-4185-af95-94c6e1efc626	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
150b01b0-5ecf-4caa-87ec-8219bf1b243c	544	Lê Thị Hội An	e232db37-5979-4524-93ef-4a84b7de0a94	anlh@ptit.edu.vn	PSV100047	Lê Thị Hội An (PSV100047)		e232db37-5979-4524-93ef-4a84b7de0a94	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
aafa4c72-c5fd-49dd-89e7-1f16e983498a	1444	Trần Tuấn Anh	acd67e14-06b4-49a5-9154-cd72fc2ed529	ttanh@ptit.edu.vn	VKH101150	Trần Tuấn Anh (VKH101150)		acd67e14-06b4-49a5-9154-cd72fc2ed529	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
26958f1c-7a91-43e2-ba34-bec972b1af7d	210	Nguyễn Thị Minh An	fc72e280-0cc1-4a14-af11-d018bfc5c79a	anntm@ptit.edu.vn	KQT100328	Nguyễn Thị Minh An (KQT100328)		fc72e280-0cc1-4a14-af11-d018bfc5c79a	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c1775df5-ed3f-4cc9-9697-ae534eeaf267	1202	Nguyễn Thị Thùy An	36e2cb85-bb81-4b63-9fd7-eb779275c0d8	anntt@ptit.edu.vn	KCN200753	Nguyễn Thị Thùy An (KCN200753)		36e2cb85-bb81-4b63-9fd7-eb779275c0d8	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f64e751-cb4a-4087-bcc2-75d901f644cb	1422	Bùi Duy Tuấn Anh	AnhBDT.B23CC004@stu.ptit.edu.vn	tranglou1003@gmail.com		Bùi Duy Tuấn Anh		71dec749-6a4e-4125-b847-95334ddb1e53	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f1c70743-53b3-49b6-9580-c45e551a97ea	177	Bùi Thị Vân Anh	095e034a-27e6-4858-afda-52408c72b44c	anhbtv@ptit.edu.vn	KDP100612	Bùi Thị Vân Anh (KDP100612)		095e034a-27e6-4858-afda-52408c72b44c	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d0e5454-835e-42ab-a54c-b4d8777c6be0	990	Bùi Vũ Anh	9f932909-a41f-43e6-9101-632806e11cbb		TG0095	Bùi Vũ Anh (TG0095)		9f932909-a41f-43e6-9101-632806e11cbb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bda43411-8db5-4aad-bee1-fbf8f8735dfb	1427	Bùi Đức Duy Anh	AnhBDD.B23CC003@stu.ptit.edu.vn	tranglou1003@gmail.com		Bùi Đức Duy Anh		2b37858b-7a45-411f-9e1a-9ae5f8f52caa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a5a7213-c741-45a1-adc2-142089ab8836	607	Kim Ngọc Anh	23e43fda-0a88-4a7f-a1d7-35f7f23a411e		TG0553	Kim Ngọc Anh (TG0553)		23e43fda-0a88-4a7f-a1d7-35f7f23a411e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5484accf-f664-4642-8400-af71eff6c931	1366	Lã Trường Anh	265fc435-f422-440f-a031-da8b849d29f9	anhlt.tg@ptit.edu.vn	2025.KQT1.15.806	Lã Trường Anh (2025.KQT1.15.806)		265fc435-f422-440f-a031-da8b849d29f9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b16e6610-fd11-477a-a27e-69c992475468	192	Lê Tuấn Anh	fed13277-2f02-4bff-9f77-7ec2b76c6a6e	anhlt@ptit.edu.vn	KDP100848	Lê Tuấn Anh (KDP100848)		fed13277-2f02-4bff-9f77-7ec2b76c6a6e	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
149c7864-6dad-4edd-a54c-42b727d0a24e	284	Nguyễn Hoàng Anh	92078371-302b-49d5-b434-e8557d49fa10	anhnh@ptit.edu.vn	KCN100246	Nguyễn Hoàng Anh (KCN100246)		92078371-302b-49d5-b434-e8557d49fa10	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c259370f-ad07-4d0d-9f43-f01d74217f67	236	Nguyễn Hương Anh	e3839db6-bb5d-4c52-a8b9-5f28b683b632	huonganh@ptit.edu.vn	KTC100315	Nguyễn Hương Anh (KTC100315)		e3839db6-bb5d-4c52-a8b9-5f28b683b632	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc67c9f9-1674-4248-a398-40047144ccf0	123	Nguyễn Lan Anh	6c01e98b-c2ff-4657-a652-b5624fa47e9a	anhnl@ptit.edu.vn	KDT200452	Nguyễn Lan Anh (KDT200452)		6c01e98b-c2ff-4657-a652-b5624fa47e9a	t	t	181	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4731a5f6-a286-4438-946c-695b69229954	455	Nguyễn Ngọc Anh	b4038139-ebe4-4e0f-9045-32a3f1583038	anhnn@ptit.edu.vn	VKT100570	Nguyễn Ngọc Anh (VKT100570)		b4038139-ebe4-4e0f-9045-32a3f1583038	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2865f8a1-e65f-4b7d-a396-731d4ea29c57	1199	Nguyễn Ngọc Hùng Anh	4dc43ef1-8cb4-4b07-80e1-e863840eefe1	anhnnh@ptit.edu.vn	KCN200863	Nguyễn Ngọc Hùng Anh (KCN200863)		4dc43ef1-8cb4-4b07-80e1-e863840eefe1	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0650289d-d4a6-46b6-8eea-6af91622393f	185	Nguyễn Phương Anh	8a605745-3d5d-4152-818d-3765ba39b014	npanh@ptit.edu.vn	KDP101012	Nguyễn Phương Anh (KDP101012)		8a605745-3d5d-4152-818d-3765ba39b014	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a56f3053-c8a6-4632-b3f1-84aa3d2d9caa	496	Nguyễn Phương Anh	1bb78fd5-3f7c-45d5-ba3d-d09cd643e02c	anhnp@ptit.edu.vn	VCN100620	Nguyễn Phương Anh (VCN100620)		1bb78fd5-3f7c-45d5-ba3d-d09cd643e02c	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a6eba030-59c8-4a02-b493-f147007dfa01	1278	Nguyễn Thị Kim Anh	fcae23e3-548d-43bf-ad94-bfbc0b95caa8	anhntk@ptit.edu.vn	TDT100559	Nguyễn Thị Kim Anh (TDT100559)		fcae23e3-548d-43bf-ad94-bfbc0b95caa8	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c8185224-7bbd-4a1e-991d-4a8ada568b75	1121	Nguyễn Thị Mai Anh	e26f67ff-5b5c-4df5-a3b5-5d7c3b54b300		TG0079	Nguyễn Thị Mai Anh (TG0079)		e26f67ff-5b5c-4df5-a3b5-5d7c3b54b300	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c732adc2-fbf3-4733-ae02-3d42cb1134fa	937	Nguyễn Thị Mai Anh	cb9968f6-d100-47c1-adac-efd5967e61a4		TG0007	Nguyễn Thị Mai Anh (TG0007)		cb9968f6-d100-47c1-adac-efd5967e61a4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
24491e86-770a-4726-8b50-948e91373294	1440	Nguyễn Thị Ngọc Anh	d9fe2dd3-96c2-4c1c-a25c-a228e510d6c2	anhntn@ptit.edu.vn	VKT101139	Nguyễn Thị Ngọc Anh (VKT101139)		d9fe2dd3-96c2-4c1c-a25c-a228e510d6c2	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
10d79dc3-9102-4d79-b125-eef92021953f	235	Nguyễn Thị Vân Anh	a68e2da5-f59a-444e-8d3e-f370d3d40fd3	anhntv@ptit.edu.vn	KTC100316	Nguyễn Thị Vân Anh (KTC100316)		a68e2da5-f59a-444e-8d3e-f370d3d40fd3	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dfe30318-1900-42c9-ba0c-04704627d21d	434	Nguyễn Trọng Trung Anh	86b8097c-6c83-4e3b-a32a-e6aae6e4732c	anhntt@ptit.edu.vn	KTN100289	Nguyễn Trọng Trung Anh (KTN100289)		86b8097c-6c83-4e3b-a32a-e6aae6e4732c	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
86451efa-ecbf-4b7a-9731-76adb6f7027e	778	Nguyễn Tuấn Anh	1cd5262b-7b03-492f-9b1c-1361f50e0606		TG0383	Nguyễn Tuấn Anh (TG0383)		1cd5262b-7b03-492f-9b1c-1361f50e0606	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
be89f07e-05e2-4ef7-8aa7-643f128d5d13	942	Nguyễn Việt Anh	bbad8fcd-a99e-4172-a85c-e443c525a95d		TG0024	Nguyễn Việt Anh (TG0024)		bbad8fcd-a99e-4172-a85c-e443c525a95d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ba360f56-44a0-4865-bad5-76b7107431d1	203	Nguyễn Vân Anh	33d1bfce-7a10-4c87-ac14-fbc74d08cdc6	anhnv@ptit.edu.vn	KDP100345	Nguyễn Vân Anh (KDP100345)		33d1bfce-7a10-4c87-ac14-fbc74d08cdc6	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7bb8dcc7-5d37-4f8c-8195-7cd479913ef5	278	Nguyễn Xuân Anh	c63fffb2-4b5b-4edd-8f6c-ba3cea635e39	anhnx@ptit.edu.vn	KCN100247	Nguyễn Xuân Anh (KCN100247)		c63fffb2-4b5b-4edd-8f6c-ba3cea635e39	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4fa0f734-c5cb-4748-a429-69645a53c1cc	808	Ong Thị Vân Anh	7f54b4f9-5239-4b57-9aa3-696a5f8b3349	anhotv@ptit.edu.vn	VPH100133	Ong Thị Vân Anh (VPH100133)		7f54b4f9-5239-4b57-9aa3-696a5f8b3349	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
21895ba7-80d0-4013-924d-a2fced961236	850	Phạm Hoàng Anh	8a66c22e-7248-479c-96ca-39525ff8eda2	anhph@ptit.edu.vn	KDT100970	Phạm Hoàng Anh (KDT100970)		8a66c22e-7248-479c-96ca-39525ff8eda2	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ce19c30c-0fd1-47ce-b23f-4ac7b6c1a1ba	356	Phạm Ngọc Anh	1259b7e3-1d65-41bc-9acc-386582f98a0b	anhpn@ptit.edu.vn	KCB100189	Phạm Ngọc Anh (KCB100189)		1259b7e3-1d65-41bc-9acc-386582f98a0b	t	t	23	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dd121e85-1e65-442f-ab7c-e0678508fc6b	265	Phạm Trần Lan Anh	9f97648a-e6b0-4832-96c4-101b6b9d5ac3	anhptl@ptit.edu.vn	KAT100642	Phạm Trần Lan Anh (KAT100642)		9f97648a-e6b0-4832-96c4-101b6b9d5ac3	t	t	77	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ab55b29b-bf85-419a-892a-941f43ece62d	1236	Phạm Tuấn Anh	bfe02215-6718-4aa3-a658-dcfc5fa2048c	anhpt@ptit.edu.vn	VKT101074	Phạm Tuấn Anh (VKT101074)		bfe02215-6718-4aa3-a658-dcfc5fa2048c	t	t	67	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dc0bf8be-486a-4d8c-8cde-d3b2041c8893	1362	Trương Tuấn Anh	9ac834b0-8ce6-4e9e-9b7b-a4db2924f074	anhtt2@ptit.edu.vn	VKH101081	Trương Tuấn Anh (VKH101081)		9ac834b0-8ce6-4e9e-9b7b-a4db2924f074	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fd070d7a-054f-487d-a4d9-2d42135c393b	1326	Trần Quang Anh	58c2c7b1-fb32-4698-acc4-44efe932402a	tqanh@ptit.edu.vn	BGD100005	Trần Quang Anh (BGD100005)		58c2c7b1-fb32-4698-acc4-44efe932402a	t	t	43	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b26165e4-ddd6-4d74-bd51-c12de582e746	894	Trần Thị Hoàng Anh	1b60af9a-4815-4efe-9ad3-0784b33448a3		TG0250	Trần Thị Hoàng Anh (TG0250)		1b60af9a-4815-4efe-9ad3-0784b33448a3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d68cdcb6-4d4b-4282-844a-fe152b319ea8	1335	Trần Tuấn Anh	trananh16112001@gmail.com	tranglou1003@gmail.com		Trần Tuấn Anh			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
35b33034-ca30-45fa-b27f-e69d1473ebb4	301	Trần Tuấn Anh	09558360-53da-4908-9bec-0eaac68bb6a4	anhtt@ptit.edu.vn	KDT100227	Trần Tuấn Anh (KDT100227)		09558360-53da-4908-9bec-0eaac68bb6a4	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1df3d396-0351-49a3-a697-cee1aebea691	636	Trần Việt Anh	71dc8fc0-c4a0-4f66-9ed8-15a418b0fb1b		TG0583	Trần Việt Anh (TG0583)		71dc8fc0-c4a0-4f66-9ed8-15a418b0fb1b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5fa570b7-d0c0-4b1d-8588-fc4194b241e7	357	Trần Việt Anh	3b111fbf-f571-4579-967c-1ab97d5b652b	tvanh@ptit.edu.vn	KCB100192	Trần Việt Anh (KCB100192)		3b111fbf-f571-4579-967c-1ab97d5b652b	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f638d048-636d-4f11-8e1a-c7963f9a8f32	979	Trần Vũ Anh	ee0d60ad-a1a3-43d4-8266-22751416ba47		TG0300	Trần Vũ Anh (TG0300)		ee0d60ad-a1a3-43d4-8266-22751416ba47	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1ff6260e-37f7-4fcd-aaf0-c2560e5f8767	858	Trịnh Hồng Anh	deb7503e-bc80-451a-80a1-e69ba2018f83	anhth@ptit.edu.vn	KDT100918	Trịnh Hồng Anh (KDT100918)		deb7503e-bc80-451a-80a1-e69ba2018f83	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2c1ca92b-400b-4bfa-905c-50a7c837ba1c	285	Trịnh Thị Vân Anh	428a1621-61c3-40d9-9d3e-9c0f94182aa6	anhttv@ptit.edu.vn	KCN100248	Trịnh Thị Vân Anh (KCN100248)		428a1621-61c3-40d9-9d3e-9c0f94182aa6	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d5046630-13da-48a4-b5d8-1cda2d44f4b0	515	Văn Thục Anh	8edf393b-cdb8-4940-aeb7-58db888c7555	anhvt@ptit.edu.vn	VCN100599	Văn Thục Anh (VCN100599)		8edf393b-cdb8-4940-aeb7-58db888c7555	t	t	55	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
746480a5-8c19-4fc9-aa59-8756483f9948	43	Vũ Minh Anh	B19DCCN048	tranglou1003@gmail.com		Vũ Minh Anh		b19dccn048	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
922e26fa-25ff-4dcd-817f-63786762cec0	985	Vũ Ngọc Anh	f6380717-6f6a-4dae-9b50-ec7e02f2a37c		TG0075	Vũ Ngọc Anh (TG0075)		f6380717-6f6a-4dae-9b50-ec7e02f2a37c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3f77352b-ff17-4a27-9df7-c9e01a835a25	190	Vũ Thị Tú Anh	c9c02d58-47e0-41ca-bc2f-f63dc01a2724	anhvtt@ptit.edu.vn	KDP100346	Vũ Thị Tú Anh (KDP100346)		c9c02d58-47e0-41ca-bc2f-f63dc01a2724	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9ecd6beb-4352-4461-8689-9dc3d0051648	537	Vũ Tuấn Anh	8ccfb1ee-cf2b-494d-80ae-afa817967017	anhvut@ptit.edu.vn	PTC100037	Vũ Tuấn Anh (PTC100037)		8ccfb1ee-cf2b-494d-80ae-afa817967017	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
013ab140-c4b7-48a1-87d9-e17e2254aa59	506	Vũ Tuấn Anh	e9af9c35-3670-4006-a19e-915ffa3d7d3d	vtanh@ptit.edu.vn	VCN100608	Vũ Tuấn Anh (VCN100608)		e9af9c35-3670-4006-a19e-915ffa3d7d3d	t	t	58	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3c233596-785c-4efe-89af-758c328cf7ca	1203	Đoàn Công Anh	b6593d43-78ea-4ec3-8fbd-53a604bbaf96	anhdc@ptit.edu.vn	KDT200929	Đoàn Công Anh (KDT200929)		b6593d43-78ea-4ec3-8fbd-53a604bbaf96	t	t	180	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9a55cec2-2887-48a4-bc10-4a328e9d7c8c	217	Đỗ Thị Lan Anh	6d28c398-77bb-45aa-8246-cc3308b3c1fc	anhdl@ptit.edu.vn	KQT100329	Đỗ Thị Lan Anh (KQT100329)		6d28c398-77bb-45aa-8246-cc3308b3c1fc	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
003f050c-3447-4347-9a77-df6d2dee3eea	1016	Đặng Trần Lê Anh	1155e57d-6eaa-4a3e-9e69-3c66362dd009	anhdtl@ptit.edu.vn	KVT100288	Đặng Trần Lê Anh (KVT100288)		1155e57d-6eaa-4a3e-9e69-3c66362dd009	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b8b08502-c98f-45c5-bd6f-c729f5d636f4	451	Đỗ Minh Anh	2560a6da-2356-47eb-8275-f637d29a1a20	anhdm@ptit.edu.vn	VKT100908	Đỗ Minh Anh (VKT100908)		2560a6da-2356-47eb-8275-f637d29a1a20	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
83be47fc-37c9-49bb-bb9d-269ac98347b4	1006	Đỗ Thị Ngọc Anh	54b7ea5d-d59d-445c-a9b7-5b35583edad2		TG0223	Đỗ Thị Ngọc Anh (TG0223)		54b7ea5d-d59d-445c-a9b7-5b35583edad2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
73bed16f-1d39-4a79-b73f-0bd0641dd001	563	Đỗ Trung Anh	c2cfa04f-5df6-4123-ade6-4933a23a51b3	anhdt@ptit.edu.vn	TDM100066	Đỗ Trung Anh (TDM100066)		c2cfa04f-5df6-4123-ade6-4933a23a51b3	t	t	255	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a249caa7-4698-4813-9b50-cd87fa777657	642	Đỗ Trung Anh	8e9cbca9-f711-476c-a3e7-6447ebbe3b7b		TG0419	Đỗ Trung Anh (TG0419)		8e9cbca9-f711-476c-a3e7-6447ebbe3b7b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ba6fffb6-e0be-4b7f-bf4b-ca6e5e375521	1345	Nguyen Arthur	b5c39029-221e-4457-a0c9-ab4d27cbf75d	arthur.tg@ptit.edu.vn	VKT100986	Nguyen Arthur (VKT100986)		b5c39029-221e-4457-a0c9-ab4d27cbf75d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fff2555e-d30f-47be-bfd3-6737a8e7950d	1035	Nguyễn Tiến Ban	8ca4ccd6-49a0-4bb3-bf0c-54e2fd57187f	bannt@ptit.edu.vn	KVT100285	Nguyễn Tiến Ban (KVT100285)		8ca4ccd6-49a0-4bb3-bf0c-54e2fd57187f	t	t	21	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f8b61e84-a4be-435f-b70b-b803dbc9daa0	1363	Vũ Văn Binh	eb3d1bf6-b0cd-4cf1-b740-033a3daaed98	binhvv@ptit.edu.vn	VKH101086	Vũ Văn Binh (VKH101086)		eb3d1bf6-b0cd-4cf1-b740-033a3daaed98	t	t	72	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b4725bbf-c38a-44d9-8a71-d4822f3e7378	851	Nguyễn Quang Biên	8710c4f1-1b4d-4384-bfd9-b60f284a7ded	biennq@ptit.edu.vn	KDT100873	Nguyễn Quang Biên (KDT100873)		8710c4f1-1b4d-4384-bfd9-b60f284a7ded	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
94117ed7-839a-4ff6-a7d4-2f0aff42bf69	943	Đào Thị Kim Biên	aac2afec-c8cb-43fd-9208-80756f9568ba		TG0348	Đào Thị Kim Biên (TG0348)		aac2afec-c8cb-43fd-9208-80756f9568ba	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d721d82d-8c55-49aa-a5e1-c0f94568c692	1213	Nguyễn Xuân Bá	e659576d-6f88-46f7-90dd-a86ef1a111c8	banx@ptit.edu.vn	KQT200487	Nguyễn Xuân Bá (KQT200487)		e659576d-6f88-46f7-90dd-a86ef1a111c8	t	t	177	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
428cb9f6-acad-4853-ba4d-fe05e37b9a59	968	Kim Ngọc Bách	84b2616b-4ee3-4a95-8f82-ec18a7d64d2a	bachkn@ptit.edu.vn	KCN100968	Kim Ngọc Bách (KCN100968)		84b2616b-4ee3-4a95-8f82-ec18a7d64d2a	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ae0a488-58ad-4d67-8352-da097c90a8e8	1299	Vương Đình Bách	57b79fbd-a899-49c3-8b53-aabcf4c904f1	bachvd@ptit.edu.vn	VPH100020	Vương Đình Bách (VPH100020)		57b79fbd-a899-49c3-8b53-aabcf4c904f1	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
989eb123-68a3-4ec5-ad06-f562965453bc	913	Nguyễn Thị Báu	2ab8be8f-1886-470b-b29b-be9dbb270e7e		TG0130	Nguyễn Thị Báu (TG0130)		2ab8be8f-1886-470b-b29b-be9dbb270e7e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
db61a654-9027-4349-bf15-9ad19da3d7f5	376	Đào Thị Bé	59c93a02-ede1-4fbc-8f08-737efbcd46a0	bedt@ptit.edu.vn	TDV100159	Đào Thị Bé (TDV100159)		59c93a02-ede1-4fbc-8f08-737efbcd46a0	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
34580a92-454a-43e0-ab5b-0f47b4610c44	125	Nguyễn Thanh Bình	f1ffaeb4-febc-48b5-8220-706060d62afa	binhnt@ptit.edu.vn	KDT200451	Nguyễn Thanh Bình (KDT200451)		f1ffaeb4-febc-48b5-8220-706060d62afa	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
13d949ac-065a-46ae-9efc-5e06d4475c3a	854	Nguyễn Thanh Bình	28d7c99e-4dfd-4fd8-a746-9b44e6946306	binhnt1@ptit.edu.vn	KDT100871	Nguyễn Thanh Bình (KDT100871)		28d7c99e-4dfd-4fd8-a746-9b44e6946306	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
67e8c51b-5534-4d2f-a8fc-de29dc00d7ae	1079	Nguyễn Thị Thanh Bình	5a90382b-a2f2-4eb8-a61c-1af6cf20d280	binhntt@ptit.edu.vn	KQT100861	Nguyễn Thị Thanh Bình (KQT100861)		5a90382b-a2f2-4eb8-a61c-1af6cf20d280	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6fb4ba21-0493-44d6-a79f-da7a8a178b80	138	Nguyễn Thị Thu Bình	d751704d-0103-4390-ac49-fa01e67f5ccb	binhntt1@ptit.edu.vn	KCN201010	Nguyễn Thị Thu Bình (KCN201010)		d751704d-0103-4390-ac49-fa01e67f5ccb	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1d5aee5a-a010-4841-a16a-333560bb34f5	730	Trần Quốc Bình	daae23fe-2114-42b4-a863-ae74463885bf		TG0023	Trần Quốc Bình (TG0023)		daae23fe-2114-42b4-a863-ae74463885bf	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf705648-500d-4a67-bce4-c6231e1b4a25	919	Trần Thanh Bình	01d8dfcb-e3e0-4e2a-9540-67e88c7f678d		TG0318	Trần Thanh Bình (TG0318)		01d8dfcb-e3e0-4e2a-9540-67e88c7f678d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5a1ce45c-5698-4dde-a327-4a228e8ad491	1412	Trần Thị Bình	BinhTT.B23CC018@stu.ptit.edu.vn	tranglou1003@gmail.com		Trần Thị Bình		dd20ead8-b83c-450d-ab2f-cd056191b75f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
112b406d-5211-407f-9aaf-7af8ed4089fa	342	Trần Thị Thanh Bình	b0044088-a97e-4a1b-b03c-4ff4b93690f4	binhttt@ptit.edu.vn	KCB100193	Trần Thị Thanh Bình (KCB100193)		b0044088-a97e-4a1b-b03c-4ff4b93690f4	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f4f19e0-0de3-4c48-a583-954b2ab571ac	1269	Trịnh Bá Phước Bình	9034730d-f75f-417f-89d7-7084ab42e1d6	binhtbp@ptit.edu.vn	TDT100990	Trịnh Bá Phước Bình (TDT100990)		9034730d-f75f-417f-89d7-7084ab42e1d6	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f61c35fd-c41a-4a9a-b7f5-73c0866db995	758	Đỗ Thanh Bình	c19edc81-9fc3-43c2-9355-ae0ef4f2ed8c	binhdt.tg@ptit.edu.vn	TG0581	Đỗ Thanh Bình (TG0581)		c19edc81-9fc3-43c2-9355-ae0ef4f2ed8c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
aa910fa1-9cd9-4669-9326-090db845ac6b	445	Đỗ Thái Bình	b8a1df51-918e-469e-87ac-6f835da3b25e	binhdt@ptit.edu.vn	VKT100586	Đỗ Thái Bình (VKT100586)		b8a1df51-918e-469e-87ac-6f835da3b25e	t	t	66	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d39534be-3c81-4fd0-859d-fafac5b000cc	831	Đỗ Đức Bình	eccd496e-2d47-4f98-8a18-e485a45bd64e	binhdd@ptit.edu.vn	KSD100954	Đỗ Đức Bình (KSD100954)		eccd496e-2d47-4f98-8a18-e485a45bd64e	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f5688240-b00e-4224-9d5e-e1f2b5a133f1	1086	Lê Thị Ngọc Bích	bb757334-8f19-4dd6-9231-66070a364272		TG0326	Lê Thị Ngọc Bích (TG0326)		bb757334-8f19-4dd6-9231-66070a364272	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
07f6f21f-b51a-49c8-ba45-d69806ca54e3	1247	Trần Thị Ngọc Bích	8f1e9155-3180-42ba-86a3-39b6e3418503	bichttn@ptit.edu.vn	VCN100894	Trần Thị Ngọc Bích (VCN100894)		8f1e9155-3180-42ba-86a3-39b6e3418503	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
440ca5e2-a7fa-4df3-8a0c-861b874c8e17	1253	Huỳnh Hữu Bằng	ce694cf4-17c3-4a13-ac75-f226bc3833df	banghh@ptit.edu.vn	TDT100919	Huỳnh Hữu Bằng (TDT100919)		ce694cf4-17c3-4a13-ac75-f226bc3833df	t	t	2	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
05af4890-bdf8-4318-a78e-4fee3b8c355f	1188	Lê Ngọc Bảo	005ee55b-2343-42aa-b3d8-bf63b18a01e9	baoln@ptit.edu.vn	KCN200741	Lê Ngọc Bảo (KCN200741)		005ee55b-2343-42aa-b3d8-bf63b18a01e9	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
940eca27-e334-4647-97c1-6350ac5ebea9	1457	Triệu Quân Bảo	tqbao279@gmail.com	tranglou1003@gmail.com		Triệu Quân Bảo			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e4044172-fb35-4133-be13-21b3408ec065	681	Nguyễn Sinh Bảy	2b604625-f04e-4b77-9894-e7890d186b86		TG0382	Nguyễn Sinh Bảy (TG0382)		2b604625-f04e-4b77-9894-e7890d186b86	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dee07f78-9e6a-4735-84a6-76399d0eb8b7	1325	Đặng Hoài Bắc	203ecc42-3ac7-4301-9b87-d9196c9a8e2c	bacdh@ptit.edu.vn	BGD100003	Đặng Hoài Bắc (BGD100003)		203ecc42-3ac7-4301-9b87-d9196c9a8e2c	t	t	43	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c9bff5c4-7e38-4f3c-ae0e-49c94d787568	553	Chung Hải Bằng	7b87dc9d-7477-4e2c-b871-9212da35e056	bangch@ptit.edu.vn	PSV100048	Chung Hải Bằng (PSV100048)		7b87dc9d-7477-4e2c-b871-9212da35e056	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b6a2ac1e-2b2a-4b7f-afad-fa040ee09780	1162	Nguyễn Nhật Bằng	4905605a-2a3f-4b22-8eff-3b696e5ab321	bangnn@ptit.edu.vn	PGV200396	Nguyễn Nhật Bằng (PGV200396)		4905605a-2a3f-4b22-8eff-3b696e5ab321	t	t	14	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6b3b9ae3-3d95-4085-aa92-6ee4445c3cf2	859	Chu Văn Bền	f7e7915f-1dc1-46fb-987b-6500c4a80b97	bencv@ptit.edu.vn	KDT100978	Chu Văn Bền (KDT100978)		f7e7915f-1dc1-46fb-987b-6500c4a80b97	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
043f75a5-c0ad-48a4-9b9c-114bf4130f4d	9	Demo Cán Bộ	DEMOCB	tranglou1003@gmail.com		Demo Cán Bộ		democb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
304ada61-851d-439b-afb1-af45d677f594	584	Nguyễn Minh Chi	5d6edace-f884-4cf9-9b0f-6a202c106798	chinm@ptit.edu.vn	PKT100628	Nguyễn Minh Chi (PKT100628)		5d6edace-f884-4cf9-9b0f-6a202c106798	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e52c5ce2-b5d8-48b0-b97b-b20c92a666d3	279	Nguyễn Quỳnh Chi	fd72ba3b-1fa8-4a0c-9cfd-0922ac5d6147	chinq@ptit.edu.vn	KCN100251	Nguyễn Quỳnh Chi (KCN100251)		fd72ba3b-1fa8-4a0c-9cfd-0922ac5d6147	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
194d8f22-a5b9-4571-ac96-ea61889af3c5	471	Nguyễn Thị Kim Chi	4d9d9373-5eb6-48fb-a102-20a6d8caa4f2	chintk@ptit.edu.vn	VKT100563	Nguyễn Thị Kim Chi (VKT100563)		4d9d9373-5eb6-48fb-a102-20a6d8caa4f2	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9a03972-f4ba-4a8d-b237-aa942ca3421e	651	Trần Thị Phương Chi	79a74d3b-5cc7-497d-997d-8f594a8dda86		TG0588	Trần Thị Phương Chi (TG0588)		79a74d3b-5cc7-497d-997d-8f594a8dda86	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cae0f6d4-832b-46a3-884b-11c9a2a5d20b	703	Đào Thị Chinh	882ebb39-b343-482c-a621-bd270fa1a6d6		TG0569	Đào Thị Chinh (TG0569)		882ebb39-b343-482c-a621-bd270fa1a6d6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
662b57b3-c54f-4066-85af-f9bf78539ff6	21	Ngô Hán Chiêu	51722327-ee9c-4203-a28f-fad02f73fe71	chieunh@ptit.edu.vn	VKH100550	Ngô Hán Chiêu (VKH100550)		51722327-ee9c-4203-a28f-fad02f73fe71	t	t	237	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe693cf7-c0b9-4a40-bdc4-a45563f040ba	551	Đỗ Đức Chiến	d375ba12-5f04-40e4-823a-d4bfe012f460	chiendd@ptit.edu.vn	PSV100050	Đỗ Đức Chiến (PSV100050)		d375ba12-5f04-40e4-823a-d4bfe012f460	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e1d8baa7-5939-49f6-b46a-805fc1b8548c	1026	Bùi Quang Chung	4665ebc7-944e-4556-8f4d-fde4c5554175	chungbq@ptit.edu.vn	KVT100805	Bùi Quang Chung (KVT100805)		4665ebc7-944e-4556-8f4d-fde4c5554175	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
29490a8f-592b-43f8-9c2a-9c9e742a8e44	27	Phạm Đình Chung	3f84617f-d1de-445e-81c7-a843a3a3d0df	chungpd@ptit.edu.vn	VKH100547	Phạm Đình Chung (VKH100547)		3f84617f-d1de-445e-81c7-a843a3a3d0df	t	t	73	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bca79fac-ee07-4f7f-9dba-26860bf7b327	1424	Đoàn Ngọc Chung	ChungDN.B23CC023@stu.ptit.edu.vn	tranglou1003@gmail.com		Đoàn Ngọc Chung		cfdc6af8-d742-434f-a197-c17c8d854487	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0d8677fe-6d8b-4b94-a018-1b6239321639	1191	Nguyễn Ngọc Chân	86881761-de22-4a35-879a-16cdf1009f8a	channn@ptit.edu.vn	KCN200725	Nguyễn Ngọc Chân (KCN200725)		86881761-de22-4a35-879a-16cdf1009f8a	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b43163e2-4d59-4a3f-8967-dfee872d68c5	241	Lê Hải Châu	a2a8e6be-3815-46c7-9de8-2eaa59ea4af1	chaulh@ptit.edu.vn	KVT100290	Lê Hải Châu (KVT100290)		a2a8e6be-3815-46c7-9de8-2eaa59ea4af1	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
42405889-4fd8-47b5-856e-684ec32413bf	180	Nguyễn Cảnh Châu	98b65e1f-80e0-4160-b77d-5d427b986b0c	chaunc@ptit.edu.vn	KDP100347	Nguyễn Cảnh Châu (KDP100347)		98b65e1f-80e0-4160-b77d-5d427b986b0c	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d194e73-6e33-45dc-8f6a-2bcd318065bf	164	Nguyễn Toàn Bảo Châu	99cf806c-00ea-48a8-b7bf-c91358dbc511	chauntb@ptit.edu.vn	KCB200736	Nguyễn Toàn Bảo Châu (KCB200736)		99cf806c-00ea-48a8-b7bf-c91358dbc511	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
56737fa6-d7e9-44fc-8c7e-54e7ad95e0ec	1240	Phạm Long Châu	8cf5b8bf-c458-47e6-93f6-6215af006619	chaupl@ptit.edu.vn	VKT100983	Phạm Long Châu (VKT100983)		8cf5b8bf-c458-47e6-93f6-6215af006619	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bfce43b0-d40b-45e0-ba1b-4ad325bd0565	781	Đặng Đình Châu	77c4f19c-2958-420e-822f-1d8a4d709e05		TG0546	Đặng Đình Châu (TG0546)		77c4f19c-2958-420e-822f-1d8a4d709e05	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3c82d3af-fc76-4e3f-abe6-33cd39f61be3	760	Nguyễn Văn Chính	f3d11b48-e32a-4fe0-a8bc-ff3549fc09c6		TG0442	Nguyễn Văn Chính (TG0442)		f3d11b48-e32a-4fe0-a8bc-ff3549fc09c6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
93d4997d-5756-4581-a411-74bc9f6f9c7f	33	Trần Thiện Chính	c10b7217-f661-418b-83fd-3a2f4909f57b	chinhtt@ptit.edu.vn	VKH100520	Trần Thiện Chính (VKH100520)		c10b7217-f661-418b-83fd-3a2f4909f57b	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5c719898-33ba-4158-8aa9-2b46125470b9	673	Vương Quốc Chính	4d985f5f-3709-4645-b090-88fa93f3ab60		TG0432	Vương Quốc Chính (TG0432)		4d985f5f-3709-4645-b090-88fa93f3ab60	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a1116928-f932-4118-990c-63328c4c1504	511	Nguyễn Văn Chương	91426664-7350-402f-9437-78b9fdba13f4	chuongnv@ptit.edu.vn	VCN100604	Nguyễn Văn Chương (VCN100604)		91426664-7350-402f-9437-78b9fdba13f4	t	t	243	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2ff0c5e-650a-4e2a-bbb8-1dad69064098	1361	Phan Thanh Chương	8d6153e0-a9d5-4e3c-b462-6f91dadb77f4	chuongpt@ptit.edu.vn	KCN201101	Phan Thanh Chương (KCN201101)		8d6153e0-a9d5-4e3c-b462-6f91dadb77f4	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ccf218f7-8a5c-45da-870f-22584423f65c	526	Đỗ Xuân Chợ	50400bef-bf2f-470a-978c-ce91bf1c1773	chodx@ptit.edu.vn	KAT100252	Đỗ Xuân Chợ (KAT100252)		50400bef-bf2f-470a-978c-ce91bf1c1773	t	t	219	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5c02a2a0-eab3-4dac-a35b-7cec968ffee9	1390	Trần Nguyên Các	f4f975ac-5fb4-4f84-98f7-df6acf020f25	cactn@ptit.edu.vn	VLD101119	Trần Nguyên Các (VLD101119)		f4f975ac-5fb4-4f84-98f7-df6acf020f25	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d1cd5f2-3237-45b9-85d8-0b5f4513f6c9	621	Bùi Văn Công	f0849288-e371-42d6-b052-971079f1e656		TG0426	Bùi Văn Công (TG0426)		f0849288-e371-42d6-b052-971079f1e656	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
96af5bc1-173c-4892-8ebb-8a11be308a04	1018	Lê Xuân Công	8226df2c-9895-47a5-98cc-9437aa0a1e4f	conglx@ptit.edu.vn	KVT100869	Lê Xuân Công (KVT100869)		8226df2c-9895-47a5-98cc-9437aa0a1e4f	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b7cf80f8-5830-46ac-8bce-288df266c1a4	427	Trần Tiến Công	da52b189-2d39-486f-9541-e59a6af09d9b	congtt@ptit.edu.vn	KTN100691	Trần Tiến Công (KTN100691)		da52b189-2d39-486f-9541-e59a6af09d9b	t	t	240	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
424800c5-7b4e-429e-a4e5-6b2959227a8b	1267	Trần Văn Công	ee771155-9f31-4924-a7c0-6b5da845cf57	congtv@ptit.edu.vn	TDT100635	Trần Văn Công (TDT100635)		ee771155-9f31-4924-a7c0-6b5da845cf57	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
732d55cc-7dd0-4cf1-94fe-4c0cda1d2cca	626	Trần Đăng Công	e2ede66c-4a9e-4a50-ad36-e2c8be6393cd		TG0400	Trần Đăng Công (TG0400)		e2ede66c-4a9e-4a50-ad36-e2c8be6393cd	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e1b65ddc-1dad-4590-81b0-a9908a2bccdb	617	Hoàng Kim Cúc	1bf2ca0e-9b2b-4222-9ee2-c6f651ec80a3	hkcuc@ptit.edu.vn	PGV100110	Hoàng Kim Cúc (PGV100110)		1bf2ca0e-9b2b-4222-9ee2-c6f651ec80a3	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7bb0acd-a349-4b2c-908e-7ea7d80fa0a8	365	Nguyễn Thị Cúc	bfa0ac68-0d35-4c34-b799-64631dd06678	cucnt@ptit.edu.vn	TDV100160	Nguyễn Thị Cúc (TDV100160)		bfa0ac68-0d35-4c34-b799-64631dd06678	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
46d661e5-d47e-4ed2-85ab-919693656378	406	Lê Văn Cưng	293bd9b0-7f3d-4590-9c84-3e73011da061	cunglv@ptit.edu.vn	PTH200506	Lê Văn Cưng (PTH200506)		293bd9b0-7f3d-4590-9c84-3e73011da061	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
940e0771-06a6-4cb9-b7e2-f96562b31221	947	Nghiêm Thị Kim Cương	9c7fc5a1-df40-49c3-ae30-d882df3bb47f		TG0091	Nghiêm Thị Kim Cương (TG0091)		9c7fc5a1-df40-49c3-ae30-d882df3bb47f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
602e8d13-7a31-4609-a0a3-11e93bf0172f	527	Nguyễn Hoa Cương	f06e602d-62e2-4254-9c78-24c5e253da53	cuongnh@ptit.edu.vn	KAT100664	Nguyễn Hoa Cương (KAT100664)		f06e602d-62e2-4254-9c78-24c5e253da53	t	t	219	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fd9042af-a18d-47fe-bb51-e7d49c1e77d2	983	Huỳnh Thúc Cước	136706c1-4b14-4e02-aa61-5fbb1a780cb4		TG0010	Huỳnh Thúc Cước (TG0010)		136706c1-4b14-4e02-aa61-5fbb1a780cb4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eecddc55-0c50-4f93-bf72-54e0a2c33758	852	Chu Văn Cường	59c3dfec-2e33-4903-b313-cebf949160ac	cuongcv@ptit.edu.vn	KDT100872	Chu Văn Cường (KDT100872)		59c3dfec-2e33-4903-b313-cebf949160ac	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
42a53857-7513-4256-b8cf-68aff8702e71	1438	Hoàng Mạnh Cường	2e68e1d2-7da4-4a29-973b-240148a0b335	cuonghm1@ptit.edu.vn	KCN101137	Hoàng Mạnh Cường (KCN101137)		2e68e1d2-7da4-4a29-973b-240148a0b335	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d141fb57-c856-40f9-9905-ddbc27b1c63d	1180	Huỳnh Minh Cường	ce5cd051-4f6f-429d-bb07-0e34f05dc374	cuonghm@ptit.edu.vn	KCB200922	Huỳnh Minh Cường (KCB200922)		ce5cd051-4f6f-429d-bb07-0e34f05dc374	t	t	192	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
452353bc-848d-445e-b3c8-cf02eb4ba3b7	1359	Lê Quốc Cường	c4e52a6d-a254-48fc-b72c-1f6cc6098fa4	cuonglq@ptit.edu.vn	KVT201085	Lê Quốc Cường (KVT201085)		c4e52a6d-a254-48fc-b72c-1f6cc6098fa4	t	t	7	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c1689f76-e806-455c-9a5c-5abca0eb3883	1164	Nghiêm Xuân Cường	4b8f056a-9e18-4ca1-bf04-6c9b92f6a368	cuongnx@ptit.edu.vn	PGV200397	Nghiêm Xuân Cường (PGV200397)		4b8f056a-9e18-4ca1-bf04-6c9b92f6a368	t	t	14	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ea413fa8-c45f-4ad8-9228-1b9322a5a2b1	1122	Nguyễn Cao Cường	83113bfa-3a44-4627-ac1f-4a17e75075ac		TG0349	Nguyễn Cao Cường (TG0349)		83113bfa-3a44-4627-ac1f-4a17e75075ac	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
29caffe2-460e-4ab8-a2d2-5c781ac70bcd	1431	Nguyễn Quốc Cường	cuongnq.b23cc026@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Quốc Cường		91b3f9ee-22ef-433b-a1ef-abf0afdbdd8f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
27f0e8e0-6d6c-4f80-bd7c-ad85b9701e47	962	Phan Hải Cường	b54edd47-3691-42cc-b6ac-060d03e255e1	cuongph.tg@ptit.edu.vn	TG0026	Phan Hải Cường (TG0026)		b54edd47-3691-42cc-b6ac-060d03e255e1	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
27b219a8-de7b-46e9-9763-b28706fbf293	1400	Phạm Tuấn Cường	0e74cd03-6c59-43d5-af22-621da1114f94	cuongpt@ptit.edu.vn	TKT101117	Phạm Tuấn Cường (TKT101117)		0e74cd03-6c59-43d5-af22-621da1114f94	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c42ee394-2568-4b83-bea7-870afed91a13	433	Phạm Văn Cường	9ab3e887-f597-4055-8695-e292300bb94f	cuongpv@ptit.edu.vn	KTN100244	Phạm Văn Cường (KTN100244)		9ab3e887-f597-4055-8695-e292300bb94f	t	t	240	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
96f181aa-9d99-4f33-8271-f339463bd67e	432	Phạm Đức Cường	a65d6848-58e1-4adc-8748-9765eefdfa4e	cuongpd@ptit.edu.vn	KTN100988	Phạm Đức Cường (KTN100988)		a65d6848-58e1-4adc-8748-9765eefdfa4e	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b901e094-a7e8-409b-9f5f-c76c63cf7855	992	Thạc Bình Cường	6d1c1cc6-b4ff-486c-a14e-9d31a65b24b5		TG0299	Thạc Bình Cường (TG0299)		6d1c1cc6-b4ff-486c-a14e-9d31a65b24b5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3e4a7f86-556a-4ca9-bc40-34cdae55408d	724	Đoàn Trung Cường	03aba055-664c-48cb-a819-3f5852c7d544		TG0365	Đoàn Trung Cường (TG0365)		03aba055-664c-48cb-a819-3f5852c7d544	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c4de4cc1-c892-4858-bc07-6f49c5019742	732	Đặng Tiến Cường	5102a462-c734-4e46-ba74-10db5c8131ec		TG0558	Đặng Tiến Cường (TG0558)		5102a462-c734-4e46-ba74-10db5c8131ec	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ddd1f76e-3e12-4bd4-8d31-27cecdcda077	641	Cao Xuân Cảnh	0ae7fe69-1bd9-4dbd-8c69-ef24d5a76a4e		TG0510	Cao Xuân Cảnh (TG0510)		0ae7fe69-1bd9-4dbd-8c69-ef24d5a76a4e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
739633d4-7217-44f2-829c-9c91baa8668e	878	Nguyễn Huy Cảnh	0deff1d3-2468-44bf-adab-372a45f5a6d2		TG0268	Nguyễn Huy Cảnh (TG0268)		0deff1d3-2468-44bf-adab-372a45f5a6d2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e378f621-c1e8-480d-b402-b3e5bd1a2c0f	1022	Nguyễn Hữu Cầm	bcdbd0dc-2101-46b5-a8ae-0ae68c25a940	camnh@ptit.edu.vn	KVT100905	Nguyễn Hữu Cầm (KVT100905)		bcdbd0dc-2101-46b5-a8ae-0ae68c25a940	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ad64130d-40ac-4c5b-99b5-553dbfa357de	933	Lê Bá Cầu	fd6d54e8-b44b-4f95-b02b-4609b1e6b49f		TG0021	Lê Bá Cầu (TG0021)		fd6d54e8-b44b-4f95-b02b-4609b1e6b49f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cbf05329-4b9e-479a-a58a-7ddee6539485	1072	Trần Xuân Cầu	52486367-4aec-47b0-b18b-527346bca7ac	cautx@ptit.edu.vn	KQT100948	Trần Xuân Cầu (KQT100948)		52486367-4aec-47b0-b18b-527346bca7ac	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
297fef3e-bada-4eb6-94e7-d368599583b1	1380	Bùi Thái Thanh Danh	33dba05c-3864-46e1-bd3a-5d157b024bb1	danhbtt@ptit.edu.vn	KQT201111	Bùi Thái Thanh Danh (KQT201111)		33dba05c-3864-46e1-bd3a-5d157b024bb1	t	t	177	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6f4c5cd0-1930-468c-865a-dece290abe96	303	Nguyễn Quốc Dinh	3f969072-0a65-403f-a2ad-cbfd5e2ec5a3	dinhnq@ptit.edu.vn	KDT100229	Nguyễn Quốc Dinh (KDT100229)		3f969072-0a65-403f-a2ad-cbfd5e2ec5a3	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d47b9cb0-b8bb-4b1a-8a9f-d1e4e64bea33	1142	Phan Thị Bích Diễm	6c95541f-1b41-44a4-9584-b2c1c5705aa0	diemptb@ptit.edu.vn	TKT200382	Phan Thị Bích Diễm (TKT200382)		6c95541f-1b41-44a4-9584-b2c1c5705aa0	t	t	12	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
205d60d1-157b-4f1d-818b-8e97ec061808	423	Võ Thị Diễm	db1e0279-3f4f-42d4-89dc-70cff7b5dfb4	diemvt@ptit.edu.vn	PTH200723	Võ Thị Diễm (PTH200723)		db1e0279-3f4f-42d4-89dc-70cff7b5dfb4	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a03e36c3-6aa9-4282-8d9a-fe214694532e	218	Lê Thị Ngọc Diệp	08f39f12-6c17-4214-982e-464f6e480df1	diepletn@ptit.edu.vn	KQT100331	Lê Thị Ngọc Diệp (KQT100331)		08f39f12-6c17-4214-982e-464f6e480df1	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
783a25a4-b745-4f2b-9b12-1c8c4f28ea1d	1195	Lưu Thị Bích Diệp	521bded9-36e5-44dc-b497-fe67d7896025	diepltb@ptit.edu.vn	KCN200745	Lưu Thị Bích Diệp (KCN200745)		521bded9-36e5-44dc-b497-fe67d7896025	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
653c736d-7952-4711-8d0b-5f2366fc6220	450	Nguyễn Thị Bích Diệp	3777f148-661c-4d21-9f64-6e34e97373d7	diepntb@ptit.edu.vn	VKT100936	Nguyễn Thị Bích Diệp (VKT100936)		3777f148-661c-4d21-9f64-6e34e97373d7	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
411e4efd-ccf0-40a5-9f6d-fc470b31297e	483	Nguyễn Thị Ngọc Diệp	811028ba-f0fd-4b69-b191-6d3216576f1c	diepntn@ptit.edu.vn	VKT100766	Nguyễn Thị Ngọc Diệp (VKT100766)		811028ba-f0fd-4b69-b191-6d3216576f1c	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7809c0a8-da40-47ef-a257-331c6e1867a8	30	Trần Hoàng Diệu	DIEUTH	tranglou1003@gmail.com		Trần Hoàng Diệu		vkh100529	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb484850-9233-4ef0-9cd3-52faa51f369f	330	Đỗ Thị Diệu	8ad8071d-463c-41b2-b207-bbd1050a1a38	dieudt@ptit.edu.vn	KCB100194	Đỗ Thị Diệu (KCB100194)		8ad8071d-463c-41b2-b207-bbd1050a1a38	t	t	229	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8861a760-4a5c-4faa-a1ab-8e92292f3afe	66	Phùng Văn Doanh	4f614d31-f564-4cc5-9d8f-62ac631162ac	doanhpv@ptit.edu.vn	VKH100963	Phùng Văn Doanh (VKH100963)		4f614d31-f564-4cc5-9d8f-62ac631162ac	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dcd2f4b6-653e-4d05-87b8-f602418a01ff	987	Phạm Văn Doanh	fc309fe9-c2b4-4131-bc4e-8fae3fc580ee		TG0292	Phạm Văn Doanh (TG0292)		fc309fe9-c2b4-4131-bc4e-8fae3fc580ee	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d00afa18-fc5a-4aa0-8383-23198fb1e77b	798	Bùi Thị Huyền Dung	5ca1e385-12ad-42e9-8c88-3dbce40b6ce3	dungbth@ptit.edu.vn	TKT100123	Bùi Thị Huyền Dung (TKT100123)		5ca1e385-12ad-42e9-8c88-3dbce40b6ce3	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ec73818d-e8fe-4f53-892b-6a7c902d3b7e	891	Lê Dung	681ab5dc-bfc4-437e-84d9-69eda1cf6b33	dungle.tg@ptit.edu.vn	2025.KCB1.15.799	Lê Dung (2025.KCB1.15.799)		681ab5dc-bfc4-437e-84d9-69eda1cf6b33	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b0a1f057-694f-4e6e-a6fb-205e37b408a5	216	Nguyễn Thùy Dung	a47f2763-13ca-4510-9759-6898bd98ca55	ntdung@ptit.edu.vn	KQT100332	Nguyễn Thùy Dung (KQT100332)		a47f2763-13ca-4510-9759-6898bd98ca55	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cf6117ba-f52e-4a17-80f0-8d1f082ff8ee	358	Nguyễn Thị Dung	a0944dd7-8593-47be-8f21-d038e59187d7	dungnt@ptit.edu.vn	KCB100195	Nguyễn Thị Dung (KCB100195)		a0944dd7-8593-47be-8f21-d038e59187d7	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ecccfc50-c88d-4753-8998-fe8f00ffbb76	1024	Nguyễn Thị Phương Dung	4fdd14b0-0b0f-4ce0-b971-815be69cb37d	dungntp1@ptit.edu.vn	KVT100312	Nguyễn Thị Phương Dung (KVT100312)		4fdd14b0-0b0f-4ce0-b971-815be69cb37d	t	t	21	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f0161dda-3de8-40fe-9b82-5a252140bbb1	467	Nguyễn Thị Phương Dung	ef2a1e20-4679-46f0-9dbd-f77f8585416c	dungntp@ptit.edu.vn	VKT100571	Nguyễn Thị Phương Dung (VKT100571)		ef2a1e20-4679-46f0-9dbd-f77f8585416c	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
356804ee-1bdd-4bfe-81b3-e4daa2387ce9	1190	Phan Cảnh Thị Cẩm Dung	0ea06488-e135-47ab-b4f5-cf523a659938	dungpctc@ptit.edu.vn	KCN200747	Phan Cảnh Thị Cẩm Dung (KCN200747)		0ea06488-e135-47ab-b4f5-cf523a659938	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f97d11d-4da3-4edc-8b71-88e5e702af2b	539	Phạm Thị Kim Dung	c9489ef4-1b9e-4fb1-b92f-18fc4bcd0c7b	dungpk@ptit.edu.vn	PTC100038	Phạm Thị Kim Dung (PTC100038)		c9489ef4-1b9e-4fb1-b92f-18fc4bcd0c7b	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6295f8fa-88f2-4453-bad5-718bf7a88957	709	Trần Bá Dung	209125dd-4de7-492f-b757-1f341a23ec71		TG0396	Trần Bá Dung (TG0396)		209125dd-4de7-492f-b757-1f341a23ec71	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f5b0173-fc77-4ded-9e62-4c68cdd48640	1262	Vũ Kim Dung	d3960a35-e033-4185-9466-89ef5fbcb345	dungvk@ptit.edu.vn	VLD100818	Vũ Kim Dung (VLD100818)		d3960a35-e033-4185-9466-89ef5fbcb345	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80c13a58-2238-4c5c-83ef-0cb1e9891244	309	Dương Quang Duy	03d08851-f45e-4f2b-abdd-06066ff6e742	duydq@ptit.edu.vn	KDT100831	Dương Quang Duy (KDT100831)		03d08851-f45e-4f2b-abdd-06066ff6e742	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c277bc73-6908-461a-8c66-47b1bfbcb1ec	1377	Lê Minh Duy	5acaae5e-a44d-4413-9793-7dab041983b1	duylm@ptit.edu.vn	KTN101092	Lê Minh Duy (KTN101092)		5acaae5e-a44d-4413-9793-7dab041983b1	t	t	253	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5a477c27-dd0c-4eaa-b611-4fd7f9cddd3f	130	Lê Ngọc Thanh Duy	c157a239-cad4-44e9-965e-df9611d03aae	duylnt@ptit.edu.vn	KCN200740	Lê Ngọc Thanh Duy (KCN200740)		c157a239-cad4-44e9-965e-df9611d03aae	t	t	251	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bfe004df-0ca1-4399-9aff-349f8725be7c	91	Nguyễn Lưu Nhật Duy	DuyNLN.B23CC048@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Lưu Nhật Duy		2294b377-ffce-4f99-b7fe-fae0197d71a0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6caf221f-9c33-4063-b12d-bbca871f42ec	143	Nguyễn Ngọc Duy	3ba553b1-2ee7-4098-8682-2b4ff811d90c	duynn@ptit.edu.vn	KCN200428	Nguyễn Ngọc Duy (KCN200428)		3ba553b1-2ee7-4098-8682-2b4ff811d90c	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f14c5c66-223c-4dd5-86e2-2e5d3d564417	856	Nguyễn Quang Duy	8b3b3949-4ae3-4536-b280-4c135e5fa827	duynq@ptit.edu.vn	KDT100946	Nguyễn Quang Duy (KDT100946)		8b3b3949-4ae3-4536-b280-4c135e5fa827	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8327a881-aed4-4d3d-a115-d9b89df77964	240	Nguyễn Thị Hằng Duy	1ad6d159-8da0-47dd-a22b-02c5a861475c	duynth@ptit.edu.vn	KVT100291	Nguyễn Thị Hằng Duy (KVT100291)		1ad6d159-8da0-47dd-a22b-02c5a861475c	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5dfb5372-d1d5-4ec0-ab0f-58ad9308946b	1428	Nguyễn Tiến Duy	DuyNT.B24CC094@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Tiến Duy		1e90d651-0994-4c30-87f0-ee801bab820b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
839a7afe-7f4c-4fa0-9ea5-c62fefa730c7	528	Phạm Hoàng Duy	f66107b3-6aee-45bf-851e-d278300d75cd	duyph@ptit.edu.vn	KAT100255	Phạm Hoàng Duy (KAT100255)		f66107b3-6aee-45bf-851e-d278300d75cd	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e0f2b4d0-8838-43cf-8d13-cdee6c9ca79b	121	Phạm Thế Duy	3aa0311e-2181-4cdb-8576-90f13199892f	duypt@ptit.edu.vn	PGV200454	Phạm Thế Duy (PGV200454)		3aa0311e-2181-4cdb-8576-90f13199892f	t	t	14	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
37405833-7a34-4beb-95ad-c239cd00d8b7	1194	Trương Vĩnh Trường Duy	289eb560-d8f2-409a-aa4c-1cb8201a93d7	duytvt@ptit.edu.vn	KCN200726	Trương Vĩnh Trường Duy (KCN200726)		289eb560-d8f2-409a-aa4c-1cb8201a93d7	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
11459ba5-c441-4553-958c-736409be1e81	181	Trần Duy	81f75589-7c32-4c88-b7a8-199debaf5f97	tranduy@ptit.edu.vn	KDP100849	Trần Duy (KDP100849)		81f75589-7c32-4c88-b7a8-199debaf5f97	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
50596bf8-17f8-4484-9d3b-511e58aa558b	1153	Trần Trung Duy	fce1f7b8-450e-442b-9ebd-5f4364a14364	duytt@ptit.edu.vn	KVT200390	Trần Trung Duy (KVT200390)		fce1f7b8-450e-442b-9ebd-5f4364a14364	t	t	7	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6151bace-a9b4-4ecb-9866-1cc1b38acdfb	529	Đinh Trường Duy	21e12c06-c599-4a6f-bb4f-409bde4b642b	duydt@ptit.edu.vn	KAT100254	Đinh Trường Duy (KAT100254)		21e12c06-c599-4a6f-bb4f-409bde4b642b	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
483e6491-63bf-445d-ae63-4bfabb1a2180	1456	Đàm Khánh Duy	khanhduydam09@gmail.com	tranglou1003@gmail.com		Đàm Khánh Duy			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d07247bc-f428-424d-8d12-ed877c9b3848	1276	Nguyễn Thị Duyên	1215e64b-faf3-494e-afed-873c16ba8d5e	duyennt@ptit.edu.vn	TDT100866	Nguyễn Thị Duyên (TDT100866)		1215e64b-faf3-494e-afed-873c16ba8d5e	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6d7e5e8d-8f84-4d34-959a-b72536cb58d3	995	Lê Thị Thùy Duơng	9f011531-df60-4fb4-a15d-59f459c5e402		TG0084	Lê Thị Thùy Duơng (TG0084)		9f011531-df60-4fb4-a15d-59f459c5e402	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1d15ce14-dc1e-48b2-8b0c-77588a14c0b3	827	Nguyễn Văn Dũng	3c59a5ef-0e46-4305-849f-ceb96b3f5357	dungnguyen@ptit.edu.vn	KSD100675	Nguyễn Văn Dũng (KSD100675)		3c59a5ef-0e46-4305-849f-ceb96b3f5357	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
feef1ba6-39d5-4e36-81e1-ec50aff19abe	310	Lương Công Duẩn	bf7b778a-8ed4-4c52-8e22-cf4be62ef6f0	duanlc@ptit.edu.vn	KDT100230	Lương Công Duẩn (KDT100230)		bf7b778a-8ed4-4c52-8e22-cf4be62ef6f0	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
494e1577-6a8b-41f2-97f0-4c1ba6c1fcc6	869	Lương Công Duẩn	c7f57d3f-a966-4eff-ba4c-28aa97a938ae		TG0345	Lương Công Duẩn (TG0345)		c7f57d3f-a966-4eff-ba4c-28aa97a938ae	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
92d02567-2f81-42c1-994b-a93c32d3d07b	302	Bùi Thị Dân	e746aede-80d0-46f2-8592-933a0433edb5	danbt@ptit.edu.vn	KDT100228	Bùi Thị Dân (KDT100228)		e746aede-80d0-46f2-8592-933a0433edb5	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8fed022a-befd-4ff0-91b4-43223508be37	1160	Nguyễn Văn Dân	a11ad38a-8c58-4e99-89ef-96df467c5e55	dannv@ptit.edu.vn	PDT200391	Nguyễn Văn Dân (PDT200391)		a11ad38a-8c58-4e99-89ef-96df467c5e55	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb821b4b-6e8f-4da0-bbe4-520b7949be38	1207	Lê Ngọc Dùng	c7fc2311-f347-4a7c-81ee-1d4d72fce729	dungln@ptit.edu.vn	KDT201049	Lê Ngọc Dùng (KDT201049)		c7fc2311-f347-4a7c-81ee-1d4d72fce729	t	t	180	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ed346768-6791-4ea4-ae76-d6b9b8bfc872	462	Bùi Nghĩa Dũng	ac16a517-1e18-4629-a042-79b4783c1b96	dungbn@ptit.edu.vn	VKT101011	Bùi Nghĩa Dũng (VKT101011)		ac16a517-1e18-4629-a042-79b4783c1b96	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
52e7f51a-bb51-4316-8526-9774ef423074	359	Hoàng Phi Dũng	dd97ab1f-1b3a-4840-9c4f-c3aa41996b7a	dunghp@ptit.edu.vn	KCB100196	Hoàng Phi Dũng (KCB100196)		dd97ab1f-1b3a-4840-9c4f-c3aa41996b7a	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
df83810a-adff-4392-94a2-ce297166f7a3	503	Hà Đình Dũng	a5082589-f1e0-4360-a7e0-82ac64aa0237	dunghd@ptit.edu.vn	VCN100611	Hà Đình Dũng (VCN100611)		a5082589-f1e0-4360-a7e0-82ac64aa0237	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9fe49225-9962-4817-b0ee-a0040200a131	928	Kiều Anh Dũng	2564dabb-93ad-4068-816b-2ebdacc350e8		TG0031	Kiều Anh Dũng (TG0031)		2564dabb-93ad-4068-816b-2ebdacc350e8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
251b7617-55ba-40e8-831f-6e83e6ab6cc8	1348	Lê Hữu Dũng	cc10a092-21d4-4b5f-a50e-d72a21856a61	dunglh.tg@ptit.edu.vn	TG0623	Lê Hữu Dũng (TG0623)		cc10a092-21d4-4b5f-a50e-d72a21856a61	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0dc9f476-d9ea-4473-8586-6cf5116bf858	257	Lương Việt Dũng	c384ce34-4a78-45b0-910b-37be9b3be90d	dunglv@ptit.edu.vn	KVT100699	Lương Việt Dũng (KVT100699)		c384ce34-4a78-45b0-910b-37be9b3be90d	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e4adbec5-3a0b-4012-8e7e-e16697a1ee64	893	Nguyễn Chỉ Dũng	472e58c2-34ca-4f6f-8904-f3009a03ab22	dungnc.tg@ptit.edu.vn	2025.KCB1.15.801	Nguyễn Chỉ Dũng (2025.KCB1.15.801)		472e58c2-34ca-4f6f-8904-f3009a03ab22	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80ed749a-c001-4900-bd1a-8b5a61936056	1151	Nguyễn Duy Dũng	3f015d0f-79d2-478a-b413-64d5f017a5f6	dungnd1@ptit.edu.vn	PDT200883	Nguyễn Duy Dũng (PDT200883)		3f015d0f-79d2-478a-b413-64d5f017a5f6	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3d10a670-159b-4856-8952-1f523d287f06	1158	Nguyễn Hùng Dũng	244cc195-ebdb-430a-9769-a3b95e55eeb5	dungnh@ptit.edu.vn	PDT200392	Nguyễn Hùng Dũng (PDT200392)		244cc195-ebdb-430a-9769-a3b95e55eeb5	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
10179b8d-e280-4382-8d3f-f859ac284b37	282	Nguyễn Hải Dũng	ffbee478-f438-4b3b-93f8-dab2c140378d	dungnh01@ptit.edu.vn	KCN100692	Nguyễn Hải Dũng (KCN100692)		ffbee478-f438-4b3b-93f8-dab2c140378d	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7c4b4425-624f-4117-b199-21aca55add85	63	Nguyễn Mạnh Dũng	190387cb-5fea-4c7b-a53c-9e38d96d476d	dungnm1@ptit.edu.vn	VKH100231	Nguyễn Mạnh Dũng (VKH100231)		190387cb-5fea-4c7b-a53c-9e38d96d476d	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a0be8225-391c-41f8-9c3b-f8faa958d47f	1084	Nguyễn Việt Dũng	fdaba8d8-30ab-45b2-b4e1-1d95a7e74920	dungnv.tg@ptit.edu.vn	TG0346	Nguyễn Việt Dũng (TG0346)		fdaba8d8-30ab-45b2-b4e1-1d95a7e74920	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8b351668-0994-44a7-85e6-ebab174415e0	456	Nguyễn Việt Dũng	502d0d03-47ae-43e1-962b-95cb3045a427	dungnv@ptit.edu.vn	VKT100572	Nguyễn Việt Dũng (VKT100572)		502d0d03-47ae-43e1-962b-95cb3045a427	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
00a95980-3e70-4a14-8778-25e2f595bee8	20	Nguyễn Việt Dũng	f5b7051a-ddf5-4959-a2b0-444623cb4f40	dungnv1@ptit.edu.vn	VKH100878	Nguyễn Việt Dũng (VKH100878)		f5b7051a-ddf5-4959-a2b0-444623cb4f40	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3aabb5c3-554d-4e35-a4a8-cc7dd622b227	1367	Nguyễn Việt Dũng	a91823b0-c43e-4369-b588-f6d65409c7ca	nvdung@ptit.edu.vn	VKT100542	Nguyễn Việt Dũng (VKT100542)		a91823b0-c43e-4369-b588-f6d65409c7ca	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5659252e-4258-4023-a20c-718d357bae81	1378	Nguyễn Xuân Dũng	bb97fda4-174a-4745-8de4-e80db57d8aca	dungnx@ptit.edu.vn	VKH100962	Nguyễn Xuân Dũng (VKH100962)		bb97fda4-174a-4745-8de4-e80db57d8aca	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0eeff26f-f390-4fe0-a18d-6f9a647822c7	22	Ngô Quốc Dũng	4cfbc44b-2d1b-4637-b65d-6828732a4e59	dungnq@ptit.edu.vn	VKH100256	Ngô Quốc Dũng (VKH100256)	Phó Viện trưởng phụ trách	4cfbc44b-2d1b-4637-b65d-6828732a4e59	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f19db7fb-b147-453f-912f-3296465d1849	1434	Ngô Quốc Dũng	c6655cc7-52d3-4b0a-83c7-ff018843c808		TG0215	Ngô Quốc Dũng (TG0215)		c6655cc7-52d3-4b0a-83c7-ff018843c808	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fb6be2dc-1914-4ef3-9c6a-141d240cd245	661	Triệu Anh Dũng	118be3d2-9cc3-4645-b0c1-b88154106d6d		TG0525	Triệu Anh Dũng (TG0525)		118be3d2-9cc3-4645-b0c1-b88154106d6d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d8ec5b32-8282-414d-b227-6cd6e7327db3	317	Trương Cao Dũng	834ae484-b7da-4f89-b725-2bfffa8e4742	dungtc@ptit.edu.vn	KDT100232	Trương Cao Dũng (KDT100232)		834ae484-b7da-4f89-b725-2bfffa8e4742	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2fece09c-7afd-4bef-a5c8-5486b5d8afa6	396	Tân Hùng Dũng	f7f6c316-07e4-43d9-85b7-4ca38a68e1fe	dungth@ptit.edu.vn	KCN200898	Tân Hùng Dũng (KCN200898)		f7f6c316-07e4-43d9-85b7-4ca38a68e1fe	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
45db59a9-c91d-433a-969c-5dc88e4e7bd3	494	Đinh Văn Dũng	83b868fc-5984-49b6-9369-3cac96dc15b7	dvdung@ptit.edu.vn	VCN100621	Đinh Văn Dũng (VCN100621)		83b868fc-5984-49b6-9369-3cac96dc15b7	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
da0b7d95-1b05-49bc-91e2-8074d62e1e15	1048	Đinh Xuân Dũng	3a1bd654-fe1e-47cf-b00a-87a25ba69a26	dungdx.tg@ptit.edu.vn	TG0538	Đinh Xuân Dũng (TG0538)		3a1bd654-fe1e-47cf-b00a-87a25ba69a26	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
301c301a-ea78-4438-9526-9ac6c98b4cc6	375	Đàm Chí Dũng	d9a5b5e8-0fd2-46be-80ee-59e13fe32633	dungdc@ptit.edu.vn	TDV100161	Đàm Chí Dũng (TDV100161)		d9a5b5e8-0fd2-46be-80ee-59e13fe32633	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1d50d409-2505-4d8e-9347-41a8e27ef43b	50	Đặng Quang Dũng	8716befb-cb32-43be-b79c-98872741ad7d	dungdq@ptit.edu.vn	VKH101028	Đặng Quang Dũng (VKH101028)		8716befb-cb32-43be-b79c-98872741ad7d	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
72a45bed-f012-4fb2-ace3-dd380321df5f	270	Đỗ Tiến Dũng	47b1a4a6-910f-4df1-a449-eea8b5274f9e	dungdt@ptit.edu.vn	KCN100822	Đỗ Tiến Dũng (KCN100822)		47b1a4a6-910f-4df1-a449-eea8b5274f9e	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
be7f00ad-60c6-4a9e-9433-c411c90f0cbb	591	Đỗ Đình Dũng	0c88eaa2-40dd-41cd-80a8-e80180289d7a	dungdd@ptit.edu.vn	PKT101036	Đỗ Đình Dũng (PKT101036)		0c88eaa2-40dd-41cd-80a8-e80180289d7a	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
de78c917-f10a-4267-bc3f-1609671f30ea	946	Phạm Khánh Dư	223f0753-243d-4a10-a5af-3f540fd3a2da		TG0102	Phạm Khánh Dư (TG0102)		223f0753-243d-4a10-a5af-3f540fd3a2da	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
648b5c02-fdc7-4d8b-8063-9d1ed378062e	855	Hà Đình Dương	a1fe4afe-f15f-4b92-b17a-f4de200fa7e6	duonghd@ptit.edu.vn	KDT100889	Hà Đình Dương (KDT100889)		a1fe4afe-f15f-4b92-b17a-f4de200fa7e6	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe47e9d4-af27-4d55-9f92-f5ca23caac22	1020	Lâm Đức Dương	39ce1bc1-48c3-42dc-9b3e-70902a08e2c6	duongld@ptit.edu.vn	KTC101021	Lâm Đức Dương (KTC101021)		39ce1bc1-48c3-42dc-9b3e-70902a08e2c6	t	t	20	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
68eef673-13ab-40bd-8264-f7a49e5ebe19	1078	Nguyễn Hoàng Dương	a1fe42f4-68ce-4165-8df3-0f34e3e4b7c8	duongnh@ptit.edu.vn	KQT101048	Nguyễn Hoàng Dương (KQT101048)		a1fe42f4-68ce-4165-8df3-0f34e3e4b7c8	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bee0df9a-8219-499c-8c5b-104b65100020	792	Nguyễn Đình Dương	734641c7-6d73-4c08-89ff-1d5eea5c7bf9		TG0059	Nguyễn Đình Dương (TG0059)		734641c7-6d73-4c08-89ff-1d5eea5c7bf9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ebe274b-ee41-4b4a-a5a2-18ba2995c911	449	Ngô Thị Thuỳ Dương	f2d388e9-c4b2-4023-ab76-17e16ed6d9d1	duongntt@ptit.edu.vn	VKT100972	Ngô Thị Thuỳ Dương (VKT100972)		f2d388e9-c4b2-4023-ab76-17e16ed6d9d1	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
857a83c7-0d72-4b93-bc2f-e0a24d955670	958	Vũ Ngọc Thùy Dương	18792d26-e445-466f-988f-bbf510da2b12	duongvnt.tg@ptit.edu.vn	TG0336	Vũ Ngọc Thùy Dương (TG0336)		18792d26-e445-466f-988f-bbf510da2b12	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cdc70f98-d172-4022-bf9f-8b6dd005b7c1	1449	Đinh Hải Dương	1642782b-4c67-4f5b-a269-b7fb95897ba5	duongdh@ptit.edu.vn	VKH101151	Đinh Hải Dương (VKH101151)		1642782b-4c67-4f5b-a269-b7fb95897ba5	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb93978c-0434-47fb-8bde-47102d296092	505	Đào Đại Dương	517dc169-1878-4825-8fdf-25345483416d	duongdd1@ptit.edu.vn	VCN101008	Đào Đại Dương (VCN101008)		517dc169-1878-4825-8fdf-25345483416d	t	t	58	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3d66a799-b30f-489e-af15-d4fdbe8d9d0c	48	Đào Đức Dương	DUONGDD	tranglou1003@gmail.com		Đào Đức Dương		vkh100538	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc0495a6-8959-46d6-a16e-89d0cb33ccf4	525	Hoàng Xuân Dậu	7f63dc65-baf9-45e3-9b92-79276069641b	dauhx@ptit.edu.vn	KAT100245	Hoàng Xuân Dậu (KAT100245)		7f63dc65-baf9-45e3-9b92-79276069641b	t	t	77	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
40712a95-af0d-40e4-9014-70a0709fe9f6	97	Đỗ Văn Việt Em	a283412a-18a2-4f9b-9840-56adcdd6eefa	emdvv@ptit.edu.vn	KVT200494	Đỗ Văn Việt Em (KVT200494)		a283412a-18a2-4f9b-9840-56adcdd6eefa	t	t	171	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
759e4741-b8f4-4f23-bf35-6c0c128b29c6	12	Hà Hương Giang	ffd67e34-d9fe-4560-932b-162d1ad6513c	gianghh@ptit.edu.vn	VPH100012	Hà Hương Giang (VPH100012)		ffd67e34-d9fe-4560-932b-162d1ad6513c	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9b06d438-220a-43f1-b70e-77a85833061b	649	Lê Huyền Giang	459e25e4-d2f4-49ce-8305-7f549a148047		TG0439	Lê Huyền Giang (TG0439)		459e25e4-d2f4-49ce-8305-7f549a148047	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
05ab5252-7f9d-49a5-9593-12bba0977b14	461	Nguyễn Hoàng Giang	55dfe8b4-0472-41e6-98c0-13278797a284	giangnh@ptit.edu.vn	VKT100804	Nguyễn Hoàng Giang (VKT100804)		55dfe8b4-0472-41e6-98c0-13278797a284	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ed888942-a97c-40ca-8798-73c4c52bf0bb	950	Nguyễn Thị Giang	62ca04e7-1fd6-478f-8d2a-357fa53f4476		TG0108	Nguyễn Thị Giang (TG0108)		62ca04e7-1fd6-478f-8d2a-357fa53f4476	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0a399233-2b45-4dbc-b076-59eae7f2053e	1284	Nguyễn Thị Hương Giang	82ea1792-ba7c-4a0c-aa54-94b072783112	giangnth@ptit.edu.vn	VPH100014	Nguyễn Thị Hương Giang (VPH100014)		82ea1792-ba7c-4a0c-aa54-94b072783112	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a77aca8f-a2c2-4c87-9702-e7a424099095	1125	Phạm Minh Giang	44c22a98-78e5-4467-bf83-0ec3893a5f44		TG0317	Phạm Minh Giang (TG0317)		44c22a98-78e5-4467-bf83-0ec3893a5f44	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb7e8760-7422-4bb2-ab61-b7e525b9cfde	469	Trần Hương Giang	68b44259-af8a-42f4-9386-e90540ed5465	giangth@ptit.edu.vn	VKT100564	Trần Hương Giang (VKT100564)		68b44259-af8a-42f4-9386-e90540ed5465	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
284d3c6e-3b68-40dc-949a-1ba9224ac05b	564	Trần Thị Hương Giang	428eaf00-def7-419a-ba8d-7f735ef5750a	giangtth@ptit.edu.vn	PQL100070	Trần Thị Hương Giang (PQL100070)		428eaf00-def7-419a-ba8d-7f735ef5750a	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e819a0e3-abe4-4eb2-acc5-c3574703072a	473	Từ Thảo Hương Giang	629e9532-71db-41b4-b029-be191c46e93c	giangtth2@ptit.edu.vn	VKT100854	Từ Thảo Hương Giang (VKT100854)		629e9532-71db-41b4-b029-be191c46e93c	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f36bb6e7-6f49-4955-bd37-28e88ee93bd0	1347	Đặng Thu Giang	2ec0553d-5463-40e4-a316-6b5165d0582e	giangdt.tg@ptit.edu.vn	TG0627	Đặng Thu Giang (TG0627)		2ec0553d-5463-40e4-a316-6b5165d0582e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02aa8f05-8f17-413e-b95a-2396d305eed0	324	Đỗ Thuỳ Giang	85fb071b-15cf-4783-8b93-9c45ed7fe288	giangdt@ptit.edu.vn	KCB101023	Đỗ Thuỳ Giang (KCB101023)		85fb071b-15cf-4783-8b93-9c45ed7fe288	t	t	228	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
be6dc64f-04f1-4f58-ad5d-798caa62032a	1351	Chu Xuân Giao	40378f9c-51e3-48ef-b84b-fdedcde2bab5	giaocx.tg@ptit.edu.vn	TG0626	Chu Xuân Giao (TG0626)		40378f9c-51e3-48ef-b84b-fdedcde2bab5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5c27c91f-6705-4b99-b819-bcd87886d28a	829	Lê Ngọc Giao	a36205f7-4826-4d00-aab1-890e356996b2	giaoln@ptit.edu.vn	KSD100676	Lê Ngọc Giao (KSD100676)		a36205f7-4826-4d00-aab1-890e356996b2	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ce3d3484-41e1-4e69-b54c-a0a2e92fbbe6	348	Nguyễn Quỳnh Giao	984361b5-1ca5-4bac-acc3-d9a08347d6b7	giaonq@ptit.edu.vn	KCB100190	Nguyễn Quỳnh Giao (KCB100190)		984361b5-1ca5-4bac-acc3-d9a08347d6b7	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a2b47e22-60c0-4465-97fa-44c4a2383fa4	623	Trương Mạnh Giáp	b8856d21-aaa6-4766-8785-cc9cf1e76060	giaptm@ptit.edu.vn	PGV100111	Trương Mạnh Giáp (PGV100111)		b8856d21-aaa6-4766-8785-cc9cf1e76060	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a0255b13-b5cc-4f16-a911-bf9d34d3b048	711	Thỉnh Giảng	bc6d7d68-3528-4a8d-89ea-52c606b608ad		TG026	Thỉnh Giảng (TG026)		bc6d7d68-3528-4a8d-89ea-52c606b608ad	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7751d7a-5f73-410c-a933-21272474fac4	1364	Trần Thanh Giảng	193f90b2-6235-4055-a675-6d699d17a27e	giangtt@ptit.edu.vn	KCN201099	Trần Thanh Giảng (KCN201099)		193f90b2-6235-4055-a675-6d699d17a27e	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8a35d266-b603-43d3-80cf-27442fad7e4a	944	Zonia Yang Go	fd2fda10-b8b8-4451-ab3d-cac0ec0f1a1c		TG0334	Zonia Yang Go (TG0334)		fd2fda10-b8b8-4451-ab3d-cac0ec0f1a1c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f38faf6a-dcc8-465d-90c0-b870192c11a1	751	Đỗ Văn Hanh	a6849df8-f387-4c1a-a64e-c12ea1441636		TG0407	Đỗ Văn Hanh (TG0407)		a6849df8-f387-4c1a-a64e-c12ea1441636	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f71861b1-258a-4ee6-a5d9-afd200c04e74	1092	Đỗ Văn Hanh	47a0437c-9ccf-4bc3-8587-259cd5246c36	hanhdv@ptit.edu.vn	KDP100614	Đỗ Văn Hanh (KDP100614)		47a0437c-9ccf-4bc3-8587-259cd5246c36	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dda7601a-4c70-4179-838e-1b2857cadd31	367	Mai Thị Bích Hạnh	9b5db120-ee44-4abe-83c9-71d8c1ac897f	hanhmtb@ptit.edu.vn	TDV100165	Mai Thị Bích Hạnh (TDV100165)		9b5db120-ee44-4abe-83c9-71d8c1ac897f	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d6cab6f5-f123-40e4-9101-f0eb1b761f42	572	Nguyễn Văn Hinh	23b43223-c950-4ff0-b7f6-9d358ddd4b62	hinhnv@ptit.edu.vn	PQL100857	Nguyễn Văn Hinh (PQL100857)		23b43223-c950-4ff0-b7f6-9d358ddd4b62	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7ab775ef-cb7f-48d2-90f4-8a4c7b178554	243	Nguyễn Thị Thu Hiên	c1ad6c6a-c7cf-4ab7-b467-2c826ad42aa0	hiennt@ptit.edu.vn	KVT100296	Nguyễn Thị Thu Hiên (KVT100296)		c1ad6c6a-c7cf-4ab7-b467-2c826ad42aa0	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
61fe2802-e3b7-4560-99ea-b4a952ca2f8b	579	Phan Thị Thu Hiền	572dfb12-c655-487a-861c-695ac2ebe86d	ptthien@ptit.edu.vn	PKT100082	Phan Thị Thu Hiền (PKT100082)		572dfb12-c655-487a-861c-695ac2ebe86d	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8cf11781-a790-4f21-8a76-198e2d62e44c	287	Nguyễn Đình Hiến	705e0e9d-bf18-4c32-aa27-3bb1e917eb9c	hiennd@ptit.edu.vn	KCN100261	Nguyễn Đình Hiến (KCN100261)		705e0e9d-bf18-4c32-aa27-3bb1e917eb9c	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6c2b7985-8f3d-478b-9185-ce3f1efe8912	832	Bùi Trung Hiếu	da532976-9a87-4717-9ef3-3a386863cd02	hieubt@ptit.edu.vn	KSD100671	Bùi Trung Hiếu (KSD100671)		da532976-9a87-4717-9ef3-3a386863cd02	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7e02ce41-7b75-4d9a-a111-cf5a98e64c45	1182	Lê Ngọc Hiếu	f4ec53dc-6956-4d53-8139-cf3b916c4871	hieuln@ptit.edu.vn	KCN200928	Lê Ngọc Hiếu (KCN200928)		f4ec53dc-6956-4d53-8139-cf3b916c4871	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6593f782-e6e5-4494-bfbe-4bf57f351336	95	Lưu Văn Hiếu	788a1dfe-01d2-4b51-943b-7c9c41b574bd	hieulv@ptit.edu.vn	VKT100862	Lưu Văn Hiếu (VKT100862)		788a1dfe-01d2-4b51-943b-7c9c41b574bd	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9fe7c691-01f7-4395-98e3-cee3e8e9117d	1095	Lương Khắc Hiếu	320b9f28-8d13-402f-99cc-3a621cf45a96	hieulk@ptit.edu.vn	KDP100966	Lương Khắc Hiếu (KDP100966)		320b9f28-8d13-402f-99cc-3a621cf45a96	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a95eaaec-859e-49a2-86d3-dc7cda5264e5	84	Nguyễn Chí Minh Hiếu	HieuNCM.B23CC064@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Chí Minh Hiếu		972ecfb9-26fd-458b-aadf-8a5090bc97e0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
638be8c6-59a3-43db-bcf9-6c42c46bcad3	600	Nguyễn Kim Hiếu	9ab67c69-8a5f-4dcd-a58b-875c7330e453	hieunk@ptit.edu.vn	PKH100101	Nguyễn Kim Hiếu (PKH100101)		9ab67c69-8a5f-4dcd-a58b-875c7330e453	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
df50fcbc-9d00-4bb1-991f-aced3f7ce878	1173	Nguyễn Thị Hiếu	b45c941b-7676-4c5c-88df-57ec914a0c88	hieunth@ptit.edu.vn	TKT200409	Nguyễn Thị Hiếu (TKT200409)		b45c941b-7676-4c5c-88df-57ec914a0c88	t	t	12	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2d9c8bdf-7d20-4458-adfd-439ed521f73a	152	Nguyễn Trung Hiếu	3f4570da-95ba-44d6-a618-9cebf32336ea	hieunt1@ptit.edu.vn	KCN200432	Nguyễn Trung Hiếu (KCN200432)		3f4570da-95ba-44d6-a618-9cebf32336ea	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f8fff26c-4a1d-4512-acdf-9e3b110bea19	611	Nguyễn Trung Hiếu	8cc203b5-309d-488a-96a9-38361ba64739	nthieu1@ptit.edu.vn	PGV100115	Nguyễn Trung Hiếu (PGV100115)		8cc203b5-309d-488a-96a9-38361ba64739	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f5d5533e-450b-4e54-8428-d8beb280fd6e	314	Nguyễn Trung Hiếu	ac42b6ae-e125-4594-b91a-b0f2cbed9210	trunghieu@ptit.edu.vn	VKT101075	Nguyễn Trung Hiếu (VKT101075)		ac42b6ae-e125-4594-b91a-b0f2cbed9210	t	t	67	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a2abad1e-2f88-4ee7-a4e0-e7f0b45c9b2a	316	Nguyễn Trung Hiếu	4278e962-218a-493d-99d9-96707af8c678	hieunt@ptit.edu.vn	KDT100226	Nguyễn Trung Hiếu (KDT100226)		4278e962-218a-493d-99d9-96707af8c678	t	t	24	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
937206f1-16d4-4da6-bb49-66866e1e722a	1402	Phạm Thanh Hiếu	8bb48cd7-8f9c-4559-b62d-f68cd12dbecd	hieupt@ptit.edu.vn	KCB101116	Phạm Thanh Hiếu (KCB101116)		8bb48cd7-8f9c-4559-b62d-f68cd12dbecd	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2539c2e9-19ef-4716-b354-0696c9ccac49	499	Trần Duy Hiếu	7f3f6ab3-cba1-4fe5-825c-9250dbc2c996	hieutd@ptit.edu.vn	VCN100615	Trần Duy Hiếu (VCN100615)		7f3f6ab3-cba1-4fe5-825c-9250dbc2c996	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0378fed9-4c3d-4de1-a9fe-03ad5cb32abb	71	Trần Minh Hiếu	7f1ce077-a974-4fc9-b778-b33769dfb117	hieutm@ptit.edu.vn	VKH101027	Trần Minh Hiếu (VKH101027)		7f1ce077-a974-4fc9-b778-b33769dfb117	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4beb4694-f96c-44e4-9eed-4c70e5f7c740	1340	Trần Đức Hiếu	990ba163-5773-4a48-8a5c-65e4411451d3	hieutd.tg@ptit.edu.vn	2025.KDP1.15.810	Trần Đức Hiếu (2025.KDP1.15.810)		990ba163-5773-4a48-8a5c-65e4411451d3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e50499aa-e167-427a-8ecf-01862cbd5d69	312	Trịnh Trung Hiếu	724cfe37-3417-4156-b4d4-dc78eb2424c8	hieutt@ptit.edu.vn	KDT100832	Trịnh Trung Hiếu (KDT100832)		724cfe37-3417-4156-b4d4-dc78eb2424c8	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0841d1a9-9b47-448c-b299-8dfd294b8d25	753	Tạ Chí Hiếu	85b96fb4-be73-4881-86af-f1b20e730220		TG0521	Tạ Chí Hiếu (TG0521)		85b96fb4-be73-4881-86af-f1b20e730220	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
51a74e86-9706-4ee0-bbec-0f7aa30cfdf5	441	Vũ Thạch Hiếu	fe828f8f-b4ad-4684-a272-bf7c23768e0d	hieuvt@ptit.edu.vn	VKT100587	Vũ Thạch Hiếu (VKT100587)		fe828f8f-b4ad-4684-a272-bf7c23768e0d	t	t	66	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb370434-7afb-4585-ae12-4f169c811d71	1054	Vũ Thạnh Hiếu	086c284f-c6f2-4db7-a1ab-db9b5b6a0d91		TG0239	Vũ Thạnh Hiếu (TG0239)		086c284f-c6f2-4db7-a1ab-db9b5b6a0d91	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fb89ce7e-bb32-461d-9ba5-d4ee66b8e491	238	Đinh Chí Hiếu	5b7bd1ff-137e-47ea-8b80-d710081cf1f6	hieudc@ptit.edu.vn	KTC100807	Đinh Chí Hiếu (KTC100807)		5b7bd1ff-137e-47ea-8b80-d710081cf1f6	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b5e3c03b-bdad-4889-b913-ea2039f5fea4	1279	Đoàn Hiếu	7b414094-6e3a-4bbf-bce6-804e232e3648	doanhieu@ptit.edu.vn	TDT100626	Đoàn Hiếu (TDT100626)		7b414094-6e3a-4bbf-bce6-804e232e3648	t	t	2	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
35ecb229-baa1-41de-a350-9a17e77fc416	644	Đặng Văn Hiếu	9d0d6da8-96f7-4848-8088-fad21a2334f3	hieudv.tg@ptit.edu.vn	TG0025	Đặng Văn Hiếu (TG0025)		9d0d6da8-96f7-4848-8088-fad21a2334f3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e3ab4400-209a-4392-a7c6-71ebe6a0c98c	1337	Đặng Văn Hiếu	09668b35-59bd-49be-8c13-7b4a6c978cdb	hieudv@ptit.edu.vn	VKH101080	Đặng Văn Hiếu (VKH101080)		09668b35-59bd-49be-8c13-7b4a6c978cdb	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d5e11206-668b-45db-8169-5da08fbe5d7e	1135	Bá Thu Hiền	e87147e8-e457-44de-b2bb-a1afff13a771		TG0028	Bá Thu Hiền (TG0028)		e87147e8-e457-44de-b2bb-a1afff13a771	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a2203aca-ee87-4aae-90d9-833f34b56588	1110	Chu Phương Hiền	235d9c70-2ac1-4276-b032-03e6549ce49c		TG0244	Chu Phương Hiền (TG0244)		235d9c70-2ac1-4276-b032-03e6549ce49c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e7473469-ad32-43f4-b229-1dedaa2fae7e	1197	Lê Xuân Hiền	30a4e8e4-4f9b-4af5-ae45-73cd32635aac	hienlx@ptit.edu.vn	KCN200744	Lê Xuân Hiền (KCN200744)		30a4e8e4-4f9b-4af5-ae45-73cd32635aac	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e8bf9763-eb49-40f3-9ae2-fbbc53c61a76	1114	Nguyễn Thị Bích Hiền	0a19981b-c8a7-4b77-b825-76f539893005		TG0314	Nguyễn Thị Bích Hiền (TG0314)		0a19981b-c8a7-4b77-b825-76f539893005	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b3145391-7d94-4e96-9a63-30c4f9d75012	957	Nguyễn Thị Hiền	c3c3c7fc-1e39-4a1a-9b0c-4603f0ad9fd3		TG0053	Nguyễn Thị Hiền (TG0053)		c3c3c7fc-1e39-4a1a-9b0c-4603f0ad9fd3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7a03d206-0841-4859-a7a1-d60e30abfd65	807	Nguyễn Thị Thu Hiền	d1691614-cc4a-4499-b4a8-4161625905d8	hienntt@ptit.edu.vn	VKT100135	Nguyễn Thị Thu Hiền (VKT100135)		d1691614-cc4a-4499-b4a8-4161625905d8	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
42a0a55a-ddfc-4932-ad78-858b88a249ae	106	Nguyễn Văn Hiền	555b569a-5d74-43a4-8b39-605b9f33d951	hiennv@ptit.edu.vn	KVT200495	Nguyễn Văn Hiền (KVT200495)		555b569a-5d74-43a4-8b39-605b9f33d951	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
96b49297-054b-4a2e-8872-fe65f03b68fc	407	Nguyễn Đức Hiền	8187c155-5e0f-4559-afbf-b960b282ee8b	ndhien@ptit.edu.vn	PTH200781	Nguyễn Đức Hiền (PTH200781)		8187c155-5e0f-4559-afbf-b960b282ee8b	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
50c8d098-6b89-499c-8b79-c6465c8af431	756	Phạm Minh Hiền	b290377b-083e-4cd4-8fef-e7dbd88f0834		TG0366	Phạm Minh Hiền (TG0366)		b290377b-083e-4cd4-8fef-e7dbd88f0834	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
53fa090c-175b-47af-8ee9-e7db9c509bab	254	Phạm Thị Thúy Hiền	9d1da0b1-52c6-41d7-b3dd-cb89e7045612	hienptt@ptit.edu.vn	KVT100297	Phạm Thị Thúy Hiền (KVT100297)		9d1da0b1-52c6-41d7-b3dd-cb89e7045612	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f428930-dc01-42c0-a1b4-b46be657ca48	47	Đào Thu Hiền	dc9ff02d-b26d-477c-a259-d2797dc98f87	hiendt@ptit.edu.vn	VKH100544	Đào Thu Hiền (VKH100544)		dc9ff02d-b26d-477c-a259-d2797dc98f87	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7119c646-a6b1-4b8a-834d-f5c6aedf6607	1321	Cao Xuân Hiển	463148f1-7bb2-4680-8099-0d4a64dcf098	hiencx@ptit.edu.vn	TDT100150	Cao Xuân Hiển (TDT100150)		463148f1-7bb2-4680-8099-0d4a64dcf098	t	t	246	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
61a48e02-34c8-49f8-a63a-7e1e8050edab	1289	Nguyễn Quốc Hiển	3eb2c1c2-c5be-47ea-9f7b-1bf6ba969c2b	hiennq@ptit.edu.vn	VPH100021	Nguyễn Quốc Hiển (VPH100021)		3eb2c1c2-c5be-47ea-9f7b-1bf6ba969c2b	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
14206032-f19a-47d8-a7f1-6324e372f41b	1075	Nguyễn Văn Hiệp	c7b9ee0c-3ecc-4123-af4c-2d9b9f6e4781	hiepnv@ptit.edu.vn	KQT100934	Nguyễn Văn Hiệp (KQT100934)		c7b9ee0c-3ecc-4123-af4c-2d9b9f6e4781	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b47a0b8c-b575-4bd1-9a83-fe7c46253a56	155	Nguyễn Xuân Hiệp	dcbc2ccf-95c1-4f1e-a144-01821d5f0a32	hiepnx@ptit.edu.vn	KCB200796	Nguyễn Xuân Hiệp (KCB200796)		dcbc2ccf-95c1-4f1e-a144-01821d5f0a32	t	t	192	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cdbd597d-6bd9-4b35-969e-79958df8dcfa	147	Phan Nghĩa Hiệp	87839494-9d22-4d82-a42e-8978399d9767	hieppn@ptit.edu.vn	KCN200431	Phan Nghĩa Hiệp (KCN200431)		87839494-9d22-4d82-a42e-8978399d9767	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f7d7587-fb8e-4b42-a37a-95bbb50fd308	746	Đỗ Duy Hiệp	bc6d4ecd-7bba-4cd3-b818-805bc8d3ef2c		TG0069	Đỗ Duy Hiệp (TG0069)		bc6d4ecd-7bba-4cd3-b818-805bc8d3ef2c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f6c80ed-ff47-4d10-94e2-f62c8718a872	848	Đỗ Duy Hiệp	ea3c919e-c239-42b5-8e35-e0202770a2f8	hiepdd@ptit.edu.vn	KDT100902	Đỗ Duy Hiệp (KDT100902)		ea3c919e-c239-42b5-8e35-e0202770a2f8	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f80e36ed-6504-4b17-bf7b-53ec4fe12df6	1421	Nguyễn Văn Hiệu	Anhhieuuet@gmail.com	tranglou1003@gmail.com		Nguyễn Văn Hiệu - Anhhieuuet@gmail.com			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5a38ab11-6da6-4b9e-98e6-39ab61d3cbbb	1171	Lê Thị Minh Hoa	4c0384aa-e0e2-4cab-a0d0-af85e6b74953	hoaltm@ptit.edu.vn	PSV200402	Lê Thị Minh Hoa (PSV200402)		4c0384aa-e0e2-4cab-a0d0-af85e6b74953	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
65ad582f-c525-4e83-bd79-b3918c8c6c7a	255	Lê Tùng Hoa	f6a34e04-a4fb-4220-b6a0-50b89c49e1df	hoalt@ptit.edu.vn	KVT100298	Lê Tùng Hoa (KVT100298)		f6a34e04-a4fb-4220-b6a0-50b89c49e1df	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6efa0e32-6145-4334-9790-5a126c749d5a	1116	Đặng Thanh Hoa	218e1db9-4572-47d5-8352-d69aac530a6d		TG0278	Đặng Thanh Hoa (TG0278)		218e1db9-4572-47d5-8352-d69aac530a6d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7034f00a-8a4f-4bd4-8be5-efeacbaeefbb	1123	Đặng Thị Thanh Hoa	e8ac0a8b-6d17-4a2b-89de-69ac54208532		TG0306	Đặng Thị Thanh Hoa (TG0306)		e8ac0a8b-6d17-4a2b-89de-69ac54208532	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1aac0fd5-5e11-489b-a5e0-5824a0342d18	1118	Đỗ Thị Thanh Hoa	fff6e9e8-a3db-46ab-ab58-e3ddd9ede59f		TG0247	Đỗ Thị Thanh Hoa (TG0247)		fff6e9e8-a3db-46ab-ab58-e3ddd9ede59f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0eb58d0f-72ae-4794-8021-8f72695aa2d5	61	Vũ Thị Hoà	9754b753-265b-422b-8a71-9390044bace3	hoavt@ptit.edu.vn	VKH100855	Vũ Thị Hoà (VKH100855)		9754b753-265b-422b-8a71-9390044bace3	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e3ce82eb-ae2f-41cb-91f4-cb5f08eb9cf6	1059	Ao Thu Hoài	4cfd6e05-5aa4-468d-9493-963f0b6cea03		TG9999	Ao Thu Hoài (TG9999)		4cfd6e05-5aa4-468d-9493-963f0b6cea03	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
25a49651-8423-4344-a20f-ea40ebdc2383	624	Bùi Minh Hoài	abd8869a-8512-4231-8f40-c26dc3139971		TG0369	Bùi Minh Hoài (TG0369)		abd8869a-8512-4231-8f40-c26dc3139971	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
57bde3e8-f7aa-4990-96f5-ff0f920e49a6	707	Nguyễn Thu Hoài	edc425dd-154d-422f-ac22-0c55cb6656cc		TG0596	Nguyễn Thu Hoài (TG0596)		edc425dd-154d-422f-ac22-0c55cb6656cc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c15d3ad5-8ef9-4837-9707-15c0fd394a61	762	Nguyễn Thị Hoài	2aa5a4b7-03a9-41a9-a4dd-b4809af25409		TG0549	Nguyễn Thị Hoài (TG0549)		2aa5a4b7-03a9-41a9-a4dd-b4809af25409	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e830c0db-de51-480b-90a4-471d4662cd9f	1406	Nông Ngọc Hoài	nnhoai	tranglou1003@gmail.com	nnhoai	Nông Ngọc Hoài (nnhoai)			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b55707f0-60c2-4046-8935-b2d4e103692e	1248	Võ Thị Hoài	d60e6cc6-b26d-46b9-a7cf-402509ec03a8	hoaivt@ptit.edu.vn	TDT100895	Võ Thị Hoài (TDT100895)		d60e6cc6-b26d-46b9-a7cf-402509ec03a8	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
457ac6db-a5a5-4430-adf5-4b0ed7f20ab6	757	Vương Minh Hoài	16d9ec19-cd15-4c42-8d0e-cf070f487145		TG0062	Vương Minh Hoài (TG0062)		16d9ec19-cd15-4c42-8d0e-cf070f487145	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a85dc56b-a873-4127-bc20-56bcbd49f176	167	Lưu Vũ Cẩm Hoàn	b3d59069-f73c-4f1d-bc04-da894cb6a4e8	hoanlvc@ptit.edu.vn	KCB200733	Lưu Vũ Cẩm Hoàn (KCB200733)		b3d59069-f73c-4f1d-bc04-da894cb6a4e8	t	t	195	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ca72da48-e8fb-4e1c-bb73-4f32d07f798e	194	Đỗ Hải Hoàn	a40dfea7-6bd8-456b-b434-97545a73db74	hoandh@ptit.edu.vn	VKT100352	Đỗ Hải Hoàn (VKT100352)		a40dfea7-6bd8-456b-b434-97545a73db74	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f676ec8b-e859-4dd3-afba-9875340150eb	419	Bùi Văn Hoàng	dd953854-5ed3-400f-b117-8bfd4bce1917	hoangbv@ptit.edu.vn	PTH200508	Bùi Văn Hoàng (PTH200508)		dd953854-5ed3-400f-b117-8bfd4bce1917	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d1633f0-7e11-4dde-bcaf-1c82a4054813	72	Lê Văn Hoàng	75aeffc9-c65c-49d6-9257-9756a2b18de3	hoanglv@ptit.edu.vn	VKH101056	Lê Văn Hoàng (VKH101056)		75aeffc9-c65c-49d6-9257-9756a2b18de3	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a6fa331-e940-492e-a168-00d7eee72555	1045	Nguyễn Anh Hoàng	7a23b5f2-f843-45a6-b01e-52d5586421c1	hoangna@ptit.edu.vn	VLD101017	Nguyễn Anh Hoàng (VLD101017)		7a23b5f2-f843-45a6-b01e-52d5586421c1	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
17391a50-5675-4a6e-9289-8bae9f4a6d72	1200	Nguyễn Văn Hữu Hoàng	27496a82-2e1e-43bb-8c0b-58bada09dcab	hoangnvh@ptit.edu.vn	KCN200887	Nguyễn Văn Hữu Hoàng (KCN200887)		27496a82-2e1e-43bb-8c0b-58bada09dcab	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6c141bdc-37e6-44e1-a2c5-582bc8b2b126	249	Nguyễn Xuân Hoàng	b3078819-6342-45e6-accb-4fc3b2567187	hoangnx@ptit.edu.vn	KVT100702	Nguyễn Xuân Hoàng (KVT100702)		b3078819-6342-45e6-accb-4fc3b2567187	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d407c009-e626-4822-b561-fc270b3daf36	491	Nguyễn Đức Hoàng	0a5a971d-4108-4003-87b7-cd46cf0ca35c	hoangnd@ptit.edu.vn	VCN100619	Nguyễn Đức Hoàng (VCN100619)		0a5a971d-4108-4003-87b7-cd46cf0ca35c	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5d9981e3-6e84-40dd-a70f-c18ce23804ab	420	Phan Thị Ánh Hoàng	ec8fee99-a10f-4740-8302-823efa84454c	hoangpta@ptit.edu.vn	PTH200371	Phan Thị Ánh Hoàng (PTH200371)		ec8fee99-a10f-4740-8302-823efa84454c	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
73264032-54bd-4b17-969a-8fc88003ef72	1339	Đinh Văn Hoàng	4d947bbe-52c6-4c07-9903-19f1cf26c9da	hoangdv.tg@ptit.edu.vn	2025.KCB1.15.807	Đinh Văn Hoàng (2025.KCB1.15.807)		4d947bbe-52c6-4c07-9903-19f1cf26c9da	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64c47530-a4e8-485c-ad57-f52c1114bd6e	1353	Dương Quang Huy	9c823921-aa9a-4713-aefa-1f5804fd6491	huydq@ptit.edu.vn	KVT101102	Dương Quang Huy (KVT101102)		9c823921-aa9a-4713-aefa-1f5804fd6491	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f62b24f3-271c-4475-b518-9d3e8a430916	970	Nguyễn Quang Huy	d8de2b07-967b-4b68-b4e7-23fff12e12ea	huynq@ptit.edu.vn	KCN100965	Nguyễn Quang Huy (KCN100965)		d8de2b07-967b-4b68-b4e7-23fff12e12ea	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9ed20dbf-0f16-42c9-aab1-193ddbadf503	779	Nguyễn Quang Huy	89bd6e71-ed7f-44c1-a563-60af274a9f20	huynq.tg@ptit.edu.vn	TG0504	Nguyễn Quang Huy (TG0504)		89bd6e71-ed7f-44c1-a563-60af274a9f20	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
12fcc409-37d9-4a84-abe3-17bb7c42e6db	737	Nguyễn Xuân Huy	ef622ceb-4a44-4137-8a58-bd6d7ebdea97	huynx.tg@ptit.edu.vn	TG0589	Nguyễn Xuân Huy (TG0589)		ef622ceb-4a44-4137-8a58-bd6d7ebdea97	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f1ff4db-d3d6-449c-99f2-1a8dc1c312fd	188	Phí Công Huy	6ba8d2f9-fd1a-4757-b01f-f82b3f81ac92	huypc@ptit.edu.vn	KDP100354	Phí Công Huy (KDP100354)		6ba8d2f9-fd1a-4757-b01f-f82b3f81ac92	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9f6e322d-66d9-4c23-90ae-b93d186aae3e	540	Phạm Lê Huy	56e97dcf-cfee-4ad6-8903-b3c83bbec8b9	huypl@ptit.edu.vn	PTC100036	Phạm Lê Huy (PTC100036)		56e97dcf-cfee-4ad6-8903-b3c83bbec8b9	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ba852fe-660d-458a-a19b-65bf44979d21	478	Trần Quang Huy	bb6758c8-df45-4f74-9fbf-22fd30959baa	huytq.tg@ptit.edu.vn	TG0219	Trần Quang Huy (TG0219)		bb6758c8-df45-4f74-9fbf-22fd30959baa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
aa8a251c-cfcf-4d38-89da-45df7dbdeb5f	833	Hoàng Ứng Huyền	69926847-759a-4f32-9a07-9e5ad9cf3838	huyenhu@ptit.edu.vn	KSD100678	Hoàng Ứng Huyền (KSD100678)		69926847-759a-4f32-9a07-9e5ad9cf3838	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
27210695-fb02-4e98-a77f-5ce66cbf8429	1165	Chu Thị Thanh Huyền	7ecf984e-d033-4a88-8101-5971be7e64b8	huyenctt@ptit.edu.vn	PGV200398	Chu Thị Thanh Huyền (PGV200398)		7ecf984e-d033-4a88-8101-5971be7e64b8	t	t	14	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
84f5e0bb-7234-44e6-baee-fa0dc71cca37	1349	Nghiêm Thanh Huyền	d63f2bdf-1ef7-4dc1-8e70-fadcb66e46a4	huyennt@ptit.edu.vn	VKH101087	Nghiêm Thanh Huyền (VKH101087)		d63f2bdf-1ef7-4dc1-8e70-fadcb66e46a4	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
72ccaf54-dc91-48c2-b940-5899dd9b22a7	501	Lê Thị Hà	8cb8451c-cf26-401f-9a72-78adcd06cdb1	ltha@ptit.edu.vn	TDV100613	Lê Thị Hà (TDV100613)		8cb8451c-cf26-401f-9a72-78adcd06cdb1	t	t	26	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
af1dca1e-4b07-4ace-aed3-c879a997e85c	489	Nguyễn Ngọc Huyền	bf0e4654-157d-423b-a07d-7cca60d1c0f7	huyennn@ptit.edu.vn	VKT100561	Nguyễn Ngọc Huyền (VKT100561)		bf0e4654-157d-423b-a07d-7cca60d1c0f7	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e99917bf-a3c0-4ad5-bb00-55c250634096	1070	Nguyễn Thị Thanh Huyền	67505dc700ad6dbc8c2576ff	tranglou1003@gmail.com	tg0003	Nguyễn Thị Thanh Huyền (tg0003)		7640cd2b-8804-49fc-8cb9-875c2ef63b70	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3dd93d3e-6fe2-4ebe-b685-ae25c5474abb	214	Nguyễn Thị Thanh Huyền	b84868fd-3067-4c48-a1bb-9998dc706620	huyenntt@ptit.edu.vn	KQT100337	Nguyễn Thị Thanh Huyền (KQT100337)		b84868fd-3067-4c48-a1bb-9998dc706620	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6ed3bc31-c405-464c-b69e-f9472f4eec62	1399	Phạm Thị Thanh Huyền	9f3aa43e-87f5-457b-8bda-cab346c26a77	huyenptt@ptit.edu.vn	KCN201097	Phạm Thị Thanh Huyền (KCN201097)		9f3aa43e-87f5-457b-8bda-cab346c26a77	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
81cba4c8-ee0e-46c9-bdef-1a764cf9abd9	168	Trần Thị Thanh Huyền	681ecd3d-0c0b-4dc7-8c6b-40b01abbbc98	huyenttt@ptit.edu.vn	KDP100368	Trần Thị Thanh Huyền (KDP100368)		681ecd3d-0c0b-4dc7-8c6b-40b01abbbc98	t	t	18	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7abd6ff2-de8c-43db-8ed2-493b49fd9e3a	1342	Vũ Mỹ Huyền	ba809957-091d-4121-b45c-aeee45fe757d	huyenvm.tg@ptit.edu.vn	2025.KCB1.15.808	Vũ Mỹ Huyền (2025.KCB1.15.808)		ba809957-091d-4121-b45c-aeee45fe757d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
11faff29-4b96-4b9b-b68b-f7e5d4a05ced	582	Vũ Thị Huyền	cfe486f1-8fd5-458e-8686-80e0923dca43	huyenvt@ptit.edu.vn	PKT100084	Vũ Thị Huyền (PKT100084)		cfe486f1-8fd5-458e-8686-80e0923dca43	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3d6d2443-2cd1-4929-8b98-d8bc522b2855	759	Đinh Diệu Huyền	e199ead3-3cb3-4ee4-9c51-673d10468cd6		TG0406	Đinh Diệu Huyền (TG0406)		e199ead3-3cb3-4ee4-9c51-673d10468cd6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6cf37a5f-c8ea-4881-8826-44bf79505b7e	853	Đào Thanh Huyền	71269938-e69e-45ec-97b4-b05fb720bc1f	huyendt@ptit.edu.vn	KDT100874	Đào Thanh Huyền (KDT100874)		71269938-e69e-45ec-97b4-b05fb720bc1f	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
857e77e5-202b-44af-a577-adb47c44bda3	735	Đào Thanh Huyền	c05ff2ec-3ed4-4db0-9430-e41e7685fe40		TG0068	Đào Thanh Huyền (TG0068)		c05ff2ec-3ed4-4db0-9430-e41e7685fe40	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
737c7da9-7548-4ee1-bff6-27a452acbbdf	784	Đào Thanh Huyền	3143fdd2-d530-492b-8e88-2deba4de8373		TG0373	Đào Thanh Huyền (TG0373)		3143fdd2-d530-492b-8e88-2deba4de8373	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9994ea0c-194b-48a0-9476-db86d546f9c8	474	Đặng Thị Thu Huyền	e8d41955-694c-47d3-945e-bf086e9d4124	huyendtt@ptit.edu.vn	VKT100568	Đặng Thị Thu Huyền (VKT100568)		e8d41955-694c-47d3-945e-bf086e9d4124	t	t	4	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c5081692-9fcd-4c3e-b6ea-a73fc21d87d4	1230	Nguyễn Nguyên Huân	d251423f-10f3-445e-85bb-5e5b6e9df6ff	huannn@ptit.edu.vn	KVT200764	Nguyễn Nguyên Huân (KVT200764)		d251423f-10f3-445e-85bb-5e5b6e9df6ff	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
18e683e6-7a81-4428-a140-22936799f2f8	116	Nguyễn Trọng Huân	18c18ae9-1174-42d6-bc55-fc020ef1edc9	huannt@ptit.edu.vn	KDT200456	Nguyễn Trọng Huân (KDT200456)		18c18ae9-1174-42d6-bc55-fc020ef1edc9	t	t	179	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dedc8445-0f57-4209-80cc-40b558e11782	1420	Tạ Văn Huấn	HuanTV.B23CC075@stu.ptit.edu.vn	tranglou1003@gmail.com		Tạ Văn Huấn		4b97206d-3e06-4f84-907f-9356e4e09a8a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b2ba72e9-ba34-454f-aa8d-68751522a16c	568	Bùi Thị Minh Huệ	01bc8707-faa4-4399-8894-ebc77af6d1ae	huebm@ptit.edu.vn	PQL100072	Bùi Thị Minh Huệ (PQL100072)		01bc8707-faa4-4399-8894-ebc77af6d1ae	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
391dff81-7644-41cc-b494-0221b3c31a52	169	Hà Thị Huệ	6e36caec-b586-4cbd-b47d-f6c1a5beb3b0	hueht@ptit.edu.vn	KDP100715	Hà Thị Huệ (KDP100715)		6e36caec-b586-4cbd-b47d-f6c1a5beb3b0	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2abe83ab-d7db-40aa-9ffd-2480220f4c09	620	Hà Thị Thu Huệ	c06629fd-180e-47a2-bf98-499549f99011		TG0542	Hà Thị Thu Huệ (TG0542)		c06629fd-180e-47a2-bf98-499549f99011	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
63a122df-7019-42b7-8852-61ddddc5721b	674	Kiến Thị Huệ	d98ca527-9ae8-41b8-9f4b-b1d7665de528		TG0376	Kiến Thị Huệ (TG0376)		d98ca527-9ae8-41b8-9f4b-b1d7665de528	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c90f3d3c-4220-49cc-a1ff-2bac53e9c8d1	708	Kiều Thị Huệ	e9a24774-20a7-4eec-97f5-759c573a87a0		TG0450	Kiều Thị Huệ (TG0450)		e9a24774-20a7-4eec-97f5-759c573a87a0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
28c5608e-00e6-453e-acba-e0c23e7cb15d	1343	Lâm Thị Huệ	6a1698e1-854b-429b-b7ec-9d3989e176af	huelt.tg@ptit.edu.vn	TG0618	Lâm Thị Huệ (TG0618)		6a1698e1-854b-429b-b7ec-9d3989e176af	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
437ad1cc-e14c-493a-8d9c-83a871124932	908	Nguyễn Thị Huệ	f717fb45-0658-4126-a6fd-2f2642345921		TG0012	Nguyễn Thị Huệ (TG0012)		f717fb45-0658-4126-a6fd-2f2642345921	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
87d5ac7b-39c2-480e-a8c1-0775720e028c	554	Nguyễn Thị Hồng Huệ	1c6ba53d-9383-449e-9ef0-96788b193261	huenth@ptit.edu.vn	PDT100061	Nguyễn Thị Hồng Huệ (PDT100061)		1c6ba53d-9383-449e-9ef0-96788b193261	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
651e915b-610a-440d-add2-dd3be3a65695	939	Ngô Thị Hồng Huệ	abdfd732-ef98-4d83-a8ac-fb79aa88c543		TG0085	Ngô Thị Hồng Huệ (TG0085)		abdfd732-ef98-4d83-a8ac-fb79aa88c543	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1eaeea88-9282-4c8d-9b86-2fb58ecb0dc0	575	Ngọ Thanh Huệ	a7f73209-6eaf-4122-9114-c9041dae8d4d	huent@ptit.edu.vn	VCN101024	Ngọ Thanh Huệ (VCN101024)		a7f73209-6eaf-4122-9114-c9041dae8d4d	t	t	57	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8abedb35-0fcc-4c7d-bcf6-b54c5a104763	996	Trần Thị Huệ	ed072d5a-df14-4dca-8dcf-3c4039881e28		TG0337	Trần Thị Huệ (TG0337)		ed072d5a-df14-4dca-8dcf-3c4039881e28	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
21016d3c-5fd9-4c60-ad43-bbf303906e6f	1049	Trần Thị Hồng Huệ	594df71f-44e8-4791-b010-5f4b8d11e169		TG0008	Trần Thị Hồng Huệ (TG0008)		594df71f-44e8-4791-b010-5f4b8d11e169	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20c83320-d3ea-45b1-916a-43f8af3701a2	24	Phan Lý Huỳnh	af48a29b-b50c-4364-9800-0c66b58f2601	huynhpl@ptit.edu.vn	VKH100880	Phan Lý Huỳnh (VKH100880)		af48a29b-b50c-4364-9800-0c66b58f2601	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
edbe150c-260d-4e15-9c2f-5a46b39ae18f	437	Trần Xuân Huỳnh	fa6443cd-ee7f-492d-8ba1-7cc4175dd95c	huynhtx@ptit.edu.vn	VKH101046	Trần Xuân Huỳnh (VKH101046)		fa6443cd-ee7f-492d-8ba1-7cc4175dd95c	t	t	72	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e7c69e6a-dd51-4a4b-86c7-646511de3862	151	Phan Thanh Hy	62ab7822-a230-44ae-a3a7-404d765683cd	hypt@ptit.edu.vn	KCN200434	Phan Thanh Hy (KCN200434)		62ab7822-a230-44ae-a3a7-404d765683cd	t	t	190	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6dc6b074-5d9e-41da-a61f-5bb92b9fab74	1338	Wi Jong Hyun	830f5881-4ee3-4485-8339-5c5e7f890d3b		VCN101118	Wi Jong Hyun (VCN101118)		830f5881-4ee3-4485-8339-5c5e7f890d3b	t	t	243	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fa9320e6-093a-4cd8-92ad-948b96184864	671	Chu Thị Thu Hà	9fe8abdb-87d3-4eb5-9ea2-a92a577321ab		TG0497	Chu Thị Thu Hà (TG0497)		9fe8abdb-87d3-4eb5-9ea2-a92a577321ab	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0cd58318-0f6d-4336-a85c-11d00bcd8c90	211	Dương Hải Hà	6c322d78-93cc-496e-bbb4-0046037c236b	hadh@ptit.edu.vn	KQT100711	Dương Hải Hà (KQT100711)		6c322d78-93cc-496e-bbb4-0046037c236b	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
50629634-b1d0-4257-b38e-e07442149fdc	173	Khuất Thị Thu Hà	8d926731-4c74-4f15-8ef8-97b93eaf6ef7	haktt@ptit.edu.vn	KDP100834	Khuất Thị Thu Hà (KDP100834)		8d926731-4c74-4f15-8ef8-97b93eaf6ef7	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
56771ab5-e879-4ee6-b876-d3427c311a3c	914	Lê Thúy Hà	e4531fb0-f201-474a-b944-542b0f36c156		TG0018	Lê Thúy Hà (TG0018)		e4531fb0-f201-474a-b944-542b0f36c156	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7cc59df-0445-46d0-bf84-699a7cfcffd6	1310	Lê Thúy Hà	eaf91ce2-4f7e-4a59-8dc9-355c3900e322	halt@ptit.edu.vn	TQT100144	Lê Thúy Hà (TQT100144)		eaf91ce2-4f7e-4a59-8dc9-355c3900e322	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c22d3ba0-0a29-44d6-acb7-c4b209bdf56a	910	Lê Thị Thúy Hà	9288d4a9-c393-48ea-a35e-a0c755414871		TG0230	Lê Thị Thúy Hà (TG0230)		9288d4a9-c393-48ea-a35e-a0c755414871	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6f050bf1-cb2d-4d59-a30d-ead09fb64cb9	1091	Lương Nguyễn Phượng Hà	2df613f6-e4a4-4277-a362-33b674eb8e82	halnp@ptit.edu.vn	KDP101040	Lương Nguyễn Phượng Hà (KDP101040)		2df613f6-e4a4-4277-a362-33b674eb8e82	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0770e719-8047-40c5-8606-5492d48c26e1	1356	Lương Thị Thanh Hà	7a1381db-d13a-40b5-9150-bf2be92838a3	haltt@ptit.edu.vn	KQT201110	Lương Thị Thanh Hà (KQT201110)		7a1381db-d13a-40b5-9150-bf2be92838a3	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
290773f6-2ef8-47cb-b730-f5a5ac2600a1	898	Mai Hoàng Hà	487db62a-f74a-4280-b803-93f6ad055f97		TG0233	Mai Hoàng Hà (TG0233)		487db62a-f74a-4280-b803-93f6ad055f97	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d4cd9aef-04b8-4c19-b259-fce6ddb0008d	668	Mai Hồng Hà	b377d98b-5dd0-434e-9618-480b26a24b64		TG0379	Mai Hồng Hà (TG0379)		b377d98b-5dd0-434e-9618-480b26a24b64	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5147810a-c8c3-4a7b-ba85-ed0ff257a7b0	1352	Mai Thị Ngọc Hà	b087aae7-6ea9-4928-9237-3d1f0c59b0e0	hamtn@ptit.edu.vn	KCB101104	Mai Thị Ngọc Hà (KCB101104)		b087aae7-6ea9-4928-9237-3d1f0c59b0e0	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ceb8b846-8cec-4b02-8d98-bfb72cead446	586	Nguyễn Hải Hà	65f9a2e6-d634-4c41-a379-f97f0acc7319	hanh@ptit.edu.vn	PKT100081	Nguyễn Hải Hà (PKT100081)		65f9a2e6-d634-4c41-a379-f97f0acc7319	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
32ccf76f-bef0-4897-a696-eec3ebff9b4b	680	Nguyễn Ngọc Hà	f0a456ea-54c4-4cd4-95e2-bdfa0cf10eee	hann.tg@ptit.edu.vn	TG0362	Nguyễn Ngọc Hà (TG0362)		f0a456ea-54c4-4cd4-95e2-bdfa0cf10eee	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
298f0d1e-9258-425a-952a-30b5288e6a94	698	Nguyễn Phương Hà	34e220c8-75a9-4227-964c-90c76e498219		TG0447	Nguyễn Phương Hà (TG0447)		34e220c8-75a9-4227-964c-90c76e498219	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b7b596d6-8259-4a38-a32a-619d875e4164	966	Nguyễn Thị Thu Hà	31df61a3-67fd-4446-a114-716fb293aec2	chuacoemail@ptit.edu.vn	TG0035	Nguyễn Thị Thu Hà (TG0035)		31df61a3-67fd-4446-a114-716fb293aec2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
967377dd-0498-433a-a43a-bb90b8b51bad	610	Nguyễn Thị Vân Hà	410fbc79-1667-407b-88f3-dbaa35c0ba25	ntvha@ptit.edu.vn	PGV100112	Nguyễn Thị Vân Hà (PGV100112)		410fbc79-1667-407b-88f3-dbaa35c0ba25	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
74d0aca7-054d-4551-a4ea-863841bc951c	389	Nguyễn Xuân Hà	f3807f16-72ab-4184-99e1-2cd43b9e5d6c	hanx@ptit.edu.vn	VPH100164	Nguyễn Xuân Hà (VPH100164)		f3807f16-72ab-4184-99e1-2cd43b9e5d6c	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dfdb281f-fb45-4539-b1a8-89b13479ba00	479	Ngô Thái Hà	ff207e0f-9554-4b1e-ae78-dafc425ad80e		TG0099	Ngô Thái Hà (TG0099)		ff207e0f-9554-4b1e-ae78-dafc425ad80e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0cb8a527-f4b6-4021-b737-c0c46c9b2e40	23	Ngô Thị Mỹ Hà	9e45aa87-ea49-4655-bcd4-b60d121e38f6	hantm@ptit.edu.vn	VKH100535	Ngô Thị Mỹ Hà (VKH100535)		9e45aa87-ea49-4655-bcd4-b60d121e38f6	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
95f3849e-222c-4f1c-82a6-7d86edf2749c	286	Phan Thị Hà	ca864c70-6bc3-4447-b79c-6f8ab2dc299d	hapt@ptit.edu.vn	KCN100260	Phan Thị Hà (KCN100260)		ca864c70-6bc3-4447-b79c-6f8ab2dc299d	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5fecac57-2801-4138-87d6-c990a02d35c6	787	Phương Thị Hồng Hà	c2a1673f-7e54-4864-9693-b465cd2ddf45	hapth.tg@ptit.edu.vn	TG0409	Phương Thị Hồng Hà (TG0409)		c2a1673f-7e54-4864-9693-b465cd2ddf45	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0b280c30-5fef-408b-b36c-df69b01ccc2f	1446	Phạm Văn Hà	558a888c-098b-4ec0-997f-d81caefd1a81	hapv1@ptit.edu.vn	VKH101145	Phạm Văn Hà (VKH101145)		558a888c-098b-4ec0-997f-d81caefd1a81	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb0dd313-1fd4-4ebf-8f33-58b2084f1089	739	Trần Ngọc Hà	9703465f-6646-4ab8-bf95-d33e10295812		TG0354	Trần Ngọc Hà (TG0354)		9703465f-6646-4ab8-bf95-d33e10295812	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
24bc06da-5f46-48f4-a895-7caa14d9256e	1220	Trần Thị Nhật Hà	a853937a-da7c-4593-a359-df9cdb71f3b3	ttnha@ptit.edu.vn	KQT200467	Trần Thị Nhật Hà (KQT200467)		a853937a-da7c-4593-a359-df9cdb71f3b3	t	t	176	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1a63cca1-e9ad-4337-acbf-8fbdc640235f	319	Trần Thị Thúy Hà	f2c13f46-6371-4406-bff0-f092b6cc4bca	hatt@ptit.edu.vn	KDT100234	Trần Thị Thúy Hà (KDT100234)		f2c13f46-6371-4406-bff0-f092b6cc4bca	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8e7e604e-2705-47ee-9af4-8a80a77b7691	562	Tô Thị Ngọc Hà	ba22159a-8a01-4c2d-821d-a737badd031c	hattn@ptit.edu.vn	PDT100059	Tô Thị Ngọc Hà (PDT100059)		ba22159a-8a01-4c2d-821d-a737badd031c	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9586902e-0281-4fdb-8262-eb8e2b719524	697	Tạ Thị Thanh Hà	67f7a3f9-4463-4f8c-9f90-7239dc57999c		TG0033	Tạ Thị Thanh Hà (TG0033)		67f7a3f9-4463-4f8c-9f90-7239dc57999c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5dddd54a-066e-4008-a283-615f6ff209cf	1000	Vũ Thị Hà	a1a06ef3-ca33-477a-afad-39ee9777844c		TG0042	Vũ Thị Hà (TG0042)		a1a06ef3-ca33-477a-afad-39ee9777844c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9e8c333e-36c0-4c46-bfcb-d779f7624ed5	961	Vũ Thị Thái Hà	6f6eb3d6-7711-477a-971c-2dc1fa6096ed		TG0331	Vũ Thị Thái Hà (TG0331)		6f6eb3d6-7711-477a-971c-2dc1fa6096ed	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
390b50c9-7f24-4008-9c2b-75cab6d329e4	242	Vũ Thị Thúy Hà	4e12ccb8-4d70-4f1e-bae7-d5c24071d6ee	havt@ptit.edu.vn	KVT100293	Vũ Thị Thúy Hà (KVT100293)		4e12ccb8-4d70-4f1e-bae7-d5c24071d6ee	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
37808efa-0d46-4fb4-9144-51486ed705e0	44	Vũ Thị Việt Hà	6ee8807b-0789-4675-87de-fe383311abeb	havtv@ptit.edu.vn	VKH100089	Vũ Thị Việt Hà (VKH100089)		6ee8807b-0789-4675-87de-fe383311abeb	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c8880666-0271-49dc-af16-e6df049f46ed	1043	Đào Thu Hà	c70fea8c-5c82-4e32-83f3-1adc40fd48ea	dtha@ptit.edu.vn	KTC100992	Đào Thu Hà (KTC100992)		c70fea8c-5c82-4e32-83f3-1adc40fd48ea	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a4ad78d-c350-41c0-a174-f9863d50fe0c	630	Đặng Hải Hà	e6db1c2f-68da-4b91-b395-4681504d341b		TG0374	Đặng Hải Hà (TG0374)		e6db1c2f-68da-4b91-b395-4681504d341b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06080d57-9fd7-441f-8c6b-bca3ad6fd4ad	738	Đặng Thu Hà	aea93955-9fa2-4f58-a53a-3f5f008e4699		TG0586	Đặng Thu Hà (TG0586)		aea93955-9fa2-4f58-a53a-3f5f008e4699	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
681a0052-6ac2-4c73-b6d5-ed0d60afae44	534	Đặng Thu Hà	e6b1f79e-eff1-4a97-8891-4392e9394564	hadt@ptit.edu.vn	PTC100034	Đặng Thu Hà (PTC100034)		e6b1f79e-eff1-4a97-8891-4392e9394564	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
33051a56-d9d5-49af-8728-f52b0aa901b5	440	Đặng Việt Hà	b7ce7e78-b92c-4516-8a54-de080ea04d51	hadv@ptit.edu.vn	VKH100584	Đặng Việt Hà (VKH100584)		b7ce7e78-b92c-4516-8a54-de080ea04d51	t	t	73	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9e61533e-c30a-4cdf-9a3d-51c667c7426b	1175	Đỗ Hoàng Hà	b91c45aa-3fa0-41c3-98c2-99d057b945ee	dhha@ptit.edu.vn	TKT200407	Đỗ Hoàng Hà (TKT200407)		b91c45aa-3fa0-41c3-98c2-99d057b945ee	t	t	12	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f56e13da-d6d0-4fe8-b85f-6c207d09d5eb	53	Đỗ Hương Hà	04b87830-3a02-4292-8591-00a3aa6209db	hado@ptit.edu.vn	VKH100543	Đỗ Hương Hà (VKH100543)		04b87830-3a02-4292-8591-00a3aa6209db	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d27a0a2d-a0ab-4dbb-a02d-3918c4b50aaa	1386	Đỗ Thanh Hà	35a75912-aee4-4b94-a36a-9ba8977b7207	dothanhha@ptit.edu.vn	KTN101114	Đỗ Thanh Hà (KTN101114)		35a75912-aee4-4b94-a36a-9ba8977b7207	t	t	253	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a783eec0-0739-4932-9405-f58636be6247	1124	Đỗ Tuyết Linh Hà	84a4127e-5c0f-420e-a463-3226233461e8		TG0322	Đỗ Tuyết Linh Hà (TG0322)		84a4127e-5c0f-420e-a463-3226233461e8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c6863525-dfe8-4d42-a172-bf840c112d09	141	Nguyễn Anh Hào	6619ef03-6ee0-461d-8f1c-fe3d9293dfc9	haona@ptit.edu.vn	KCN200430	Nguyễn Anh Hào (KCN200430)		6619ef03-6ee0-461d-8f1c-fe3d9293dfc9	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c00bbc89-c809-491e-9dbf-5f5281c28003	702	Nguyễn Văn Hào	8dc8d553-b490-48c9-851b-e66d3cf1025b		TG0401	Nguyễn Văn Hào (TG0401)		8dc8d553-b490-48c9-851b-e66d3cf1025b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1182f84c-a74b-4c20-8efe-56b2a1d28bf7	110	Đinh Việt Hào	ca7350dd-6f55-4d85-b414-de776efdd5d7	haodv@ptit.edu.vn	KVT200759	Đinh Việt Hào (KVT200759)		ca7350dd-6f55-4d85-b414-de776efdd5d7	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fcc45773-27b3-4bb7-a688-0b42c401e4a8	847	Phạm Thiện Hân	92d806b2-9e2f-4f2d-b331-99de0938e788	hanpt@ptit.edu.vn	KDT100876	Phạm Thiện Hân (KDT100876)		92d806b2-9e2f-4f2d-b331-99de0938e788	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9dc0c99b-0f56-4452-aca6-6f4d75439dd5	980	Đào Thị Ngọc Hân	2caa47ae-32d0-4a6d-82a1-a501d677a52a		TG0083	Đào Thị Ngọc Hân (TG0083)		2caa47ae-32d0-4a6d-82a1-a501d677a52a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf1ebf76-462d-44d6-9481-54eb96bddd1b	830	Nguyễn Hữu Hậu	3d1f5d84-c655-4e57-bd64-7d65f8dee650	haunh@ptit.edu.vn	KSD100677	Nguyễn Hữu Hậu (KSD100677)		3d1f5d84-c655-4e57-bd64-7d65f8dee650	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1a758ec1-e26b-4b5e-a8d0-f392bda96e47	1354	Cao Phục Long Hòa	0ec0956b-6723-4d66-b6c3-f6e0e170aac3	hoacpl@ptit.edu.vn	KCB201107	Cao Phục Long Hòa (KCB201107)		0ec0956b-6723-4d66-b6c3-f6e0e170aac3	t	t	193	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
53822037-d66a-4eef-abc9-fb311d74455a	659	Phạm Quang Hòa	ea14ab34-4c3a-4a28-8fe7-fdba9388b70b		TG0526	Phạm Quang Hòa (TG0526)		ea14ab34-4c3a-4a28-8fe7-fdba9388b70b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
51e30853-2fba-43fb-a418-b2fb8375a5f8	222	Trần Thị Hòa	3bdde4dd-020e-4aa9-93c5-4fdbc5fffa72	hoatt@ptit.edu.vn	KQT100336	Trần Thị Hòa (KQT100336)		3bdde4dd-020e-4aa9-93c5-4fdbc5fffa72	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80fe6d4e-126a-4ae2-9d74-0913fb632154	634	Trần Thị Hòa	a2960503-5aed-4e17-b093-3d4a0bb14c69		TG0557	Trần Thị Hòa (TG0557)		a2960503-5aed-4e17-b093-3d4a0bb14c69	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e83595f6-e438-411e-a3b9-5f2bd92124d9	755	Đoàn Nguyễn Thanh Hòa	7ea6b88a-de98-4570-8871-5d504e1d9d43		TG223	Đoàn Nguyễn Thanh Hòa (TG223)		7ea6b88a-de98-4570-8871-5d504e1d9d43	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1d9f46c2-620a-4085-8b4c-f3e8b21a701a	99	Huỳnh Văn Hóa	b3850c61-59e9-4b42-9093-a1243255d8fa	hoahv@ptit.edu.vn	KVT200496	Huỳnh Văn Hóa (KVT200496)		b3850c61-59e9-4b42-9093-a1243255d8fa	t	t	171	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ebfd7da-fc1d-4307-b6c9-27c77bdbce6a	132	Lê Minh Hóa	5332ab80-97bd-4964-aa24-79744185df60	hoalm@ptit.edu.vn	KCN200433	Lê Minh Hóa (KCN200433)		5332ab80-97bd-4964-aa24-79744185df60	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f091e523-36cd-41ef-bd1f-155565262f30	280	Nguyễn Đình Hóa	0f0b8c57-ed36-45c3-924c-5a210485ec1f	hoand@ptit.edu.vn	KCN100262	Nguyễn Đình Hóa (KCN100262)		0f0b8c57-ed36-45c3-924c-5a210485ec1f	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7796218-8200-43da-acda-4ef779d05522	1295	Hoàng Văn Hùng	4bb98c9c-a1a6-4a5d-886b-d523366337cb	hunghv@ptit.edu.vn	VPH100026	Hoàng Văn Hùng (VPH100026)		4bb98c9c-a1a6-4a5d-886b-d523366337cb	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3a39c964-da9f-4125-a465-e9f37a416064	772	Lê Văn Hùng	41719c07-9893-46d6-9d86-c0fad263f152		TG0428	Lê Văn Hùng (TG0428)		41719c07-9893-46d6-9d86-c0fad263f152	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
47a699f7-2681-483a-8d3a-a256e0b2635e	258	Lý Đình Hùng	1eaf296f-a08f-4d2a-85f8-330899520ea9	ldhung@ptit.edu.vn	KVT100703	Lý Đình Hùng (KVT100703)		1eaf296f-a08f-4d2a-85f8-330899520ea9	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e05872cd-aeb0-4c28-b157-9a779a211c0f	516	Lưu Doãn Hùng	478eb62b-9821-4383-8ee0-a0aa523ff4e3	hungld@ptit.edu.vn	VCN100602	Lưu Doãn Hùng (VCN100602)		478eb62b-9821-4383-8ee0-a0aa523ff4e3	t	t	55	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b326bcc-e754-4778-b701-1b83028e71e4	438	Nguyễn Duy Hùng	24b9b0c6-9033-4f85-8649-97b2a5fce69d	ndhung@ptit.edu.vn	VKT100588	Nguyễn Duy Hùng (VKT100588)		24b9b0c6-9033-4f85-8649-97b2a5fce69d	t	t	67	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
71f0b34d-5ce4-4c76-ab2d-af66a903cb58	1283	Nguyễn Mạnh Hùng	e91890b2-1b38-46ef-a3d4-0f6bbc47c630	hungnm@ptit.edu.vn	VPH100152	Nguyễn Mạnh Hùng (VPH100152)		e91890b2-1b38-46ef-a3d4-0f6bbc47c630	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
000f9ffb-8174-45ee-8e26-9bf61f7808e6	288	Nguyễn Mạnh Hùng	db97eb9f-eb81-418b-9a56-fc8e04670bd4	mhnguyen@ptit.edu.vn	KCN100264	Nguyễn Mạnh Hùng (KCN100264)		db97eb9f-eb81-418b-9a56-fc8e04670bd4	t	t	22	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ca8e780b-c3a7-448b-81ce-a36c7190398f	975	Nguyễn Tiến Hùng	1ca0f1df-5129-42fc-bcfb-4f88ab05cc33	hungnt.tg@ptit.edu.vn	TG0217	Nguyễn Tiến Hùng (TG0217)		1ca0f1df-5129-42fc-bcfb-4f88ab05cc33	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b220aac2-7891-44c5-b70e-ff6097471585	385	Nguyễn Vinh Hùng	b2aa8e2b-cae6-4e9c-aee5-9e1312bd46ac	hungnv@ptit.edu.vn	TDV100167	Nguyễn Vinh Hùng (TDV100167)		b2aa8e2b-cae6-4e9c-aee5-9e1312bd46ac	t	t	235	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
73a4e159-b1d0-4b40-9324-f6d2c7a08211	1040	Nguyễn Việt Hùng	4805ab09-b171-47be-ad85-3eb105bf275a		TG0101	Nguyễn Việt Hùng (TG0101)		4805ab09-b171-47be-ad85-3eb105bf275a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80a208e7-ef08-44cc-a424-cdb16faca387	1138	Nguyễn Văn Hùng	50b0990b-ea94-4b23-a2c4-b3e55098549b		TG0070	Nguyễn Văn Hùng (TG0070)		50b0990b-ea94-4b23-a2c4-b3e55098549b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c84d3ebf-d3d9-4a49-abfc-4680ad3839b8	1314	Nguyễn Đoàn Hùng	2150bbe4-30b1-4929-ae8f-41ca5b0d23ca		TQT100901	Nguyễn Đoàn Hùng (TQT100901)		2150bbe4-30b1-4929-ae8f-41ca5b0d23ca	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
190b0eff-9c03-4821-abb9-54d9d135b564	596	Nguyễn Đức Hùng	b00b6d2d-5afe-405f-9656-3941f0dd0926	hungnd@ptit.edu.vn	PKH100102	Nguyễn Đức Hùng (PKH100102)		b00b6d2d-5afe-405f-9656-3941f0dd0926	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7c79cdfc-c7cd-4708-bec6-1a0205379a8c	1021	Phạm Hùng	c057cf3e-2d0f-48f4-bac5-6925bd58c2ee	hungpham@ptit.edu.vn	KVT101063	Phạm Hùng (KVT101063)		c057cf3e-2d0f-48f4-bac5-6925bd58c2ee	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
568237e3-c37e-4293-8049-db48766994fb	1008	Phạm Quốc Hùng	59035b85-eca6-45c5-b279-ff85fb291c19		TG0106	Phạm Quốc Hùng (TG0106)		59035b85-eca6-45c5-b279-ff85fb291c19	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e580d195-52cc-49f1-8257-27062e64a14a	1397	Trần Quốc Hùng	c10e8b77-c5ba-488d-9ee7-a00ca9b20269	hungtq1@ptit.edu.vn	KQT200470	Trần Quốc Hùng (KQT200470)		c10e8b77-c5ba-488d-9ee7-a00ca9b20269	t	t	176	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5eb8e9c5-dd9c-4cbe-bc80-c3da98e65c27	834	Tạ Quang Hùng	a16b3758-0b9e-47a1-814d-a7f25220adc1	taquanghung@ptit.edu.vn	KSD100870	Tạ Quang Hùng (KSD100870)		a16b3758-0b9e-47a1-814d-a7f25220adc1	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8abed541-f5cd-40dd-a46b-91fe69eee9af	1264	Vũ Mạnh Hùng	56c557fd-ae37-4d32-bb86-fa6b938a2590	hungvm@ptit.edu.vn	TDT100893	Vũ Mạnh Hùng (TDT100893)		56c557fd-ae37-4d32-bb86-fa6b938a2590	t	t	48	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5cf7af09-3baa-499d-9b51-6f97a839fe0c	809	Vương Việt Hùng	409d77b9-4396-4f96-b634-0f58c5a487a2	hungvv@ptit.edu.vn	VPH100667	Vương Việt Hùng (VPH100667)		409d77b9-4396-4f96-b634-0f58c5a487a2	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bdb2df5b-e8f6-4567-a722-4990dd4a9492	994	Đinh Khắc Hùng	0793d79b-2818-458b-980c-e3e0cffa3f1f		TG0082	Đinh Khắc Hùng (TG0082)		0793d79b-2818-458b-980c-e3e0cffa3f1f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c94a85e1-1403-4802-b099-2e1082bba6f1	298	Đặng Ngọc Hùng	bf70d674-7541-4b76-b129-0815921eb980	hungdn@ptit.edu.vn	KCN100263	Đặng Ngọc Hùng (KCN100263)		bf70d674-7541-4b76-b129-0815921eb980	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6697fc0d-ca40-46af-9b1d-3cef9b7a8635	321	Đặng Việt Hùng	6df31582-f3ad-4f3e-a919-ade2aa9a582a	hungdv@ptit.edu.vn	KDT100688	Đặng Việt Hùng (KDT100688)		6df31582-f3ad-4f3e-a919-ade2aa9a582a	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
19dc8300-6680-46c8-a292-31e30841cbc2	509	Đỗ Mạnh Hùng	c8d60d20-8d38-4e1b-b786-cf4134eff2e8	hungdm@ptit.edu.vn	PKH100607	Đỗ Mạnh Hùng (PKH100607)		c8d60d20-8d38-4e1b-b786-cf4134eff2e8	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
554375ef-593f-4ba4-960e-ddc9cd90ee38	927	Đỗ Việt Hùng	433bb5ca-4d85-4d08-9188-f359fbf39dfc		TG0050	Đỗ Việt Hùng (TG0050)		433bb5ca-4d85-4d08-9188-f359fbf39dfc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4ed171a3-fcd8-4320-a981-ed63c6302f22	581	Cao Minh Hằng	bcd873c5-50d4-4d18-ba81-041d9e32af38	hangcm@ptit.edu.vn	PKT100090	Cao Minh Hằng (PKT100090)		bcd873c5-50d4-4d18-ba81-041d9e32af38	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
30e4430f-42db-471f-8e89-139c2ff7e685	264	Phạm Thị Lệ Hằng	650c4cd1-dd68-48df-b785-73f12ab4b623	hangptl@ptit.edu.vn	KTN100091	Phạm Thị Lệ Hằng (KTN100091)		650c4cd1-dd68-48df-b785-73f12ab4b623	t	t	240	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
19ead0a2-92b0-4c29-89ae-c6035b2722e9	201	Thái Thị Minh Hằng	197adb05-d059-491b-b1af-02e57f6b16cd	hangttm@ptit.edu.vn	KDP100714	Thái Thị Minh Hằng (KDP100714)		197adb05-d059-491b-b1af-02e57f6b16cd	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
904f5fea-b30a-4943-b578-5b39ea69a8fd	888	Bùi Quốc Hưng	5b0a4023-b3e9-4ee8-8cac-8b5e8f8197ef	hungbq.tg@ptit.edu.vn	2025.KCB1.15.797	Bùi Quốc Hưng (2025.KCB1.15.797)		5b0a4023-b3e9-4ee8-8cac-8b5e8f8197ef	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6f33df06-0d73-4730-a9a1-a0785c9bb902	1272	Chu Quang Hưng	ccf54fa6-1f50-4821-9dab-98c26bdf50c6	hungcq@ptit.edu.vn	TDT100634	Chu Quang Hưng (TDT100634)		ccf54fa6-1f50-4821-9dab-98c26bdf50c6	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
beb85d74-9aef-4667-bb76-c10c78bd1c2a	816	Nguyễn Xuân Hưng	43bd57e8-60bb-4cc3-b9cd-6f846f8e2c1c	hungnx@ptit.edu.vn	VPH100136	Nguyễn Xuân Hưng (VPH100136)		43bd57e8-60bb-4cc3-b9cd-6f846f8e2c1c	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1bcf001d-ab15-45ad-bb0e-c89daa97e68e	183	Nguyễn Quang Hưng	eb81cdce-94de-4e35-a6ee-d0b2c7160be9	hungnq2@ptit.edu.vn	KDP101014	Nguyễn Quang Hưng (KDP101014)		eb81cdce-94de-4e35-a6ee-d0b2c7160be9	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c70fa4e6-a7ca-467d-844f-5934e859d4db	1274	Nguyễn Quang Hưng	6fd72f00-a4cd-41f7-8f30-56671e15db6b	hungnq@ptit.edu.vn	TDT100641	Nguyễn Quang Hưng (TDT100641)		6fd72f00-a4cd-41f7-8f30-56671e15db6b	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f4d212bf-d0ce-439e-a949-2a6f1eebef73	971	Nguyễn Quang Hưng	76f134ab-9b2d-4753-a588-95f6aa3c02f9	hungnq1@ptit.edu.vn	KCN101000	Nguyễn Quang Hưng (KCN101000)		76f134ab-9b2d-4753-a588-95f6aa3c02f9	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7627f88e-a952-4cb9-85d0-a56e5fa98860	386	Nguyễn Quốc Hưng	ea017fec-af25-4c1d-8b6d-979faf8b9f54	nqhung@ptit.edu.vn	TDV100155	Nguyễn Quốc Hưng (TDV100155)		ea017fec-af25-4c1d-8b6d-979faf8b9f54	t	t	235	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06a62bba-5cea-420f-afa0-629d0bbad2a2	252	Nguyễn Việt Hưng	96eeb838-2d67-47ac-bf06-0c7098a9fca2	nvhung_vt1@ptit.edu.vn	PQL100299	Nguyễn Việt Hưng (PQL100299)		96eeb838-2d67-47ac-bf06-0c7098a9fca2	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
74cc438d-a31d-4c15-bd63-8e1925bfc4db	1265	Nguyễn Văn Hưng	540e88c4-21ae-4e24-8056-f13236ec2617	hung_nv@ptit.edu.vn	TDT100643	Nguyễn Văn Hưng (TDT100643)		540e88c4-21ae-4e24-8056-f13236ec2617	t	t	48	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2ba8fb0b-8667-49ed-8eb4-1e16b7d4feb4	165	Nguyễn Văn Hưng	fec33c83-068a-4114-b37e-b7142cf6ee0a	nvhung@ptit.edu.vn	KCB200416	Nguyễn Văn Hưng (KCB200416)		fec33c83-068a-4114-b37e-b7142cf6ee0a	t	t	195	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
afa98002-3408-4c1e-a4a0-88bae4fd0e75	768	Nguyễn Đình Hưng	e6b39fcb-36bf-4bde-9bcf-068d2608ba5b		TG0451	Nguyễn Đình Hưng (TG0451)		e6b39fcb-36bf-4bde-9bcf-068d2608ba5b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
69a0f19b-ab70-4f3b-af91-993c9f860b91	1083	Nguyễn Đắc Hưng	310848dd-51dc-4180-9159-63ae8a909808	hungnd.tg@ptit.edu.vn	TG0605	Nguyễn Đắc Hưng (TG0605)		310848dd-51dc-4180-9159-63ae8a909808	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4e0e84f4-8316-4731-89e0-1fb94102c707	29	Trần Quốc Hưng	HUNGTQ	tranglou1003@gmail.com		Trần Quốc Hưng		vkh100545	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7212590-af2a-4405-a183-2f14c8dfdc7a	498	Trần Quang Hưng	e183a25c-a1a9-42a9-bfeb-52ac10219b7f	hungtq2@ptit.edu.vn	VCN101052	Trần Quang Hưng (VCN101052)		e183a25c-a1a9-42a9-bfeb-52ac10219b7f	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64fa7857-86a8-4f7a-8142-52a10988cbff	595	Trần Quang Hưng	87f79972-d3f2-4969-a1a2-700a1c978309	quanghung@ptit.edu.vn	PKH100103	Trần Quang Hưng (PKH100103)		87f79972-d3f2-4969-a1a2-700a1c978309	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3f87749e-9716-4f3c-b32b-b4859d79d66d	415	Trần Quốc Hưng	7625d7b3-9833-4457-a793-abf5e4f6715c	hungtran@ptit.edu.vn	PTH200372	Trần Quốc Hưng (PTH200372)		7625d7b3-9833-4457-a793-abf5e4f6715c	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4e1810cf-53f8-4946-901a-81a3a463f232	224	Trịnh Duy Hưng	91a5e0fd-7b99-45f0-885f-ab6376e16982	hungtd@ptit.edu.vn	KTC100858	Trịnh Duy Hưng (KTC100858)		91a5e0fd-7b99-45f0-885f-ab6376e16982	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e1038ec2-e260-443f-9d38-c8e6e02a9ee3	239	Đỗ Quang Hưng	743e5020-2f10-40d8-80df-4ea2778daf38	dqhung@ptit.edu.vn	KTC100892	Đỗ Quang Hưng (KTC100892)		743e5020-2f10-40d8-80df-4ea2778daf38	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3b37ef99-7dfc-4f78-bb02-171f5d191170	334	Hoàng Thị Lan Hương	8cb6c7c0-2acf-44a7-ba07-508813ec702f	huonghtl@ptit.edu.vn	KCB100199	Hoàng Thị Lan Hương (KCB100199)		8cb6c7c0-2acf-44a7-ba07-508813ec702f	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0b7101d3-84cb-42cc-8dff-2c03ac2707e2	1015	Khuất Thị Hương	f3711392-fe23-4f12-8d60-695a69444e12	huongkt@ptit.edu.vn	KVT101015	Khuất Thị Hương (KVT101015)		f3711392-fe23-4f12-8d60-695a69444e12	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
60371a06-022b-4c49-a996-e037c5beea5a	955	Kiều Mai Hương	280dd1dc-ef32-4992-9042-f8d62be87f59		TG0330	Kiều Mai Hương (TG0330)		280dd1dc-ef32-4992-9042-f8d62be87f59	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9af467e8-2d74-4bc7-ad58-d9a801ecb457	889	Kiều Mai Hương	a6275278-0628-4a1a-9958-b03f544f8a65		TG0308	Kiều Mai Hương (TG0308)		a6275278-0628-4a1a-9958-b03f544f8a65	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
41f17840-a2b7-4d2f-b56a-52797509df80	353	Lê Mai Hương	0ae16aaa-cd71-4d1a-aa02-ef050a372154	huonglm@ptit.edu.vn	KCB101005	Lê Mai Hương (KCB101005)		0ae16aaa-cd71-4d1a-aa02-ef050a372154	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
566a8567-2dd8-4959-aff4-64ac22785857	439	Nguyễn Thu Hương	a3cee2ae-bf57-4e12-8b36-f68e4be83ff6	huongnt@ptit.edu.vn	VKT100937	Nguyễn Thu Hương (VKT100937)		a3cee2ae-bf57-4e12-8b36-f68e4be83ff6	t	t	67	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f8d5020-5092-4bba-972f-f6fa5ac64e49	351	Nguyễn Thị Hương	2c5c7319-1031-4444-aa85-14e69af6382f	nthuong@ptit.edu.vn	KCB100980	Nguyễn Thị Hương (KCB100980)		2c5c7319-1031-4444-aa85-14e69af6382f	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b703735f-03d8-4c3b-9b52-31ad93e06348	1004	Nguyễn Thị Thanh Hương	47b86390-0d7d-4910-8dc0-3b564e8714d2		TG0226	Nguyễn Thị Thanh Hương (TG0226)		47b86390-0d7d-4910-8dc0-3b564e8714d2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5052333c-7049-43af-b7fb-6f2f8eb2985e	577	Nguyễn Thị Thanh Hương	9e295112-c132-4024-a06f-0f79981b4edb	thanhhuongnt@ptit.edu.vn	PKT100094	Nguyễn Thị Thanh Hương (PKT100094)		9e295112-c132-4024-a06f-0f79981b4edb	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ffbad7cb-a534-4cab-b05d-3792793f2724	1222	Nguyễn Thị Thanh Hương	9d6f4288-ef68-40a2-b98e-1aad053cb107	ntthuong@ptit.edu.vn	KQT200471	Nguyễn Thị Thanh Hương (KQT200471)		9d6f4288-ef68-40a2-b98e-1aad053cb107	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b2ad67c9-4c46-4ca6-8ece-72a245b0c0a5	574	Nguyễn Thị Thu Hương	2a8680b4-7252-423c-8439-ed5e0bcb37f0	huongngt@ptit.edu.vn	PQL100052	Nguyễn Thị Thu Hương (PQL100052)		2a8680b4-7252-423c-8439-ed5e0bcb37f0	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3530bb00-40d6-478f-ae17-2f8336a540b4	615	Ngô Thị Thu Hương	0e83e486-260e-4db2-a3b3-beb1aa02a6ef	huongntt2@ptit.edu.vn	PGV100116	Ngô Thị Thu Hương (PGV100116)		0e83e486-260e-4db2-a3b3-beb1aa02a6ef	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02e87542-53de-4af3-8b6b-1d2225540c7c	843	Phan Thị Hương	867ba715-7469-481f-805d-ae07c7d5acda	huongpt@ptit.edu.vn	KSD100188	Phan Thị Hương (KSD100188)		867ba715-7469-481f-805d-ae07c7d5acda	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d3fbda43-8b52-4957-9180-46fe6b7347a2	1304	Thái Thu Hương	e67e2678-58f1-42fd-9f78-777fd4926a29	huongtt2@ptit.edu.vn	VPH101016	Thái Thu Hương (VPH101016)		e67e2678-58f1-42fd-9f78-777fd4926a29	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
35f1e6fc-422a-4b83-9ba1-9443cb5a09a6	459	Trần Thanh Hương	a22c83dd-90ba-4ada-95dc-2b4b82ab1169	huongtt@ptit.edu.vn	VKT100573	Trần Thanh Hương (VKT100573)		a22c83dd-90ba-4ada-95dc-2b4b82ab1169	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
14d3dbf3-a5f3-46cb-a615-ba778f37cc3c	952	Trần Thị Hương	1eea9add-f9cc-4146-9f0c-0a70ee964524		TG0238	Trần Thị Hương (TG0238)		1eea9add-f9cc-4146-9f0c-0a70ee964524	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e770ad8c-68f0-4516-9690-b53faf9a4f06	1317	Trần Thị Thu Hương	1fd88657-8afe-4056-83eb-b211a785a26d	huongttt@ptit.edu.vn	TQT101071	Trần Thị Thu Hương (TQT101071)		1fd88657-8afe-4056-83eb-b211a785a26d	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0233285e-e05f-4672-ba05-d14f446df416	40	Vũ Thị Lan Hương	f5ec6e93-d9ed-4eb6-b705-6b04e2e49fb5	huongvtl@ptit.edu.vn	VKH100521	Vũ Thị Lan Hương (VKH100521)		f5ec6e93-d9ed-4eb6-b705-6b04e2e49fb5	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7c3855cd-8949-4749-a65e-87a65f45badb	897	Vũ Thị Thanh Hương	96fecb8b-4fbf-43fc-a298-4fe0ced497c6	huongvtt.tg@ptit.edu.vn	TG0017	Vũ Thị Thanh Hương (TG0017)		96fecb8b-4fbf-43fc-a298-4fe0ced497c6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6a28760c-df1e-4f0b-ac81-c5b2c84dca90	468	Đinh Thị Hương	8668db20-9b20-4fa1-9562-5e1b48689a0e	huongdt@ptit.edu.vn	VKT100565	Đinh Thị Hương (VKT100565)		8668db20-9b20-4fa1-9562-5e1b48689a0e	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
01d7e14f-ce54-4a67-914e-1b7b8ae8b0ea	935	Đoàn Thị Thanh Hương	5fe5173e-9172-4080-a156-b45d729338b9		TG0046	Đoàn Thị Thanh Hương (TG0046)		5fe5173e-9172-4080-a156-b45d729338b9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
906fb4f4-acc3-4b01-b6ac-74cc23f6a5cf	921	Đỗ Thị Lan Hương	cd1ac841-64eb-4924-a562-32587760ba08		TG0229	Đỗ Thị Lan Hương (TG0229)		cd1ac841-64eb-4924-a562-32587760ba08	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
90909bc2-d277-4ad1-8636-3facd79931ba	1167	Nguyễn Mỹ Hường	08211204-0719-4378-84b6-bec26a92f7ca	huongnm@ptit.edu.vn	PSV200403	Nguyễn Mỹ Hường (PSV200403)		08211204-0719-4378-84b6-bec26a92f7ca	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a62cb23-d8ad-42ed-9fdc-0401ae0cc1ef	1137	Nguyễn Thị Thu Hường	4a9e39a7-2f97-42d9-8599-23cdf91e4d9c		TG0286	Nguyễn Thị Thu Hường (TG0286)		4a9e39a7-2f97-42d9-8599-23cdf91e4d9c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9b248aee-c9da-4afc-9013-13ff9d192e0e	569	Trần Thị Hường	cd8477ad-e3e2-4bbd-975a-e1461c54cebe	huongtt1@ptit.edu.vn	PQL100074	Trần Thị Hường (PQL100074)		cd8477ad-e3e2-4bbd-975a-e1461c54cebe	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dd1125ba-6efe-4597-b19e-6f4ad48c0c16	1007	Đỗ Hường	4e949e58-0587-413f-823b-d19e039efe5f		TG0061	Đỗ Hường (TG0061)		4e949e58-0587-413f-823b-d19e039efe5f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
012730ad-c3c9-4d68-8a83-6b0d8044c6cc	1316	Đỗ Thanh Hường	9b2e4203-0c17-46eb-8ef1-623d1b436684	dthuong@ptit.edu.vn	TQT100900	Đỗ Thanh Hường (TQT100900)		9b2e4203-0c17-46eb-8ef1-623d1b436684	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
71c88ac5-ff58-49f5-9572-87f4135cf779	679	Đỗ Thu Hường	a9b3c910-7552-45b6-aa3d-4f89489ba088	huongdt.tg@ptit.edu.vn	TG0559	Đỗ Thu Hường (TG0559)		a9b3c910-7552-45b6-aa3d-4f89489ba088	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c9d410e5-4520-42fd-8f0e-5e9b896c2e64	884	Hoàng Hồng Hạnh	4cc58903-4e48-493e-81b2-6fc55630cce4	hanhhh@ptit.edu.vn	KCB100223	Hoàng Hồng Hạnh (KCB100223)		4cc58903-4e48-493e-81b2-6fc55630cce4	t	t	23	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d4038681-66da-4916-8c24-e22fa6cbea05	1374	Hoàng Hữu Hạnh	83f61c9b-9caa-4455-84c5-41c7fa810f0e	hhhanh@ptit.edu.vn	TQT100142	Hoàng Hữu Hạnh (TQT100142)		83f61c9b-9caa-4455-84c5-41c7fa810f0e	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
92a811df-7847-4cbf-a363-a0a11dc971b9	1176	Hoàng Lê Hồng Hạnh	f52cf587-2333-42c4-b206-7187adc1069c	hanhhlh@ptit.edu.vn	TKT200408	Hoàng Lê Hồng Hạnh (TKT200408)		f52cf587-2333-42c4-b206-7187adc1069c	t	t	12	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f9d057db-0740-432c-a1c1-51cd7bc58dec	354	Lê Thị Hồng Hạnh	ae48c8aa-de13-4831-bf3b-1d100729f187	hanhlth@ptit.edu.vn	KCB100197	Lê Thị Hồng Hạnh (KCB100197)		ae48c8aa-de13-4831-bf3b-1d100729f187	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2702affe-7930-409e-b07c-4c51960f8be5	1150	Nguyễn Bích Hạnh	774ba6b8-f5e6-4fce-b0b2-c633902c6639	hanhnb@ptit.edu.vn	TDT100187	Nguyễn Bích Hạnh (TDT100187)		774ba6b8-f5e6-4fce-b0b2-c633902c6639	t	t	2	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
732dd035-4018-4854-82c1-d5e0d319c115	922	Nguyễn Quang Hạnh	7d9bea05-d32a-48e5-9069-c727f4eddd6c		TG0467	Nguyễn Quang Hạnh (TG0467)		7d9bea05-d32a-48e5-9069-c727f4eddd6c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02c88ceb-ba1b-4a9f-9b37-f42652d8f92e	631	Nguyễn Thị Hạnh	c596e917-6976-476f-a4a4-1e4157d43cbb	hanhnt.tg@ptit.edu.vn	TG0587	Nguyễn Thị Hạnh (TG0587)		c596e917-6976-476f-a4a4-1e4157d43cbb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
96ae16ba-eef5-445b-97a9-89fcef0755cb	802	Nguyễn Thị Hồng Hạnh	05932190-655f-43f8-bb37-3a027d44b687	hanhnth@ptit.edu.vn	TKT100808	Nguyễn Thị Hồng Hạnh (TKT100808)		05932190-655f-43f8-bb37-3a027d44b687	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
af5cf823-e676-40c6-a8fe-be552d894558	1315	Phạm Thị Hạnh	d2e2c2ba-fbc8-4b98-9018-336fc23e2d4f	hanhpt@ptit.edu.vn	TQT100899	Phạm Thị Hạnh (TQT100899)		d2e2c2ba-fbc8-4b98-9018-336fc23e2d4f	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0aa06c09-acef-4e76-b1f7-44897c2eb44f	929	Phạm Thị Hồng Hạnh	96f27d5a-f42f-415f-bd46-ba98a7025a72		TG0232	Phạm Thị Hồng Hạnh (TG0232)		96f27d5a-f42f-415f-bd46-ba98a7025a72	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
23768c6c-857a-4843-a105-75f0015ac810	920	Trần Thị Hạnh	72b4fadd-1a28-4118-925f-92131d9da8e3		TG0019	Trần Thị Hạnh (TG0019)		72b4fadd-1a28-4118-925f-92131d9da8e3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3f63df97-57e6-4800-aa12-1132e7b1cf90	796	Trần Thị Mỹ Hạnh	19d622bd-ba2a-47d3-95b9-b5fdcc3a884a	hanhtm@ptit.edu.vn	PTC100121	Trần Thị Mỹ Hạnh (PTC100121)		19d622bd-ba2a-47d3-95b9-b5fdcc3a884a	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
19fd124a-f718-419d-b6ab-688b848a1ddd	219	Trần Đoàn Hạnh	84bede92-660a-4314-b4ae-a1cfc1643e85	hanhtd@ptit.edu.vn	KQT100335	Trần Đoàn Hạnh (KQT100335)		84bede92-660a-4314-b4ae-a1cfc1643e85	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b180998a-15d8-48d3-b3b9-e096c7d54496	1324	Tân Hạnh	ba86c4a0-2ab2-4664-b8ee-ce7b41a8285e	tanhanh@ptit.edu.vn	KCN200006	Tân Hạnh (KCN200006)		ba86c4a0-2ab2-4664-b8ee-ce7b41a8285e	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
96d1d016-20ae-4b00-b8be-f43f20f8f9af	932	Vũ Ngọc Hạnh	f335feee-c49a-418c-8347-8f21a3dc0b7b		TG0001	Vũ Ngọc Hạnh (TG0001)		f335feee-c49a-418c-8347-8f21a3dc0b7b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
daf3ae50-3c8a-46d0-b7dd-ecbc3b2cd8ee	559	Đinh Thị Bích Hạnh	d86e4d08-8687-498e-a711-caa74e01b905	hanhdtb@ptit.edu.vn	PDT100060	Đinh Thị Bích Hạnh (PDT100060)		d86e4d08-8687-498e-a711-caa74e01b905	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
33d6dba6-6749-4210-ba9f-c9bcdb387524	187	Hoàng Đăng Hải	8a3fecef-8356-4042-9623-f8b2a9131d13	haihd@ptit.edu.vn	KDP100353	Hoàng Đăng Hải (KDP100353)		8a3fecef-8356-4042-9623-f8b2a9131d13	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c95f17a2-8e7b-42ad-8894-3755fcaeca92	1112	Nguyễn Minh Hải	a811fef9-f5da-47b9-9f4b-d959eeeec379		TG0078	Nguyễn Minh Hải (TG0078)		a811fef9-f5da-47b9-9f4b-d959eeeec379	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
67115c1b-c351-4083-8ade-931267d7da6c	524	Nguyễn Nam Hải	10edfe4e-5965-418b-ab37-73422fadb1eb	hainn@ptit.edu.vn	KAT100933	Nguyễn Nam Hải (KAT100933)		10edfe4e-5965-418b-ab37-73422fadb1eb	t	t	219	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
28e8480e-3577-4a6d-ade8-33f97e2988d3	1041	Nguyễn Thị Hồng Hải	26df6eb2-318c-414b-9dcc-1cfaa512bde0	hainth@ptit.edu.vn	KTC101062	Nguyễn Thị Hồng Hải (KTC101062)		26df6eb2-318c-414b-9dcc-1cfaa512bde0	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
905ca9de-891e-4738-be8b-c212c5f3e943	206	Nguyễn Thị Thanh Hải	59a796bd-b68a-458d-a35f-e8eb328a05ef	haintt@ptit.edu.vn	KQT100712	Nguyễn Thị Thanh Hải (KQT100712)		59a796bd-b68a-458d-a35f-e8eb328a05ef	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe5c09de-8a19-4bc5-9ddc-8f80207be32f	139	Nguyễn Thị Tuyết Hải	74ca6320-6a95-48be-978c-f3b1fbbb6726	ntthai@ptit.edu.vn	KCN200440	Nguyễn Thị Tuyết Hải (KCN200440)		74ca6320-6a95-48be-978c-f3b1fbbb6726	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9443380e-45a3-490b-b712-ca96480719ab	1178	Nguyễn Xuân Hải	edce207b-41ec-47e7-bd3f-bb4ba46733c6	haingx@ptit.edu.vn	KCB200412	Nguyễn Xuân Hải (KCB200412)		edce207b-41ec-47e7-bd3f-bb4ba46733c6	t	t	11	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c9fec04d-8183-495a-920c-02ed7418a20c	536	Phạm Nguyễn Hoàng Hải	fa016486-e8ad-4382-9ede-c854da993e2c	haipnh@ptit.edu.vn	PTC100042	Phạm Nguyễn Hoàng Hải (PTC100042)		fa016486-e8ad-4382-9ede-c854da993e2c	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
408ecada-6d75-4675-9491-e9235bfc62a1	936	Phạm Xuân Hải	cf6315ea-2467-41e7-853d-90acfaeea3ee		TG0011	Phạm Xuân Hải (TG0011)		cf6315ea-2467-41e7-853d-90acfaeea3ee	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
331e0ce9-017e-4672-8891-d03124ff7040	1281	Trần Vũ Hải	b61cd81b-76a5-4958-b255-2291329a6843	haitv@ptit.edu.vn	VPH100010	Trần Vũ Hải (VPH100010)		b61cd81b-76a5-4958-b255-2291329a6843	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4421afd1-2a8b-4c04-826f-670af03326c6	248	Tạ Hoàng Hải	5638cb0b-c8f1-4b5d-8d78-d18d56faeb8f	haith@ptit.edu.vn	KVT100701	Tạ Hoàng Hải (KVT100701)		5638cb0b-c8f1-4b5d-8d78-d18d56faeb8f	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3e810077-2c2c-4ed8-b34f-a1455dee5327	594	Đinh Hồng Hải	08277927-837e-45d8-bfc5-48d5b2b49efa	haidh@ptit.edu.vn	PKH100098	Đinh Hồng Hải (PKH100098)		08277927-837e-45d8-bfc5-48d5b2b49efa	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
276af811-7ac9-42ae-933e-feb34530bd68	726	Đào Thanh Hải	c1615292-8e4f-4fb8-9dd3-530f4ba626ad		TG0493	Đào Thanh Hải (TG0493)		c1615292-8e4f-4fb8-9dd3-530f4ba626ad	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d14393a1-4160-4b9d-beab-02b5c2256509	1227	Nguyễn Thị Phương Hảo	a93e8607-8af0-4ce9-a7a4-8b1865d9cf14	haontp@ptit.edu.vn	KQT200469	Nguyễn Thị Phương Hảo (KQT200469)		a93e8607-8af0-4ce9-a7a4-8b1865d9cf14	t	t	177	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
737cd6b1-8bcd-4d0f-9a0e-5831253589e1	1323	Trần Thị Bích Hảo	5586c7e8-d110-4873-a6ae-9e0c102e99ba	haottb@ptit.edu.vn	TDT101007	Trần Thị Bích Hảo (TDT101007)		5586c7e8-d110-4873-a6ae-9e0c102e99ba	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f04c6e1e-98d4-46eb-94ed-391205aefab6	1204	Nguyễn Bình Hậu	f233e9fc-5c6a-42ec-81ba-dce38c87ba86	haunb@ptit.edu.vn	KDT200930	Nguyễn Bình Hậu (KDT200930)		f233e9fc-5c6a-42ec-81ba-dce38c87ba86	t	t	180	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
619cc7dc-d471-433d-ad1f-ca600e147265	948	Nguyễn Văn Hậu	93e80249-b597-4bff-93d9-d3b86624c86e		TG0081	Nguyễn Văn Hậu (TG0081)		93e80249-b597-4bff-93d9-d3b86624c86e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dd45a27e-6886-4c52-810c-a568aeab8b77	230	Nguyễn Văn Hậu	bcc8565f-3ea1-45b6-8767-94c1be9d213d	haunv@ptit.edu.vn	KTC100314	Nguyễn Văn Hậu (KTC100314)		bcc8565f-3ea1-45b6-8767-94c1be9d213d	t	t	20	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a05cb8f0-1b1a-40f3-a37a-c2e5af36b307	690	Nguyễn Đình Hậu	241e4547-34c0-44f3-9054-a4e3ffc76e27		TG0380	Nguyễn Đình Hậu (TG0380)		241e4547-34c0-44f3-9054-a4e3ffc76e27	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c0f604a5-c336-478d-a0aa-99461c7628bf	1013	Phạm Văn Hậu	99233988-a61f-49b4-abd6-d8ab070108bc		TG0298	Phạm Văn Hậu (TG0298)		99233988-a61f-49b4-abd6-d8ab070108bc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7fdc8644-23e3-41e8-bfe4-08ed31066ef2	1002	Vũ Văn Hậu	b545cea3-8eac-47a5-abbd-992fdd0f8a9d		TG0301	Vũ Văn Hậu (TG0301)		b545cea3-8eac-47a5-abbd-992fdd0f8a9d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9197a006-cb4f-451e-8d76-5a2aa80d1305	1388	Cao Thu Hằng	2ef2939a-8a05-4a4c-a03a-d8725dccf3ea	hangct@ptit.edu.vn	KCB101125	Cao Thu Hằng (KCB101125)		2ef2939a-8a05-4a4c-a03a-d8725dccf3ea	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80a34ae5-5a0e-4864-a2f0-7880d4ae20e3	213	Dương Thúy Hằng	58fc917a-5bfb-414c-961c-6bfeeabc7245	hang_dt@ptit.edu.vn	KQT100334	Dương Thúy Hằng (KQT100334)		58fc917a-5bfb-414c-961c-6bfeeabc7245	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
17f0a995-b8b6-4ea7-934d-672fb452bdb2	193	Lê Thị Hằng	2cf50418-3928-4006-a16c-ff1a18b093b1	hanglt@ptit.edu.vn	KDP100344	Lê Thị Hằng (KDP100344)		2cf50418-3928-4006-a16c-ff1a18b093b1	t	t	18	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cff0e362-db8b-4af6-a192-d79669caea5f	1392	Lê Thị Thu Hằng	2bb0df88-1472-459e-9237-6ea31c20c174	hangltt@ptit.edu.vn	KQT101094	Lê Thị Thu Hằng (KQT101094)		2bb0df88-1472-459e-9237-6ea31c20c174	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dc6c6f2b-6f5c-478e-8cb3-ff66e7536a88	1458	Nguyễn Thị Phương Hằng	hangphuongags@gmail.com	tranglou1003@gmail.com		Nguyễn Thị Phương Hằng			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9ec2735-340f-4256-8c8c-ed54d59e9881	1270	Nguyễn Thị Thu Hằng	cf08268b-3c09-4709-89a7-84964b5e5710	hangntt1@ptit.edu.vn	TDT100636	Nguyễn Thị Thu Hằng (TDT100636)		cf08268b-3c09-4709-89a7-84964b5e5710	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
639e8831-760a-47b7-a32c-4640f68aefe4	716	Nguyễn Thị Thu Hằng	96fbefa7-0a1f-47b8-a5d7-28625b0a084d		TG0515	Nguyễn Thị Thu Hằng (TG0515)		96fbefa7-0a1f-47b8-a5d7-28625b0a084d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b34f7c6f-ad90-493d-943f-dbf69bc438d6	1034	Nguyễn Thị Thu Hằng	71011327-ebc5-4e4f-b488-c1c63f03ed35	hangntt@ptit.edu.vn	KVT100295	Nguyễn Thị Thu Hằng (KVT100295)		71011327-ebc5-4e4f-b488-c1c63f03ed35	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4749b685-5b82-4bb3-8674-1ea07b3a5d3e	949	Phạm Thị Thu Hằng	579775fd-9fba-46ca-90be-a3a817f55afb		TG0237	Phạm Thị Thu Hằng (TG0237)		579775fd-9fba-46ca-90be-a3a817f55afb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bc9249f1-050a-4f86-aa8e-fa5a0b16aed7	918	Phạm Thị Thúy Hằng	839e66d5-5364-48bc-9f28-48d10408245e		TG0114	Phạm Thị Thúy Hằng (TG0114)		839e66d5-5364-48bc-9f28-48d10408245e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d505883c-9c67-45e7-a68b-03b534e16f28	799	Trịnh Thị Hằng	0bc77298-fed2-4bb0-889e-418f0dfa5660	hangtt@ptit.edu.vn	TKT100124	Trịnh Thị Hằng (TKT100124)		0bc77298-fed2-4bb0-889e-418f0dfa5660	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
72c90f1f-dc0e-4d89-b982-9aa050360e01	938	Vũ Thị Thu Hằng	ce6258a9-27ec-4e7d-bfd5-507945dfbde4	hangvtt.tg@ptit.edu.vn	2025.KCB1.15.804	Vũ Thị Thu Hằng (2025.KCB1.15.804)		ce6258a9-27ec-4e7d-bfd5-507945dfbde4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1d11f7db-6523-432c-80ee-627c64756371	774	Đinh Diệu Hằng	be09e9e3-159f-46fe-a960-ac757dcaac88		TG0416	Đinh Diệu Hằng (TG0416)		be09e9e3-159f-46fe-a960-ac757dcaac88	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b3127d89-b6b4-4a6b-9585-f2cdbfffc41f	1057	Đặng Thu Hằng	39531671-e32d-49de-84b4-8c3e779d8ef4		TG0222	Đặng Thu Hằng (TG0222)		39531671-e32d-49de-84b4-8c3e779d8ef4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ce47d012-c375-4014-b24f-79188e48b690	1109	Đỗ Thu Hằng	0dc2bea3-b606-4f8a-bb0e-4c68e6732336		TG0047	Đỗ Thu Hằng (TG0047)		0dc2bea3-b606-4f8a-bb0e-4c68e6732336	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0b33b2f7-49e0-493f-8eca-c8b6f2523335	612	Đỗ Thúy Hằng	2556b24b-393e-4df4-8a39-1945f755b6e8	hangdt@ptit.edu.vn	PGV100113	Đỗ Thúy Hằng (PGV100113)		2556b24b-393e-4df4-8a39-1945f755b6e8	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c0973903-57dc-45b9-a78e-c1d0190dfeeb	299	Dương Thị Thúy Hồng	c5d7116c-a533-4a16-8537-2ec75e27325b	hongdtt@ptit.edu.vn	KDT100560	Dương Thị Thúy Hồng (KDT100560)		c5d7116c-a533-4a16-8537-2ec75e27325b	t	t	24	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d8f5bc5a-7b81-407f-91f9-b829b200f88a	552	Lê Đình Hồng	ff2b7cee-0199-4087-8b5a-993fdd8c0089	hongld@ptit.edu.vn	PSV100151	Lê Đình Hồng (PSV100151)		ff2b7cee-0199-4087-8b5a-993fdd8c0089	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc9ebfba-8173-46fc-9cda-f7ebf770aaf9	844	Nguyễn Minh Hồng	337e7e50-f8e1-4f7a-8166-98758a860597	hongnm@ptit.edu.vn	KSD100670	Nguyễn Minh Hồng (KSD100670)		337e7e50-f8e1-4f7a-8166-98758a860597	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8330859b-e36c-4ddd-ac9b-c11d0174a059	1074	Nguyễn Thị Hồng	a2a82ba7-8920-4cce-9628-072cbdda6fd3	hongnt@ptit.edu.vn	KQT100912	Nguyễn Thị Hồng (KQT100912)		a2a82ba7-8920-4cce-9628-072cbdda6fd3	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5cb8bd56-64ab-46bb-bf4e-dfd442c7e10a	1111	Nguyễn Xuân Hồng	d198d85a-31a0-493d-a4bd-0a6186245498		TG0289	Nguyễn Xuân Hồng (TG0289)		d198d85a-31a0-493d-a4bd-0a6186245498	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a969ce2-cbbc-434f-854d-4086564916cd	881	Phạm Thúy Hồng	1a1d7f4b-3c46-46ca-9401-834bfed311b2	hongpt.tg@ptit.edu.vn	TG0115	Phạm Thúy Hồng (TG0115)		1a1d7f4b-3c46-46ca-9401-834bfed311b2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a1a77b0b-2f96-4050-b72d-b92d75c93c58	901	Phạm Thị Hồng	ab01e4d0-a3b0-4dde-ae56-e861e523a6f4		TG0037	Phạm Thị Hồng (TG0037)		ab01e4d0-a3b0-4dde-ae56-e861e523a6f4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
11ce9d90-d89f-4a74-8f4f-c365f14750ae	951	Trần Thị Hồng	89fc029d-0878-4dfa-ae05-179fda6b00aa		TG0045	Trần Thị Hồng (TG0045)		89fc029d-0878-4dfa-ae05-179fda6b00aa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b10c5877-9e7f-4e8a-a752-0e038b1d06cb	368	Trần Thị Hồng	d5c23ae5-43c6-4fd9-9e35-cb034a996e02	hongtt@ptit.edu.vn	TDV100166	Trần Thị Hồng (TDV100166)		d5c23ae5-43c6-4fd9-9e35-cb034a996e02	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
76220f1c-4054-4096-bfb7-8a42b17edcf1	215	Trần Thị Thuý Hồng	e6731669-0d70-418b-b446-bcbec65d3aa5	hongttt@ptit.edu.vn	KQT100850	Trần Thị Thuý Hồng (KQT100850)		e6731669-0d70-418b-b446-bcbec65d3aa5	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
58322ab8-7d75-4c68-bb84-3043a628970c	409	Trần Đức Hồng	6a5043d5-170e-42d2-8c44-aa7297e0b455	hongtd@ptit.edu.vn	PTH200509	Trần Đức Hồng (PTH200509)		6a5043d5-170e-42d2-8c44-aa7297e0b455	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d82aeb5d-ad33-408e-a865-9fd4f76ec96d	333	Đào Thị Hồng	d59367f9-2785-41bc-a246-59809ee67867	hongdt@ptit.edu.vn	KCB100198	Đào Thị Hồng (KCB100198)		d59367f9-2785-41bc-a246-59809ee67867	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d7358138-d076-438a-bc1a-f3be7192ff56	783	Đỗ Minh Hồng	37cac2e6-995c-4152-a077-e38af2fc6488		TG0421	Đỗ Minh Hồng (TG0421)		37cac2e6-995c-4152-a077-e38af2fc6488	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
51ff45bd-1e12-4dca-8bf3-4ab1e41e4ed8	98	Phạm Quốc Hợp	850b6acf-8cb6-4540-91b8-365dff451736	hoppq@ptit.edu.vn	KVT200497	Phạm Quốc Hợp (KVT200497)		850b6acf-8cb6-4540-91b8-365dff451736	t	t	171	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fd4891aa-6fe5-4c70-8353-207aba31e603	605	Chu Quang Khanh	38ee7baf-b00e-478f-8df4-c50ca39a8fb6	khanhcq@ptit.edu.vn	PKH100104	Chu Quang Khanh (PKH100104)		38ee7baf-b00e-478f-8df4-c50ca39a8fb6	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bda8b680-cf94-4e99-bc4e-457330982059	137	Nguyễn Công Khanh	2c329e6b-6013-4821-9e3d-7ec9b58603ad	khanhnc@ptit.edu.vn	KCN201009	Nguyễn Công Khanh (KCN201009)		2c329e6b-6013-4821-9e3d-7ec9b58603ad	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bfe017fb-ba06-48b9-b916-10cbda3c9bc5	1163	Đào Thị Khim	0b1695be-e21f-47db-b9c3-a42f757ae201	khimdt@ptit.edu.vn	PGV200399	Đào Thị Khim (PGV200399)		0b1695be-e21f-47db-b9c3-a42f757ae201	t	t	14	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8aba0aa5-d189-4ec0-b16f-fd61283a2a9c	1251	Trương Duy Khiêm	a4e400c1-3123-4c9a-a3ae-a338c83726f9	khiemtd@ptit.edu.vn	TDT100996	Trương Duy Khiêm (TDT100996)		a4e400c1-3123-4c9a-a3ae-a338c83726f9	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3619d70c-34e0-44db-8f87-9c4d869e8749	1130	Tăng Văn Khiêm	eb8467b8-1536-437f-a510-867f04edecd3		TG0343	Tăng Văn Khiêm (TG0343)		eb8467b8-1536-437f-a510-867f04edecd3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d208e90b-9428-4cb0-b732-209a84e94453	398	Đỗ Khắc Khoan	4121023f-7df8-4d05-bb7e-e78c7ed6b783	khoandk@ptit.edu.vn	PTH200374	Đỗ Khắc Khoan (PTH200374)		4121023f-7df8-4d05-bb7e-e78c7ed6b783	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2ead4b1-ab1b-4239-b9b4-0fca2522cf70	657	Lê Thị Hồng Khuyên	00cf9843-59f9-4ac6-aad3-36f9dbf54773		TG0490	Lê Thị Hồng Khuyên (TG0490)		00cf9843-59f9-4ac6-aad3-36f9dbf54773	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a1be812-62d6-48e1-8bf1-3d4ede9dd849	377	Lường Thị Khuyên	9b806079-1e9d-46e9-84e3-8a9728455b99	khuyenlt@ptit.edu.vn	TDV100168	Lường Thị Khuyên (TDV100168)		9b806079-1e9d-46e9-84e3-8a9728455b99	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a1b8897-f080-4f6b-ad14-a369bcba8245	1108	Hoàng Quốc Khánh	9ee540fb-91fe-419f-aad2-3b8754bb582f		TG0476	Hoàng Quốc Khánh (TG0476)		9ee540fb-91fe-419f-aad2-3b8754bb582f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
77581315-b478-4fb4-b36c-4c2a446ce18a	13	Linh Lê Khánh	linhlk.b21dt016@stu.ptit.edu.vn	tranglou1003@gmail.com		Linh Lê Khánh		b21dcdt016	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7e453a0-d4db-4632-bd64-2b09d7f58a8c	107	Lê Duy Khánh	420beb9a-44e4-476f-868a-a65fdadbd26a	khanhld@ptit.edu.vn	KVT200498	Lê Duy Khánh (KVT200498)		420beb9a-44e4-476f-868a-a65fdadbd26a	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f086c6da-2472-4102-9e07-af765b883852	550	Nguyễn Duy Khánh	55be68cf-17a5-42a2-8a2b-cade349aad46	khanhnd@ptit.edu.vn	PSV101029	Nguyễn Duy Khánh (PSV101029)		55be68cf-17a5-42a2-8a2b-cade349aad46	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
73768c02-bc8b-4631-ab33-217cbd0617c1	1455	Nguyễn Kim Khánh	kkhanh3204@gmail.com	tranglou1003@gmail.com		Nguyễn Kim Khánh			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
be3c8636-69ba-44ba-8420-6a01d9b3e6b7	296	Nguyễn Trọng Khánh	15664654-0c93-485b-9269-62eaf94f6bc0	khanhnt@ptit.edu.vn	KCN100265	Nguyễn Trọng Khánh (KCN100265)		15664654-0c93-485b-9269-62eaf94f6bc0	t	t	22	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06688f69-cf3f-4eb5-a28e-54b8df4b942c	113	Nguyễn Xuân Khánh	d4c2777e-d1cf-417f-b284-dcd737cad054	khanhnx@ptit.edu.vn	KVT200395	Nguyễn Xuân Khánh (KVT200395)		d4c2777e-d1cf-417f-b284-dcd737cad054	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
437709f3-e354-4f60-bb90-8f8fda748125	1044	Phạm Duy Khánh	8be533c5-e11a-40bc-be18-f74c0392aadd	khanhpd@ptit.edu.vn	KTC100890	Phạm Duy Khánh (KTC100890)		8be533c5-e11a-40bc-be18-f74c0392aadd	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7daef127-1812-40dc-a6c3-1b25efb0db81	1408	Phạm Nam Khánh	KhanhPN.B24CC162@ptit.stu.edu.vn	tranglou1003@gmail.com		Phạm Nam Khánh - KhanhPN.B24CC162@ptit.stu.edu.vn		4194c4c9-783a-434d-8520-69282bb571bc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9ad96eb2-9b98-43f9-9843-6a1f01c35338	331	Phạm Thị Khánh	8d5e006a-284e-4d64-b88b-97b68a6c711a	khanhpt@ptit.edu.vn	KCB100201	Phạm Thị Khánh (KCB100201)		8d5e006a-284e-4d64-b88b-97b68a6c711a	t	t	229	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cbaabead-36ac-4e51-bd8c-ce4fb9685f65	1090	Trần Bảo Khánh	52241a89-ce25-4df5-a24f-a7579fef5db5	khanhtb1@ptit.edu.vn	KDP100793	Trần Bảo Khánh (KDP100793)		52241a89-ce25-4df5-a24f-a7579fef5db5	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
584f9b6f-cc1b-4730-b351-600016c1fd0d	237	Trần Quốc Khánh	8bc91f92-0453-41c0-a299-50b746e552fc	khanhtq@ptit.edu.vn	KTC100708	Trần Quốc Khánh (KTC100708)		8bc91f92-0453-41c0-a299-50b746e552fc	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0431c8e8-2309-40d2-b741-6ecb0314650f	36	Trịnh Bảo Khánh	671987f3-bbbc-41d7-bef3-0c4fca90ab89	khanhtb@ptit.edu.vn	VKH100539	Trịnh Bảo Khánh (VKH100539)		671987f3-bbbc-41d7-bef3-0c4fca90ab89	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
37d7f5b7-bcc2-4143-b2f4-b41f25176d7c	814	Trịnh Đăng Khánh	5e1c052e-20b2-4ade-81a1-a7d46407ca38	khanhtd@ptit.edu.vn	KDT100950	Trịnh Đăng Khánh (KDT100950)		5e1c052e-20b2-4ade-81a1-a7d46407ca38	t	t	24	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ba664ee0-7127-486a-97e4-ac170e56cad2	1014	Phùng Khương	61254b85-cee4-42e6-b514-7dc130708b22	khuongpd.tg@ptit.edu.vn	TG0607	Phùng Khương (TG0607)		61254b85-cee4-42e6-b514-7dc130708b22	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
070bc2c9-ba6c-4bab-b3dc-49fcf5ea77a1	392	Nguyễn Quang Khải	11dca173-af36-4702-8ed2-049814635950	khainq@ptit.edu.vn	TQT100156	Nguyễn Quang Khải (TQT100156)		11dca173-af36-4702-8ed2-049814635950	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5287c33f-6b78-4f79-ba3c-fd6173975700	104	Lê Chu Khẩn	23abe438-070b-4222-9127-ce2bdbac6235	khanlc@ptit.edu.vn	KVT200499	Lê Chu Khẩn (KVT200499)		23abe438-070b-4222-9127-ce2bdbac6235	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
28e11a39-9ee9-475c-9825-38065c1475af	972	Bùi Văn Kiên	9ec88dbd-75d0-459e-b3da-0c659138e686	kienbv@ptit.edu.vn	KCN101003	Bùi Văn Kiên (KCN101003)		9ec88dbd-75d0-459e-b3da-0c659138e686	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
18a647cf-01ef-4452-8c06-26560d3f1d9f	714	Bùi Đức Kiên	bc56731a-21d7-4486-906e-d5671f5e65cb		TG0492	Bùi Đức Kiên (TG0492)		bc56731a-21d7-4486-906e-d5671f5e65cb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a94771a8-26d2-4af5-9daa-ec945f8376bd	493	Nguyễn Chí Kiên	2344442b-4dd6-43a4-bc83-0d2f7091d604	kkienchi@gmail.com	VCN100839	Nguyễn Chí Kiên (VCN100839)		2344442b-4dd6-43a4-bc83-0d2f7091d604	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
185870c3-d8b6-407f-9528-64e974f35952	1327	Nguyễn Trung Kiên	870a669c-7857-464f-a709-5b7f880905ad	tranglou1003@gmail.com	BGD100595	Nguyễn Trung Kiên (BGD100595)		870a669c-7857-464f-a709-5b7f880905ad	t	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a4ff19ae-dbf1-411f-b71e-a5d7e01163d8	127	Nguyễn Trọng Kiên	6131d3a7-0bb1-476e-935a-7ca63e78f1d6	ntkien@ptit.edu.vn	KDT200457	Nguyễn Trọng Kiên (KDT200457)		6131d3a7-0bb1-476e-935a-7ca63e78f1d6	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b7463b21-1cf2-46d0-9bdb-acea19516cf4	1019	Ngô Trung Kiên	53c1622d-1850-44a3-85ff-b26c2c713933	kiennt1@ptit.edu.vn	KVT101001	Ngô Trung Kiên (KVT101001)		53c1622d-1850-44a3-85ff-b26c2c713933	t	t	21	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c8d6e999-700c-4549-930d-c709cda617ce	718	Phan Trung Kiên	19b2c61c-40ad-4549-a5c7-f3bdd0d01964		TG0539	Phan Trung Kiên (TG0539)		19b2c61c-40ad-4549-a5c7-f3bdd0d01964	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a37ff73e-47e9-4ab8-88d6-8c929830eb48	1097	Trần Trung Kiên	2ee58280-7437-45cd-8c1b-146a3252e5c7	kientt@ptit.edu.vn	KDP100944	Trần Trung Kiên (KDP100944)		2ee58280-7437-45cd-8c1b-146a3252e5c7	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
08228b29-c635-4163-b3fe-27680a42bd26	1201	Nguyễn Xuân Kiều	6564d530-63bc-4982-aa90-a8b79ca47da8	kieunx@ptit.edu.vn	KCN200752	Nguyễn Xuân Kiều (KCN200752)		6564d530-63bc-4982-aa90-a8b79ca47da8	t	t	190	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
da6b7a69-bb74-48a5-86b6-6f25b6bb3603	1170	Phan Thanh Kiều	eb6ab7f3-701e-4604-806b-481c0ce9ea75	kieupt@ptit.edu.vn	PSV200732	Phan Thanh Kiều (PSV200732)		eb6ab7f3-701e-4604-806b-481c0ce9ea75	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c252983d-dfc3-43e5-bf50-69a74ffd9e34	835	Phạm Hồng Ký	d988cf75-fc16-4b89-a829-b7c32927268f	kyph@ptit.edu.vn	KSD100679	Phạm Hồng Ký (KSD100679)		d988cf75-fc16-4b89-a829-b7c32927268f	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
308c0bc9-bf10-47c3-8515-cf923986d03b	233	Vũ Quang Kết	977cf59b-e087-45ad-95c5-518c354f8537	ketvq@ptit.edu.vn	KTC100318	Vũ Quang Kết (KTC100318)		977cf59b-e087-45ad-95c5-518c354f8537	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9f83b750-a77e-4e0e-8c79-782c689b29cc	100	Phạm Khắc Kỷ	0dc8d741-c618-4f20-b0f1-b2d6c1524bcc	kypk@ptit.edu.vn	KVT200760	Phạm Khắc Kỷ (KVT200760)		0dc8d741-c618-4f20-b0f1-b2d6c1524bcc	t	t	171	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
66a9000b-7d6e-4f99-88cd-1a49acc8efc7	74	LD_TEST	LD_TEST	tranglou1003@gmail.com	LD_TEST	LD_TEST (LD_TEST)	LD_TEST		f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
679eb28a-ffad-4ee7-a552-8cd0fb7c8ce0	75	LD_TEST1	LD_TEST1	tranglou1003@gmail.com	LD_TEST1	LD_TEST1 (LD_TEST1)	LD_TEST1		f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ad24da4-97fc-456b-be8b-d8b737e23477	204	Trần Đức Lai	db1d3c95-9c5e-49a3-9651-dbd25686efb0	laitd@ptit.edu.vn	KDP100717	Trần Đức Lai (KDP100717)		db1d3c95-9c5e-49a3-9651-dbd25686efb0	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8e68bf5c-b93b-4650-893e-d94f1ca913e4	226	Nguyễn Thị Chinh Lam	fb8223f9-8a5e-4fd3-9ba7-adb8504fd7b6	lamntc@ptit.edu.vn	KTC100319	Nguyễn Thị Chinh Lam (KTC100319)		fb8223f9-8a5e-4fd3-9ba7-adb8504fd7b6	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7e221569-6d17-4874-a64a-dc1a4b220965	175	Nguyễn Thị Lam	20e05493-6a0a-4d8d-86f9-39a7d6c73902	lamnt@ptit.edu.vn	KDP100241	Nguyễn Thị Lam (KDP100241)		20e05493-6a0a-4d8d-86f9-39a7d6c73902	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
17a9719b-cb9c-4683-b095-90e7d2f49e45	789	Hoàng Thị Lan	0d88bbae-cffd-41b6-8490-a89cf51682a7	lanht.tg@ptit.edu.vn	TG0591	Hoàng Thị Lan (TG0591)		0d88bbae-cffd-41b6-8490-a89cf51682a7	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ea7bc7e1-5727-4b63-a19f-1601fb349e8c	637	Hà Thu Lan	ef43d3e6-5072-410f-96c5-536c182abc54		TG0433	Hà Thu Lan (TG0433)		ef43d3e6-5072-410f-96c5-536c182abc54	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
812b0073-6d5d-463b-bfe5-e32a17c48048	307	Hà Thị Thu Lan	8c1aee70-5009-45e5-bbd4-bff446aa536d	lanhtt@ptit.edu.vn	KDT100686	Hà Thị Thu Lan (KDT100686)		8c1aee70-5009-45e5-bbd4-bff446aa536d	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
047d75bb-e5b3-4073-ae79-6c7879c2e6cb	102	Nguyễn Ngọc Lan	b0856c2c-74e6-4c1b-8b86-9a07cd35a12f	lannn@ptit.edu.vn	KVT201019	Nguyễn Ngọc Lan (KVT201019)		b0856c2c-74e6-4c1b-8b86-9a07cd35a12f	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4c542950-54be-4589-a605-444f3eafd30c	1419	Nguyễn Thị Lan	LanNT.B24CC173@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Thị Lan		7d25269d-5254-435a-9d14-2bdc574a8575	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e33fafc8-a0a9-48ee-87fc-211be9c384a5	956	Nguyễn Thị Thúy Lan	b1cbc3e8-40a0-4f8d-90fc-ecbaa2f52fca		TG0005	Nguyễn Thị Thúy Lan (TG0005)		b1cbc3e8-40a0-4f8d-90fc-ecbaa2f52fca	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ba419889-ef3e-44fb-b282-935dedeb8336	865	Phan Thị Lan	44bde1d4-ef16-477e-828d-c9ada1601c37	lanpt@ptit.edu.vn	KDT101065	Phan Thị Lan (KDT101065)		44bde1d4-ef16-477e-828d-c9ada1601c37	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ef90c42f-bba9-46d3-9e67-18d3fa85b909	1073	Phạm Thị Minh Lan	cc55bd6a-01f9-44a6-95f2-c4f3f9cf066d	lanptm@ptit.edu.vn	KQT100338	Phạm Thị Minh Lan (KQT100338)		cc55bd6a-01f9-44a6-95f2-c4f3f9cf066d	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8b6853f7-3e2b-4140-8c47-057e2491563e	538	Trần Thị Phương Lan	6376b7f1-b393-47b9-b58f-2e2e52971454	lanttp@ptit.edu.vn	PTC100040	Trần Thị Phương Lan (PTC100040)		6376b7f1-b393-47b9-b58f-2e2e52971454	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
09a0a99f-5831-48a1-9a52-57976900299f	1060	Đặng Thu Lan	1d883679-0c1a-4a86-8aef-0db66d79d3da		TG0279	Đặng Thu Lan (TG0279)		1d883679-0c1a-4a86-8aef-0db66d79d3da	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6ca12fb6-7c95-4f8a-953e-687fd4207c92	1225	Trần Thị Khánh Li	b2ddc102-af87-4bbf-b7f2-7d222d6a00c7	littk@ptit.edu.vn	KQT200473	Trần Thị Khánh Li (KQT200473)		b2ddc102-af87-4bbf-b7f2-7d222d6a00c7	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2550513f-88d2-4165-a62d-c762d021d0b4	1266	Hoàng Thị Tú Linh	5149da3f-f17f-4a51-9bbb-67cbe6348eda	linhhtt@ptit.edu.vn	TDT100767	Hoàng Thị Tú Linh (TDT100767)		5149da3f-f17f-4a51-9bbb-67cbe6348eda	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06d0dc5d-3b5c-4ba5-a54e-6d1335c278bf	1198	Huỳnh Lưu Quốc Linh	0010c542-8085-46e3-9c38-2c91fc57c4dd	linhhlq@ptit.edu.vn	KCN200751	Huỳnh Lưu Quốc Linh (KCN200751)		0010c542-8085-46e3-9c38-2c91fc57c4dd	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6ac09a18-bdfa-4bee-9cef-5f2695fc598b	761	Huỳnh Lưu Quốc Linh	4d7e44e5-24b1-461a-8465-11ed234053ca		TG198	Huỳnh Lưu Quốc Linh (TG198)		4d7e44e5-24b1-461a-8465-11ed234053ca	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
66bcc0dc-4185-4990-8594-e5997aa076e0	1433	Hà Thảo Linh	linhht	tranglou1003@gmail.com		Hà Thảo Linh			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
936df292-c369-4866-b8d6-39bd67bb5455	1429	Lê Khánh Linh	LinhLK.B21DT016@stu.ptit.edu.vn	tranglou1003@gmail.com		Lê Khánh Linh		4d11330d-e0df-4eb7-ab36-1183802991ec	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5f5da9a8-4662-4ce1-a7d3-7b1331db4ed6	1032	Nguyễn Hoàng Linh	256166d2-7f79-4a7e-b8fc-f032ff323b23	linhnh@ptit.edu.vn	KVT100877	Nguyễn Hoàng Linh (KVT100877)		256166d2-7f79-4a7e-b8fc-f032ff323b23	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b3dea49d-2c70-45ab-9c2a-e8fe972b9a1e	429	Nguyễn Kiều Linh	437afd21-02e7-4493-a9b6-6c01cd929e24	linhnk@ptit.edu.vn	KTN100203	Nguyễn Kiều Linh (KTN100203)		437afd21-02e7-4493-a9b6-6c01cd929e24	t	t	253	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e5fa36ef-c893-4e5d-bfa6-b02bb51bfb8f	676	Nguyễn Kiều Linh	7f275d11-4cd0-4c72-851b-7b9a9ffcc9ac		TG0418	Nguyễn Kiều Linh (TG0418)		7f275d11-4cd0-4c72-851b-7b9a9ffcc9ac	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf156f9f-3b69-4127-b324-f47a5c059592	1358	Nguyễn Mai Linh	b28d6345-9c1e-4fbd-ac17-5c7a2ab28087	linhnm@ptit.edu.vn	VKT101134	Nguyễn Mai Linh (VKT101134)		b28d6345-9c1e-4fbd-ac17-5c7a2ab28087	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d33ef514-3d3c-4682-9c05-10287ebb92fd	1312	Nguyễn Ngọc Linh	334bf33c-a049-43ec-a51e-90e4b2e13bb5	nnlinh@ptit.edu.vn	VPH100778	Nguyễn Ngọc Linh (VPH100778)		334bf33c-a049-43ec-a51e-90e4b2e13bb5	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bcd32d87-0cc9-41f1-a1fd-5d04169a10c4	485	Nguyễn Ngọc Linh	1c881e42-9291-4e72-8a6a-62f31e3a4cc5	linhnn@ptit.edu.vn	VKT100557	Nguyễn Ngọc Linh (VKT100557)		1c881e42-9291-4e72-8a6a-62f31e3a4cc5	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9d449cde-73c2-4c06-a4c1-9a1d818e42ff	1416	Nguyễn Thị Phương Linh	LinhNTP.B23CC096@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Thị Phương Linh		cb59bc7b-c0ea-4538-bd29-12e170048fd0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
65091f3c-6701-4e2b-915a-c3e308057a34	638	Nguyễn Thị Thùy Linh	395a66c6-9911-4daf-ae2a-150287ed874b		TG0435	Nguyễn Thị Thùy Linh (TG0435)		395a66c6-9911-4daf-ae2a-150287ed874b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
abc1a1c5-dd5f-4db5-8370-1da07b952843	68	Nguyễn Thị Thảo Linh	8309eb62-d29e-4dfd-a384-55b32db71586	linhntt@ptit.edu.vn	VKH100961	Nguyễn Thị Thảo Linh (VKH100961)		8309eb62-d29e-4dfd-a384-55b32db71586	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
673782f8-8c13-44ef-82a9-62745c4f40f3	157	Nguyễn Thị Yến Linh	09216130-6978-456d-a2c8-98830f48db6a	linhnty@ptit.edu.vn	KCB200417	Nguyễn Thị Yến Linh (KCB200417)		09216130-6978-456d-a2c8-98830f48db6a	t	t	193	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6e6e3f42-d0b4-4336-a30e-374c04026d35	1453	Phạm Thuỳ Linh	linhpham2004xhxtnd@gmail.com	tranglou1003@gmail.com		Phạm Thuỳ Linh			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ac2f47b5-8f0b-4e33-a4b6-c2e9cd83ba21	925	Phạm Thùy Linh	4d48f2b1-f170-4fa6-a7e8-d0f3cb8e7db2		TG0253	Phạm Thùy Linh (TG0253)		4d48f2b1-f170-4fa6-a7e8-d0f3cb8e7db2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d3b462f8-92fa-4fa5-b316-799c190f38b6	1100	Trương Diệu Linh	0da8b2b7-7cae-4267-b320-c5a487f1b1b4		KDP100792	Trương Diệu Linh (KDP100792)		0da8b2b7-7cae-4267-b320-c5a487f1b1b4	t	t	18	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d49aa504-513a-47fb-a923-9c92a6b08715	766	Trương Diệu Linh	c9b4df14-4950-42a4-bb2a-05a6bd280ffc		TG0604	Trương Diệu Linh (TG0604)		c9b4df14-4950-42a4-bb2a-05a6bd280ffc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc1f1775-bbb0-4121-a082-96064b2805b3	1087	Trần Diệu Linh	8ef4b9ae-a05c-479a-a43f-910682dbd57f		TG0074	Trần Diệu Linh (TG0074)		8ef4b9ae-a05c-479a-a43f-910682dbd57f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f392d5d4-ff8b-4d77-98a9-4125d09e54b2	593	Trần Diệu Linh	bc3b1e4d-f49c-482f-a49c-890a9357e66e	linhtd@ptit.edu.vn	PKH101037	Trần Diệu Linh (PKH101037)		bc3b1e4d-f49c-482f-a49c-890a9357e66e	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b1329af8-9d77-43dc-a510-73ba424fc43a	1042	Trần Phương Linh	059b2372-99b8-461e-9a59-a685241ad6d6	linhtp@ptit.edu.vn	KTC100981	Trần Phương Linh (KTC100981)		059b2372-99b8-461e-9a59-a685241ad6d6	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
692363a6-fc77-4add-a0bb-73ec15eaa742	646	Trần Thị Thùy Linh	ea2932e1-ac6c-4942-90a6-d017425b2876	linhttt.tg@ptit.edu.vn	TG0498	Trần Thị Thùy Linh (TG0498)		ea2932e1-ac6c-4942-90a6-d017425b2876	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c74b0a13-6d5c-4ccf-b3ff-8018c6c91f02	304	Trần Thị Thục Linh	4cbb37a6-135a-4857-8f5e-eda14bf39698	linhtt@ptit.edu.vn	KDT100235	Trần Thị Thục Linh (KDT100235)		4cbb37a6-135a-4857-8f5e-eda14bf39698	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2891fba4-b53f-4ee6-8550-39d092a64e40	1237	Trịnh Khánh Linh	f9a542a2-75c4-4ff7-8f88-7949420f32c9	linhtk@ptit.edu.vn	VKT101076	Trịnh Khánh Linh (VKT101076)		f9a542a2-75c4-4ff7-8f88-7949420f32c9	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6cce9aa3-66b2-4338-ab76-7da1dc773ee8	1319	Vũ Thuỳ Linh	ca7b2ccf-f145-4150-bc28-ff796d00750b	linhvt1@ptit.edu.vn	TDV100884	Vũ Thuỳ Linh (TDV100884)		ca7b2ccf-f145-4150-bc28-ff796d00750b	t	t	26	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f1f11d7-af9f-4a90-80c5-7f663ecb1339	195	Vũ Thùy Linh	0c5602b7-3f36-45c0-b8e2-8ce5e9c79759	linhvt@ptit.edu.vn	KDP100357	Vũ Thùy Linh (KDP100357)		0c5602b7-3f36-45c0-b8e2-8ce5e9c79759	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
45e4b693-2332-47c0-89dc-26daa2d47150	521	Đinh Duy Linh	1f42a164-558f-43d9-a07a-220c0ff1f938	linhdd@ptit.edu.vn	PDT200650	Đinh Duy Linh (PDT200650)		1f42a164-558f-43d9-a07a-220c0ff1f938	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
969e93b9-f906-4491-8ef9-1a5fd4c518b3	704	Vilma Liwan	20980ef0-6623-4d55-b3c1-9427d82f9fda		TG0507	Vilma Liwan (TG0507)		20980ef0-6623-4d55-b3c1-9427d82f9fda	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8e7d6b09-8529-48d6-95e2-901fab39b4b8	1435	Nguyễn Thị Kim Liên	893ee4b2-0101-4d90-9dd7-5463e07f8593	lienntk@ptit.edu.vn	KQT101136	Nguyễn Thị Kim Liên (KQT101136)		893ee4b2-0101-4d90-9dd7-5463e07f8593	t	t	19	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
93e74473-4725-497d-81f0-45016e8a76c4	326	Trương Kim Liên	6ac516cf-1199-4f9f-9ea4-2b8a5f6925f3	lientk@ptit.edu.vn	KCB100202	Trương Kim Liên (KCB100202)		6ac516cf-1199-4f9f-9ea4-2b8a5f6925f3	t	t	228	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cca0389c-4067-4ffd-a313-be70fbbbdc87	289	Đỗ Thị Liên	6f4d7d9c-255b-4444-987d-f993b48e7406	liendt@ptit.edu.vn	KCN100356	Đỗ Thị Liên (KCN100356)		6f4d7d9c-255b-4444-987d-f993b48e7406	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c235b665-2554-4653-b71b-15a013a435e6	981	Đỗ Thị Liên	80581945-6d34-4cea-9a1c-0c1311288987		TG0303	Đỗ Thị Liên (TG0303)		80581945-6d34-4cea-9a1c-0c1311288987	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
353fabb8-8e8d-47fa-aefc-a795ac83d3a0	1134	Đỗ Thị Liên	815f229b-be59-4470-9c30-f39d46801f19		TG0245	Đỗ Thị Liên (TG0245)		815f229b-be59-4470-9c30-f39d46801f19	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7262462-be09-4a5d-8042-6e1618fe900e	335	Nguyễn Thị Thúy Liễu	0d0722a4-4d05-42ef-a19c-c0534028814b	lieuntt@ptit.edu.vn	KCB100204	Nguyễn Thị Thúy Liễu (KCB100204)		0d0722a4-4d05-42ef-a19c-c0534028814b	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3f9aa091-4c81-4eaf-9d62-ec6907218d40	1293	Nguyễn Thị Liệu	6e6ae40b-c801-4447-8685-aec4213a4f06	lieunt@ptit.edu.vn	VPH100025	Nguyễn Thị Liệu (VPH100025)		6e6ae40b-c801-4447-8685-aec4213a4f06	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64e4b26d-6b61-4fa7-b26e-0e6f252e2fdb	580	Nguyễn Hồng Loan	041487fa-84c3-4c36-803b-0128bf35d580	loannh@ptit.edu.vn	PKT100093	Nguyễn Hồng Loan (PKT100093)		041487fa-84c3-4c36-803b-0128bf35d580	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
687f7cd2-f23e-4c09-8952-474280faf52d	178	Nguyễn Thanh Loan	1228235f-2e02-475d-af10-6fc232702e90	loannt1@ptit.edu.vn	KDP100971	Nguyễn Thanh Loan (KDP100971)		1228235f-2e02-475d-af10-6fc232702e90	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2f72fcfd-b356-4700-9fad-6f7c785babc9	1371	Nguyễn Thanh Loan	06918548-8319-4e63-b0e4-6f0bdbc62150		TG0601	Nguyễn Thanh Loan (TG0601)		06918548-8319-4e63-b0e4-6f0bdbc62150	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cd791a65-470c-462e-8283-c229a5ac3973	369	Nguyễn Thị Loan	ba8055fd-cbd3-49b7-b8bf-91acba516f43	loannt@ptit.edu.vn	TDV100169	Nguyễn Thị Loan (TDV100169)		ba8055fd-cbd3-49b7-b8bf-91acba516f43	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20b2069b-452e-4306-813f-c11f506eb41c	158	Nguyễn Thị Phương Loan	d3d0916f-0c9d-4971-b8ab-039c5582f409	loanntp@ptit.edu.vn	KCB200418	Nguyễn Thị Phương Loan (KCB200418)		d3d0916f-0c9d-4971-b8ab-039c5582f409	t	t	193	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
aa1c46d1-27fd-47b6-b42d-7f832c2952fc	73	Vi Thị Hồng Loan	c21a046d-654f-4cd5-9668-1709889c9247	loanvth@ptit.edu.vn	VKH100956	Vi Thị Hồng Loan (VKH100956)		c21a046d-654f-4cd5-9668-1709889c9247	t	t	72	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d7bd2872-8d1b-4adb-8d19-51fc8c106cf8	926	Võ Thị Thanh Loan	d414a606-ca56-41f1-8ab4-0bc376772e9e		TG0120	Võ Thị Thanh Loan (TG0120)		d414a606-ca56-41f1-8ab4-0bc376772e9e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
00ea19e9-398a-475c-b1f9-8fbfac1c7e98	731	Đỗ Thị Bích Lon	f69912a1-12e1-4d93-9eba-9ade002cad4d		TG0571	Đỗ Thị Bích Lon (TG0571)		f69912a1-12e1-4d93-9eba-9ade002cad4d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bb9c781d-e1d8-49f4-93f6-609c87c3b327	362	Lê Bá Long	0b5270cf-e685-40da-9bc7-262476747081	longlb@ptit.edu.vn	KCB100224	Lê Bá Long (KCB100224)		0b5270cf-e685-40da-9bc7-262476747081	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0bfd7f4d-e34c-4444-922f-800dac84cc5e	1415	Mã Hồng Long	LongMH.B23CC103@stu.ptit.edu.vn	tranglou1003@gmail.com		Mã Hồng Long		d911132b-3931-425e-9275-a65bd2f9dbfa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7757e57f-c16e-48a6-b354-b41e66cd5ce1	1104	Nguyễn Quang Long	143c6304-f748-4e81-9937-07de3df0221a		TG0313	Nguyễn Quang Long (TG0313)		143c6304-f748-4e81-9937-07de3df0221a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4b087c8d-fed9-46e3-8582-5719ef7cae3e	1038	Nguyễn Đình Long	fecf4513-8cd6-4fc4-9bfe-1838502caa20	longnd@ptit.edu.vn	KVT100300	Nguyễn Đình Long (KVT100300)		fecf4513-8cd6-4fc4-9bfe-1838502caa20	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b6c9c940-6a64-4502-9150-e0dab56b4b5d	1107	Ngô Thanh Long	e48af287-06f6-448a-9ee6-78295b2af7cc		TG0341	Ngô Thanh Long (TG0341)		e48af287-06f6-448a-9ee6-78295b2af7cc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
22436e88-a80f-4035-b3ff-5dfa72dc01f5	1396	Phan Thành Long	9526cb06-e28a-486c-9745-e1609a283fcd	longpt@ptit.edu.vn	KCN201098	Phan Thành Long (KCN201098)		9526cb06-e28a-486c-9745-e1609a283fcd	t	t	190	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
53e574b8-d5e6-443e-b799-237ac57e1edd	64	Phạm Hoàng Long	575b7bdd-1d76-4f16-8d6d-18aefe32cf5b	longph@ptit.edu.vn	VKH100953	Phạm Hoàng Long (VKH100953)		575b7bdd-1d76-4f16-8d6d-18aefe32cf5b	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3c522d24-877a-4712-9cc7-a865f1521c85	1030	Trần Huy Long	2e17b3cb-4d74-416a-aa8a-16ed50d26a7d	longth@ptit.edu.vn	KVT100536	Trần Huy Long (KVT100536)		2e17b3cb-4d74-416a-aa8a-16ed50d26a7d	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64101550-9d51-4e0c-a35a-46db9a96d378	37	Tạ Việt Long	dfdfae55-b6c9-467a-9c48-2c42069df6bd	longtv@ptit.edu.vn	VKH100551	Tạ Việt Long (VKH100551)		dfdfae55-b6c9-467a-9c48-2c42069df6bd	t	t	237	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
705b7c10-b0bf-4bd8-813c-98d5444a24b0	969	Đặng Hoàng Long	69d12627-297b-4a7f-92d7-a72ed4ff61f0	longdh@ptit.edu.vn	KCN100969	Đặng Hoàng Long (KCN100969)		69d12627-297b-4a7f-92d7-a72ed4ff61f0	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ecff345d-28ac-4ed8-84c2-5902d89d5883	408	Phạm Xuân Lung	e5634dd1-8530-4fb0-a26e-f01d278d41e4	lungpx@ptit.edu.vn	PTH200783	Phạm Xuân Lung (PTH200783)		e5634dd1-8530-4fb0-a26e-f01d278d41e4	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9bb75e0-ea9a-4dfe-a2b9-c2967b582d1f	1432	Lê Thị Luyến	luyenlt	tranglou1003@gmail.com		Lê Thị Luyến			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fa014640-f8af-4a83-8953-798b45f318d1	1418	Nguyễn Văn Luận	LuanNV.B23CC106@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Văn Luận		9054d417-005f-468f-a204-585de4080039	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
24728a91-458d-4bf3-93c9-0253dc18d1e5	1252	Nguyễn Thị Trúc Ly	40680a78-43b9-4e99-8d63-4411d014c535	lyntt1@ptit.edu.vn	TDT101044	Nguyễn Thị Trúc Ly (TDT101044)		40680a78-43b9-4e99-8d63-4411d014c535	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
15b72fe8-c25c-4151-9b78-6547f1d0adce	182	Vương Khánh Ly	791a5ef7-d883-4007-8a13-36760768324f	lyvk@ptit.edu.vn	KDP100716	Vương Khánh Ly (KDP100716)		791a5ef7-d883-4007-8a13-36760768324f	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
69c2f85b-3979-4b7f-b874-295610cda912	941	Nguyễn Thị Lành	10e2263c-ca25-445e-8c45-8bb46b0a7f6e		TG0235	Nguyễn Thị Lành (TG0235)		10e2263c-ca25-445e-8c45-8bb46b0a7f6e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ec56e240-0908-40f7-aa34-20c65748b7c2	954	Trần Thị Lành	0da7b38e-72b7-41bb-887d-024f3a97f845		TG0118	Trần Thị Lành (TG0118)		0da7b38e-72b7-41bb-887d-024f3a97f845	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0289d487-fbf4-403c-a8ac-b1e06ca0e546	1216	Nguyễn Bảo Lâm	8169479e-39ea-4852-828d-fc946eea2546	lamnb@ptit.edu.vn	KQT200472	Nguyễn Bảo Lâm (KQT200472)		8169479e-39ea-4852-828d-fc946eea2546	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
89f5270b-3300-4efc-aa0e-410ea1a28084	842	Phạm Mạnh Lâm	b69b4ab4-d295-42f2-8a1e-39dd1b361fef	lampm@ptit.edu.vn	KSD100680	Phạm Mạnh Lâm (KSD100680)		b69b4ab4-d295-42f2-8a1e-39dd1b361fef	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c17c56d5-7e16-4fe3-913c-bc617a3601d2	555	Vũ Tuấn Lâm	2b97720f-2178-46dd-9b28-f56240004981	lamvt@ptit.edu.vn	PDT100002	Vũ Tuấn Lâm (PDT100002)		2b97720f-2178-46dd-9b28-f56240004981	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
95924c31-958c-46cf-8cee-8428d0e0c64e	725	Nguyễn Đức Lân	c5582ca4-e887-4228-b0b4-43059436fe54		TG0395	Nguyễn Đức Lân (TG0395)		c5582ca4-e887-4228-b0b4-43059436fe54	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0d7508e9-8e49-46ba-a476-3395c40dcf38	225	Nguyễn Thị Việt Lê	11b27cd2-bff7-4e92-8099-3f70b4cd9542	lentv@ptit.edu.vn	KTC100320	Nguyễn Thị Việt Lê (KTC100320)		11b27cd2-bff7-4e92-8099-3f70b4cd9542	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
002728eb-58d2-4f23-a047-e4542daa28ef	1067	Nguyễn Thị Việt Lê	58932cec-b10a-4de8-87ac-8431604cbf76		TG0351	Nguyễn Thị Việt Lê (TG0351)		58932cec-b10a-4de8-87ac-8431604cbf76	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
71c5e8fd-8660-4341-9a8d-e0e6d4f01dc1	1156	Bùi Thị Lý	49543f62-0988-4449-9db5-c80f5bb18281	lybt@ptit.edu.vn	PDT200393	Bùi Thị Lý (PDT200393)		49543f62-0988-4449-9db5-c80f5bb18281	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe40764d-e5fd-4231-b67f-882694a2962b	794	Nguyễn Thanh Lý	960bd60c-d49b-49d4-be74-f04bbcf3de9c	lynt.tg@ptit.edu.vn	TG0404	Nguyễn Thanh Lý (TG0404)		960bd60c-d49b-49d4-be74-f04bbcf3de9c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5925f836-8021-4b48-8416-9aea97246d1d	1159	Nguyễn Thị Hải Lý	e6c34bad-3a38-450b-b240-7d56d0eb6582	lynth@ptit.edu.vn	PDT200864	Nguyễn Thị Hải Lý (PDT200864)		e6c34bad-3a38-450b-b240-7d56d0eb6582	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
72306505-82e3-4c23-a232-2fd1b50226b3	156	Nguyễn Thị Tri Lý	fd291d14-4d7a-4ca1-bbe1-4023c3962ac9	lyntt@ptit.edu.vn	KCB200734	Nguyễn Thị Tri Lý (KCB200734)		fd291d14-4d7a-4ca1-bbe1-4023c3962ac9	t	t	192	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ad382f4e-f779-4bd2-bb8a-de02dddb3a75	1056	Phạm Thị Lý	6be20d15-8055-4d9e-be94-94dbd073ec9c		TG0002	Phạm Thị Lý (TG0002)		6be20d15-8055-4d9e-be94-94dbd073ec9c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3502776e-2844-4013-b30e-fd7e3e032fe2	583	Trần Thị Lý	aaefc810-859d-46d1-b092-8cd64c46adb1	lytt@ptit.edu.vn	PKT100088	Trần Thị Lý (PKT100088)		aaefc810-859d-46d1-b092-8cd64c46adb1	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
39d07a84-01a7-418e-8c0f-eaeecd440a4f	448	Trịnh Thúy Lý	8e21da8a-1f56-4ffb-a2af-1945ef49f79f	lyttr@ptit.edu.vn	VKT100562	Trịnh Thúy Lý (VKT100562)		8e21da8a-1f56-4ffb-a2af-1945ef49f79f	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fcff109d-e9cd-4119-a40e-73c034c3faf5	1437	Phạm Thị Lĩnh	dd10c2cf-d541-49fa-81f4-c37ce1415762	linhpt@ptit.edu.vn	KQT201140	Phạm Thị Lĩnh (KQT201140)		dd10c2cf-d541-49fa-81f4-c37ce1415762	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5efefc54-1d90-4f9b-bf88-be263d6ca013	1046	Đặng Văn Lương	a57f3573-7385-4b63-8922-d3506e4aa92d	luongdv@ptit.edu.vn	KTC101033	Đặng Văn Lương (KTC101033)		a57f3573-7385-4b63-8922-d3506e4aa92d	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06222dd6-eeb0-4ba0-b805-377fd3b3c1b5	862	Vũ Đức Lượng	4a7d6838-c2a5-4817-9a82-b957a4e8da48	luongvd@ptit.edu.vn	VKT100932	Vũ Đức Lượng (VKT100932)		4a7d6838-c2a5-4817-9a82-b957a4e8da48	t	t	256	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
49cd10cf-d78b-40b9-ad8a-4ee70f161aae	276	Lê Hữu Lập	b0f4598e-6445-49a0-855a-93a108748bd5	laplh@ptit.edu.vn	KCN100282	Lê Hữu Lập (KCN100282)		b0f4598e-6445-49a0-855a-93a108748bd5	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
52128204-8580-4f89-9153-d38945e98861	764	Trần Văn Lệ	ca59185a-e188-4a19-b48e-406081cff3d0		TG0501	Trần Văn Lệ (TG0501)		ca59185a-e188-4a19-b48e-406081cff3d0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06df3db3-904a-44a3-a95a-9af980ce931c	150	Đàm Minh Lịnh	f21c2f26-0d10-465b-ba19-7ffc114e46eb	linhdm@ptit.edu.vn	KCN200435	Đàm Minh Lịnh (KCN200435)		f21c2f26-0d10-465b-ba19-7ffc114e46eb	t	t	190	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
22188cf7-7530-4457-8f75-11c825c690f5	129	Trương Vĩnh Lộc	ec59c063-dc1e-4ccc-ac48-0afe0c3fbbde	loctv@ptit.edu.vn	KCN200436	Trương Vĩnh Lộc (KCN200436)		ec59c063-dc1e-4ccc-ac48-0afe0c3fbbde	t	t	251	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
50d4870b-b038-4260-b6da-a7f74e3a4390	1311	Nguyễn Thị Lụa	5635a1e4-13c1-4e73-8ad1-cc19e7ccba85	luant@ptit.edu.vn	TQT100147	Nguyễn Thị Lụa (TQT100147)		5635a1e4-13c1-4e73-8ad1-cc19e7ccba85	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
23a46654-dfd3-4b78-8b4e-1d11208e07f6	744	Đoàn Thị Hồng Lữ	1417657d-3350-4476-8210-71a705a2d0fa		TG0511	Đoàn Thị Hồng Lữ (TG0511)		1417657d-3350-4476-8210-71a705a2d0fa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1d777154-4f10-4b04-9dc2-80cdb54f577a	776	Đoàn Thị Hồng Lữ	feb53ed9-5e23-47d4-b915-2348e9506dc3		TG0499	Đoàn Thị Hồng Lữ (TG0499)		feb53ed9-5e23-47d4-b915-2348e9506dc3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9af7e93a-e33e-4ff8-a6b7-29baf27e5854	997	Ngô Quang Lựa	5ac2bfcb-de55-41ca-aa4d-305baee9fd18		TG0039	Ngô Quang Lựa (TG0039)		5ac2bfcb-de55-41ca-aa4d-305baee9fd18	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4db4ea8d-5258-4445-8c02-0ce869f1c690	592	Nguyễn Hồng Lực	bb40fae8-d069-439d-8749-f8ed1392bb6e	lucnh@ptit.edu.vn	PKT100085	Nguyễn Hồng Lực (PKT100085)		bb40fae8-d069-439d-8749-f8ed1392bb6e	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
97ba347c-0a52-483b-af69-793e61d59bbe	1211	Đỗ Như Lực	7fbdcabf-ede9-4e66-9516-6feb1235b686	lucdn@ptit.edu.vn	KQT200474	Đỗ Như Lực (KQT200474)		7fbdcabf-ede9-4e66-9516-6feb1235b686	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f60637c5-7e8e-4a08-8ee2-ca7e44289bbc	355	Bùi Thị Thanh Mai	daf1208f-e2ca-4eea-846d-5e0e575b265d	maibtt@ptit.edu.vn	KCB100798	Bùi Thị Thanh Mai (KCB100798)		daf1208f-e2ca-4eea-846d-5e0e575b265d	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
244a1e72-e16d-4c69-aa44-f156d13b4a47	1242	Hoàng Thị Xuân Mai	1ff00a1e-8b9d-4cc9-9a37-9cb062cc5949	maihtx@ptit.edu.vn	VKT101061	Hoàng Thị Xuân Mai (VKT101061)		1ff00a1e-8b9d-4cc9-9a37-9cb062cc5949	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ee7f71bd-8421-4241-9188-1283d319db6e	1218	Lê Hoàng Mai	96a7f61e-3566-429c-b6a1-672635cc527b	mailh@ptit.edu.vn	KQT200797	Lê Hoàng Mai (KQT200797)		96a7f61e-3566-429c-b6a1-672635cc527b	t	t	177	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c84cdcf6-afc9-4048-88b5-fa2e5ebeb22e	590	Lê Thị Ngọc Mai	b1d710a9-4ad6-4910-b6dc-2e4192aec7e6	mailtn@ptit.edu.vn	PKT101059	Lê Thị Ngọc Mai (PKT101059)		b1d710a9-4ad6-4910-b6dc-2e4192aec7e6	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
362610f4-af7f-4cbe-a815-59d6f38db638	645	Nguyễn Lê Mai	d4e576f8-2e6c-4fcc-b626-a92c91a5bd41		TG0440	Nguyễn Lê Mai (TG0440)		d4e576f8-2e6c-4fcc-b626-a92c91a5bd41	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
be365753-30b1-45a4-87c5-e1b66e4d6abe	542	Nguyễn Thị Mai	26e72e15-8f6e-4127-b2fc-8071eaaa609b	ntmai@ptit.edu.vn	PTC100043	Nguyễn Thị Mai (PTC100043)		26e72e15-8f6e-4127-b2fc-8071eaaa609b	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
47fc2e2d-a47f-41e7-a893-c999f5537556	1065	Nguyễn Thị Thanh Mai	7b4096a8-05c3-4f96-a905-9e66266c77b0		TG0121	Nguyễn Thị Thanh Mai (TG0121)		7b4096a8-05c3-4f96-a905-9e66266c77b0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d6d8712d-3de4-4921-aa8e-679dc0ecf499	1085	Nguyễn Thị Thanh Mai	11619ff4-bed1-4be4-9933-9b2cd019ac90		TG0347	Nguyễn Thị Thanh Mai (TG0347)		11619ff4-bed1-4be4-9933-9b2cd019ac90	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a1173864-2a0d-4b88-9b90-cd86178f1886	466	Nguyễn Thị Thanh Mai	f13ebd18-5753-4880-b70d-258fb3a6dfd4	maint@ptit.edu.vn	VKT100574	Nguyễn Thị Thanh Mai (VKT100574)		f13ebd18-5753-4880-b70d-258fb3a6dfd4	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
404dfc19-19ed-412d-9887-d1cd3810cedd	1053	Nguyễn Thị Thanh Mai	f6bda372-0627-46a7-8075-146f13e53d4d		TG0067	Nguyễn Thị Thanh Mai (TG0067)		f6bda372-0627-46a7-8075-146f13e53d4d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7501679-1223-4ffd-8fac-d6a6b3db280d	170	Nguyễn Thị Tuyết Mai	5ea8cbe1-2160-4b08-9b5d-898816729628	maintt@ptit.edu.vn	KDP100358	Nguyễn Thị Tuyết Mai (KDP100358)		5ea8cbe1-2160-4b08-9b5d-898816729628	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8babb13b-e033-4189-ab1a-9b6b80c7c7db	1268	Phạm Thị Mai	16c5cd68-ab51-403e-8deb-45453bc90857	maipt@ptit.edu.vn	TDT100637	Phạm Thị Mai (TDT100637)		16c5cd68-ab51-403e-8deb-45453bc90857	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
67e63386-8d64-497f-87f5-47f2aeb41cdd	470	Trần Thanh Mai	329e39b2-aa16-4aee-bcbb-9a550d185502	maitt@ptit.edu.vn	VKT100567	Trần Thanh Mai (VKT100567)		329e39b2-aa16-4aee-bcbb-9a550d185502	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
44dad069-7a51-4ade-94d5-59de672e6662	405	Võ Thị Mai	07bb36e5-ed04-4ee8-a0ed-686a21d52d7f	maivt@ptit.edu.vn	PTH200375	Võ Thị Mai (PTH200375)		07bb36e5-ed04-4ee8-a0ed-686a21d52d7f	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d43b6b03-97cc-414d-9d68-4233a85b87b1	683	Đào Thị Mai	d5701492-8a90-427d-8a44-e63311048596		TG0556	Đào Thị Mai (TG0556)		d5701492-8a90-427d-8a44-e63311048596	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b58d184-b723-402f-bbe1-ad6d07efa3ea	1208	Bùi Vũ Nguyệt Minh	5486d34a-3531-44ba-8d31-3d718bcade3f	minhbvn@ptit.edu.vn	KQT200976	Bùi Vũ Nguyệt Minh (KQT200976)		5486d34a-3531-44ba-8d31-3d718bcade3f	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
34f3319e-b05a-4bcc-bee6-d13925ff8575	1219	Dương Nguyễn Uyên Minh	1c63f120-f4d3-4724-becf-0b38a3db471b	minhdnu@ptit.edu.vn	KQT200475	Dương Nguyễn Uyên Minh (KQT200475)		1c63f120-f4d3-4724-becf-0b38a3db471b	t	t	176	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d4b71a9-8242-4955-92d7-77c611d609cb	1036	Hoàng Trọng Minh	ee9b0dfd-b521-409d-9182-272fe8527e6b	hoangtrongminh@ptit.edu.vn	KVT100301	Hoàng Trọng Minh (KVT100301)		ee9b0dfd-b521-409d-9182-272fe8527e6b	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0cb92f86-546b-49d3-98ae-33f0b8b5205e	119	Hồ Nhựt Minh	6aa5286d-e413-473d-bebc-c4a5daab9514	minhhn@ptit.edu.vn	KDT200459	Hồ Nhựt Minh (KDT200459)		6aa5286d-e413-473d-bebc-c4a5daab9514	t	t	180	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3485fe5f-85b0-4f27-8e4a-703326b0abca	14	Lương Hồng Minh	78637621-a85d-4f3d-8c72-03a377bb887c	lhminh@ptit.edu.vn	VKH100523	Lương Hồng Minh (VKH100523)		78637621-a85d-4f3d-8c72-03a377bb887c	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1bf7a695-454f-49fa-9599-6f45b606df9a	618	Nguyễn Hồng Minh	c1883326-4c8d-4874-b814-8262d4461bce	minhnh@ptit.edu.vn	PGV100117	Nguyễn Hồng Minh (PGV100117)		c1883326-4c8d-4874-b814-8262d4461bce	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3a14d5b2-b9fb-4972-bc23-969fc5bf994e	1294	Nguyễn Hồng Minh	31ab2c6c-fbb1-4d62-8c0a-60d8fe6fb8c1	nhminh@ptit.edu.vn	VPH100027	Nguyễn Hồng Minh (VPH100027)		31ab2c6c-fbb1-4d62-8c0a-60d8fe6fb8c1	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
df2bcbc0-7531-4fe7-93d2-825f9cf8a64f	513	Nguyễn Minh	e9055ca4-f4db-4cd8-b213-44735e28381e	minhn@ptit.edu.vn	VCN100603	Nguyễn Minh (VCN100603)		e9055ca4-f4db-4cd8-b213-44735e28381e	t	t	243	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6f5d467d-5839-418e-8289-801c7e01cc83	1089	Nguyễn Minh	4bcb75c4-6c2c-4860-a12f-c8ab46b24179		TG0342	Nguyễn Minh (TG0342)		4bcb75c4-6c2c-4860-a12f-c8ab46b24179	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4da6f1f4-8b00-4a0d-a275-9d749b4d2950	320	Nguyễn Ngọc Minh	93b1882c-1be1-41ee-80b6-9738d7b3b941	minhnn@ptit.edu.vn	KDT100225	Nguyễn Ngọc Minh (KDT100225)		93b1882c-1be1-41ee-80b6-9738d7b3b941	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0c8f8314-3440-45b3-85d8-c04361d5eb8e	1454	Nguyễn Quang Minh	quanggminhk@gmail.com	tranglou1003@gmail.com		Nguyễn Quang Minh			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1913a407-bdc3-4af4-935a-0d734dcf0195	1127	Nguyễn Thị Tuyết Minh	d065fe7e-ef86-4fd1-a8b5-fff20933285f		TG0048	Nguyễn Thị Tuyết Minh (TG0048)		d065fe7e-ef86-4fd1-a8b5-fff20933285f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
91fdb60e-1097-44e5-977f-2cb134cdfa07	495	Nguyễn Tuấn Minh	0ccfe820-de23-4d7a-b74c-013a3fda5403	minhnt@ptit.edu.vn	VCN100622	Nguyễn Tuấn Minh (VCN100622)		0ccfe820-de23-4d7a-b74c-013a3fda5403	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b4f9ddcc-f2dd-45f5-8313-b0070e9a1fc5	256	Nguyễn Viết Minh	0ee076c0-7872-43e3-85c8-25f6f91c0bec	minhnv@ptit.edu.vn	KVT100302	Nguyễn Viết Minh (KVT100302)		0ee076c0-7872-43e3-85c8-25f6f91c0bec	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e366c37c-bbdc-4899-88ff-45d7e6d9ecf0	695	Nguyễn Văn Minh	34be1e17-8dc9-41fe-8bdc-b2862d27b512	minhnv.tg@ptit.edu.vn	TG0580	Nguyễn Văn Minh (TG0580)		34be1e17-8dc9-41fe-8bdc-b2862d27b512	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d12dbe2-4a59-4954-b851-b11941d0e8b6	815	Nguyễn Đức Minh	1ad6ef95-9e1d-4747-a6eb-4dfded83ba69	minhnd@ptit.edu.vn	KDT100137	Nguyễn Đức Minh (KDT100137)		1ad6ef95-9e1d-4747-a6eb-4dfded83ba69	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bd5af0eb-07a1-4252-ba08-d608f87ed84b	541	Phạm Hồng Minh	087f3ca1-535d-4451-855e-8e4074804653	minhph@ptit.edu.vn	PTC100128	Phạm Hồng Minh (PTC100128)		087f3ca1-535d-4451-855e-8e4074804653	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ab502f59-a34d-4a7d-99ff-2349010332ed	1443	Phạm Tuấn Minh	12923928-7252-4969-b412-34651331cd28	minhpt@ptit.edu.vn	KCN101153	Phạm Tuấn Minh (KCN101153)		12923928-7252-4969-b412-34651331cd28	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c04c2418-22ff-470e-bdb6-63d996ac978f	118	Phạm Xuân Minh	898fe61d-eb83-49a5-bf30-6a30c3c28f56	minhpx@ptit.edu.vn	KDT200460	Phạm Xuân Minh (KDT200460)		898fe61d-eb83-49a5-bf30-6a30c3c28f56	t	t	181	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80ed8e5f-dbb6-4a04-aac0-93d0414a5a57	221	Trần Ngọc Minh	bf062913-2273-44d3-9227-1232ad709c91	minhtn@ptit.edu.vn	KQT100339	Trần Ngọc Minh (KQT100339)		bf062913-2273-44d3-9227-1232ad709c91	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b08c7d9b-bca0-4608-b959-fcb0e783094c	31	Trần Quang Minh	ee661ac7-8abf-454b-a31f-8f551d6b2721	minhtq@ptit.edu.vn	VKH101058	Trần Quang Minh (VKH101058)	Chuyên viên phòng CNS	ee661ac7-8abf-454b-a31f-8f551d6b2721	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4df88b6c-c464-4add-922a-0a7478f64ae3	1241	Trần Tuấn Minh	bdd38511-6326-41eb-bf98-49aad7267fb3	minhtt@ptit.edu.vn	VKT101073	Trần Tuấn Minh (VKT101073)		bdd38511-6326-41eb-bf98-49aad7267fb3	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b40dbc3-4832-46ce-9fda-82c9042f2d93	418	Võ Văn Minh	c70e9feb-116f-46ce-a225-8baefef5553e	minhvv@ptit.edu.vn	PTH200511	Võ Văn Minh (PTH200511)		c70e9feb-116f-46ce-a225-8baefef5553e	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb8c814c-9361-4d1f-8747-1e6cef7b120a	1029	Vũ Quang Minh	a925905f-0d5a-4a91-b98d-1f9ed42040f6	minhvq@ptit.edu.vn	KVT100923	Vũ Quang Minh (KVT100923)		a925905f-0d5a-4a91-b98d-1f9ed42040f6	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7dcfa8ee-12dd-4d54-8c51-1ddc98e77fd4	915	Nguyễn Huyền Muời	0e933cdf-d76e-4428-b020-a6ed87efb97e		TG0086	Nguyễn Huyền Muời (TG0086)		0e933cdf-d76e-4428-b020-a6ed87efb97e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d7a48707-512d-4265-9a75-19aab567874d	486	Hoàng Hằng My	2502d5e4-14cd-4069-a41a-32720fb6927d	hoangmy@ptit.edu.vn	VKT100652	Hoàng Hằng My (VKT100652)		2502d5e4-14cd-4069-a41a-32720fb6927d	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bbd60b48-9c03-439b-9108-f9ff1bea7510	1328	Hoàng Nguyễn Trà My	MyHNT.B23CC116@stu.ptit.edu.vn	tranglou1003@gmail.com		Hoàng Nguyễn Trà My		d70353a2-a222-48b2-9bcf-814281bd97e9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5332eb7d-89db-4e64-8f68-eb358a71e2e0	134	Nguyễn Tất Mão	b381bb03-7065-479e-a485-b59e95cc0e84	maont@ptit.edu.vn	KCN200437	Nguyễn Tất Mão (KCN200437)		b381bb03-7065-479e-a485-b59e95cc0e84	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
51f2d72f-a8fc-460c-acd3-56974447e772	1288	Nguyễn Thị Mơ	c3a46d2d-96e8-43a1-a36f-206fcdecd254	mont@ptit.edu.vn	VPH100017	Nguyễn Thị Mơ (VPH100017)		c3a46d2d-96e8-43a1-a36f-206fcdecd254	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6b4dbd1b-fcc7-42f8-9d37-5a22b8cd6ad7	1063	Trần Thị Mơ	106e1e00-c567-4496-9a41-4139cae1837f		TG0220	Trần Thị Mơ (TG0220)		106e1e00-c567-4496-9a41-4139cae1837f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
27286bff-8b10-4605-a4f3-03b1eafcb4c3	179	Lê Xuân Mạnh	52d8c949-f616-40ee-af35-f8e3aadbdf39	manhlx@ptit.edu.vn	KDP100973	Lê Xuân Mạnh (KDP100973)		52d8c949-f616-40ee-af35-f8e3aadbdf39	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0aa9865c-4cbc-4546-bdb4-03871047db24	1336	Lương Đức Mạnh	ManhLD.B21DT144@stu.ptit.edu.vn	tranglou1003@gmail.com		Lương Đức Mạnh		01a79f6d-4152-4df9-8228-5b39e97ace30	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6ded3b75-dda5-4c49-be41-3d636e38e1a3	837	Ngô Hùng Mạnh	4b3b7186-b692-4455-8dc6-d3ce8ff34582	manhnh@ptit.edu.vn	KSD100875	Ngô Hùng Mạnh (KSD100875)		4b3b7186-b692-4455-8dc6-d3ce8ff34582	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7ac6fb17-a909-4533-a927-2c4879f0c927	442	Phan Hữu Mạnh	3bef339f-7667-4e0f-967e-a466130b4480	manhph@ptit.edu.vn	VKT100589	Phan Hữu Mạnh (VKT100589)		3bef339f-7667-4e0f-967e-a466130b4480	t	t	66	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b146ab09-ab6a-4f80-a361-7a187887abc2	1210	Trần Văn Mạnh	c23d4f9f-d9ef-458f-97d8-0626e44d69c6	manhtv@ptit.edu.vn	KQT200758	Trần Văn Mạnh (KQT200758)		c23d4f9f-d9ef-458f-97d8-0626e44d69c6	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0da29862-a3e4-4a46-91ad-1fc173b375ad	267	Vũ Minh Mạnh	d60a739e-9af2-458b-a7d7-9fe47fe5d51e	manhvm@ptit.edu.vn	KAT100821	Vũ Minh Mạnh (KAT100821)		d60a739e-9af2-458b-a7d7-9fe47fe5d51e	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
91aa3ad5-00cc-48d0-8134-33a042190c55	1286	Trịnh Ngọc Mỹ	dac1a9b2-0b04-4de8-87ac-35749cb07f53	mytn@ptit.edu.vn	VPH100018	Trịnh Ngọc Mỹ (VPH100018)		dac1a9b2-0b04-4de8-87ac-35749cb07f53	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
65666304-b8c2-4e42-8861-151abb13f48c	1149	Đỗ Kiều Ngọc Mỹ	3294f713-b2be-44c2-888e-c74a4ff273f1	mydkn@ptit.edu.vn	PKT200383	Đỗ Kiều Ngọc Mỹ (PKT200383)		3294f713-b2be-44c2-888e-c74a4ff273f1	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d2b21dd1-156f-465d-9098-8a5ea057a6b3	15	NGUOI_DUNG_TEST	NGUOI_DUNG_TEST	tranglou1003@gmail.com		NGUOI_DUNG_TEST		nguoi_dung_test	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9d9d8a46-3f1e-4542-bec5-a46a4b4a5e78	604	Hoàng Phương Nam	6faf9e65-b4fb-4ec6-9a52-b9f50fa60428	namhp@ptit.edu.vn	PKH100105	Hoàng Phương Nam (PKH100105)		6faf9e65-b4fb-4ec6-9a52-b9f50fa60428	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f5fe8cef-c02c-419a-9db8-882d0d55c745	90	Nguyễn Hữu Nam	NamNH.B23CC121@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Hữu Nam		c48f6c2a-a049-4dcc-a96b-a14cb6eeb80f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e4275403-fcb3-4202-b60c-5077d3d8622a	1300	Nguyễn Phương Nam	532a5e61-2248-4dfa-bedc-2b04afaaabde	namnp@ptit.edu.vn	VPH100028	Nguyễn Phương Nam (VPH100028)		532a5e61-2248-4dfa-bedc-2b04afaaabde	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3897cec9-8f02-4e40-9a29-c1417bcd9811	999	Nguyễn Thành Nam	0e7ae81c-ba65-4d85-9b21-9f28185378e4		TG0107	Nguyễn Thành Nam (TG0107)		0e7ae81c-ba65-4d85-9b21-9f28185378e4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
723dae65-5b28-4f01-a080-84a9addda8fd	18	Nguyễn Thị Phương Nam	5fc5a18b-b122-43b9-a5bf-174889a3eaa4	namntp@ptit.edu.vn	VKH100528	Nguyễn Thị Phương Nam (VKH100528)		5fc5a18b-b122-43b9-a5bf-174889a3eaa4	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e094b772-59aa-42ce-965a-8ee01929388a	1249	Nguyễn Viết Phương Nam	320fb6bc-b3e1-4072-a4cd-91d4937c03bb	namnvp@ptit.edu.vn	TDT100958	Nguyễn Viết Phương Nam (TDT100958)		320fb6bc-b3e1-4072-a4cd-91d4937c03bb	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
373ab25d-4579-4dd7-831a-9a77516dbc0d	1450	Nguyễn Đức Nam	cd03d674-f535-4de0-af97-09293a35178d	namnd@ptit.edu.vn	VKH101142	Nguyễn Đức Nam (VKH101142)		cd03d674-f535-4de0-af97-09293a35178d	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8fb052f0-3985-49e7-8b76-970c99e49cf9	1229	Phạm Hoài Nam	dd84118b-d24e-4a43-b30c-f730d2bdf770	namph@ptit.edu.vn	KQT200757	Phạm Hoài Nam (KQT200757)		dd84118b-d24e-4a43-b30c-f730d2bdf770	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ffe9d6b-96ad-42af-8113-5bae31defe7b	1256	Quản Hoài Nam	7c61bea8-aa02-41bb-80ec-0bbd069d285f	namqh@ptit.edu.vn	TDT100646	Quản Hoài Nam (TDT100646)		7c61bea8-aa02-41bb-80ec-0bbd069d285f	t	t	49	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
84555f8c-b6be-4b55-8e3c-6780a2deec13	490	Trần Đình Nam	6baa625c-c2b3-4d4b-86c5-97c96f9f94df	namtd@ptit.edu.vn	VKT100556	Trần Đình Nam (VKT100556)		6baa625c-c2b3-4d4b-86c5-97c96f9f94df	t	t	4	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3a724bee-02a7-4188-a3b6-00eff11e7505	1184	Trần Hoàng Nam	b463d1de-8c9c-4418-a9ca-da55013c5dbc	namth@ptit.edu.vn	KCN201070	Trần Hoàng Nam (KCN201070)		b463d1de-8c9c-4418-a9ca-da55013c5dbc	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6af1b314-dc0c-40bd-9117-dc6e8fd4a410	189	Trần Quý Nam	a4de29e3-98f6-48ed-8179-84afee9e3990	namtq@ptit.edu.vn	KDP100360	Trần Quý Nam (KDP100360)		a4de29e3-98f6-48ed-8179-84afee9e3990	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
95c74022-f128-4ced-9eb1-19fc87088824	1140	Võ Xuân Nam	86641562-3e99-4c29-b908-b8c8a9569bc4		TG0478	Võ Xuân Nam (TG0478)		86641562-3e99-4c29-b908-b8c8a9569bc4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8e9acb13-19b7-4683-b442-b386b33f425a	428	Vũ Hoài Nam	e7d11292-d468-4941-88f4-4c439ca866a2	namvh@ptit.edu.vn	KTN100266	Vũ Hoài Nam (KTN100266)		e7d11292-d468-4941-88f4-4c439ca866a2	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
edd604fd-7406-434e-b9f7-de6f21e9f732	960	Đỗ Việt Nam	74429605-e0e2-4e6c-9231-2a8b21cfea47		TG0103	Đỗ Việt Nam (TG0103)		74429605-e0e2-4e6c-9231-2a8b21cfea47	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4483ac59-6296-4b00-b1e9-7aa45cfe1ab4	803	Hồ Thị Thanh Nga	47bab178-ae0c-482a-a7b2-c5806be25337	ngahtt@ptit.edu.vn	TKT100666	Hồ Thị Thanh Nga (TKT100666)		47bab178-ae0c-482a-a7b2-c5806be25337	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
71bbba97-50f6-4cf3-9d52-8b4bc4d09a1e	343	Nguyễn Hồng Nga	2b46e96e-30e0-4ece-9c68-3f8431fdd086	nganh@ptit.edu.vn	KCB100206	Nguyễn Hồng Nga (KCB100206)		2b46e96e-30e0-4ece-9c68-3f8431fdd086	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c3c4cc3d-7e29-478c-9269-70a49ca48f2e	1259	Nguyễn Quỳnh Nga	2f14ff98-c579-4b7d-87be-dd38bb7eaebc	nganq@ptit.edu.vn	TDT100817	Nguyễn Quỳnh Nga (TDT100817)		2f14ff98-c579-4b7d-87be-dd38bb7eaebc	t	t	49	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b135fb70-4d77-410a-8493-1a511a7fb2c6	743	Nguyễn Quỳnh Nga	b120e576-44f9-4829-9272-4d1514f3d178		TG0381	Nguyễn Quỳnh Nga (TG0381)		b120e576-44f9-4829-9272-4d1514f3d178	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c15f1771-9d44-444c-8946-d6734a9063ba	208	Nguyễn Thanh Nga	d550e606-2202-4cdd-8d44-05839bf0d634	nganguyen@ptit.edu.vn	KQT100340	Nguyễn Thanh Nga (KQT100340)		d550e606-2202-4cdd-8d44-05839bf0d634	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f86917d-8379-4c44-b25d-e9204180c00b	640	Nguyễn Thu Nga	2f10bbdd-3201-4727-a1cd-24121f872638		TG0358	Nguyễn Thu Nga (TG0358)		2f10bbdd-3201-4727-a1cd-24121f872638	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a70fc2a-f1b5-478a-a8ac-c5e0e0728a89	652	Nguyễn Thị Nga	07e88cf7-e35a-415e-bffe-bde0886c9e37		TG0575	Nguyễn Thị Nga (TG0575)		07e88cf7-e35a-415e-bffe-bde0886c9e37	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7b3c7b6-6468-4b25-94d0-83f8c3cb05f4	887	Nguyễn Thị Nga	9841c3f3-6f5f-42a8-ba5c-223d58405844	ngant.tg@ptit.edu.vn	TG0022	Nguyễn Thị Nga (TG0022)		9841c3f3-6f5f-42a8-ba5c-223d58405844	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
56928b64-c0ab-4b60-9b67-12ba6cb0e592	512	Nguyễn Thị Nga	db2d1dca-ff17-48c0-99b5-a0dc584fa977	ngant@ptit.edu.vn	KTC100601	Nguyễn Thị Nga (KTC100601)		db2d1dca-ff17-48c0-99b5-a0dc584fa977	t	t	20	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b5d284db-7125-43e3-be4c-c453a9f9c2c2	1382	Nguyễn Thị Thanh Nga	20fa892b-506a-49b3-b0b4-e7defa638704	ngantt3@ptit.edu.vn	KQT201112	Nguyễn Thị Thanh Nga (KQT201112)		20fa892b-506a-49b3-b0b4-e7defa638704	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1e050fb1-5439-409b-a626-c96e7c87d63b	566	Nguyễn Thị Thu Nga	af6885b6-f0d8-4188-a86b-34f6cd201b0a	ntnga@ptit.edu.vn	PQL100071	Nguyễn Thị Thu Nga (PQL100071)		af6885b6-f0d8-4188-a86b-34f6cd201b0a	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
393bcab9-a201-4f82-af9c-f6dcaaeaf59a	245	Nguyễn Thị Thu Nga	84aaa757-3d90-45cb-a166-c2a04672cc90	ngantt@ptit.edu.vn	KVT100303	Nguyễn Thị Thu Nga (KVT100303)		84aaa757-3d90-45cb-a166-c2a04672cc90	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a245c7f0-ab88-4560-947c-64c2de608682	545	Nguyễn Thị Thúy Nga	e3d6212e-905a-42de-9200-43136aa4cebe	ngantt2@ptit.edu.vn	PSV100055	Nguyễn Thị Thúy Nga (PSV100055)		e3d6212e-905a-42de-9200-43136aa4cebe	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb406202-2ff1-4220-b7c3-e1cc150019a7	740	Phan Hồng Nga	3797d1ac-f637-411b-811c-63a217001825	ngaph.tg@ptit.edu.vn	TG0516	Phan Hồng Nga (TG0516)		3797d1ac-f637-411b-811c-63a217001825	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b8c569e6-7bb0-4784-a1c2-f8af9064971a	678	Phí Thị Thúy Nga	e0054aec-43b6-41b0-8388-201279deab76		TG0386	Phí Thị Thúy Nga (TG0386)		e0054aec-43b6-41b0-8388-201279deab76	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b8dad833-edff-4fca-8028-0b1acefe6daa	472	Phí Thị Thúy Nga	bdb5918f-5ab5-4188-bceb-194f1b0c68af	phinga@ptit.edu.vn	VKT100566	Phí Thị Thúy Nga (VKT100566)		bdb5918f-5ab5-4188-bceb-194f1b0c68af	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2b2736bd-9cda-4686-bf40-923e0f6b1e16	800	Phạm Thị Tố Nga	64e4500e-32ff-46b6-939c-63d93a58a986	ngaptt@ptit.edu.vn	TKT100126	Phạm Thị Tố Nga (TKT100126)		64e4500e-32ff-46b6-939c-63d93a58a986	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d5c0dce0-bf62-4859-8809-98495f4d9634	1217	Trương Đức Nga	0b07a189-bc87-40e1-92dd-d7e30be0f3cb	ngatd@ptit.edu.vn	KQT200464	Trương Đức Nga (KQT200464)		0b07a189-bc87-40e1-92dd-d7e30be0f3cb	t	t	177	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6c3007ef-804b-472c-b9be-0e77ebf32efc	706	Trần Thị Phương Nga	361fda59-a1a4-4fa7-8c66-4cee5ad5b76a		TG0122	Trần Thị Phương Nga (TG0122)		361fda59-a1a4-4fa7-8c66-4cee5ad5b76a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7c8f5c58-9b2d-41ea-8521-8b5ae2947e3b	1094	Trịnh Vân Nga	b3ee9781-7427-405f-9d73-74cb77681264	ngatv@ptit.edu.vn	KDP100982	Trịnh Vân Nga (KDP100982)		b3ee9781-7427-405f-9d73-74cb77681264	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fdfb74ae-d5ef-41e1-9cfd-73342740f7a5	336	Vũ Thị Hồng Nga	1cf1131d-93f6-400b-9f42-4dca40c65cef	ngavth@ptit.edu.vn	KCB100207	Vũ Thị Hồng Nga (KCB100207)		1cf1131d-93f6-400b-9f42-4dca40c65cef	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
41110ad3-159a-41c6-889c-553a56e5d3ba	790	Đào Tuyết Nga	6bee7582-bdc0-4fb5-9f4c-9531fa581350	ngadt.tg@ptit.edu.vn	TG0552	Đào Tuyết Nga (TG0552)		6bee7582-bdc0-4fb5-9f4c-9531fa581350	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
61df31e5-40cc-458d-b9e7-0a328cd784b7	520	Đặng Thị Nga	1f2ecdb0-3f61-4a8c-8541-d99a5b3089db	ngadt@ptit.edu.vn	TDT100656	Đặng Thị Nga (TDT100656)		1f2ecdb0-3f61-4a8c-8541-d99a5b3089db	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9a919129-ca35-4597-a3ba-b08be8ebf636	959	Đỗ Phi Nga	505da63c-50f6-4a55-8e70-cade8d98ee97		TG0479	Đỗ Phi Nga (TG0479)		505da63c-50f6-4a55-8e70-cade8d98ee97	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fb884baa-a2b6-47a5-8f40-98708885c01f	1238	Lưu Văn Nghiêm	bba5b612-597a-4f9e-a862-e2d57433c318	nghiemlv@ptit.edu.vn	VKT100987	Lưu Văn Nghiêm (VKT100987)		bba5b612-597a-4f9e-a862-e2d57433c318	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6d518d28-6447-4ac3-9f15-33f9d38e9a64	1301	Đới Văn Nghiệp	315f94be-d556-4259-9d42-80abca16c951	nghiepdv@ptit.edu.vn	VPH100662	Đới Văn Nghiệp (VPH100662)		315f94be-d556-4259-9d42-80abca16c951	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0995cced-2bf6-4f40-90c1-c665d9178119	662	Lưu Minh Nghĩa	ae24b1d9-38a9-4f4b-a4e7-9c13279f2e6d		TG0394	Lưu Minh Nghĩa (TG0394)		ae24b1d9-38a9-4f4b-a4e7-9c13279f2e6d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d5bb1526-f095-4ea3-862b-ab1aefd75183	315	Mai Thị Nghĩa	4184caf9-e116-41b2-a3de-eb1b87cbdb8a	nghiamt@ptit.edu.vn	KDT100830	Mai Thị Nghĩa (KDT100830)		4184caf9-e116-41b2-a3de-eb1b87cbdb8a	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
274a46a5-81c0-4341-9afa-2ceaf897127c	142	Nguyễn Thị Bích Nguyên	e07b6850-9161-4321-9db5-5b1107a341ce	nguyenntb@ptit.edu.vn	KCN200438	Nguyễn Thị Bích Nguyên (KCN200438)		e07b6850-9161-4321-9db5-5b1107a341ce	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe4239e1-63cc-424a-9df3-16e5d589fc4c	1332	Nguyễn Thị Hạnh Nguyên	NguyenNTH.B23CC124@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Thị Hạnh Nguyên		e9d607f5-666b-42e9-a74d-a3dc3a789247	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7bd367be-3e0e-4a41-9edc-406aa54cc061	244	Trần Hà Nguyên	f6902356-dc95-45ae-978a-c38f574175c5	nguyenth@ptit.edu.vn	KVT100697	Trần Hà Nguyên (KVT100697)		f6902356-dc95-45ae-978a-c38f574175c5	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
28c946e5-93a2-4abe-9bd5-e764455c7ebe	234	Đặng Phong Nguyên	c0ebec29-3b77-4f39-9c3e-d5199bf43db1	nguyendp@ptit.edu.vn	KTC100321	Đặng Phong Nguyên (KTC100321)		c0ebec29-3b77-4f39-9c3e-d5199bf43db1	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c882adbd-0ed1-4211-b762-4924852b9ff4	1243	Đinh Hữu Nguyện	57b38a48-70f1-47cb-a9e2-411e10f7900e	nguyendh1@ptit.edu.vn	VCN101032	Đinh Hữu Nguyện (VCN101032)		57b38a48-70f1-47cb-a9e2-411e10f7900e	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a93fcae3-8f10-4cb3-8920-7c9fb7c8d7d1	719	Trần Thị Thanh Ngát	4410bc0f-b2ca-4b01-94c5-36e004ce6ba2		TG0570	Trần Thị Thanh Ngát (TG0570)		4410bc0f-b2ca-4b01-94c5-36e004ce6ba2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c1513850-1d17-49f9-aa19-450fd96194f1	171	Hà Thị Hồng Ngân	9bf870b6-350a-4768-bde4-6b3c15cf6cad	nganhth@ptit.edu.vn	KDP100362	Hà Thị Hồng Ngân (KDP100362)		9bf870b6-350a-4768-bde4-6b3c15cf6cad	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5e9116e7-f623-4bb7-a00a-30c1cf648ace	172	Nguyễn Thị Kim Ngân	3fb59101-1e11-43a3-9e27-fd9fdbbe18ab	nganntk@ptit.edu.vn	KDP100363	Nguyễn Thị Kim Ngân (KDP100363)		3fb59101-1e11-43a3-9e27-fd9fdbbe18ab	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1819717c-3c8f-431b-bf95-5b898891bdfd	1287	Nguyễn Thị Thu Ngân	fe9491af-8767-4fff-ac9c-b5ccbeca34e5	nganntt@ptit.edu.vn	VPH100016	Nguyễn Thị Thu Ngân (VPH100016)		fe9491af-8767-4fff-ac9c-b5ccbeca34e5	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b322e193-1439-418c-be65-15b0c5f112b7	931	Roãn Thị Ngân	7eb4671a-cfc5-4e56-963d-f046ac33deb9	nganrt.tg@ptit.edu.vn	TG0614	Roãn Thị Ngân (TG0614)		7eb4671a-cfc5-4e56-963d-f046ac33deb9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f43b7347-4f0e-43e6-9696-01d86444fc6e	413	Đào Lệ Hà Ngân	8c7e16af-464a-489b-96c0-0ec0c4f50998		PTH200911	Đào Lệ Hà Ngân (PTH200911)		8c7e16af-464a-489b-96c0-0ec0c4f50998	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a94139e6-2403-4a01-82a6-521e420d4487	1375	Bùi Khắc Ngọc	0316e51c-1bc0-4bf8-8fe5-e5ee692f66a9	ngocbk@ptit.edu.vn	VKH101082	Bùi Khắc Ngọc (VKH101082)		0316e51c-1bc0-4bf8-8fe5-e5ee692f66a9	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e1a8a3b6-ece3-433e-a814-9cceb6773a64	458	Lê Bảo Ngọc	2341b49e-4006-40a0-ab4d-9f6941cab8a4	ngoclb@ptit.edu.vn	VKT100579	Lê Bảo Ngọc (VKT100579)		2341b49e-4006-40a0-ab4d-9f6941cab8a4	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bd16a88c-8dd1-4a28-b5f4-4ebacd53a947	1260	Lê Kim Ngọc	7b602c75-d70f-4864-b29d-4f5e24db22b3	ngoclk@ptit.edu.vn	TDT100645	Lê Kim Ngọc (TDT100645)		7b602c75-d70f-4864-b29d-4f5e24db22b3	t	t	49	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ebda1ed6-1d4b-4a41-a12d-c72a633440b7	484	Lê Thanh Ngọc	6c8035fa-6852-4f6c-a100-24fe9838cce8	ngoclt@ptit.edu.vn	VKT100794	Lê Thanh Ngọc (VKT100794)		6c8035fa-6852-4f6c-a100-24fe9838cce8	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e485b0d8-c5bf-43cd-9df1-25ef45272bae	209	Lê Thị Bích Ngọc	161edc30-f2cc-4882-8208-f2387964f61e	ngocltb@ptit.edu.vn	KQT100341	Lê Thị Bích Ngọc (KQT100341)		161edc30-f2cc-4882-8208-f2387964f61e	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2fdf83cd-466d-43fa-8f33-e8d86b99d696	360	Lê Văn Ngọc	bcd345a3-0d1c-43f9-b0a5-b937eee88966	ngoclv@ptit.edu.vn	KCB100208	Lê Văn Ngọc (KCB100208)		bcd345a3-0d1c-43f9-b0a5-b937eee88966	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0511d79e-d0f1-46cb-8f46-582d837918d2	701	Nguyễn Bảo Ngọc	ac1d5061-32c1-442b-8260-f0f06f0fff62		TG0437	Nguyễn Bảo Ngọc (TG0437)		ac1d5061-32c1-442b-8260-f0f06f0fff62	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4d37ae19-693a-4358-8a2c-55a335e9fe6e	460	Nguyễn Bảo Ngọc	95e9004f-76c7-473e-8982-ff0a2735fecd	ngocnb@ptit.edu.vn	VKT100580	Nguyễn Bảo Ngọc (VKT100580)		95e9004f-76c7-473e-8982-ff0a2735fecd	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc28c358-ff09-4cb7-83c6-490b609aa225	349	Nguyễn Diệu Ngọc	38efc7b6-4f83-4097-b312-79dab5a0a4f2	ngocnd@ptit.edu.vn	KCB100209	Nguyễn Diệu Ngọc (KCB100209)		38efc7b6-4f83-4097-b312-79dab5a0a4f2	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
79cc5f78-63b4-4993-a708-110591bf96a1	801	Nguyễn Hải Ngọc	dcddcf65-1446-41ce-9f8f-61c166cd6ac2	ngocnh@ptit.edu.vn	TKT100127	Nguyễn Hải Ngọc (TKT100127)		dcddcf65-1446-41ce-9f8f-61c166cd6ac2	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5361153d-9ece-42e6-9a1a-5f83a73bff44	694	Nguyễn Hồng Ngọc	a7dd5f05-9997-4cc4-a1b5-a83599932d3d		TG0561	Nguyễn Hồng Ngọc (TG0561)		a7dd5f05-9997-4cc4-a1b5-a83599932d3d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bef58cb8-2d49-48a0-bb84-76c34d044287	810	Nguyễn Quang Ngọc	b6c0f105-a957-485a-9e90-57c42ee94348	ngocnq@ptit.edu.vn	KDP100138	Nguyễn Quang Ngọc (KDP100138)		b6c0f105-a957-485a-9e90-57c42ee94348	t	t	18	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ae54f8b0-a142-48d9-82d9-4f919424203d	1302	Nguyễn Thanh Ngọc	1b4354fc-0c18-4f53-9cba-b0a8ad8c20e7	ntngoc@ptit.edu.vn	VPH100030	Nguyễn Thanh Ngọc (VPH100030)		1b4354fc-0c18-4f53-9cba-b0a8ad8c20e7	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
23f4f586-4caa-4266-b7c6-eae83494d71f	443	Nguyễn Thị Bích Ngọc	8e13d523-23e0-4547-a7e2-2d76b3d5e7b2	ngocntb@ptit.edu.vn	VKT100590	Nguyễn Thị Bích Ngọc (VKT100590)		8e13d523-23e0-4547-a7e2-2d76b3d5e7b2	t	t	66	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
041389ec-bee3-4a4d-9eaa-ac3c15c96119	1401	Nguyễn Thị Hồng Ngọc	0dd789a8-c96b-41a5-bc62-9d08da8e79bd	ngocnth@ptit.edu.vn	TDT101103	Nguyễn Thị Hồng Ngọc (TDT101103)		0dd789a8-c96b-41a5-bc62-9d08da8e79bd	t	t	246	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
330ad8e6-e973-45cc-afd9-395437c4d2bc	963	Nguyễn Thị Ánh Ngọc	cae9b938-1082-4ca3-aaff-14c262162e5a		TG0092	Nguyễn Thị Ánh Ngọc (TG0092)		cae9b938-1082-4ca3-aaff-14c262162e5a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
223a66a9-4adc-4c4a-bed9-d1b320ca4919	126	Phạm Thị Đan Ngọc	02e8c94c-3332-48ad-8be9-4a481c0a9747	ngocptd@ptit.edu.vn	KDT200461	Phạm Thị Đan Ngọc (KDT200461)		02e8c94c-3332-48ad-8be9-4a481c0a9747	t	t	181	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ce0d80ee-4b20-4283-adf3-06c85a858255	823	Trần Thanh Ngọc	c6b1ceb6-c73b-4e19-a51e-d865e1cf51ac	ngoctt@ptit.edu.vn	KSD100324	Trần Thanh Ngọc (KSD100324)		c6b1ceb6-c73b-4e19-a51e-d865e1cf51ac	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9061c53b-0bc3-457b-99c3-c4c06217ea49	867	Đinh Quang Ngọc	4cfa183d-4524-46fb-9c0c-07c55d93b46a	ngocdq@ptit.edu.vn	KDT100942	Đinh Quang Ngọc (KDT100942)		4cfa183d-4524-46fb-9c0c-07c55d93b46a	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9ea848e3-8932-4778-a232-f6f8a8365e92	585	Đặng Bích Ngọc	d205ab32-2d65-434f-990c-346630f2223a	ngocdb@ptit.edu.vn	PKT100600	Đặng Bích Ngọc (PKT100600)		d205ab32-2d65-434f-990c-346630f2223a	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1be0ed46-d415-4616-a7b3-0ae62adedfbe	253	Đặng Thế Ngọc	679942fa-56e9-4e47-89f2-b3661a018875	ngocdt@ptit.edu.vn	KVT100286	Đặng Thế Ngọc (KVT100286)		679942fa-56e9-4e47-89f2-b3661a018875	t	t	21	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
844848a7-eacf-4f7c-ad6b-fa85f1d90e84	1193	Đặng Thị Ngọc	89fc1169-756c-4792-9fba-920c9e42fe3c	ngocdt1@ptit.edu.vn	KCN200743	Đặng Thị Ngọc (KCN200743)		89fc1169-756c-4792-9fba-920c9e42fe3c	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ad70ed0c-57ac-499a-96cb-2d6a42476f37	978	Đỗ Thị Bích Ngọc	dcaabaac-e312-4811-8a87-f9d94742d4c8		TG0015	Đỗ Thị Bích Ngọc (TG0015)		dcaabaac-e312-4811-8a87-f9d94742d4c8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f0177740-52f1-4b29-84df-37a0d0f49810	290	Đỗ Thị Bích Ngọc	701844c5-3c26-4f1d-aa8d-bd0ed62df254	ngocdtb@ptit.edu.vn	KCN100267	Đỗ Thị Bích Ngọc (KCN100267)		701844c5-3c26-4f1d-aa8d-bd0ed62df254	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
05c18bc5-bd16-4d47-a038-aaa909f4c8b3	1055	Nguyễn Thanh Nhiên	13cb35c3-fd1f-49c4-9bf0-72d6ab6759c5		TG0212	Nguyễn Thanh Nhiên (TG0212)		13cb35c3-fd1f-49c4-9bf0-72d6ab6759c5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8540a8cd-1b28-4a47-9691-3929c4e577b8	543	Nguyễn Thị Nhiễu	577d5349-e979-40d2-86fb-84da87a4ae09	nhieunt@ptit.edu.vn	PSV100046	Nguyễn Thị Nhiễu (PSV100046)		577d5349-e979-40d2-86fb-84da87a4ae09	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf7b1bf8-2ac2-4115-8415-23f59dcb08fd	220	Bùi Thị Nhung	2a4c295f-1fbd-4c75-bbb2-e7abe5cb8fc0	nhungbt@ptit.edu.vn	KQT100851	Bùi Thị Nhung (KQT100851)		2a4c295f-1fbd-4c75-bbb2-e7abe5cb8fc0	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f7c8123-5901-4de0-b3ab-eec8667a9361	546	Lê Thị Kim Nhung	a96d33e5-50c2-48ac-ab08-69103f4b1e15	nhungltk@ptit.edu.vn	PSV100629	Lê Thị Kim Nhung (PSV100629)		a96d33e5-50c2-48ac-ab08-69103f4b1e15	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
251164a9-c8ae-44ba-9c73-2bf39b7c0af7	986	Nguyễn Thị Nhung	0c93bbf5-1b18-409e-bb0f-ab6b2b347f58		TG0225	Nguyễn Thị Nhung (TG0225)		0c93bbf5-1b18-409e-bb0f-ab6b2b347f58	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
315a5ecf-0679-49e0-ae49-97514f23412b	344	Nguyễn Thị Phương Nhung	881e9bc6-e8ec-428d-a5eb-618ad488aade	nhungntp@ptit.edu.vn	KCB100210	Nguyễn Thị Phương Nhung (KCB100210)		881e9bc6-e8ec-428d-a5eb-618ad488aade	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
afab5876-8e8f-4a94-a764-020e79440d11	1117	Nguyễn Thị Tuyết Nhung	d7711b5e-5f89-415d-9ae0-14a171e051bb		TG0352	Nguyễn Thị Tuyết Nhung (TG0352)		d7711b5e-5f89-415d-9ae0-14a171e051bb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a720c4e-32ad-4406-89c9-1b2e7f567539	1058	Phạm Hồng Nhung	35f6ef22-7882-4dc0-9ebb-1e86a498b44b		TG0056	Phạm Hồng Nhung (TG0056)		35f6ef22-7882-4dc0-9ebb-1e86a498b44b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
15ee5e23-bb40-474a-9111-e2e2cf79743c	176	Trần Thị Tuyết Nhung	75413a6d-58fb-48c2-8694-61af55f4be91	nhungttt@ptit.edu.vn	KDP100803	Trần Thị Tuyết Nhung (KDP100803)		75413a6d-58fb-48c2-8694-61af55f4be91	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4b09fcba-171d-40ae-b99f-61b9e815462b	1228	Võ Thị Phương Nhung	192c9e15-0e9a-4cd5-ba8a-374faccad5fd	nhungvtp@ptit.edu.vn	KQT200756	Võ Thị Phương Nhung (KQT200756)		192c9e15-0e9a-4cd5-ba8a-374faccad5fd	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5f7cd577-e703-45b5-9108-da5be2b82477	1322	Vũ Thị Mai Nhung	73296df1-d13e-4d3b-a336-41bc5ded0fdf	nhungvtm@ptit.edu.vn	TDT100991	Vũ Thị Mai Nhung (TDT100991)		73296df1-d13e-4d3b-a336-41bc5ded0fdf	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9006e95e-f3d8-4210-8fea-77169a1faa43	699	Lê Thị Thanh Nhàn	b928c380-20e7-4928-bf31-4afedb25c0f0		TG0438	Lê Thị Thanh Nhàn (TG0438)		b928c380-20e7-4928-bf31-4afedb25c0f0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
84a5a339-ee1e-4891-9e72-2ef4852bb2e8	162	Đinh Nguyễn Thanh Nhàn	c4bd5bd2-086d-40e9-8a9a-ddcd58718f34	nhandnt@ptit.edu.vn	KCB200419	Đinh Nguyễn Thanh Nhàn (KCB200419)		c4bd5bd2-086d-40e9-8a9a-ddcd58718f34	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
48d6d6d8-ba50-4164-9349-0f1cc54d9f47	54	Đỗ Thị Nhàn	3479789d-cbcc-4ad8-84a3-44326bc1ed28	nhandt@ptit.edu.vn	VKH100532	Đỗ Thị Nhàn (VKH100532)		3479789d-cbcc-4ad8-84a3-44326bc1ed28	t	t	74	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
27872aad-c05d-4dcc-96fa-a34f0f5a579d	1169	Nguyễn Linh Nhâm	ea725cba-2d74-4e56-bf21-dac14983aba5	nhamnl@ptit.edu.vn	PSV200404	Nguyễn Linh Nhâm (PSV200404)		ea725cba-2d74-4e56-bf21-dac14983aba5	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e66f5e4b-f233-46e8-ba0f-21c3fedb0911	1291	Nguyễn Trung Nhân	fd37b890-7690-4bcd-854b-cf068bf08dec	nhannt@ptit.edu.vn	VPH100775	Nguyễn Trung Nhân (VPH100775)		fd37b890-7690-4bcd-854b-cf068bf08dec	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9081aec4-2759-4bcb-be06-0aaec289724d	1133	Nghiêm Thị Thanh Nhã	6ef14164-97ba-47a9-9d8f-17454f09814c		TG0030	Nghiêm Thị Thanh Nhã (TG0030)		6ef14164-97ba-47a9-9d8f-17454f09814c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
93b4a025-9388-4d8e-966b-8925e7be2e73	1395	Nguyễn Thị Quỳnh Như	25af5e8a-8365-445e-9463-d9206e3353ec	nhuntq@ptit.edu.vn	KCN201096	Nguyễn Thị Quỳnh Như (KCN201096)		25af5e8a-8365-445e-9463-d9206e3353ec	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f5b1f276-dd28-4791-b74e-3dd8753d12f6	67	Ngô Văn Nhận	3dea4018-d18d-4506-8792-7cad0efa7954	nhannv@ptit.edu.vn	VKH100964	Ngô Văn Nhận (VKH100964)		3dea4018-d18d-4506-8792-7cad0efa7954	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
845be896-1b6b-460c-bdb1-370902e781de	124	Nguyễn Lương Nhật	74e862c4-6d16-427c-9c87-d27e25b60b92	nhatnl@ptit.edu.vn	KDT200450	Nguyễn Lương Nhật (KDT200450)		74e862c4-6d16-427c-9c87-d27e25b60b92	t	t	182	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5060bdba-94ce-46ea-84b7-737511cfa3da	899	Vũ Hữu Nhự	543bfbb9-26f1-4a78-9ac4-a0cfc1705850		TG0090	Vũ Hữu Nhự (TG0090)		543bfbb9-26f1-4a78-9ac4-a0cfc1705850	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e36f84af-83c1-40ee-9af4-6badc00527e5	202	Trần Ngọc Trang Ninh	bf6d54da-ca03-4f3c-8e73-2bd4b4063578	ninhtnt@ptit.edu.vn	KDP100361	Trần Ngọc Trang Ninh (KDP100361)		bf6d54da-ca03-4f3c-8e73-2bd4b4063578	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
db0a2cf7-1d67-4141-a3f3-9a6e2c8ad92e	332	Đào Mạnh Ninh	0e5d2fd4-d144-49b5-acd2-b8bfcf7988e6	ninhdm@ptit.edu.vn	KCB100205	Đào Mạnh Ninh (KCB100205)		0e5d2fd4-d144-49b5-acd2-b8bfcf7988e6	t	t	229	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e122b667-a363-494b-bc5d-77d4fb8a3634	412	Trần Thị Năm	cdd1a9e9-c2ad-4ff4-8836-626c963d8309	namtt@ptit.edu.vn	PTH200784	Trần Thị Năm (PTH200784)		cdd1a9e9-c2ad-4ff4-8836-626c963d8309	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
263f62e7-50f0-4736-937c-0f4169629cbc	601	Thạch Thọ Năng	98758467-4220-47e1-8190-384d8cba660a	nangtt@ptit.edu.vn	PKH100592	Thạch Thọ Năng (PKH100592)		98758467-4220-47e1-8190-384d8cba660a	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
156efe0a-eb23-4aca-b5d4-c9f282ea5043	561	Hoàng Thị Nương	2d1caf8a-e207-4cf5-ad21-fa3ed775a732	nuonght@ptit.edu.vn	PDT100062	Hoàng Thị Nương (PDT100062)		2d1caf8a-e207-4cf5-ad21-fa3ed775a732	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7c221da5-a996-48eb-8679-1a664cda65cd	895	Nguyễn Thị Kim Oanh	f5f87d75-9f72-4a10-8369-84ec380f2d77		TG0109	Nguyễn Thị Kim Oanh (TG0109)		f5f87d75-9f72-4a10-8369-84ec380f2d77	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ab09c68b-c961-487b-955c-27a2ffd86936	1277	Phạm Thị Oanh	5cfaa699-cad7-4567-8b3a-cf1c0bce8829	oanhpt@ptit.edu.vn	TDT100630	Phạm Thị Oanh (TDT100630)		5cfaa699-cad7-4567-8b3a-cf1c0bce8829	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
765ccf50-71d6-4e4b-b0bf-f522c4618292	818	Trương Thị Tú Oanh	ea84ab87-8982-4550-8341-d7c9c6bc1a64	oanhttt@ptit.edu.vn	TKT100139	Trương Thị Tú Oanh (TKT100139)		ea84ab87-8982-4550-8341-d7c9c6bc1a64	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fea80b0a-3b05-4a28-a95a-c7bc2fdb3db5	46	Đinh Thị Oanh	e8d41b00-1fb6-46bf-b791-a6247a0f3992	oanhdt@ptit.edu.vn	VKH100524	Đinh Thị Oanh (VKH100524)		e8d41b00-1fb6-46bf-b791-a6247a0f3992	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
af385557-0038-4e9d-a493-355464a92f8b	227	Bùi Xuân Phong	0e5ab3ff-222c-4dc2-81ec-09a88a1b0a87	phongbx@ptit.edu.vn	KTC100325	Bùi Xuân Phong (KTC100325)		0e5ab3ff-222c-4dc2-81ec-09a88a1b0a87	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fa51360d-9361-4aa6-994a-248e506b2c0d	811	Chu Huy Phong	87ed331a-7fc9-48b7-83a1-827247486a97	phongch@ptit.edu.vn	TKT100540	Chu Huy Phong (TKT100540)		87ed331a-7fc9-48b7-83a1-827247486a97	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2ec4f6fc-84fd-4592-bd18-c69577f595c2	446	Lê Thanh Phong	bd561eec-ab1c-4a20-8a9e-a389cb9eb78f	phonglt@ptit.edu.vn	VKT100591	Lê Thanh Phong (VKT100591)		bd561eec-ab1c-4a20-8a9e-a389cb9eb78f	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
117585e1-e0ed-4bb5-8428-639e54e9ddcc	989	Nguyễn Tuấn Phong	df4a8ecd-9a54-4414-9277-5adf6463f0c3		TG0329	Nguyễn Tuấn Phong (TG0329)		df4a8ecd-9a54-4414-9277-5adf6463f0c3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fdb39414-9af7-40f3-8b46-907cd5b61dc8	1261	Nguyễn Tuấn Phong	227488d6-2eaf-4589-b752-4bfbe6ee03e7	phongnt@ptit.edu.vn	TDT100640	Nguyễn Tuấn Phong (TDT100640)		227488d6-2eaf-4589-b752-4bfbe6ee03e7	t	t	48	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7516073b-0eab-4d7a-9b1c-6c0e79c03559	163	Nguyễn Đại Phong	ae1d7af6-7b10-4f9c-8c6a-3f4874621bc1	phongnd@ptit.edu.vn	KCB200420	Nguyễn Đại Phong (KCB200420)		ae1d7af6-7b10-4f9c-8c6a-3f4874621bc1	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
af4d0073-3c8c-4ef8-aea4-23ee6ec7c3ba	122	Ngô Đình Phong	84acc6fe-2196-4c88-a232-398e78394942	ndphong@ptit.edu.vn	KDT200462	Ngô Đình Phong (KDT200462)		84acc6fe-2196-4c88-a232-398e78394942	t	t	181	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2388579a-b787-462a-b121-6fdedc49721e	846	Phan Hữu Phong	4a3e21d4-769a-4508-8188-96d1b32f1bba	phongph@ptit.edu.vn	KSD100672	Phan Hữu Phong (KSD100672)		4a3e21d4-769a-4508-8188-96d1b32f1bba	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4e840d1d-99fb-401d-8fa3-a5383bc8fba1	35	Trần Trung Phong	598e807d-e25b-4cd7-afeb-3369c794569f	phongtt@ptit.edu.vn	VKH100537	Trần Trung Phong (VKH100537)		598e807d-e25b-4cd7-afeb-3369c794569f	t	t	73	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a8d12df4-163c-4c63-b2eb-7408c2d99c7c	877	Từ Anh Phong	edfd86bc-d410-4839-94d2-5a3c388d5f94		TG0016	Từ Anh Phong (TG0016)		edfd86bc-d410-4839-94d2-5a3c388d5f94	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7b85079-32f5-4ebb-8317-9ccda66b50e4	782	Lê Huy Thục	cda1fc5e-dd7d-4e94-87b6-63f1b82b4f53		TG0398	Lê Huy Thục (TG0398)		cda1fc5e-dd7d-4e94-87b6-63f1b82b4f53	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3a79fdd3-4dc3-4f9f-b3f8-a46200085a0b	1082	Vũ Trọng Phong	f1c31d14-bbd9-4d04-b8d3-03ad87b60c95	phongvt@ptit.edu.vn	KQT100326	Vũ Trọng Phong (KQT100326)		f1c31d14-bbd9-4d04-b8d3-03ad87b60c95	t	t	19	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ed8166d-986f-4e41-8f70-30ba7fccb40c	840	Đinh Thị Thu Phong	c0465e09-4c9d-4248-ba58-b9b7f8a325fc	phongdtt@ptit.edu.vn	KSD100681	Đinh Thị Thu Phong (KSD100681)		c0465e09-4c9d-4248-ba58-b9b7f8a325fc	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7df118c2-e6a3-4e0f-a4b1-01101b677d50	291	Đào Ngọc Phong	452e0e36-6df0-47af-a186-5fe25f9cb45a	phongdn@ptit.edu.vn	KCN100268	Đào Ngọc Phong (KCN100268)		452e0e36-6df0-47af-a186-5fe25f9cb45a	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4201bf13-1379-4aea-af22-a53d6124d1fd	660	Đào Ngọc Phong	6fd14f9c-87bf-4205-a7df-0bf2086b614e		TG0522	Đào Ngọc Phong (TG0522)		6fd14f9c-87bf-4205-a7df-0bf2086b614e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d84a0c8c-aac5-43a8-b2dd-4b5ffafa4cd5	650	Nguyễn Bá Phùng	888b567c-f420-4b5c-b4c9-d130ab99b337		TG0543	Nguyễn Bá Phùng (TG0543)		888b567c-f420-4b5c-b4c9-d130ab99b337	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
55a58c94-1286-40bc-8e36-b4ce2043f7d7	1205	Lê Quang Phú	d4d1da19-cc85-4b1d-a04a-bd7223bc04aa	phulq@ptit.edu.vn	KDT200389	Lê Quang Phú (KDT200389)		d4d1da19-cc85-4b1d-a04a-bd7223bc04aa	t	t	181	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7eaf686b-83de-4d2a-9131-0f09cb230dc2	69	Nguyễn Ngọc Phú	00e3ba1a-11c2-4f74-a3bf-f41703515e95	phunn@ptit.edu.vn	VKH100993	Nguyễn Ngọc Phú (VKH100993)		00e3ba1a-11c2-4f74-a3bf-f41703515e95	t	t	74	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9ce7b78b-0813-4277-922b-aa28daf7ea92	812	Nguyễn Đức Phú	b43cd83b-1380-442c-bd3b-742474a1f4af	phund@ptit.edu.vn	VPH100140	Nguyễn Đức Phú (VPH100140)		b43cd83b-1380-442c-bd3b-742474a1f4af	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
31a3d8f8-89f8-4188-acb0-6487b659063b	556	Bùi Đình Phúc	e75f8c3f-8914-42ae-be3b-48fe10236a75	phucbd@ptit.edu.vn	PDT100824	Bùi Đình Phúc (PDT100824)		e75f8c3f-8914-42ae-be3b-48fe10236a75	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1f3f3b20-4d9d-4df9-9df1-450c4d25a10a	1334	Nguyễn Trần Phúc	PhucNT.B23CC134@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Trần Phúc		fe339832-d3fb-4640-916c-f4330ebcd37c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dd2f4c9d-dcee-40c0-b513-8f573fc21d1c	1414	Trần Nhật Phúc	PhucTN.B24CC229@stu.ptit.edu.vn	tranglou1003@gmail.com		Trần Nhật Phúc		96af52ba-9b87-4ba8-9441-cf81657678e5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
63d9741c-b9c2-48cb-9fc1-cc1cefb3da68	476	Đào Nguyên Phúc	3ad66e4a-112e-4486-97bd-31ab5dd11736		TG0060	Đào Nguyên Phúc (TG0060)		3ad66e4a-112e-4486-97bd-31ab5dd11736	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5512ba9c-7158-499e-82a6-edf4dd61dc0d	619	Chu Thị Lan Phương	d6534c53-2c77-4aee-9eda-db896d8082ac	phuongctl@ptit.edu.vn	PGV100118	Chu Thị Lan Phương (PGV100118)		d6534c53-2c77-4aee-9eda-db896d8082ac	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a5115a37-fa07-44c8-9ab1-e0326bcea38c	229	Lê Thị Ngọc Phương	a7ebf69d-bb5c-4fda-8f4e-61e3d9f87d5b	phuongltn@ptit.edu.vn	KTC100322	Lê Thị Ngọc Phương (KTC100322)		a7ebf69d-bb5c-4fda-8f4e-61e3d9f87d5b	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c6f6294c-c172-4711-8dfa-646fd1189a70	991	Nguyễn Duy Phương	df6c7069-76a1-4db8-bfb8-b9210f57e48a	phuongnd.tg@ptit.edu.vn	TG0077	Nguyễn Duy Phương (TG0077)		df6c7069-76a1-4db8-bfb8-b9210f57e48a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
109e8d23-660d-4850-b94c-6ab5519c8985	297	Nguyễn Duy Phương	51167995-9a93-4bb1-bc42-366137170df8	phuongnd@ptit.edu.vn	KCN100243	Nguyễn Duy Phương (KCN100243)		51167995-9a93-4bb1-bc42-366137170df8	t	t	22	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a473810e-728f-4049-bfc9-fd333713b4ff	982	Nguyễn Thu Phương	c8842a5d-da2d-48b6-a2c8-bf00cd81d4f3		TG0315	Nguyễn Thu Phương (TG0315)		c8842a5d-da2d-48b6-a2c8-bf00cd81d4f3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c8c6ca92-f745-4f4d-97bd-309aa68fec83	196	Nguyễn Thị Hoài Phương	de4b153c-2fb0-40a7-85d3-fc4a1f308feb	phuongnth@ptit.edu.vn	KDP100364	Nguyễn Thị Hoài Phương (KDP100364)		de4b153c-2fb0-40a7-85d3-fc4a1f308feb	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
308390dd-29a4-4381-9359-0bbee53e1c19	352	Nguyễn Thị Lan Phương	ddaec2cb-2a5d-4134-ba0f-bcac84ef48cc	phuongntl@ptit.edu.vn	KCB101004	Nguyễn Thị Lan Phương (KCB101004)		ddaec2cb-2a5d-4134-ba0f-bcac84ef48cc	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
886dcfed-7542-43d9-898b-98e49c4a550c	1010	Nguyễn Thị Thu Phương	1d4d9a4d-3ceb-432f-93a0-56fcc6db31df		TG0305	Nguyễn Thị Thu Phương (TG0305)		1d4d9a4d-3ceb-432f-93a0-56fcc6db31df	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a248e7fb-789c-4068-9fcd-0c17d4b34176	1292	Nguyễn Văn Phương	0dd8a312-ef4a-4f40-8b9e-a0c4971b8cd8	phuongnv@ptit.edu.vn	VPH100022	Nguyễn Văn Phương (VPH100022)		0dd8a312-ef4a-4f40-8b9e-a0c4971b8cd8	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f775aa9c-e1c1-4eff-a0c6-8f5b2ce3235c	629	Ngô Xuân Phương	d8439c53-94ab-473f-9f0a-2ba33631fb3f	phuongnx.tg@ptit.edu.vn	TG0417	Ngô Xuân Phương (TG0417)		d8439c53-94ab-473f-9f0a-2ba33631fb3f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8a1b8b28-6663-477c-b342-6fa511df3eb2	1050	Phạm Thị Thu Phương	9140d438-ed4e-4560-a3fa-dd5460736e73	phuongptt@ptit.edu.vn	KTC101077	Phạm Thị Thu Phương (KTC101077)		9140d438-ed4e-4560-a3fa-dd5460736e73	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
56013ec1-7fbd-4a86-9c5c-8b39f3539e2d	1308	Trần Thị Lan Phương	dec273dd-9123-430b-8db2-5ff03905aec2	phuongttl@ptit.edu.vn	TQT100145	Trần Thị Lan Phương (TQT100145)		dec273dd-9123-430b-8db2-5ff03905aec2	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5b544a94-428c-41bd-b1ad-83ef81a7adbc	1305	Từ Minh Phương	7eeb9ad1-e6fe-465c-9740-34e14b4311ae	phuongtm@ptit.edu.vn	HDHV00001	Từ Minh Phương (HDHV00001)		7eeb9ad1-e6fe-465c-9740-34e14b4311ae	t	t	38	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a17a5311-f407-4266-b6a1-9827cd7686ef	269	Đặng Thị Ngọc Phương	a22620fb-c8a2-4017-b62d-1db384bb7457	phuongdn@ptit.edu.vn	KCN100280	Đặng Thị Ngọc Phương (KCN100280)		a22620fb-c8a2-4017-b62d-1db384bb7457	t	t	22	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d89f494c-1d8c-488c-ab44-fb8e9c7f68f5	570	Đỗ Thị Lan Phương	64fb6ea2-934e-4bb3-8e4a-fd2ee624ebd6	phuongdtl@ptit.edu.vn	PQL100073	Đỗ Thị Lan Phương (PQL100073)		64fb6ea2-934e-4bb3-8e4a-fd2ee624ebd6	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
676b91d5-dc47-4a48-9760-eadf40531d10	417	Lê Văn Phước	0cb0d410-15a2-4806-8a78-3a41858d864e	phuoclv@ptit.edu.vn	PTH200512	Lê Văn Phước (PTH200512)		0cb0d410-15a2-4806-8a78-3a41858d864e	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b59ff298-0182-4f05-b9f5-ca126689b572	522	Lương Hoàng Phước	e6e7e05b-b5c1-4ada-a1f4-8b243c7b3fc7	lhphuoc@ptit.edu.vn	TDT100651	Lương Hoàng Phước (TDT100651)		e6e7e05b-b5c1-4ada-a1f4-8b243c7b3fc7	t	t	2	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0a926746-bb1b-439c-be67-501838f0704c	1212	Nguyễn Văn Phước	05dd4e14-cd6e-44c7-b88b-8c5409b4c16e	phuocnv@ptit.edu.vn	KQT200479	Nguyễn Văn Phước (KQT200479)		05dd4e14-cd6e-44c7-b88b-8c5409b4c16e	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
174a7a60-7478-4afc-b843-68c97cd79436	635	Đào Mai Phước	9c5585de-0286-4b63-b070-e716ad6c56fa	phuocdm.tg@ptit.edu.vn	TG0489	Đào Mai Phước (TG0489)		9c5585de-0286-4b63-b070-e716ad6c56fa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e3396c95-f0ff-44ee-a6a4-61abd87cedc3	934	Hà Thị Phượng	ed93f979-3522-435a-a0cd-5ffa4b36c922		TG0036	Hà Thị Phượng (TG0036)		ed93f979-3522-435a-a0cd-5ffa4b36c922	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
99df0fae-5ca4-4bbd-a1f0-324ed54252a0	907	Hà Thị Phượng	1cc1c4bb-3f73-400c-978c-496e2e483585		TG00026	Hà Thị Phượng (TG00026)		1cc1c4bb-3f73-400c-978c-496e2e483585	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
008d8174-a247-4d2a-97f7-3cca209e8ad1	1066	Lê Thị Ngọc Phượng	658e5025-757d-4353-ab04-c00f8ecc9296		TG0281	Lê Thị Ngọc Phượng (TG0281)		658e5025-757d-4353-ab04-c00f8ecc9296	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3266bf8b-a101-4fc4-8152-baf14d268984	487	Phạm Thị Phượng	1975fe3e-8c8b-4e76-8dfb-23845a1d99f1	phuongpt@ptit.edu.vn	VKT100907	Phạm Thị Phượng (VKT100907)		1975fe3e-8c8b-4e76-8dfb-23845a1d99f1	t	t	62	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9c5ebf67-36ea-423c-9231-d839b827cf39	890	Bùi Xuân Quang	8b5effa2-b5d9-4f44-a70f-db46a2889b5d	quangbx.tg@ptit.edu.vn	2025.KCB1.15.798	Bùi Xuân Quang (2025.KCB1.15.798)		8b5effa2-b5d9-4f44-a70f-db46a2889b5d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4570be7e-ef31-4376-b26e-75524d9fc0ac	492	Nguyễn Duy Quang	b7ba46c6-1820-40dd-a04e-149c96964066	quangnd@ptit.edu.vn	VCN100846	Nguyễn Duy Quang (VCN100846)		b7ba46c6-1820-40dd-a04e-149c96964066	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1e3660f3-1403-4470-bd2a-cf72730a8f7d	838	Nguyễn Hồng Quang	0c68172a-3c11-4903-b7ac-158486b00d79	nguyenhongquang@ptit.edu.vn	KSD100833	Nguyễn Hồng Quang (KSD100833)		0c68172a-3c11-4903-b7ac-158486b00d79	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
90cb596a-39d5-4ce6-bae3-14184b293907	519	Nguyễn Kim Quang	e83ca9e5-691d-4c9a-ad13-ce11408329d4	quangnk@ptit.edu.vn	VCN100596	Nguyễn Kim Quang (VCN100596)		e83ca9e5-691d-4c9a-ad13-ce11408329d4	t	t	3	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
74418f3e-82fb-457f-b96f-5e8cce3030b2	83	Nguyễn Minh Quang	QuangNM.B23CC140@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Minh Quang		0672bfce-7640-448d-aadc-ab72d2ff398e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
459c7e56-367e-4a52-8717-c7565cea88de	839	Nguyễn Ngọc Quang	c4fbcafa-4f10-43d6-a651-e2eb13a48525	nguyenngocquang@ptit.edu.vn	KSD100852	Nguyễn Ngọc Quang (KSD100852)		c4fbcafa-4f10-43d6-a651-e2eb13a48525	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ae7aa112-3037-41cb-bb54-f6ca777941f1	614	Nguyễn Ngọc Quang	9145f9bc-b4a0-4621-930a-630f64372da2	quangnn@ptit.edu.vn	PGV100119	Nguyễn Ngọc Quang (PGV100119)		9145f9bc-b4a0-4621-930a-630f64372da2	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a5c2ba34-ee15-4411-b326-b71fdc7a8efc	976	Nguyễn Quang	19f85cae-49ac-43b7-8eb7-dc1ff6298144		TG0224	Nguyễn Quang (TG0224)		19f85cae-49ac-43b7-8eb7-dc1ff6298144	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5b257bc9-c3ae-4a7f-9393-0d2106729160	643	Nguyễn Tài Quang	6ea58ac6-c3af-4b96-9e07-9815c00f6bb6	quangnt.tg@ptit.edu.vn	TG0385	Nguyễn Tài Quang (TG0385)		6ea58ac6-c3af-4b96-9e07-9815c00f6bb6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
95a60ef1-2dc0-4c7b-ae6b-a06a9bcaef39	19	Nguyễn Tương Quang	QUANGNT	tranglou1003@gmail.com		Nguyễn Tương Quang		vkh100552	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d2b327ed-42b5-4a23-868f-b7efea3c1467	1394	Nguyễn Đăng Quang	072c1a1a-22ef-4b8f-adc5-02aa2243af25	quangnd2@ptit.edu.vn	KCB201108	Nguyễn Đăng Quang (KCB201108)		072c1a1a-22ef-4b8f-adc5-02aa2243af25	t	t	195	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e4570074-eeb0-447e-ad0e-4b40c82a5d2e	654	Nguyễn Đức Quang	3057563e-c1c3-48d3-a27b-7e760d24b3f9		TG0531	Nguyễn Đức Quang (TG0531)		3057563e-c1c3-48d3-a27b-7e760d24b3f9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a114592b-b4bd-4661-8f72-7c65d47b5c60	101	Phạm Minh Quang	90fb291d-21d3-485b-9e74-1e298f5a7c52	quangpm@ptit.edu.vn	KVT200500	Phạm Minh Quang (KVT200500)		90fb291d-21d3-485b-9e74-1e298f5a7c52	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ae849143-f46c-4d6c-81d3-3b70d7f003c1	672	Phạm Đức Quang	a609939e-2a59-454f-b19a-b70f63b9a822		TG0494	Phạm Đức Quang (TG0494)		a609939e-2a59-454f-b19a-b70f63b9a822	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
35e33c21-674d-43ef-91b2-0d84c4af3d26	1155	Trang Duy Quang	4d53a1df-08b1-4b34-b694-5188d2c12c8e		PDT200975	Trang Duy Quang (PDT200975)		4d53a1df-08b1-4b34-b694-5188d2c12c8e	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5f9c61ce-d5be-4059-a23d-3a3c6b35d91a	1001	Trần Nhật Quang	61088cf6-9a75-4521-94ee-3fe7a6a3444c		TG0041	Trần Nhật Quang (TG0041)		61088cf6-9a75-4521-94ee-3fe7a6a3444c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fd6f502d-8f42-42cd-9d90-570137564a69	1129	Vũ Thanh Quang	4dd77659-9bee-45aa-b33d-d11d9426574d		TG0076	Vũ Thanh Quang (TG0076)		4dd77659-9bee-45aa-b33d-d11d9426574d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b489dd63-e7f3-4a1e-822f-825e014c94f6	655	Đặng Đức Quang	6e15e803-52f5-4725-87e8-37840eb8aee8	quangdd.tg@ptit.edu.vn	TG0445	Đặng Đức Quang (TG0445)		6e15e803-52f5-4725-87e8-37840eb8aee8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
27e4f386-3469-41e8-a028-a9e769888b2f	598	Đỗ Viết Quang	5fc24702-e10b-4a5a-b443-bfd1a063f941	quangdv@ptit.edu.vn	PKH100598	Đỗ Viết Quang (PKH100598)		5fc24702-e10b-4a5a-b443-bfd1a063f941	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f8ef4a5f-2dd9-4d94-b4e6-f14776c00921	687	Nguyễn Thị Kim Quy	1ea67900-f690-4c8d-ad74-622246bfffa8		TG0508	Nguyễn Thị Kim Quy (TG0508)		1ea67900-f690-4c8d-ad74-622246bfffa8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b46c554-600f-4de0-999c-616540149f38	361	Ngô Thị Kim Quy	c0e58389-c75b-4eaa-a533-def221acd91e	quyntk@ptit.edu.vn	KCB100211	Ngô Thị Kim Quy (KCB100211)		c0e58389-c75b-4eaa-a533-def221acd91e	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a2000740-f21d-4cb6-bdfc-76026e53bd87	1285	Dương Thị Hà Quyên	70db6d58-a529-40d9-801a-2250a670ec0b	quyendh@ptit.edu.vn	VPH100015	Dương Thị Hà Quyên (VPH100015)		70db6d58-a529-40d9-801a-2250a670ec0b	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
32775dd9-e725-408e-aaf6-fff414e526fe	1185	Trương Thị Quyên	96fc4ca0-870d-4b73-9c87-33b8b5a48711	quyentt@ptit.edu.vn	KCN201078	Trương Thị Quyên (KCN201078)		96fc4ca0-870d-4b73-9c87-33b8b5a48711	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6837c84f-d250-4597-a563-d5bc449d982e	364	Nguyễn Hương Quyết	b57ab41b-0af6-4b21-9483-4333356c7f41	quyetnh@ptit.edu.vn	TDV100154	Nguyễn Hương Quyết (TDV100154)		b57ab41b-0af6-4b21-9483-4333356c7f41	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bd4ca1fb-3008-447b-9e27-5cec3a40839d	1257	Nguyễn Thế Quyền	43d013d4-b3ed-45d6-9ca4-8bbb4582a382	quyennt@ptit.edu.vn	TDT100647	Nguyễn Thế Quyền (TDT100647)		43d013d4-b3ed-45d6-9ca4-8bbb4582a382	t	t	49	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06b66855-7120-4ba5-970e-a4af9568f947	1189	Ngô Quang Quyền	013ccec4-f897-4ba3-a65b-df958baff1c8	quyennq@ptit.edu.vn	KCN200746	Ngô Quang Quyền (KCN200746)		013ccec4-f897-4ba3-a65b-df958baff1c8	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
12d945b6-3ff3-479f-82b9-46de7119c01b	1306	Trần Ngọc Quyền	93dfeafe-fb91-4a0f-b5a5-b51bd4cfcd87	quyentn@ptit.edu.vn	TQT101054	Trần Ngọc Quyền (TQT101054)		93dfeafe-fb91-4a0f-b5a5-b51bd4cfcd87	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
69b32e3c-f1c6-405b-8d56-b727a633400a	1448	Tô Anh Quyền	fe20af51-ef60-4af8-85ec-bdfbf35a3d98	quyenta@ptit.edu.vn	VKH101146	Tô Anh Quyền (VKH101146)		fe20af51-ef60-4af8-85ec-bdfbf35a3d98	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
53c8e23a-1fe7-4e82-994b-e9b67d25f5c4	1179	Nguyễn Hồng Quân	c0d0c336-be98-4a3b-b6c6-ff917df19f30	quannguyen@ptit.edu.vn	KCB200413	Nguyễn Hồng Quân (KCB200413)		c0d0c336-be98-4a3b-b6c6-ff917df19f30	t	t	195	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4439cd65-cc58-4359-914d-3d7c7cf3d310	1244	Nguyễn Đoàn Quân	eef634bc-6f99-428a-85a2-1651779c79ab	quannd1@ptit.edu.vn	VCN101031	Nguyễn Đoàn Quân (VCN101031)		eef634bc-6f99-428a-85a2-1651779c79ab	t	t	58	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b22f5f0-969c-498f-8f00-9e16e8814791	431	Nguyễn Đình Quân	099192c6-ac00-4043-8a73-d10cea4360ea	quannd@ptit.edu.vn	KTN100979	Nguyễn Đình Quân (KTN100979)		099192c6-ac00-4043-8a73-d10cea4360ea	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
425fd929-cc40-4dc6-91bb-b89145dbe3ce	28	Thái Minh Quân	342e8d4f-18c6-429d-8e6f-0fda31b0e742	quantm@ptit.edu.vn	VKH100534	Thái Minh Quân (VKH100534)		342e8d4f-18c6-429d-8e6f-0fda31b0e742	t	t	72	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ec5f75f-bae4-4ce2-9cf3-228b41ad974d	1439	Trần An Quân	04c2e42e-a6b0-4202-8a3c-c5dc118e5a79	quanta@ptit.edu.vn	KTC101138	Trần An Quân (KTC101138)		04c2e42e-a6b0-4202-8a3c-c5dc118e5a79	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f0c46ab7-5223-4733-baaa-a670dbcdb955	821	Trần Hồng Quân	17f911b7-bebc-4574-9790-72c3c5e76666	tranhongquan@ptit.edu.vn	KSD100673	Trần Hồng Quân (KSD100673)		17f911b7-bebc-4574-9790-72c3c5e76666	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
484f37c6-7a5d-4209-a331-c43a9146ba4a	404	Từ Minh Quân	80fb22f8-dc5f-4091-97ad-6c1ea37e18f6	quantm2@ptit.edu.vn	PTH200829	Từ Minh Quân (PTH200829)		80fb22f8-dc5f-4091-97ad-6c1ea37e18f6	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8cedd647-d01d-49e7-bbbb-c7d044a7271f	767	Vũ Văn Quân	8160c6c8-4020-491f-a3e2-c127452400d6	quanvv.tg@ptit.edu.vn	TG0124	Vũ Văn Quân (TG0124)		8160c6c8-4020-491f-a3e2-c127452400d6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6aba795a-4965-4942-b9ae-f8a510a535af	1404	Đoàn Đức Quí	6fb4af59-35d1-496f-836c-c7bec67bcac4	quidd@ptit.edu.vn	KCN201100	Đoàn Đức Quí (KCN201100)		6fb4af59-35d1-496f-836c-c7bec67bcac4	t	t	190	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a50c5e74-a207-418d-850b-f14cbcf3f79c	1355	Lâm Duy Quý	4cc91da6-0a4c-4bfc-af8c-cc1a938af85e	quyld@ptit.edu.vn	KCN201109	Lâm Duy Quý (KCN201109)		4cc91da6-0a4c-4bfc-af8c-cc1a938af85e	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bfa3d65a-733a-4344-b310-86fb58d2893b	160	Trần Thị Kim Quý	83e628ac-4f04-4ac0-b762-2437b5e4cf13	quyttk@ptit.edu.vn	KCB200735	Trần Thị Kim Quý (KCB200735)		83e628ac-4f04-4ac0-b762-2437b5e4cf13	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
242f3ba3-6683-4028-ac4e-b2cc3eb0b3d3	1350	Bùi Đoàn Quảng	feb80354-29e2-470a-ab1b-94c43a0c192c	quangbd@ptit.edu.vn	VKT101121	Bùi Đoàn Quảng (VKT101121)		feb80354-29e2-470a-ab1b-94c43a0c192c	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0e36b77c-2c1e-49e7-9dec-07085b576ee5	1373	Nguyễn Đình Quảng	6b477805-ef99-4632-93de-3057a5bba18b	ndquang@ptit.edu.vn	KCN101091	Nguyễn Đình Quảng (KCN101091)		6b477805-ef99-4632-93de-3057a5bba18b	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f75a9277-bd33-4336-aa8d-b51bff4baacb	322	Đinh Sỹ Quảng	64430985-ea54-497d-8071-ec4c92c3b97f	quangds@ptit.edu.vn	KDT100689	Đinh Sỹ Quảng (KDT100689)		64430985-ea54-497d-8071-ec4c92c3b97f	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b3efc2a1-9d9f-43f4-8935-167cb68c68a7	294	Trần Đình Quế	81103a1b-7ea1-46af-9a11-f3c83ddf0f23	quetd@ptit.edu.vn	KCN100283	Trần Đình Quế (KCN100283)		81103a1b-7ea1-46af-9a11-f3c83ddf0f23	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5b0f39a0-9031-4a6d-ad02-ff1c8a5f580b	205	Bùi Tuệ Quỳnh	6d9c551a-7a5a-44f3-ad0b-b560781c963b	quynhbt@ptit.edu.vn	KQT100713	Bùi Tuệ Quỳnh (KQT100713)		6d9c551a-7a5a-44f3-ad0b-b560781c963b	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
796edba5-3e1f-4c0b-84f4-e20aea4624fe	1445	Nguyễn Diễm Quỳnh	6d45c5eb-0c9f-4145-ae89-931f69faacd9	quynhnd1@ptit.edu.vn	VKH101148	Nguyễn Diễm Quỳnh (VKH101148)		6d45c5eb-0c9f-4145-ae89-931f69faacd9	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bed588ff-8472-4742-9a56-d9027eec974c	599	Nguyễn Thị Diệu Quỳnh	7ffb2ebd-65dd-45a8-babd-323be49dffa8	quynhnd@ptit.edu.vn	PKH100106	Nguyễn Thị Diệu Quỳnh (PKH100106)		7ffb2ebd-65dd-45a8-babd-323be49dffa8	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5cc2423b-45c8-4a6e-b8f3-50bf253ae61f	510	Ngô Thị Thu Quỳnh	4bff1a01-dc9d-4266-9c3c-28e2ecaf9051	quynhntt@ptit.edu.vn	VCN100609	Ngô Thị Thu Quỳnh (VCN100609)		4bff1a01-dc9d-4266-9c3c-28e2ecaf9051	t	t	57	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20ebc0a6-54cf-4af6-9ca8-7115ac9b9cc0	558	Phạm Hải Quỳnh	cf51570a-b5cd-427f-9e65-836d94bc9c34	quynhph@ptit.edu.vn	PDT100063	Phạm Hải Quỳnh (PDT100063)		cf51570a-b5cd-427f-9e65-836d94bc9c34	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c8e5ab05-3c0d-435c-9f10-61b94f135ce8	115	Phạm Thị Như Quỳnh	ed5c2e5c-0aba-40cd-b15f-fe5fd5fa3646	quynhptn@ptit.edu.vn	KDT200463	Phạm Thị Như Quỳnh (KDT200463)		ed5c2e5c-0aba-40cd-b15f-fe5fd5fa3646	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
98f7a6b9-9819-47c5-affb-645de120849a	463	Phạm Thị Thái Quỳnh	f1421022-3459-4c44-8b18-8a94e989ce82	quynhptt@ptit.edu.vn	VKT100581	Phạm Thị Thái Quỳnh (VKT100581)		f1421022-3459-4c44-8b18-8a94e989ce82	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b9ab45a0-e4df-4593-a775-daa49e2f6764	273	Đào Thị Thúy Quỳnh	e30d4083-85f4-4568-b93e-6f0de2adcc05	quynhdtt@ptit.edu.vn	KCN100269	Đào Thị Thúy Quỳnh (KCN100269)		e30d4083-85f4-4568-b93e-6f0de2adcc05	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eaa27b96-9ea6-44db-9980-39ba67bb095b	845	Vũ Văn San	51d5b951-b811-4cf4-8fd0-90995868d92f	sanvv@ptit.edu.vn	KSD100682	Vũ Văn San (KSD100682)		51d5b951-b811-4cf4-8fd0-90995868d92f	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a560cd4-d1a6-44ca-aa26-1131155e4de6	109	Nguyễn Quang Sang	180ae64b-2e7f-4894-a54a-6a342c115461	sangnq@ptit.edu.vn	KVT201018	Nguyễn Quang Sang (KVT201018)		180ae64b-2e7f-4894-a54a-6a342c115461	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
998e0342-e137-4172-af9b-2335bbfceed9	82	Nguyễn Viết Sang	SangNV.B23CC142@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Viết Sang		a9019c47-07cf-4843-8d21-2df93a8e6ba1	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4b2c6c73-af5e-47d6-99f6-a4fb360c9c1b	88	Trần Đăng Sang	SangTD.B23CC144@stu.ptit.edu.vn	tranglou1003@gmail.com		Trần Đăng Sang		de4d863e-c64c-4d59-ab8c-5af39d2f234b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fd3fe296-4b04-4492-a405-e44b5b8e5822	390	Lê Thị Thúy Sen	1c6a305e-989a-428b-a314-c9f8df1581de	senltt@ptit.edu.vn	TDV100172	Lê Thị Thúy Sen (TDV100172)		1c6a305e-989a-428b-a314-c9f8df1581de	t	t	236	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
016d98a5-45f7-4268-b45f-b5650fb70986	1226	Hồ Thị Sáng	232950a0-75eb-4983-9002-a2ae0b9c154c	sanght@ptit.edu.vn	KQT200465	Hồ Thị Sáng (KQT200465)		232950a0-75eb-4983-9002-a2ae0b9c154c	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2faf9178-9f4a-4133-90f5-eff675886543	133	Nguyễn Văn Sáu	9d08cb2f-1c3c-448b-8854-40fefec7eeea	saunv@ptit.edu.vn	KCN200439	Nguyễn Văn Sáu (KCN200439)		9d08cb2f-1c3c-448b-8854-40fefec7eeea	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9f59b2fa-5629-4de3-86a9-363e66e5d9a1	370	Đồng Thị Sáu	71b26ab8-d9a9-4c11-837d-f69d07cb1750	saudt@ptit.edu.vn	TDV100171	Đồng Thị Sáu (TDV100171)		71b26ab8-d9a9-4c11-837d-f69d07cb1750	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1fa164de-6552-4983-8f4b-016adba80f7b	259	Lê Thị Hồng Sâm	9ed51058-b843-43a0-b918-9618cdfa258e	samlth@ptit.edu.vn	KVT100705	Lê Thị Hồng Sâm (KVT100705)		9ed51058-b843-43a0-b918-9618cdfa258e	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
561e4d1d-aba9-4fad-92a0-7cbeca0457e1	885	Ngô Thị Sâm	13395133-c517-49fc-a84c-fb1443459a78	samnt.tg@ptit.edu.vn	TG0009	Ngô Thị Sâm (TG0009)		13395133-c517-49fc-a84c-fb1443459a78	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f23bf741-a258-4678-891f-244cfd1f5ada	345	Vũ Thị Sâm	82d99025-189e-409a-8d5d-ed428d311c98	samvt@ptit.edu.vn	KCB100212	Vũ Thị Sâm (KCB100212)		82d99025-189e-409a-8d5d-ed428d311c98	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
78eea8fd-1bd8-4c49-a003-ecc621005eb4	1028	Bùi Trường Sơn	6e8b2d4a-3edf-49e3-ae8a-18e5c02f2abd	sonbt@ptit.edu.vn	KVT100305	Bùi Trường Sơn (KVT100305)		6e8b2d4a-3edf-49e3-ae8a-18e5c02f2abd	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
13484e86-367e-448f-ba07-b47fc0427866	251	Cao Hồng Sơn	fd6d8bcb-8f4e-4021-839b-b1227833cebf	sonch@ptit.edu.vn	KVT100304	Cao Hồng Sơn (KVT100304)		fd6d8bcb-8f4e-4021-839b-b1227833cebf	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20f3ee28-9d05-4380-a458-12fc4ec4e556	864	Hoàng Sơn	75422e78-dfb8-4019-ab97-d3e83ac8ba55	hoangson@ptit.edu.vn	KDT101050	Hoàng Sơn (KDT101050)		75422e78-dfb8-4019-ab97-d3e83ac8ba55	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
388049ce-7dad-4d23-b26a-90aa628a3a50	500	Hoàng Xuân Sơn	e14a97b2-0bc0-45a9-9bb4-3691c8452afb	sonhx@ptit.edu.vn	VCN100616	Hoàng Xuân Sơn (VCN100616)		e14a97b2-0bc0-45a9-9bb4-3691c8452afb	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a2fff02-88d1-4e25-b19b-c2eb70576135	414	Huỳnh Kim Sơn	21fd7811-5261-4905-8935-c7bfef284d78	sonhk@ptit.edu.vn	KDT201041	Huỳnh Kim Sơn (KDT201041)		21fd7811-5261-4905-8935-c7bfef284d78	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0e938da9-bdf4-48ac-91d6-61d834cee239	736	Lương Đông Sơn	86680f7d-5d1f-43e8-993d-162787ef57e6		TG0408	Lương Đông Sơn (TG0408)		86680f7d-5d1f-43e8-993d-162787ef57e6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6248dc13-2673-45a9-96e8-2c5765dcde97	780	Nguyễn Doãn Sơn	96363354-5a41-49af-9c04-9e50e96822f3		TG0449	Nguyễn Doãn Sơn (TG0449)		96363354-5a41-49af-9c04-9e50e96822f3	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6b1160e6-588f-4440-a9d9-a07c19a59df0	402	Nguyễn Hoàng Sơn	ac8845db-fcaf-487b-9a59-b7a8b9455341	sonnh@ptit.edu.vn	PTH200516	Nguyễn Hoàng Sơn (PTH200516)		ac8845db-fcaf-487b-9a59-b7a8b9455341	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8d3bd803-aea7-4775-ae54-bb1650bfac7f	940	Nguyễn Hoàng Sơn	a54b2b4d-22a8-4069-bc0a-bd223de269c9		TG0234	Nguyễn Hoàng Sơn (TG0234)		a54b2b4d-22a8-4069-bc0a-bd223de269c9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
38a095cd-c7b3-4505-808e-0c2518fb9e06	149	Nguyễn Hồng Sơn	e9544ba3-1529-4fa5-ba7c-2134de491e33	sonngh@ptit.edu.vn	KCN200426	Nguyễn Hồng Sơn (KCN200426)		e9544ba3-1529-4fa5-ba7c-2134de491e33	t	t	190	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1e6fc3b6-74a9-4163-8089-c548da43db0e	292	Nguyễn Mạnh Sơn	18415730-1abc-4be7-9c0b-b92656993d99	sonnm@ptit.edu.vn	KCN100270	Nguyễn Mạnh Sơn (KCN100270)		18415730-1abc-4be7-9c0b-b92656993d99	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
85343032-40e7-4e3a-9b4d-a12382b787ca	763	Nguyễn Thanh Sơn	27270ea6-b443-4694-bdc4-b8e33c086bf7		TG0541	Nguyễn Thanh Sơn (TG0541)		27270ea6-b443-4694-bdc4-b8e33c086bf7	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c72903ff-2683-492b-8663-9843ebad859d	785	Nguyễn Văn Sơn	691f997e-4d68-4458-8b3d-bffec6f2a804		TG0356	Nguyễn Văn Sơn (TG0356)		691f997e-4d68-4458-8b3d-bffec6f2a804	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b34c2b5d-62ce-417d-9d94-ac46b667703a	197	Nguyễn Đình Sơn	6d759e7e-a1ac-44a1-8285-d50b1a3b8456	sonnd@ptit.edu.vn	TDM100365	Nguyễn Đình Sơn (TDM100365)		6d759e7e-a1ac-44a1-8285-d50b1a3b8456	t	t	255	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06931e08-e059-4852-8504-556298a2d770	745	Ngô Đông Sơn	ea00039d-a7e8-4a6d-b7f3-8ea904c50c8d		TG0423	Ngô Đông Sơn (TG0423)		ea00039d-a7e8-4a6d-b7f3-8ea904c50c8d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
add2eb57-12f3-4b3f-b069-33799ffe3b2b	387	Trần Cao Sơn	b103f57e-4c31-4794-9b21-01c4c3b21a8f	sontc@ptit.edu.vn	TDV100153	Trần Cao Sơn (TDV100153)		b103f57e-4c31-4794-9b21-01c4c3b21a8f	t	t	235	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
46f6e810-bca9-4012-abb0-e68921d26290	602	Trần Hoàng Sơn	7a759f19-2d8c-42b8-a419-263871abba84	sonth@ptit.edu.vn	PKH100099	Trần Hoàng Sơn (PKH100099)		7a759f19-2d8c-42b8-a419-263871abba84	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5a063b8c-a214-48a5-86f6-f9147b6f4cd6	341	Trần Minh Sơn	cd3ed1f9-ff62-46ae-bad3-3e0e756f474a	sontm@ptit.edu.vn	KCB100799	Trần Minh Sơn (KCB100799)		cd3ed1f9-ff62-46ae-bad3-3e0e756f474a	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d230eeb6-1326-49b4-bc1e-4079ba37bfdf	42	Vũ Hồng Sơn	961099f8-4ae7-4e34-bbca-3e777179544f	sonvh@ptit.edu.vn	VKH100527	Vũ Hồng Sơn (VKH100527)		961099f8-4ae7-4e34-bbca-3e777179544f	t	t	73	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
10308bb6-dda2-4421-a596-f27926a5b059	422	Đinh Tô Sơn	f08af143-528b-4582-aba9-376562e4eb76	sondt@ptit.edu.vn	PTH200514	Đinh Tô Sơn (PTH200514)		f08af143-528b-4582-aba9-376562e4eb76	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ce5067b-f4d0-450d-9dc5-acf4d8a297b1	426	Đinh Văn Sơn	953f99ab-fd2c-49b5-8a66-6b1a1234113d	sondv@ptit.edu.vn	PTH200515	Đinh Văn Sơn (PTH200515)		953f99ab-fd2c-49b5-8a66-6b1a1234113d	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c9ad3555-9149-4643-801e-e8d48e05bc20	531	Đặng Vũ Sơn	08a1085f-27a9-46b0-a838-f2d606e516f0	dvson@ptit.edu.vn	KAT100891	Đặng Vũ Sơn (KAT100891)		08a1085f-27a9-46b0-a838-f2d606e516f0	t	t	219	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe411fde-ba96-4b98-b731-1247bf40fe71	873	Đỗ Minh Sơn	2cfcd3f0-e2a7-4ff6-bdf5-cf76e1ace7be	sondm@ptit.edu.vn	KCB100213	Đỗ Minh Sơn (KCB100213)		2cfcd3f0-e2a7-4ff6-bdf5-cf76e1ace7be	t	t	229	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d5f3e63c-2ff2-47d2-af88-d7f02872416a	305	Phạm Văn Sự	a5175326-5347-4608-9e3d-a9767345b645	supv@ptit.edu.vn	KDT100236	Phạm Văn Sự (KDT100236)		a5175326-5347-4608-9e3d-a9767345b645	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a89461ef-9727-4797-b082-575481dd5814	266	Trần Đức Sự	1e55bd02-caa8-4c24-a468-d5cf671a2ac6	sutd@ptit.edu.vn	KAT100853	Trần Đức Sự (KAT100853)		1e55bd02-caa8-4c24-a468-d5cf671a2ac6	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b642fd70-a68c-47c7-8999-ed2243c66d9b	819	Nguyễn Quý Sỹ	d66b2110-ee1a-4aee-beb3-0a3e2cc1b547	synq@ptit.edu.vn	TKT100131	Nguyễn Quý Sỹ (TKT100131)		d66b2110-ee1a-4aee-beb3-0a3e2cc1b547	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bc35348c-4157-4094-b633-47cd1149e7a7	58	TEST_LD	TEST_LD	tranglou1003@gmail.com		TEST_LD			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f52aea6e-8967-44ff-85cb-b25c53b1f908	60	TEST_ND	TEST_ND	tranglou1003@gmail.com		TEST_ND			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
94f26e18-7bf7-4a8f-98be-6ae9c9c3d1d1	59	TEST_VT	TEST_VT	tranglou1003@gmail.com		TEST_VT			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6b4fb084-09ab-4b7d-82db-16c649455a03	140	Hồ Mạnh Tài	e119d260-4b7e-475e-9ec4-21e4e1acc22b	taihm@ptit.edu.vn	KCN200755	Hồ Mạnh Tài (KCN200755)		e119d260-4b7e-475e-9ec4-21e4e1acc22b	t	t	188	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2229b32-5870-42ad-95d8-0442b02db646	616	Test Test	93d3b325-0fd6-439d-ace9-403d260b69d0		TG0593	Test Test (TG0593)		93d3b325-0fd6-439d-ace9-403d260b69d0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2d91e926-58a2-4260-9dc7-cc386a233be0	727	Hoàng Thị Thanh	ae9a6813-9bf5-4ce9-92b7-423881cc1d0d		TG0491	Hoàng Thị Thanh (TG0491)		ae9a6813-9bf5-4ce9-92b7-423881cc1d0d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cce1c1a6-ad46-4ae1-86fc-48c79b50c220	1187	Lê Hà Thanh	8ed3c6d0-a0e9-4299-9fc8-dfec98c00e17	thanhlh@ptit.edu.vn	KCN200727	Lê Hà Thanh (KCN200727)		8ed3c6d0-a0e9-4299-9fc8-dfec98c00e17	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f145c9f-57f5-453c-9266-4d2d6a6b036d	337	Lê Thị Minh Thanh	97834e82-7dd2-4bcc-955a-0577a7db51df	thanhltm@ptit.edu.vn	KCB100214	Lê Thị Minh Thanh (KCB100214)		97834e82-7dd2-4bcc-955a-0577a7db51df	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f0fdeb9-f0df-45d7-8ab6-0a4d2544aa82	1051	Nguyễn Hoàng Phương Thanh	5194eb3d-1afa-4cf4-8713-3a8ce3aafca0		TG0214	Nguyễn Hoàng Phương Thanh (TG0214)		5194eb3d-1afa-4cf4-8713-3a8ce3aafca0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b2369ad6-e265-4234-b561-ce5254b0073a	1174	Nguyễn Hoàng Thanh	103b5c39-5527-47e6-87ba-17890055b9e4	nhthanh@ptit.edu.vn	TKT200406	Nguyễn Hoàng Thanh (TKT200406)		103b5c39-5527-47e6-87ba-17890055b9e4	t	t	12	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
443121da-cd68-4ff7-a245-3f809ee93890	1148	Nguyễn Thị Thanh	6be0d012-c81d-42ec-be8e-c49a1cb38923	ntthanh@ptit.edu.vn	PKT200384	Nguyễn Thị Thanh (PKT200384)		6be0d012-c81d-42ec-be8e-c49a1cb38923	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
76d4ad21-9be4-467d-b03e-ff87664ab92d	1209	Nguyễn Thị Tuyết Thanh	91004118-ea9d-4ad1-93b5-7677e2d957e8	thanhntt@ptit.edu.vn	KQT200480	Nguyễn Thị Tuyết Thanh (KQT200480)		91004118-ea9d-4ad1-93b5-7677e2d957e8	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
71f2ec96-34a9-48e3-9980-6e5acc349737	836	Phạm Thị Hồng Thanh	ac108617-f10b-45f6-89ec-9cd3dbafe357	thanhpth@ptit.edu.vn	KSD100683	Phạm Thị Hồng Thanh (KSD100683)		ac108617-f10b-45f6-89ec-9cd3dbafe357	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d62ef32-4820-48a5-82aa-087ebfdde853	228	Phạm Vũ Hà Thanh	3bde4df7-2271-4e4c-bc30-36a9604a4d8b	thanhpvh@ptit.edu.vn	VLD100323	Phạm Vũ Hà Thanh (VLD100323)		3bde4df7-2271-4e4c-bc30-36a9604a4d8b	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf5a1744-c5c2-46c0-a8f2-b982ebcdd5a3	1214	Trần Văn Thanh	561508fc-89bd-4ffe-908f-dfd76abce8a2	thanhtv@ptit.edu.vn	KQT200728	Trần Văn Thanh (KQT200728)		561508fc-89bd-4ffe-908f-dfd76abce8a2	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7bd3ae8-1d7a-42a8-9106-c43da1e8ea57	861	Vương Viết Thao	9940b21b-8ffa-40a0-b1b4-8490e0cb99c9	thaovv@ptit.edu.vn	KDT101022	Vương Viết Thao (KDT101022)		9940b21b-8ffa-40a0-b1b4-8490e0cb99c9	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c32e1a45-0792-43d6-8c3a-2dbd73d3031a	480	Bùi Anh Thi	21882059-b712-4222-a30b-9e6f958fb34c		TG0052	Bùi Anh Thi (TG0052)		21882059-b712-4222-a30b-9e6f958fb34c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5f493db7-54fe-4d9d-a421-f5b61394e1ca	1103	Lương Minh Thi	b0ea08d2-776b-4d19-9ddb-d00ac4979175		TG0340	Lương Minh Thi (TG0340)		b0ea08d2-776b-4d19-9ddb-d00ac4979175	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3543400c-087c-4df4-bb4c-74b270a9681b	911	Nguyễn Thiện Thi	14c54c03-1a56-4549-b9d9-73b9787a03c0		TG0487	Nguyễn Thiện Thi (TG0487)		14c54c03-1a56-4549-b9d9-73b9787a03c0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f7944c9-7ad3-49a3-a869-cfc285503651	346	Nguyễn Thị Thiết	11d102a3-9164-4f48-a14b-493efb189dd5	thietnt@ptit.edu.vn	KCB100216	Nguyễn Thị Thiết (KCB100216)		11d102a3-9164-4f48-a14b-493efb189dd5	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
44b8774b-c84f-4c9f-bec7-f8f6ae9f0d10	628	Nguyễn Năng Thiều	5a35e0d2-44f7-481c-b223-82ce27ea7b9d		TG0594	Nguyễn Năng Thiều (TG0594)		5a35e0d2-44f7-481c-b223-82ce27ea7b9d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
686d88aa-457e-4b64-8cc0-214d0eb16f17	381	Nguyễn Đăng Thiều	5a357947-412e-44bf-a390-6b835ba5c87d	thieund@ptit.edu.vn	TDV100180	Nguyễn Đăng Thiều (TDV100180)		5a357947-412e-44bf-a390-6b835ba5c87d	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3309bb20-76d2-4f25-97bd-a4a9c9d9566d	444	Nguyễn Xuân Thiện	2f38a07f-ab49-4b7e-819d-f12e2921f0af	thiennx@ptit.edu.vn	VKT100585	Nguyễn Xuân Thiện (VKT100585)		2f38a07f-ab49-4b7e-819d-f12e2921f0af	t	t	66	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0e967e15-64b7-4fd8-a4e0-d8b4eb537ec2	571	Ngô Đức Thiện	de86809b-87e4-476c-adfe-7945c37706fa	thiennd@ptit.edu.vn	PQL100065	Ngô Đức Thiện (PQL100065)		de86809b-87e4-476c-adfe-7945c37706fa	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
952ff593-0b5b-4cbe-bb8d-a66d0f1d6369	860	Trần Đức Thiệp	fbe49629-95da-48d1-9344-a379db5ddc60	thieptd@ptit.edu.vn	KDT100985	Trần Đức Thiệp (KDT100985)		fbe49629-95da-48d1-9344-a379db5ddc60	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d957b58d-2b20-4743-ad8e-b4d35942b46f	653	Nguyễn Đức Thiệu	60081892-118e-4aed-a454-b923a049ed7e		TG0567	Nguyễn Đức Thiệu (TG0567)		60081892-118e-4aed-a454-b923a049ed7e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
85c2ec50-3b0b-4b65-a968-4ae25b5ce23f	465	Nguyễn Thị Thoa	5b3604c1-d3e7-4dba-8c6e-79ddad582e8d	thoant@ptit.edu.vn	VKT101051	Nguyễn Thị Thoa (VKT101051)		5b3604c1-d3e7-4dba-8c6e-79ddad582e8d	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
257b0913-d71f-4105-a1df-038480f95fda	262	Hoàng Thị Thu	9c95844b-13ba-4954-8531-c3d3c8d1d7a2	thuht@ptit.edu.vn	KVT100617	Hoàng Thị Thu (KVT100617)		9c95844b-13ba-4954-8531-c3d3c8d1d7a2	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f12f5d60-70e1-44df-ab35-faa7aeb67a99	1196	Lê Thị Hoài Thu	5925aa12-17ad-4a9e-8f77-cd6f9fabe5a3	thulth1@ptit.edu.vn	KCN200742	Lê Thị Hoài Thu (KCN200742)		5925aa12-17ad-4a9e-8f77-cd6f9fabe5a3	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8b9ffc6f-e935-44d5-a8c0-f9c527ef74b8	488	Lê Thị Hà Thu	d02f0b6b-9598-4a63-81a5-849ca0a1e2d4	thulth@ptit.edu.vn	VKH100819	Lê Thị Hà Thu (VKH100819)		d02f0b6b-9598-4a63-81a5-849ca0a1e2d4	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80a6d0e8-c9ff-40bb-8da2-3840c93dfc5b	588	Nguyễn Thị Hoài Thu	3eee80ca-47ed-4ccf-a523-1358f24616a7	thunth@ptit.edu.vn	PKT100086	Nguyễn Thị Hoài Thu (PKT100086)		3eee80ca-47ed-4ccf-a523-1358f24616a7	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
23e21b16-dee3-4aaa-a2aa-0240ca3ef638	795	Nguyễn Thị Hồ Thu	ecabebb3-4363-4e55-8eab-a04727a015a9	thunth.tg@ptit.edu.vn	TG0555	Nguyễn Thị Hồ Thu (TG0555)		ecabebb3-4363-4e55-8eab-a04727a015a9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4ac69eb7-2687-4c22-bbdf-d6f25099e5b1	339	Nguyễn Thị Thu	9e74470f-0fef-4bef-b9e0-c0a23d3ef6b7	thunt2@ptit.edu.vn	KCB100800	Nguyễn Thị Thu (KCB100800)		9e74470f-0fef-4bef-b9e0-c0a23d3ef6b7	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
33230b20-a4a0-482a-af35-a33cc44b5d21	896	Nguyễn Thị Thu	9434133d-d3e2-4297-8eb3-d10af1fc0f18	thunt.tg@ptit.edu.vn	TG0089	Nguyễn Thị Thu (TG0089)		9434133d-d3e2-4297-8eb3-d10af1fc0f18	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
05a05175-bbd6-4fd4-adfa-587254ce5c0d	1384	Nguyễn Thị Thu	351af123-96ec-4d81-b139-d589fa5edaa7	thunt3@ptit.edu.vn	KCB101120	Nguyễn Thị Thu (KCB101120)		351af123-96ec-4d81-b139-d589fa5edaa7	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3095f393-8642-4313-89c5-68c721dd8472	805	Ngô Thị Minh Thu	a09c4181-bf84-488a-a348-5514dc88c4f7	thuntm@ptit.edu.vn	TKT100129	Ngô Thị Minh Thu (TKT100129)		a09c4181-bf84-488a-a348-5514dc88c4f7	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
481da105-427d-472e-acfe-0d8da5e3f15d	482	Trần Minh Thu	edeecceb-be08-4e29-bf68-1213fcd3fc98		TG0100	Trần Minh Thu (TG0100)		edeecceb-be08-4e29-bf68-1213fcd3fc98	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3093208c-e6bc-49db-8e50-b81c3ead6089	374	Võ Thị Thu	e10640be-fafe-48d0-b35a-3a782ae8b9ff	thuvt@ptit.edu.vn	TDV100181	Võ Thị Thu (TDV100181)		e10640be-fafe-48d0-b35a-3a782ae8b9ff	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
de6393d4-6f81-49aa-99c5-3bb304290563	876	Phạm Thu Thuý	0d726752-4646-4dfc-a0dd-dfc69fa0a166		KCB100984	Phạm Thu Thuý (KCB100984)		0d726752-4646-4dfc-a0dd-dfc69fa0a166	t	t	23	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
65190e47-5b03-48e6-84b8-408f70219328	1383	Phạm Thị Phương Thuý	f9694260-0403-4e96-a24c-58da82fa9b02	thuyptp@ptit.edu.vn	KQT201113	Phạm Thị Phương Thuý (KQT201113)		f9694260-0403-4e96-a24c-58da82fa9b02	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6f7bc648-3d35-4bd8-984f-c2b05caa423d	1047	Trần Thị Thanh Thuý	0b0de7f2-8056-435d-9f4a-44b1133b391b	thuyttt1@ptit.edu.vn	KTC100974	Trần Thị Thanh Thuý (KTC100974)		0b0de7f2-8056-435d-9f4a-44b1133b391b	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9e9f224-d1d7-40f8-bbfe-62efd94b93d3	1282	Lê Thị Cẩm Thuần	8d9ce8d1-b038-45d9-9650-decf787061a4	thuanltc@ptit.edu.vn	VPH100184	Lê Thị Cẩm Thuần (VPH100184)		8d9ce8d1-b038-45d9-9650-decf787061a4	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
51ce187d-3b81-4e62-87b0-7b989bdcbae5	112	Trần Đình Thuần	ac8f3316-00ac-4d78-bda7-f60c4578ee71	thuantd@ptit.edu.vn	KVT200491	Trần Đình Thuần (KVT200491)		ac8f3316-00ac-4d78-bda7-f60c4578ee71	t	t	7	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
53ca20be-f8b2-43bc-9a5e-f59b5ff8710b	892	Lê Minh Thuận	04d071ee-9122-4165-b20a-08ed0f181839	thuanlm.tg@ptit.edu.vn	2025.KCB1.15.800	Lê Minh Thuận (2025.KCB1.15.800)		04d071ee-9122-4165-b20a-08ed0f181839	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a42d1dfc-68aa-42e2-94dd-2be5b60d9b24	879	Nguyễn Thuận	9488e893-26ff-4594-9175-a209f6218b2f		TG0113	Nguyễn Thuận (TG0113)		9488e893-26ff-4594-9175-a209f6218b2f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bc23a409-13d4-4a52-b04e-64d5ec1f5ff3	886	Nguyễn Thị Thuận	18223fd9-fd4f-4494-922e-9f38728b168c	thuannt.tg@ptit.edu.vn	TG0111	Nguyễn Thị Thuận (TG0111)		18223fd9-fd4f-4494-922e-9f38728b168c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
209c5b4f-40da-448d-b1ee-8f22709b2e46	1168	Trần Quang Thuận	6eab974c-641b-4f56-9ab6-7e2b8c6075e5	thuantq@ptit.edu.vn	PSV200401	Trần Quang Thuận (PSV200401)		6eab974c-641b-4f56-9ab6-7e2b8c6075e5	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
aca2f523-5383-4579-9a6f-8ebba838949a	663	Đào Nguyên Thuận	8ae4a451-2f63-4bea-bd2c-6249f38c5407		TG0502	Đào Nguyên Thuận (TG0502)		8ae4a451-2f63-4bea-bd2c-6249f38c5407	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d7d76936-222b-48ff-9b6a-ea22fe973755	533	Nguyễn Thị Thuỷ	fa3f3e87-2f8c-415d-b6a0-8fd3b6a994ca	thuynt@ptit.edu.vn	PTC101035	Nguyễn Thị Thuỷ (PTC101035)		fa3f3e87-2f8c-415d-b6a0-8fd3b6a994ca	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cb3d24a6-436b-4d88-a6dc-af223158eef9	589	Đào Thị Thanh Thuỷ	65267e2b-3551-4977-87f9-37f0e79957c1	thuydtt@ptit.edu.vn	PKT100083	Đào Thị Thanh Thuỷ (PKT100083)		65267e2b-3551-4977-87f9-37f0e79957c1	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0c4f09e4-1f85-4040-93e1-c862001252b9	1407	Lê Đình Thành	ThanhLD.B24CC251@stu.ptit.edu.vn	tranglou1003@gmail.com		Lê Đình Thành		9c8d0934-5e5e-4000-beda-f6b5868a97e0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
21692770-2dc4-4f90-8c5f-d718fa7985d7	608	Nguyễn Chí Thành	fd077b7e-8d29-4b40-a0d5-45c96a029e05	thanhnc@ptit.edu.vn	PSV100108	Nguyễn Chí Thành (PSV100108)		fd077b7e-8d29-4b40-a0d5-45c96a029e05	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0595262c-92c8-4288-b5f5-fdfa7839ac82	395	Nguyễn Công Thành	3f435c99-65c4-477b-89f6-bfa03a69487f	ncthanh@ptit.edu.vn	PTH200785	Nguyễn Công Thành (PTH200785)		3f435c99-65c4-477b-89f6-bfa03a69487f	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d8b6986a-76c7-4fa2-8d7d-e76f462e3dcd	148	Nguyễn Hoàng Thành	13c9c0b7-388b-4ac7-94ff-696fc3b1dc42	thanhnh@ptit.edu.vn	KCN200442	Nguyễn Hoàng Thành (KCN200442)		13c9c0b7-388b-4ac7-94ff-696fc3b1dc42	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ffefd18-ed94-4c9e-968e-75abf24531e4	65	Nguyễn Thành	b9973429-4ad9-4402-8828-0e7586d0b441	thanhn@ptit.edu.vn	VKH100924	Nguyễn Thành (VKH100924)		b9973429-4ad9-4402-8828-0e7586d0b441	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e0db2c60-2b26-49b9-acc3-0cbc06210570	1368	Nguyễn Trung Thành	b2c35dc9-ae2d-42c9-8fbe-3e1f9a89294c	vcn100773@ptit.edu.vn	VCN100773	Nguyễn Trung Thành (VCN100773)		b2c35dc9-ae2d-42c9-8fbe-3e1f9a89294c	t	t	3	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02466dd6-aa87-4c55-9305-240c2d5e83c4	268	Nguyễn Trung Thành	8b97db7c-623a-4d06-ad2c-18e961026a13	thanhnt3@ptit.edu.vn	KAT100836	Nguyễn Trung Thành (KAT100836)		8b97db7c-623a-4d06-ad2c-18e961026a13	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7370383c-60f4-4809-8069-9a8edb055481	1113	Nguyễn Trung Thành	d9290890-0677-4329-83f3-75a1a1dafb15		TG0316	Nguyễn Trung Thành (TG0316)		d9290890-0677-4329-83f3-75a1a1dafb15	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3a932417-69b8-47c5-b018-6f5f2783682c	1224	Nguyễn Trung Thành	44b5f1c0-60de-4af6-be8f-6233fa68ce25	thanhnt@ptit.edu.vn	KQT200484	Nguyễn Trung Thành (KQT200484)		44b5f1c0-60de-4af6-be8f-6233fa68ce25	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9970c9d-3124-421f-b2f2-9daa41b3cf32	373	Nguyễn Trân Thành	9f72570d-ba3e-42e9-9a0b-2679de31a50e	thanhnt1@ptit.edu.vn	TDV100668	Nguyễn Trân Thành (TDV100668)		9f72570d-ba3e-42e9-9a0b-2679de31a50e	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9177b217-bdf6-4936-a3b4-d05b3c36cc14	313	Nguyễn Văn Thành	d890a210-8a7b-4890-b100-c049fdefe8ed	thanhnv@ptit.edu.vn	KDT100238	Nguyễn Văn Thành (KDT100238)		d890a210-8a7b-4890-b100-c049fdefe8ed	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9c83d165-ad02-4bb4-ab21-f5518413c566	712	Nguyễn Văn Thành	1507bac3-4e36-4db1-ba7f-93732bbac48f		TG0434	Nguyễn Văn Thành (TG0434)		1507bac3-4e36-4db1-ba7f-93732bbac48f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf6c0e48-c3dd-48a0-9a14-89c2b287ebbd	857	Nguyễn Đức Thành	8da78405-32de-4bc4-9139-413161095f5f	thanhnd@ptit.edu.vn	KDT100940	Nguyễn Đức Thành (KDT100940)		8da78405-32de-4bc4-9139-413161095f5f	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
debae4c2-5204-475e-bd82-bbf3700b3ce3	606	Ngô Xuân Thành	fdc43cb9-62bc-4db7-861b-79a35e2961c0	thanhnx@ptit.edu.vn	PGV100109	Ngô Xuân Thành (PGV100109)		fdc43cb9-62bc-4db7-861b-79a35e2961c0	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eb7c88e4-e952-4cb1-a8fa-bffc9d0d3d12	436	Phan Quang Thành	504c6ea2-bfe0-41f4-b1cd-1197656e1065	thanhpq@ptit.edu.vn	VKH101002	Phan Quang Thành (VKH101002)		504c6ea2-bfe0-41f4-b1cd-1197656e1065	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cd8825b0-d376-47d2-a616-1282b9de7393	70	Phan Quang Thành	thanhpq@ptit.edu.vn	tranglou1003@gmail.com		Phan Quang Thành - thanhpq@ptit.edu.vn		vkh11002	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f608d25-9cfc-4c90-b0f4-6bbb7a423e51	1101	Vũ Tiến Thành	b1d1f081-3c53-4ece-8d2b-75f5736fc83d		TG0294	Vũ Tiến Thành (TG0294)		b1d1f081-3c53-4ece-8d2b-75f5736fc83d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
60c0bb1a-8593-4e53-b500-2f6d7fb9c6e9	1096	Nguyễn Hồng Thái	600a7ae5-a638-4845-83ae-2ec06a277da3	thainh@ptit.edu.vn	KDP100986	Nguyễn Hồng Thái (KDP100986)		600a7ae5-a638-4845-83ae-2ec06a277da3	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
732d76e3-6b51-4517-b5b7-cb7392081f52	1139	Nguyễn Thị Hồng Thái	5725cbc2-3719-4557-bfea-a6f7c8067f7f		TG0246	Nguyễn Thị Hồng Thái (TG0246)		5725cbc2-3719-4557-bfea-a6f7c8067f7f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1b5976bc-88fa-4d22-b25c-e26676ce4549	199	Nguyễn Thị Minh Thái	fe78fc02-fedb-434b-becc-55d1059b0bb0	thaintm@ptit.edu.vn	KDP100720	Nguyễn Thị Minh Thái (KDP100720)		fe78fc02-fedb-434b-becc-55d1059b0bb0	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9f3b596d-a5a1-4e17-a573-3f5e0e389bf7	1393	Phạm Thị Phương Tháo	16c7e570-68a9-4a75-8d12-bd5140ab56cf	thaoptp@ptit.edu.vn	VCN101079	Phạm Thị Phương Tháo (VCN101079)		16c7e570-68a9-4a75-8d12-bd5140ab56cf	t	t	3	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4c1cd75a-aba4-4390-ba92-f33b17b60b69	34	Trần Thị Minh Thìn	ba033962-c006-47e1-a6ad-fc0d0f66c5c6	thinttm@ptit.edu.vn	VKH100525	Trần Thị Minh Thìn (VKH100525)		ba033962-c006-47e1-a6ad-fc0d0f66c5c6	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ff8cd39b-495e-4557-bdca-bc41194e0ec9	870	Lê Ngọc Thúy	befde5cd-4fd8-4f99-b593-f3ed8eb57617		TG0536	Lê Ngọc Thúy (TG0536)		befde5cd-4fd8-4f99-b593-f3ed8eb57617	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fccc804e-029e-4aa3-a906-a7a3796785b7	153	Lê Thanh Thúy	66a7cbb5-e7f3-4b3d-a7d8-3bdd496e997f	thuylet@ptit.edu.vn	KCB200425	Lê Thanh Thúy (KCB200425)		66a7cbb5-e7f3-4b3d-a7d8-3bdd496e997f	t	t	11	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
39a567ae-4e7e-46f6-b04f-11a88e4ba7d4	625	Phạm Thị Phương Thúy	72e8f2de-e26b-44bc-a950-7b8b41f4a015		TG0094	Phạm Thị Phương Thúy (TG0094)		72e8f2de-e26b-44bc-a950-7b8b41f4a015	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c93dc9ab-0a43-48ff-91ff-0b4a3a566726	350	Đỗ Thị Phương Thúy	2f5c901a-08af-4888-b27b-224b0a198b6a	thuydtp@ptit.edu.vn	KCB100220	Đỗ Thị Phương Thúy (KCB100220)		2f5c901a-08af-4888-b27b-224b0a198b6a	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3ea9a9f6-96c0-43f5-8f41-ef1f13dfa855	822	Lê Nhật Thăng	762dc3ea-3eb8-4505-8403-efe363bde983	thangln@ptit.edu.vn	VLD100183	Lê Nhật Thăng (VLD100183)		762dc3ea-3eb8-4505-8403-efe363bde983	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4cc84e18-cefc-4fbe-868b-b6c9f2686a1b	250	Nguyễn Hoàng Thăng	0a97e663-aa6b-4e94-8441-b3c4a423ef69	thangnh@ptit.edu.vn	KVT100707	Nguyễn Hoàng Thăng (KVT100707)		0a97e663-aa6b-4e94-8441-b3c4a423ef69	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2ffb5e67-c3c3-4740-b64a-4519bb34142b	1025	Nguyễn Văn Thăng	3b562e98-ed8d-482e-81ba-983d4958137d	thangnv@ptit.edu.vn	KVT100814	Nguyễn Văn Thăng (KVT100814)		3b562e98-ed8d-482e-81ba-983d4958137d	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b46a4524-747b-4978-9b0e-e2dd9b97608d	1144	Huỳnh Thi Thơ	68a99666-5c96-4e1e-b0ac-bc91fb36b28c	thoht@ptit.edu.vn	PKT200386	Huỳnh Thi Thơ (PKT200386)		68a99666-5c96-4e1e-b0ac-bc91fb36b28c	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0dff5882-c4b8-4477-a451-24091c973f8d	1255	Nguyễn Thị Thơ	b7954aaf-d9bf-4edc-a6c2-d8486f5cfcda	thont@ptit.edu.vn	TDT100897	Nguyễn Thị Thơ (TDT100897)		b7954aaf-d9bf-4edc-a6c2-d8486f5cfcda	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b9a98d9-cef9-4ff5-acc9-20a512b9db21	793	Nguyễn Thị Thơm	5ed13b3a-89bb-4764-8018-60d64a2b1aa7	thomnt.tg@ptit.edu.vn	TG0027	Nguyễn Thị Thơm (TG0027)		5ed13b3a-89bb-4764-8018-60d64a2b1aa7	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dbd9fbf9-6fb5-4be5-af08-7ae69b8c31f6	8	DEMO Văn Thư	DEMOVT	tranglou1003@gmail.com		DEMO Văn Thư - Đơn vị DEMO		demovt	t	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
785478bc-20bd-48f1-acfb-da9382abbb06	1161	Lưu Nguyễn Kỳ Thư	c88866ae-3334-43f0-adef-0e493d7e4c42	thulnk@ptit.edu.vn	PGV200427	Lưu Nguyễn Kỳ Thư (PGV200427)		c88866ae-3334-43f0-adef-0e493d7e4c42	t	t	14	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ba24dbae-7b01-4175-9385-fbc23bde9ba6	1146	Lương Trịnh Minh Thư	1201c7b7-eb8a-4a24-a5c8-992a60ef8ef8	thultm@ptit.edu.vn	KQT200913	Lương Trịnh Minh Thư (KQT200913)		1201c7b7-eb8a-4a24-a5c8-992a60ef8ef8	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
16bc0f5f-6f5b-45e0-9a86-955740fe7c5d	1126	Nguyễn Thị Minh Thư	75767386-726e-4feb-a4a3-bfcccf3923bd		TG0066	Nguyễn Thị Minh Thư (TG0066)		75767386-726e-4feb-a4a3-bfcccf3923bd	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
09a1be7f-166f-4efb-be96-e91e8d91f638	1023	Phạm Anh Thư	b909be0f-35ac-48bc-866e-ecb26ee74129	thupa@ptit.edu.vn	KVT100307	Phạm Anh Thư (KVT100307)		b909be0f-35ac-48bc-866e-ecb26ee74129	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a761fb3d-88ef-4c20-ad16-313fb0d79910	347	Phạm Thị Nguyên Thư	ceef4b04-73b2-4645-a0cb-95c7c9cb80c7	thupn@ptit.edu.vn	KCB100218	Phạm Thị Nguyên Thư (KCB100218)		ceef4b04-73b2-4645-a0cb-95c7c9cb80c7	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ec6e0640-9435-4b7c-9b74-4d103a301bba	275	Vũ Hoài Thư	0ffe71ed-209a-44f3-b923-7260e41e3cd7	thuvh@ptit.edu.vn	KCN100274	Vũ Hoài Thư (KCN100274)		0ffe71ed-209a-44f3-b923-7260e41e3cd7	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
087de2d0-41c0-41ef-a79c-474c472bf648	1145	Đoàn Anh Thư	e0279324-25ae-40dd-b294-e85c9e938fe7	thuda@ptit.edu.vn	PKT200387	Đoàn Anh Thư (PKT200387)		e0279324-25ae-40dd-b294-e85c9e938fe7	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe36ee1e-ff6b-40ce-bba1-47d8d3a9c9c3	146	Huỳnh Trọng Thưa	8b8dc4af-f78b-4e2e-ac79-c00fe2cb97e5	thuaht@ptit.edu.vn	KCN200443	Huỳnh Trọng Thưa (KCN200443)		8b8dc4af-f78b-4e2e-ac79-c00fe2cb97e5	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
789bc2f2-5cb4-457d-b962-35e70788cbb3	45	Vũ Văn Thương	ece7b968-ad90-43be-b14f-a3b2e9afe205	thuongvv@ptit.edu.vn	TQT100882	Vũ Văn Thương (TQT100882)		ece7b968-ad90-43be-b14f-a3b2e9afe205	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c1431259-56d6-45d6-abcc-2e68c76977b8	508	Đỗ Thị Huyền Thương	4bc8b1a6-c828-4e71-8533-8304ae188aba	thuongdth@ptit.edu.vn	VCN100838	Đỗ Thị Huyền Thương (VCN100838)		4bc8b1a6-c828-4e71-8533-8304ae188aba	t	t	57	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5bcc2299-07a6-4b7d-9c6c-7434068ba4f1	1186	Dương Thanh Thảo	ca518671-71c8-4e53-88e4-37fcd96612c4	thaodt@ptit.edu.vn	KCN200750	Dương Thanh Thảo (KCN200750)		ca518671-71c8-4e53-88e4-37fcd96612c4	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
59f926f7-fa9e-4aff-b9d9-b73b6d788acc	1172	Huỳnh Thị Phương Thảo	52d2f3bf-09ce-4a66-abf5-5881bd450ade	thaohtp@ptit.edu.vn	TKT200828	Huỳnh Thị Phương Thảo (TKT200828)		52d2f3bf-09ce-4a66-abf5-5881bd450ade	t	t	12	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f35e6be-c4c1-484f-a522-b0fde417f453	184	Nguyễn Phương Thảo	650009b5-74e6-4972-8c27-233ebe4a8e37	thaonp@ptit.edu.vn	KDP101034	Nguyễn Phương Thảo (KDP101034)		650009b5-74e6-4972-8c27-233ebe4a8e37	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8aa99ee2-7fb7-4968-a9bc-c62afb0a02e0	308	Nguyễn Thị Hương Thảo	457ac3a5-3b80-49cf-b83a-c09df48b8043	thaonth@ptit.edu.vn	KDT100239	Nguyễn Thị Hương Thảo (KDT100239)		457ac3a5-3b80-49cf-b83a-c09df48b8043	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
166f0668-1934-4b90-9355-02c0c5909629	656	Nguyễn Thị Phương Thảo	c1c16b8e-3930-4951-9685-24876dc11c75	thaontp.tg@ptit.edu.vn	TG0592	Nguyễn Thị Phương Thảo (TG0592)		c1c16b8e-3930-4951-9685-24876dc11c75	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ed69d990-78e3-4341-84da-c8cfd2db90b6	1152	Nguyễn Thị Phương Thảo	64c39825-9e0a-444d-8b7e-ec7b0f9cba19	thaontp@ptit.edu.vn	PDT200394	Nguyễn Thị Phương Thảo (PDT200394)		64c39825-9e0a-444d-8b7e-ec7b0f9cba19	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9e892696-b294-48fc-8c78-ef3c759f4e82	454	Nguyễn Thị Thu Thảo	65b8ebb9-28f7-4bd0-b64c-34dabc50de0d	thaontt@ptit.edu.vn	VKT100925	Nguyễn Thị Thu Thảo (VKT100925)		65b8ebb9-28f7-4bd0-b64c-34dabc50de0d	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4edc7fb3-f596-4e85-bf25-f03c9799ef9d	1459	Phạm Thị Phương Thảo	thiphuongthao.pham@aisoft.com.vn	tranglou1003@gmail.com		Phạm Thị Phương Thảo			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
12a960ca-fc79-4ec5-b500-9568bcc31a3c	1147	Phạm Thị Thanh Thảo	a3e8d31d-8bec-40e6-ad40-9f1728421ad7	thaoptt@ptit.edu.vn	PKT200385	Phạm Thị Thanh Thảo (PKT200385)		a3e8d31d-8bec-40e6-ad40-9f1728421ad7	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
45ec52d6-1d40-4681-bee0-555d13e5edd6	565	Triệu Phương Thảo	c3d77a50-c0ac-4877-8192-b0443cb9bcac	thaotp@ptit.edu.vn	PQL100069	Triệu Phương Thảo (PQL100069)		c3d77a50-c0ac-4877-8192-b0443cb9bcac	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
203ac056-9135-434f-815f-faed28a1c938	340	Trần Phương Thảo	c35503a9-3801-46e6-a13c-45cf5c67a24c	thaotp1@ptit.edu.vn	KCB100904	Trần Phương Thảo (KCB100904)		c35503a9-3801-46e6-a13c-45cf5c67a24c	t	t	231	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
579ac99b-d11b-41c1-9692-c1c917cc272f	338	Tô Thị Thảo	1b9f24f7-23c3-4d32-b1e4-506090260c38	thaott@ptit.edu.vn	KCB100215	Tô Thị Thảo (KCB100215)		1b9f24f7-23c3-4d32-b1e4-506090260c38	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a7423c8-836e-47ff-9a27-ebb0f5be361a	875	Tô Thị Thảo	ce660ca6-37a8-41b1-b284-024af0593f29		TG0273	Tô Thị Thảo (TG0273)		ce660ca6-37a8-41b1-b284-024af0593f29	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
679c2c68-6b2d-43f4-97ba-14cc177b8026	394	Đinh Thị Hương Thảo	222c8336-19b2-4117-8edd-3735916fb80c	thaodth@ptit.edu.vn	VCN100955	Đinh Thị Hương Thảo (VCN100955)		222c8336-19b2-4117-8edd-3735916fb80c	t	t	243	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc1953b2-003d-4bba-a5b6-54d9834a7d58	993	Lê Huy Thập	7ef38a62-9d52-46cc-830d-d39451352ed0		TG0096	Lê Huy Thập (TG0096)		7ef38a62-9d52-46cc-830d-d39451352ed0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e6dcc495-33bb-4870-bee7-1988abf07104	212	Trần Thị Thập	b5fa5ce6-533b-4f04-b991-f88e1fc6e7a0	thaptt@ptit.edu.vn	KQT100327	Trần Thị Thập (KQT100327)		b5fa5ce6-533b-4f04-b991-f88e1fc6e7a0	t	t	19	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a1b80172-b0ed-43c9-8785-74bbfaca69bd	587	Nguyễn Thị Hồng Thắm	c36d8bfc-13a4-42e7-a5c7-c92f2d048505	thamnth@ptit.edu.vn	PKT101026	Nguyễn Thị Hồng Thắm (PKT101026)		c36d8bfc-13a4-42e7-a5c7-c92f2d048505	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d3481df4-96ed-4a78-a0d1-e34eff5f85ba	567	Phạm Thị Hồng Thắm	8c1212fc-a212-4bd7-8c08-e064627155ef	thampth@ptit.edu.vn	PQL100075	Phạm Thị Hồng Thắm (PQL100075)		8c1212fc-a212-4bd7-8c08-e064627155ef	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5e31a402-6cf1-4675-90ca-81e6cfdf8cc1	747	Bùi Sỹ Thắng	30cd16d8-57bb-4228-bde2-e1fe4cf05c35	thangbs.tg@ptit.edu.vn	TG0496	Bùi Sỹ Thắng (TG0496)		30cd16d8-57bb-4228-bde2-e1fe4cf05c35	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8b4bee65-5f48-4d2f-9c97-1565193d3a80	518	Cao Minh Thắng	2d7a2cff-1ec2-48e7-82d2-8d51f04d9775	thangcm@ptit.edu.vn	VCN100597	Cao Minh Thắng (VCN100597)		2d7a2cff-1ec2-48e7-82d2-8d51f04d9775	t	t	3	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
08fe729c-deea-443e-a0f4-12763bab29de	670	Lê Quang Thắng	00afbd56-4da2-4298-892e-3439ae612358		TG0532	Lê Quang Thắng (TG0532)		00afbd56-4da2-4298-892e-3439ae612358	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
60778116-828f-492a-9f33-4b1dc7b582de	578	Lê Quốc Thắng	7753dd45-2195-4008-a382-cedbab8180e0	thanglq2@ptit.edu.vn	PKT100809	Lê Quốc Thắng (PKT100809)		7753dd45-2195-4008-a382-cedbab8180e0	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e6f2fb68-1d92-4fba-92fb-55c44927bd7f	1157	Nguyễn Tấn Thắng	8643bd28-6fe0-4ccd-a629-eda305960831	ntthang@ptit.edu.vn	PDT200951	Nguyễn Tấn Thắng (PDT200951)		8643bd28-6fe0-4ccd-a629-eda305960831	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
49290a57-e008-44a5-9c7e-30c61f403de6	274	Nguyễn Tất Thắng	1acd5077-bbfd-480f-bc92-4fd931140ce3	thangnt@ptit.edu.vn	KCN100273	Nguyễn Tất Thắng (KCN100273)		1acd5077-bbfd-480f-bc92-4fd931140ce3	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3e696276-8032-4b94-af9b-6bd6dde203dc	849	Nguyễn Văn Thắng	d32c7f56-f5a9-4f5d-9065-4b10cc10a5dd	thangnv1@ptit.edu.vn	KDT101067	Nguyễn Văn Thắng (KDT101067)		d32c7f56-f5a9-4f5d-9065-4b10cc10a5dd	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c53e8eff-50f5-4f18-86df-e1c2a2222a8c	475	Đoàn Quang Thắng	76a2268d-fc28-434d-8d48-150a90eba030	thangdq@ptit.edu.vn	VKT100770	Đoàn Quang Thắng (VKT100770)		76a2268d-fc28-434d-8d48-150a90eba030	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b04b3772-83b8-4519-bc0b-a9685bd8bf28	523	Quản Trọng Thế	c851076f-82fb-4205-8eb3-dbda30f0e278	theqt@ptit.edu.vn	KAT100994	Quản Trọng Thế (KAT100994)		c851076f-82fb-4205-8eb3-dbda30f0e278	t	t	219	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5a231eed-29d4-4cea-9259-b13be8b984cb	603	Nguyễn Vũ Thịnh	555bf001-9ec9-4f8c-97d9-bdc87f18181f	thinhnv@ptit.edu.vn	PKH100999	Nguyễn Vũ Thịnh (PKH100999)		555bf001-9ec9-4f8c-97d9-bdc87f18181f	t	t	31	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1e380eb4-98eb-4eeb-9440-6e2d784d9c11	1357	Nguyễn Đức Thịnh	73ae7eb5-1dc1-4a2b-9f19-4bfc6f60ca8b	thinhnd@ptithcm.edu.vn	KCN200927	Nguyễn Đức Thịnh (KCN200927)		73ae7eb5-1dc1-4a2b-9f19-4bfc6f60ca8b	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
322276ad-bae5-43ef-a00a-58a56ea1f61b	328	Nguyễn Đức Thịnh	9199f242-9d4f-436a-b35b-907ba1eff646	thinhnd@ptit.edu.vn	KCB100217	Nguyễn Đức Thịnh (KCB100217)		9199f242-9d4f-436a-b35b-907ba1eff646	t	t	228	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
93ff99b9-63f5-45b6-9fae-2ff73d6d503e	447	Lê Thọ	0afaf29c-cd19-45ba-846e-6839b507588a	letho@ptit.edu.vn	VKT100795	Lê Thọ (VKT100795)		0afaf29c-cd19-45ba-846e-6839b507588a	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b959106e-a873-4b1a-9f8f-6ab0445e7617	1005	Trần Văn Thọ	5bd7a922-3ae0-4a1f-9a1e-b612c0fd7ccc		TG0088	Trần Văn Thọ (TG0088)		5bd7a922-3ae0-4a1f-9a1e-b612c0fd7ccc	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b8b5e569-cd49-488c-9889-bf080cef544a	1320	Đỗ Hữu Thọ	47d6ce78-c162-4ee6-b7b7-ea894c9eccf2	thodh@ptit.edu.vn	TDV100888	Đỗ Hữu Thọ (TDV100888)		47d6ce78-c162-4ee6-b7b7-ea894c9eccf2	t	t	235	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2d7dcf24-c570-4aab-ab37-bbad1ca16d85	295	Vũ Văn Thỏa	b2786894-5a49-42dd-b92e-dc0641a2b7fe	thoavv@ptit.edu.vn	KCN100284	Vũ Văn Thỏa (KCN100284)		b2786894-5a49-42dd-b92e-dc0641a2b7fe	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a67a56d3-46be-4760-bada-da0a057c1e83	1405	Nguyễn Văn Thống	964e5029-8b3c-4a7e-b785-792b8b9974b3	thongnv@ptit.edu.vn	PTH201084	Nguyễn Văn Thống (PTH201084)		964e5029-8b3c-4a7e-b785-792b8b9974b3	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cb884b08-7494-4913-aa19-779725ca2768	246	Lê Thanh Thủy	d83c2114-e371-4048-a84a-55a69ab0b609	thuylt@ptit.edu.vn	KVT100308	Lê Thanh Thủy (KVT100308)		d83c2114-e371-4048-a84a-55a69ab0b609	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c40bb3f7-342c-4177-9b61-e470c50cc567	1099	Lê Thị Thanh Thủy	ab67c62d-f5d6-4de7-936d-bb7aa3b51ec7	thuyltt@ptit.edu.vn	KDP100721	Lê Thị Thanh Thủy (KDP100721)		ab67c62d-f5d6-4de7-936d-bb7aa3b51ec7	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f1f49dd3-c76d-4122-8f16-a055a8923195	777	Mai Thanh Thủy	b54fca52-9adc-4098-b487-67f241fbec20		TG0597	Mai Thanh Thủy (TG0597)		b54fca52-9adc-4098-b487-67f241fbec20	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0ce1f283-1cb4-4503-8571-f09b3267f7ac	1389	Nguyễn Hồng Thủy	428121ce-8e59-4b9e-b976-3a7553934841	thuynh@ptit.edu.vn	KSD101122	Nguyễn Hồng Thủy (KSD101122)		428121ce-8e59-4b9e-b976-3a7553934841	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8b1cb0f4-7221-4c91-a366-60462fa1b25f	930	Nguyễn Thu Thủy	e0ecf910-4a42-476a-a696-eae836f38c69	tranglou1003@gmail.com	TG0272	Nguyễn Thu Thủy (TG0272)		e0ecf910-4a42-476a-a696-eae836f38c69	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
28729840-29e9-4060-8cf3-9591828bd650	281	Nguyễn Thị Thanh Thủy	103c50da-b7fd-4a52-bf9a-197eee436522	thuyntt@ptit.edu.vn	KCN100275	Nguyễn Thị Thanh Thủy (KCN100275)		103c50da-b7fd-4a52-bf9a-197eee436522	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
18a62e34-fec8-4421-b2be-f3426399c94b	96	Nguyễn Thị Thu Thủy	d30f1ffd-15fd-4cd6-88c3-45f025826297	nttthuy@ptit.edu.vn	KVT200504	Nguyễn Thị Thu Thủy (KVT200504)		d30f1ffd-15fd-4cd6-88c3-45f025826297	t	t	7	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
addf9abb-4393-4a66-b922-caf9aaaf0915	715	Phạm Thanh Thủy	79245b98-be14-4efa-bac0-73f0ad635422		TG0524	Phạm Thanh Thủy (TG0524)		79245b98-be14-4efa-bac0-73f0ad635422	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1234c179-ce7e-4208-af3c-4e4930844cfc	514	Phạm Thị Thanh Thủy	28da5f99-ca46-47b0-a65a-10a93bd34eef	thuyptt@ptit.edu.vn	VCN100618	Phạm Thị Thanh Thủy (VCN100618)		28da5f99-ca46-47b0-a65a-10a93bd34eef	t	t	55	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5d90f9de-5e1c-463a-bb6e-1b3f70675da1	311	Trần Thị Thanh Thủy	4eb0ea4e-b15c-4d15-9363-0a8fe6955f48	thuyttt@ptit.edu.vn	KDT100309	Trần Thị Thanh Thủy (KDT100309)		4eb0ea4e-b15c-4d15-9363-0a8fe6955f48	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
74321879-9469-4b8c-8bc9-40c4bfa80d86	682	Vũ Bích Thủy	eae85bd6-8f3f-4b9b-b424-84f769745c4b		TG0414	Vũ Bích Thủy (TG0414)		eae85bd6-8f3f-4b9b-b424-84f769745c4b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bf42fec7-ff56-4af4-9290-dc912436c26b	720	Vũ Thị Bích Thủy	cbf3591f-c436-4741-8db2-a0760fca4ffb	thuyvtb.tg@ptit.edu.vn	TG0410	Vũ Thị Bích Thủy (TG0410)		cbf3591f-c436-4741-8db2-a0760fca4ffb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
10cdb56a-1029-4b53-88ff-d971ae583e43	773	Phạm Thanh Thủy2	c2060752-987c-4f37-815d-df4257c9400e		TG0514C	Phạm Thanh Thủy2 (TG0514C)		c2060752-987c-4f37-815d-df4257c9400e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ff4a712f-2b78-4e64-b066-64147d0f1c4d	1177	Nguyễn Thị Triều Tiên	82fa8d8b-b004-4e77-a3da-5f4f3ae8a284	tienntt@ptit.edu.vn	KCB201066	Nguyễn Thị Triều Tiên (KCB201066)		82fa8d8b-b004-4e77-a3da-5f4f3ae8a284	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
abd4b0d5-8d68-498f-9c34-6319d4a58f09	750	Lê Anh Tiến	011721a7-e309-4c75-935c-6cc5f5d533eb		TG0377	Lê Anh Tiến (TG0377)		011721a7-e309-4c75-935c-6cc5f5d533eb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b37047f0-301a-4ed5-8be9-af24ebf49db4	1234	Mạc Văn Tiến	8179832b-0369-4dd1-a8c8-839ebbdd567a	tienmv@ptit.edu.vn	VKT100856	Mạc Văn Tiến (VKT100856)		8179832b-0369-4dd1-a8c8-839ebbdd567a	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
efd8e972-c525-4148-98c4-224e2c123600	868	Nguyễn Hữu Tiến	02a01fef-4cca-4aff-a0c8-8f53750eab09		TG0213	Nguyễn Hữu Tiến (TG0213)		02a01fef-4cca-4aff-a0c8-8f53750eab09	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
99d515c6-d847-41e0-97d6-665c57e9a4f4	293	Nguyễn Văn Tiến	17721210-61a4-4fc6-9f66-18509d33d797	tiennv@ptit.edu.vn	KCN100271	Nguyễn Văn Tiến (KCN100271)		17721210-61a4-4fc6-9f66-18509d33d797	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
139d95e4-37c8-41f7-914e-e45c9874faa2	1011	Trần Ngọc Tiến	54863a96-5c5c-44dc-b487-0b1e3a531b1a		TG0087	Trần Ngọc Tiến (TG0087)		54863a96-5c5c-44dc-b487-0b1e3a531b1a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f45e359-d8bb-437e-b532-b75286bef6fc	186	Vũ Hữu Tiến	d72ca707-9bfd-4987-bc54-6745773c4f4f	tienvh@ptit.edu.vn	KDP100343	Vũ Hữu Tiến (KDP100343)		d72ca707-9bfd-4987-bc54-6745773c4f4f	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
81f96d60-fbbc-46a7-89dd-e9d5d3021f13	457	Vũ Việt Tiến	40c1f4e1-047e-48f4-b92b-6e787445b149	tienvu@ptit.edu.vn	VKT100582	Vũ Việt Tiến (VKT100582)		40c1f4e1-047e-48f4-b92b-6e787445b149	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0eee7ba0-b41e-4fb9-85d2-1c5bc66cb243	306	Lê Đức Toàn	7a2f8829-13a9-4087-ac39-a5248914b7bc	toanld@ptit.edu.vn	KDT100237	Lê Đức Toàn (KDT100237)		7a2f8829-13a9-4087-ac39-a5248914b7bc	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f01183f-fdb8-43ef-b30d-745d3638d02e	108	Nguyễn Khánh Toàn	d04488a7-12b9-4839-bceb-d94ebb2bfbed	toannk@ptit.edu.vn	KVT200501	Nguyễn Khánh Toàn (KVT200501)		d04488a7-12b9-4839-bceb-d94ebb2bfbed	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1daff2dd-2047-483c-8474-7997edac4295	497	Nguyễn Thanh Toàn	54d8501c-0c77-427b-ac8c-dd395c4fa21f	toannt@ptit.edu.vn	VCN100623	Nguyễn Thanh Toàn (VCN100623)		54d8501c-0c77-427b-ac8c-dd395c4fa21f	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a3a4f3b-e092-4df7-ac50-9dbb96369739	388	Nguyễn Quang Toán	a761c57b-0997-4b3f-82da-2610b4b1ee83	toannq@ptit.edu.vn	VPH100176	Nguyễn Quang Toán (VPH100176)		a761c57b-0997-4b3f-82da-2610b4b1ee83	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a721f37b-c8f3-42d3-9fa7-15de012d274b	371	Nguyễn Văn Toản	69f65c61-b59a-43a1-a234-cbd54ac5eb1e	nvtoan@ptit.edu.vn	TDV100175	Nguyễn Văn Toản (TDV100175)		69f65c61-b59a-43a1-a234-cbd54ac5eb1e	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f4551e30-ce31-41d8-941d-f01e2c9573ab	105	Phan Thanh Toản	babba88b-d68e-4c3f-b374-1b840aefde93	toanpt@ptit.edu.vn	KVT200502	Phan Thanh Toản (KVT200502)		babba88b-d68e-4c3f-b374-1b840aefde93	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1caa99e5-a795-408b-8dd6-d2d5d9676165	174	Trần Quốc Toản	9887893f-688e-457f-8bba-8be2054b26ed	toantq@ptit.edu.vn	KDP100719	Trần Quốc Toản (KDP100719)		9887893f-688e-457f-8bba-8be2054b26ed	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
862f78bf-d6a1-450d-a302-c58b7bf03db9	1333	Văn thư Học viện BCVT - Cơ sở Tp.HCM	vanthuhocvienbcvthcm	tranglou1003@gmail.com	vanthuhocvienbcvthcm	Văn thư Học viện BCVT - Cơ sở Tp.HCM (vanthuhocvienbcvthcm) - vanthuhocvienbcvthcm			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
234a6d91-47e2-4f5a-bae0-2b3e191c2520	1098	Bùi Cẩm Trang	4521ae10-f0dd-45fb-8475-9f79e2eb25bb		KDP100820	Bùi Cẩm Trang (KDP100820)		4521ae10-f0dd-45fb-8475-9f79e2eb25bb	t	t	18	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f5531734-2e31-4a8c-92ae-65feef67190c	1307	Bùi Quỳnh Trang	abab35f7-b148-4b7f-9e6f-341188693550		TQT101038	Bùi Quỳnh Trang (TQT101038)		abab35f7-b148-4b7f-9e6f-341188693550	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
379fdaf8-8150-43b6-808b-57eec75c565e	633	Dư Thị Thu Trang	54a62e7f-9fa6-4b6a-b892-e099513cd97e		TG0566	Dư Thị Thu Trang (TG0566)		54a62e7f-9fa6-4b6a-b892-e099513cd97e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1edbdda2-404c-4559-afe7-c6dee32135cc	393	Dương Huyền Trang	9f67744b-75b3-4460-9b3a-c0bb8765716b	trangdh@ptit.edu.vn	TDV100157	Dương Huyền Trang (TDV100157)		9f67744b-75b3-4460-9b3a-c0bb8765716b	t	t	236	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a9206f7f-4059-4360-ac7b-4f3ebb5eb0a8	1235	Giáp Thu Trang	b7c62c8b-856f-4e3e-8eb9-5f83b625d170	tranggt@ptit.edu.vn	VKT101072	Giáp Thu Trang (VKT101072)		b7c62c8b-856f-4e3e-8eb9-5f83b625d170	t	t	65	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dc77c90b-f818-4580-8ee0-b979a93bce69	804	Hà Thị Minh Trang	0afffa98-1b62-4637-bd2e-df81baf349c9	tranghtm@ptit.edu.vn	TKT100130	Hà Thị Minh Trang (TKT100130)		0afffa98-1b62-4637-bd2e-df81baf349c9	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9a5bbe4f-a2e5-4f01-8ba2-35a036f9a8fe	517	Lê Huyền Trang	14405267-d7bc-4673-aed6-092d86503e28	tranglh@ptit.edu.vn	VCN100632	Lê Huyền Trang (VCN100632)		14405267-d7bc-4673-aed6-092d86503e28	t	t	55	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
08fc0670-2507-4c8b-a1b2-afac24a42670	689	Lê Huyền Trang	3c46ed89-fe96-4d31-afe4-898f84060a46		TG0443	Lê Huyền Trang (TG0443)		3c46ed89-fe96-4d31-afe4-898f84060a46	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dc6bc82a-56bb-4880-b0f8-aedd40739fce	733	Lò Mai Trang	8275da53-f887-46eb-ae83-0835a7c67932		TG0500	Lò Mai Trang (TG0500)		8275da53-f887-46eb-ae83-0835a7c67932	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
353af2f9-5749-4b0b-91a7-626d7459bbe8	1062	Nguyễn Hồng Trang	7266e35b-13b3-40ef-a010-cfa1aa4dfd1a		TG0014	Nguyễn Hồng Trang (TG0014)		7266e35b-13b3-40ef-a010-cfa1aa4dfd1a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ef253407-d658-41ed-8172-87af02f8d506	128	Nguyễn Lệ Nhã Trang	3605891d-111e-4013-a4c2-1c8b40b42bba	trangnln@ptit.edu.vn	KCN200447	Nguyễn Lệ Nhã Trang (KCN200447)		3605891d-111e-4013-a4c2-1c8b40b42bba	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8045e3a1-7c72-4fea-b8bc-f6137424ff19	903	Nguyễn Minh Trang	a762c21b-acde-47da-9813-f5e9fd04b574	trangnm.tg@ptit.edu.vn	2025.KCB1.15.802	Nguyễn Minh Trang (2025.KCB1.15.802)		a762c21b-acde-47da-9813-f5e9fd04b574	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b830ebff-0eb0-4885-b9b1-910dfe116b5f	826	Nguyễn Thu Trang	14e7a6f6-00d1-42a3-87a2-18755ffdb397	nttrang1@ptit.edu.vn	KDP100806	Nguyễn Thu Trang (KDP100806)		14e7a6f6-00d1-42a3-87a2-18755ffdb397	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5d8cc00b-a684-40d3-8c98-4d8e6318c143	271	Nguyễn Thị Mai Trang	daa3beb1-6750-44ff-9dae-8098fc16915f	trangntm@ptit.edu.vn	KCN100835	Nguyễn Thị Mai Trang (KCN100835)		daa3beb1-6750-44ff-9dae-8098fc16915f	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f0c1488-327d-434e-9dd5-5c6b132e90d7	80	Nguyễn Thị Quỳnh Trang	TrangNTQ.B23CC160@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Thị Quỳnh Trang		075c0cdf-212a-4911-b41b-7d04c243de6d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0e326933-3e27-4772-a4aa-3339f8b56388	547	Nguyễn Thị Thu Trang	823c14b7-eab8-43d0-a375-a35d75b88120	nttrang@ptit.edu.vn	PSV100056	Nguyễn Thị Thu Trang (PSV100056)		823c14b7-eab8-43d0-a375-a35d75b88120	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2198ba0b-1f7c-48f5-9479-60429769bf3b	1385	Nguyễn Thị Trang	9f3ab7a1-1571-40be-8f92-373c5496d6ea	trangnt2@ptit.edu.vn	KCB101115	Nguyễn Thị Trang (KCB101115)		9f3ab7a1-1571-40be-8f92-373c5496d6ea	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
de0c7b05-affc-4405-9f8c-ed0f2fbcd793	710	Nguyễn Thị Vân Trang	7723c277-66b1-4225-b76e-db888f322b31		TG0384	Nguyễn Thị Vân Trang (TG0384)		7723c277-66b1-4225-b76e-db888f322b31	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2b2e1315-947c-46a0-8a00-97f81407cbfe	247	Ngô Thị Thu Trang	b18a28d7-fe40-4a2c-ae5c-045dfd195bcd	trangntt1@ptit.edu.vn	KVT100311	Ngô Thị Thu Trang (KVT100311)		b18a28d7-fe40-4a2c-ae5c-045dfd195bcd	t	t	213	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
df9ffa62-4e53-4882-8cee-492bca47a904	530	Ninh Thị Thu Trang	85425338-c6ca-4c82-bd1a-4f13bf338520	trangntt2@ptit.edu.vn	KAT100695	Ninh Thị Thu Trang (KAT100695)		85425338-c6ca-4c82-bd1a-4f13bf338520	t	t	219	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b4bba921-b9a2-4a53-99a8-5764ef1496b1	880	Nông Thu Trang	08c0dc55-b0f2-4b21-9245-43ad96d4813c	trangnt.tg@ptit.edu.vn	TG0271	Nông Thu Trang (TG0271)		08c0dc55-b0f2-4b21-9245-43ad96d4813c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
da54d788-3500-4c76-a881-2560110f011d	900	Phạm Quỳnh Trang	1eb0abb8-ecec-4d80-83f4-53618cc1fc14		TG0236	Phạm Quỳnh Trang (TG0236)		1eb0abb8-ecec-4d80-83f4-53618cc1fc14	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7d85250c-e41a-4f4a-9a51-961b02c432c3	452	Trương Đình Trang	4e0954da-5266-41bb-9486-ce1140f87c89	trangtd@ptit.edu.vn	VKT100768	Trương Đình Trang (VKT100768)		4e0954da-5266-41bb-9486-ce1140f87c89	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
991d9085-714c-4771-8f5d-d57f3fa8264e	692	Trần Thị Huyền Trang	f8e8daad-5f83-45e8-a748-f69012421716		TG0441	Trần Thị Huyền Trang (TG0441)		f8e8daad-5f83-45e8-a748-f69012421716	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d16ae911-088e-41e7-89cc-08ce02065302	786	Trần Thị Huyền Trang	2a98e4f5-4554-4f96-888c-79ca4cb05a80		TG0405	Trần Thị Huyền Trang (TG0405)		2a98e4f5-4554-4f96-888c-79ca4cb05a80	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
10b440ba-934c-4222-8783-1c714330961a	906	Trịnh Thị Trang	3d62a50c-24a7-4dfc-a86c-5823ce1bdee2	trangtt1.tg@ptit.edu.vn	TG0590	Trịnh Thị Trang (TG0590)		3d62a50c-24a7-4dfc-a86c-5823ce1bdee2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9ffc690a-4134-4b34-bbd5-58be2f955e97	791	Trịnh Thị Trang	785a8da4-097f-4bd7-bd52-ef5303e018a2	trangtt.tg@ptit.edu.vn	TG0126	Trịnh Thị Trang (TG0126)		785a8da4-097f-4bd7-bd52-ef5303e018a2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e26be88e-63fb-4e17-abe7-efd05bc2ba2e	1430	Đặng Thùy Trang	thuytrang.dang@aisoft.com.vn	tranglou1003@gmail.com		Đặng Thùy Trang - thuytrang.dang@aisoft.com.vn			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0cad95aa-42c1-4f27-809e-bf76a0f90721	161	Dương Trần Thủy Trinh	522df957-6253-4903-99ef-058992659f38	trinhdtt@ptit.edu.vn	KCB200422	Dương Trần Thủy Trinh (KCB200422)		522df957-6253-4903-99ef-058992659f38	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c2beba85-a01d-4bda-8ef7-aad062b07f3b	131	Huỳnh Thị Tuyết Trinh	c63ef764-cf0b-43c2-8479-c2c5ccc63451	trinhhtt@ptit.edu.vn	KCN200444	Huỳnh Thị Tuyết Trinh (KCN200444)		c63ef764-cf0b-43c2-8479-c2c5ccc63451	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2138e54b-936d-4840-bd5b-141e3bb71ce2	1093	Lê Đình Trinh	54227b03-8e28-4fce-918c-a53b28ab5dd7	trinhld@ptit.edu.vn	KDP100967	Lê Đình Trinh (KDP100967)		54227b03-8e28-4fce-918c-a53b28ab5dd7	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2de777be-62e4-4174-9f77-901df4eddb73	1037	Nguyễn Chiến Trinh	d9479470-c20b-4347-92c9-0802fcf3ac52	trinhnc@ptit.edu.vn	KVT100287	Nguyễn Chiến Trinh (KVT100287)		d9479470-c20b-4347-92c9-0802fcf3ac52	t	t	21	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a64079fa-5769-43c6-8e14-fc92b7239a2a	327	Nguyễn Phú Trung	f84f302f-4f56-41e5-a92c-5f93e50be391	trungnp@ptit.edu.vn	KCB100221	Nguyễn Phú Trung (KCB100221)		f84f302f-4f56-41e5-a92c-5f93e50be391	t	t	228	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c33d94ca-bacb-412e-8b88-a02131083e8e	677	Nguyễn  Phú Trung	44846046-b9fd-44ee-af6d-f6887ee597db		TG0412	Nguyễn  Phú Trung (TG0412)		44846046-b9fd-44ee-af6d-f6887ee597db	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5b45fe1b-df67-4aa3-9627-2bb7cb64ee52	17	Nguyễn Huy Trung	9306d2eb-bd30-4c7d-b394-1de161640868	trungnh@ptit.edu.vn	VKH101055	Nguyễn Huy Trung (VKH101055)		9306d2eb-bd30-4c7d-b394-1de161640868	t	t	70	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7829a8bb-9477-402b-8fd6-c22eb30e7dcb	696	Nguyễn Huy Trung	670a0e805a16811501b9f7f3	tranglou1003@gmail.com	tg0389	Nguyễn Huy Trung (tg0389)		1a5156b4-4e8f-442a-aa0f-4c6e0aae798f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
29c56621-f925-459f-9a2c-e126d97978a7	1031	Nguyễn Thành Trung	d2f06f15-0261-4e4b-8e12-716b60d42ebf	trungnt@ptit.edu.vn	KVT100917	Nguyễn Thành Trung (KVT100917)		d2f06f15-0261-4e4b-8e12-716b60d42ebf	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
679c3193-89c7-4c1a-aaf2-fd4d2ed6a775	883	Trần Nam Trung	07a19d97-450b-403b-8af8-85802a3198a9		TG0335	Trần Nam Trung (TG0335)		07a19d97-450b-403b-8af8-85802a3198a9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ba08d4a-d389-4208-b0fe-1e15752e76e6	403	Võ Văn Trung	d9eb2381-e8cd-4867-8948-ad3f209d05a9	trungvv@ptit.edu.vn	PTH200380	Võ Văn Trung (PTH200380)		d9eb2381-e8cd-4867-8948-ad3f209d05a9	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b1b636ac-e250-44a8-9e73-8bef26cbca0e	263	Nguyễn Thanh Trà	1c0f65c5-b224-4745-89dc-013871c345f1	trant@ptit.edu.vn	KVT100310	Nguyễn Thanh Trà (KVT100310)		1c0f65c5-b224-4745-89dc-013871c345f1	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2f3f490-b251-4501-a300-3178e248598f	401	Nguyễn Thị Hương Trà	45bcfece-3a8c-4f89-baff-83b91ca34b49	tranth@ptit.edu.vn	PTH200373	Nguyễn Thị Hương Trà (PTH200373)		45bcfece-3a8c-4f89-baff-83b91ca34b49	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64b45e6b-c535-4412-be29-e131cd495446	788	Nguyễn Thị Thu Trà	c2642a83-4837-42a7-add9-23061070a438		TG0582	Nguyễn Thị Thu Trà (TG0582)		c2642a83-4837-42a7-add9-23061070a438	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b3a284ac-40c8-4928-9ea2-b3ce5d95da16	1221	Trần Thanh Trà	2f5c754a-4139-46fd-81c9-4f2708f64217	tttra@ptit.edu.vn	KQT200486	Trần Thanh Trà (KQT200486)		2f5c754a-4139-46fd-81c9-4f2708f64217	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fa734bc8-5b5b-43d7-8c75-1a8d6ed176a5	1263	Trần Thị Trà	0ca713dc-35ad-40d8-a6d1-07f4d9ed9e41	tratt@ptit.edu.vn	TDT100644	Trần Thị Trà (TDT100644)		0ca713dc-35ad-40d8-a6d1-07f4d9ed9e41	t	t	48	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
783b384f-8d33-497c-898d-1e1b9bb348d4	1254	Hứa Thuỳ Trâm	3722ce4b-a581-456f-a422-d0397f51eeef	tramht@ptit.edu.vn	TDT101025	Hứa Thuỳ Trâm (TDT101025)		3722ce4b-a581-456f-a422-d0397f51eeef	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9a064655-b534-44d6-a0b9-fbf6a527f313	722	Nguyễn Ngân Trâm	e040bffd-3081-4831-a9b7-fc8c9ed8e760		TG0533	Nguyễn Ngân Trâm (TG0533)		e040bffd-3081-4831-a9b7-fc8c9ed8e760	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8435a77a-0e97-4620-97c4-919cf9892396	1381	Nguyễn Đinh Bảo Trân	dc8debec-5124-414a-9574-3036b62b8292	tranndb@ptit.edu.vn	KCB201106	Nguyễn Đinh Bảo Trân (KCB201106)		dc8debec-5124-414a-9574-3036b62b8292	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c004ebc6-dea2-4663-a3eb-41dc79bf8e39	1360	Bùi Văn Trí	0475f6a1-b6ed-41a9-9ebf-c6d554698826	tribv@ptit.edu.vn	PDT201095	Bùi Văn Trí (PDT201095)		0475f6a1-b6ed-41a9-9ebf-c6d554698826	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e23bb2fe-c6cf-40b3-a7be-8f042803c12b	397	Bùi Thanh Trúc	3c124b40-a270-4b17-b9c7-fac336f32d9b	trucbt@ptit.edu.vn	KQT201042	Bùi Thanh Trúc (KQT201042)		3c124b40-a270-4b17-b9c7-fac336f32d9b	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f247402b-139e-4e43-bad1-1ae6c330a20c	325	Nguyễn Duy Trường	e83bfa22-ef03-42be-bd16-f7142451ec1b	truongnd@ptit.edu.vn	KCB100222	Nguyễn Duy Trường (KCB100222)		e83bfa22-ef03-42be-bd16-f7142451ec1b	t	t	228	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d0cfa61b-5af2-4441-87cd-1e003b953ef2	272	Đinh Xuân Trường	9e289d7e-bcf5-4b0c-b745-b12780b66701	truongdx@ptit.edu.vn	KCN100279	Đinh Xuân Trường (KCN100279)		9e289d7e-bcf5-4b0c-b745-b12780b66701	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
732f761b-f31c-4dca-9adf-59384221fd99	1280	Nguyễn Xuân Trường	a87abf60-b1ed-49fa-b67f-e2bbfc26dcad	truongnx@ptit.edu.vn	TDV100627	Nguyễn Xuân Trường (TDV100627)		a87abf60-b1ed-49fa-b67f-e2bbfc26dcad	t	t	26	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f71d7086-92ec-46dd-81a4-548d331a45ae	1271	Phạm Đức Trường	6caf7116-0f63-4ae7-95fd-125578e4d182	truongpd@ptit.edu.vn	TDT100638	Phạm Đức Trường (TDT100638)		6caf7116-0f63-4ae7-95fd-125578e4d182	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ba869b7c-b273-4749-bb32-74d2aafcabeb	1069	Vũ Hoàng Trường	dbcf4e63-8e0d-40b3-ab69-934c67654bad		TG0006	Vũ Hoàng Trường (TG0006)		dbcf4e63-8e0d-40b3-ab69-934c67654bad	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c6d67810-ee9a-4ddb-99db-cd1875309570	1398	Vũ Thịnh Trường	d77372d4-7806-4c3d-9b46-5de1d4008ed7	truongvt@ptit.edu.vn	KQT201124	Vũ Thịnh Trường (KQT201124)		d77372d4-7806-4c3d-9b46-5de1d4008ed7	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
587b6895-66b2-4b64-a9b4-dc5e113fe845	667	Lê Đình Trưởng	789b16be-2f97-4323-9d0b-4a5525a72160		TG0072	Lê Đình Trưởng (TG0072)		789b16be-2f97-4323-9d0b-4a5525a72160	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e09a998b-0def-45f4-94f3-4d5df7cccc0e	41	Võ Trọng	48b70549-7812-4816-af1f-8e1858736ee2	trongv@ptit.edu.vn	VKH100868	Võ Trọng (VKH100868)		48b70549-7812-4816-af1f-8e1858736ee2	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a99ee9de-49da-462b-b2d2-98d042c381bc	1223	Đỗ Duy Trọng	db49fba3-feb1-4d79-b868-314aeb3b95d3	trongdd@ptit.edu.vn	KQT200482	Đỗ Duy Trọng (KQT200482)		db49fba3-feb1-4d79-b868-314aeb3b95d3	t	t	176	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d280a686-9e72-414d-9920-26fd1600e8ed	144	Huỳnh Trung Trụ	d0a7b840-c4be-4485-85c7-b7bcb2f5dadc	truht@ptit.edu.vn	KCN200445	Huỳnh Trung Trụ (KCN200445)		d0a7b840-c4be-4485-85c7-b7bcb2f5dadc	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e4693417-09e0-42bd-a51c-57a4f4f501dd	1298	Nguyễn Ngọc Tuyên	428a624e-8ac0-40fe-a9de-5e7deb7dc773	tuyennn@ptit.edu.vn	VPH100776	Nguyễn Ngọc Tuyên (VPH100776)		428a624e-8ac0-40fe-a9de-5e7deb7dc773	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8e914702-96c2-4e4b-8536-b72b7ef25849	820	Nguyễn Tài Tuyên	65914dc7-4c3d-4724-badf-8721b0a2ff51	tuyennt@ptit.edu.vn	KDT100141	Nguyễn Tài Tuyên (KDT100141)		65914dc7-4c3d-4724-badf-8721b0a2ff51	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f1eba08-e898-443f-893a-98aa15f0bb66	1296	Nguyễn Trung Tuyến	d6f5921a-c4e8-4650-a5cb-9b02d675af5c	nttuyen@ptit.edu.vn	VPH100031	Nguyễn Trung Tuyến (VPH100031)		d6f5921a-c4e8-4650-a5cb-9b02d675af5c	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
16a14fe6-5e61-4572-8e28-69dd0ff97961	11	Huỳnh Thị Ánh Tuyết	90cfabe6-e5cc-4f55-8f2d-d8463206a855	tuyethta@ptit.edu.vn	VKH100555	Huỳnh Thị Ánh Tuyết (VKH100555)		90cfabe6-e5cc-4f55-8f2d-d8463206a855	t	t	237	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3cf3d637-b344-49ca-a7a6-63d705242605	380	Lê Thị Ánh Tuyết	117c4659-20fd-452a-a4b8-00719c822116	tuyetlta@ptit.edu.vn	TDV100179	Lê Thị Ánh Tuyết (TDV100179)		117c4659-20fd-452a-a4b8-00719c822116	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
82592409-7684-420c-8e4e-324c654954ed	1379	Nguyễn Thị Bạch Tuyết	7a6dcd48-78d8-4693-9423-f7ecb0688a74	tuyetntb@ptit.edu.vn	VKH101083	Nguyễn Thị Bạch Tuyết (VKH101083)		7a6dcd48-78d8-4693-9423-f7ecb0688a74	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c77c9052-6a95-4233-83e4-f36f20e62155	560	Nguyễn Thị Tuyết	d04c88dd-2423-43a8-b8b9-fd785ff90678	tuyetnt@ptit.edu.vn	PDT100064	Nguyễn Thị Tuyết (PDT100064)		d04c88dd-2423-43a8-b8b9-fd785ff90678	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7656ab96-195f-49f8-8769-5dd789dd0755	912	Trần Thị Minh Tuyết	aa6b90ab-3afa-4b00-a11d-2d5c3ac1732d		TG0484	Trần Thị Minh Tuyết (TG0484)		aa6b90ab-3afa-4b00-a11d-2d5c3ac1732d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7fdbb9ee-3ead-4116-9c33-2c1e29f6c8bb	705	Vũ Thị Minh Tuyết	352920fa-e097-4aeb-a2a9-b2c54beb06b0		TG0415	Vũ Thị Minh Tuyết (TG0415)		352920fa-e097-4aeb-a2a9-b2c54beb06b0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
edb64642-c6cd-4514-9d5c-2c0a913f5a13	1318	Lê Văn Tuyền	b5e52b17-4642-4346-ad4e-00488510438e	tuyenlv@ptit.edu.vn	VPH101030	Lê Văn Tuyền (VPH101030)		b5e52b17-4642-4346-ad4e-00488510438e	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
161fb469-2b88-4cda-8943-b6823ffd2b47	1290	Nguyễn Minh Tuân	f18d34ec-1507-4145-89bf-057f5fe2ef47	tuannm@ptit.edu.vn	VPH100019	Nguyễn Minh Tuân (VPH100019)		f18d34ec-1507-4145-89bf-057f5fe2ef47	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ccc1f2e-e410-482a-b0e5-0a5930ef1959	658	Đinh Văn Tuân	6b1bf63f-c166-440a-a326-3bd531182901		TG0013	Đinh Văn Tuân (TG0013)		6b1bf63f-c166-440a-a326-3bd531182901	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3bf36f8d-4203-459a-a56d-33b3d75c1e81	1076	Bùi Anh Tuấn	20d2e619-6fdf-4940-82bd-405d5d2c4547	tuanba@ptit.edu.vn	KQT100710	Bùi Anh Tuấn (KQT100710)		20d2e619-6fdf-4940-82bd-405d5d2c4547	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2f45143d-e535-47d1-8599-fddc281d5037	666	Bùi Anh Tuấn	041d3d23-1352-4c76-879d-e55e4c1ec76e	batuan.tg@ptit.edu.vn	TG0599	Bùi Anh Tuấn (TG0599)		041d3d23-1352-4c76-879d-e55e4c1ec76e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0b1cd33a-65be-48f0-8bd7-5211b3f57433	1119	Dư Anh Tuấn	15b43993-6022-4252-8ec8-32876512e5e2		TG0093	Dư Anh Tuấn (TG0093)		15b43993-6022-4252-8ec8-32876512e5e2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
73b85e9d-2fee-4ced-8f33-4777afb86313	277	Hoàng Anh Tuấn	7ca7e9bc-f7ac-45f2-9246-fd156433055d	tuanha@ptit.edu.vn	KCN100694	Hoàng Anh Tuấn (KCN100694)		7ca7e9bc-f7ac-45f2-9246-fd156433055d	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2b1be91-feea-4c48-a4db-7256f67cf121	665	Hoàng Mạnh Tuấn	aa81ebb2-d8c6-481d-9a20-d216722970b1		TG0390	Hoàng Mạnh Tuấn (TG0390)		aa81ebb2-d8c6-481d-9a20-d216722970b1	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a949d1dd-a025-4430-83c3-6eadc3a5ce70	1003	Lê Minh Tuấn	07ecdab1-d359-4b15-942f-4c9c864294cb		TG0054	Lê Minh Tuấn (TG0054)		07ecdab1-d359-4b15-942f-4c9c864294cb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7bd476e0-cfa4-4f94-8b4f-273ca153b416	866	Lê Minh Tuấn	eba4bb53-cf8d-4bb5-baf1-f2ebb8b6fd98	tuanlm@ptit.edu.vn	KDT100938	Lê Minh Tuấn (KDT100938)		eba4bb53-cf8d-4bb5-baf1-f2ebb8b6fd98	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1a41b08a-49d9-47af-9a11-e93b36f5c2f7	92	Lưu Đức Tuấn	TuanLD.B23CC170@stu.ptit.edu.vn	tranglou1003@gmail.com		Lưu Đức Tuấn		0b73e69c-7d18-40aa-8619-bb1841bae612	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
07294d0c-07eb-4b6d-be88-9b73a0a5d7b2	1346	Nguyễn Anh Tuấn	53776af5-acc6-47e6-9fe8-8a3b20880abc	tuanna@ptit.edu.vn	VKH101088	Nguyễn Anh Tuấn (VKH101088)		53776af5-acc6-47e6-9fe8-8a3b20880abc	t	t	71	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f4220a8-ada9-4006-8850-9434d8106292	1452	Nguyễn Hữu Tuấn	99b56307-c635-42c2-b2ab-dc2e1230100c	tuannh@ptit.edu.vn	KCN101154	Nguyễn Hữu Tuấn (KCN101154)		99b56307-c635-42c2-b2ab-dc2e1230100c	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
356b4ff9-8533-458a-8de0-6cd8a0a9a40d	1387	Nguyễn Minh Tuấn	3682f343-2602-4990-b3d8-3853f8c344eb	tuannm1@ptit.edu.vn	VCN100827	Nguyễn Minh Tuấn (VCN100827)		3682f343-2602-4990-b3d8-3853f8c344eb	t	t	60	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fbff3cde-8743-41d1-9b5b-3d5eba18d028	1039	Nguyễn Minh Tuấn	54f1b91d-b748-4fe4-8150-aab5ae67b95d	nmtuan@ptit.edu.vn	KVT100698	Nguyễn Minh Tuấn (KVT100698)		54f1b91d-b748-4fe4-8150-aab5ae67b95d	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
59d5585e-0a4f-4a17-98b4-751ffa3a9119	145	Nguyễn Minh Tuấn	d332f30d-9588-44c1-8ccd-4480230d15ec	minhtuan@ptit.edu.vn	KCN201068	Nguyễn Minh Tuấn (KCN201068)		d332f30d-9588-44c1-8ccd-4480230d15ec	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6f4a6c8b-46c8-43dd-9c0e-c631c2e62556	1102	Nguyễn Ngọc Tuấn	56f6c8d6-3782-4709-9330-f869cb40fd06		TG0312	Nguyễn Ngọc Tuấn (TG0312)		56f6c8d6-3782-4709-9330-f869cb40fd06	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fa33914a-279b-481f-ae89-ff33550b2c82	1136	Nguyễn Tuấn	fd05db0f-c65c-4857-8942-91f6200bb3ef		TG0288	Nguyễn Tuấn (TG0288)		fd05db0f-c65c-4857-8942-91f6200bb3ef	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8d53f17d-fddb-4341-b598-bb121f7c5daa	1061	Nguyễn Viết Tuấn	acc06c65-2165-44dc-a9da-bcc69f762d0c		TG0071	Nguyễn Viết Tuấn (TG0071)		acc06c65-2165-44dc-a9da-bcc69f762d0c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c0ad75c1-2467-45c4-bde2-0b9edc41418f	1425	Nguyễn Đức Tuấn	TuanND.B23CC172@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Đức Tuấn			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5931b653-2190-48e8-aa56-d6a02674dac6	1250	Ngô Đức Tuấn	cf175d0c-1570-4442-bc14-e9d0d507f884		TDT101045	Ngô Đức Tuấn (TDT101045)		cf175d0c-1570-4442-bc14-e9d0d507f884	t	t	1	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0659c494-680b-4cf4-9243-f823c6866155	797	Phạm Anh Tuấn	2ac2a051-1e3b-48b5-b880-8fe821f5d6e0	tuanpa@ptit.edu.vn	TKT100665	Phạm Anh Tuấn (TKT100665)		2ac2a051-1e3b-48b5-b880-8fe821f5d6e0	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
949cab38-8db3-4c91-9903-b75e959bc96e	1081	Trần Anh Tuấn	c7b1975b-9510-4f96-9b12-0e5e8604fae1	tuanta@ptit.edu.vn	KQT100903	Trần Anh Tuấn (KQT100903)		c7b1975b-9510-4f96-9b12-0e5e8604fae1	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b818aaa4-a071-49eb-8d8e-088b67591c3c	1132	Trần Thanh Tuấn	3a31b6a0-389f-457a-a62e-ce0740c2772e		TG0338	Trần Thanh Tuấn (TG0338)		3a31b6a0-389f-457a-a62e-ce0740c2772e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02525b4a-03d9-459c-b5ce-c5654ce9764b	416	Trần Văn Tuấn	3e1bf685-ae42-47be-9717-172e5945f13b	tuantv@ptit.edu.vn	PTH200517	Trần Văn Tuấn (PTH200517)		3e1bf685-ae42-47be-9717-172e5945f13b	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f071ecea-7db9-45f0-bf40-d703a2f40734	748	Vũ Anh Tuấn	f3b035d3-de63-47a8-b486-6c473b1cc053		TG0519	Vũ Anh Tuấn (TG0519)		f3b035d3-de63-47a8-b486-6c473b1cc053	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
68fa3de0-92f6-44c8-ac28-c2c54f69daf3	49	Đặng Anh Tuấn	2557f094-1fed-4607-9f7e-b51e3b670913	tuanda@ptit.edu.vn	VKH100881	Đặng Anh Tuấn (VKH100881)	Phụ trách phòng CNS	2557f094-1fed-4607-9f7e-b51e3b670913	t	t	74	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f4a2dac-ba12-4784-bc51-796df8b10f8f	1370	Đặng Minh Tuấn	2ef5d1b4-9300-4ee1-b7fd-92928e12372e	tuandm@ptit.edu.vn	2025.KAT1.15.805	Đặng Minh Tuấn (2025.KAT1.15.805)		2ef5d1b4-9300-4ee1-b7fd-92928e12372e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
db05dd9c-2aa6-4f2b-bedf-4e58e1e7e1a0	430	Đỗ Trung Tuấn	8eb9c993-9fab-411b-84b2-8c508a281acd	tuandt@ptit.edu.vn	KTN100977	Đỗ Trung Tuấn (KTN100977)		8eb9c993-9fab-411b-84b2-8c508a281acd	t	t	253	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f142906-6fb0-49ce-b2d8-50b9f2ef825d	111	Lê Tuệ	dc76e6bd-8e10-464a-a781-cc8538fafa14	letue@ptit.edu.vn	KVT200761	Lê Tuệ (KVT200761)		dc76e6bd-8e10-464a-a781-cc8538fafa14	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
777151c0-43fb-4463-8d5b-91a2f0b42206	26	Phạm Hữu Tài	27662a8a-d060-4245-8069-605c9a2e4612	taiph@ptit.edu.vn	VKH100554	Phạm Hữu Tài (VKH100554)		27662a8a-d060-4245-8069-605c9a2e4612	t	t	237	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3c2e576f-576c-4ee7-b6f6-a3d4e8565301	806	Phạm Phú Tài	261f5403-d115-4da4-b8c3-5df94289a87a	taipp@ptit.edu.vn	TKT100122	Phạm Phú Tài (TKT100122)		261f5403-d115-4da4-b8c3-5df94289a87a	t	t	29	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a0bb7b76-fafc-4ac5-8609-998160a95b1e	1206	Võ Minh Tài	f682f382-d3ca-47e7-b8f4-8172a105f6fe	taivm@ptit.edu.vn	KDT201043	Võ Minh Tài (KDT201043)		f682f382-d3ca-47e7-b8f4-8172a105f6fe	t	t	180	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d61d7733-d7f4-4175-982d-3e5c1a26db4c	1344	Vũ Tiến Tài	079a1422-3f01-4fe1-a2e1-1134925d13a2	taivt.tg@ptit.edu.vn	TG0624	Vũ Tiến Tài (TG0624)		079a1422-3f01-4fe1-a2e1-1134925d13a2	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a787c3b7-d043-4127-a8b6-4c33991f6b30	742	Đỗ Đức Tài	b5629118-d2a9-48e5-8fc4-b0f99075d8e7		TG0595	Đỗ Đức Tài (TG0595)		b5629118-d2a9-48e5-8fc4-b0f99075d8e7	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
38962df8-48f6-49e9-9bbb-8fcaee468534	613	Lương Thị Minh Tâm	b915eb5d-61bb-4d2c-b558-e977727d6e81	tamltm@ptit.edu.vn	PGV100120	Lương Thị Minh Tâm (PGV100120)		b915eb5d-61bb-4d2c-b558-e977727d6e81	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2ddb1dde-0c21-4301-a4fd-cd41b82cfcfa	1233	Nguyễn Thanh Tâm	4794c3ab-75d3-439e-a3cd-6ccf571788d4	tamnt1@ptit.edu.vn	KVT200765	Nguyễn Thanh Tâm (KVT200765)		4794c3ab-75d3-439e-a3cd-6ccf571788d4	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fc205638-11c2-443f-8eb8-9aaf71615d32	363	Nguyễn Thị Minh Tâm	fc725366-0c17-4347-88fa-0849e6456154	tamntm@ptit.edu.vn	KCB100690	Nguyễn Thị Minh Tâm (KCB100690)		fc725366-0c17-4347-88fa-0849e6456154	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
848fa9ce-0a74-4126-b236-5b680f95e1b7	384	Nguyễn Thị Thanh Tâm	e53c3ccd-7d30-4809-b41b-c9249099125a	tamntt@ptit.edu.vn	TDV100174	Nguyễn Thị Thanh Tâm (TDV100174)		e53c3ccd-7d30-4809-b41b-c9249099125a	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ce47472d-c3e1-4bdf-aba2-8d5bfbf8e349	191	Nguyễn Thị Thanh Tâm	478eada6-6007-41d5-acf4-44281157a246	ntttam@ptit.edu.vn	KDP100366	Nguyễn Thị Thanh Tâm (KDP100366)		478eada6-6007-41d5-acf4-44281157a246	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e10ec424-a5ce-4df6-bdf4-e27996e0719d	721	Nguyễn Thị Thanh Tâm	f2ed0f00-0a30-479b-9440-a15e9e529d2a		TG0523	Nguyễn Thị Thanh Tâm (TG0523)		f2ed0f00-0a30-479b-9440-a15e9e529d2a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1a41032a-cd12-4e01-b1f6-217ed8421bc9	378	Nguyễn Thị Tâm	462fb5c2-dcb0-4dea-bde2-e2edd232a571	tamnt@ptit.edu.vn	TDV100173	Nguyễn Thị Tâm (TDV100173)		462fb5c2-dcb0-4dea-bde2-e2edd232a571	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d63ce40f-e88d-47ea-b542-c16152e39e6e	576	Đỗ Thị Minh Tâm	53968371-b5da-44c8-97af-f76c951da69c	tamdtm@ptit.edu.vn	PKT100095	Đỗ Thị Minh Tâm (PKT100095)		53968371-b5da-44c8-97af-f76c951da69c	t	t	32	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c9622ec4-dbfb-4f56-a239-e831dea51937	1128	Lương Minh Tân	1cdb46ed-e594-41c2-837e-cba21199d48a		TG0029	Lương Minh Tân (TG0029)		1cdb46ed-e594-41c2-837e-cba21199d48a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3d259bcf-1e7b-4751-b3f5-214f72bec1b5	25	Phạm Hoàng Tân	44acfa9b-1a58-4012-ba62-c26fe5c435ce	tanph@ptit.edu.vn	VKH100867	Phạm Hoàng Tân (VKH100867)		44acfa9b-1a58-4012-ba62-c26fe5c435ce	t	t	237	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6264abd6-6364-481a-abbb-7a8438f0f224	1436	Phạm Minh Tân	903ec30f-7a8e-45c4-964b-4b57a4481a79	tanpm@ptit.edu.vn	KCB101135	Phạm Minh Tân (KCB101135)		903ec30f-7a8e-45c4-964b-4b57a4481a79	t	t	230	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
80847a0e-7fac-4780-8552-9246f5d4591a	114	Đỗ Kim Tân	2998b5eb-e8a2-42b0-a8b5-2f3af5b1d2ee	tandk@ptit.edu.vn	KQT200489	Đỗ Kim Tân (KQT200489)		2998b5eb-e8a2-42b0-a8b5-2f3af5b1d2ee	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
67293f24-f587-4313-8b35-07ea04b154df	916	Vũ Gia Tê	9b71b669-0206-4014-b78c-056bed4ca2fa		TG0020	Vũ Gia Tê (TG0020)		9b71b669-0206-4014-b78c-056bed4ca2fa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
242b6b08-d675-4782-adb2-32eab159c590	1192	Cao Trung Tín	71922b1a-845c-4042-8c42-535faea8d9c6	tinct@ptit.edu.vn	KCN200748	Cao Trung Tín (KCN200748)		71922b1a-845c-4042-8c42-535faea8d9c6	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ab98bf7b-2158-4410-8e03-3ec729c8f7e2	7	Bùi Văn Tùng	16f029a9-2267-4111-a027-aa973846535b	tungbv@ptit.edu.vn	VKH101057	Bùi Văn Tùng (VKH101057)		16f029a9-2267-4111-a027-aa973846535b	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7fb55355-e7c7-4ad8-a795-41f1283d0f33	639	Lê Ngọc Tùng	594bd49f-dd1d-4b1b-a239-d8ca02214e3b		TG0550	Lê Ngọc Tùng (TG0550)		594bd49f-dd1d-4b1b-a239-d8ca02214e3b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3ceb81dd-6d6a-49b5-89dd-1af5aeff8f57	504	Lại Như Tùng	d1b7b097-12df-4aa3-819a-68f77713118b	tungln@ptit.edu.vn	VCN100837	Lại Như Tùng (VCN100837)		d1b7b097-12df-4aa3-819a-68f77713118b	t	t	58	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
94a4dcdc-97e2-44aa-b18d-b9e2be161057	1141	Nguyễn Khánh Tùng	885b731e-e519-48aa-a10e-696a089c9ce5		TG0311	Nguyễn Khánh Tùng (TG0311)		885b731e-e519-48aa-a10e-696a089c9ce5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
19dfec5f-5f07-4052-a2f8-7b210a6e303a	372	Nguyễn Ngọc Tùng	2992cedf-518b-4829-b88f-1fae5c8e99a4	tungnn@ptit.edu.vn	TDV100177	Nguyễn Ngọc Tùng (TDV100177)		2992cedf-518b-4829-b88f-1fae5c8e99a4	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
75f70777-dfc9-4714-89a5-6d6059aa4828	728	Nguyễn Thanh Tùng	89e8747c-c84d-4561-8d94-cc8fa3cc55ca		TG0509	Nguyễn Thanh Tùng (TG0509)		89e8747c-c84d-4561-8d94-cc8fa3cc55ca	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9acd7893-4328-40b0-85c2-e041f92d11d9	379	Phan Thanh Tùng	2e6efe19-a90e-4379-bf85-988b5aae37a4	tungpt@ptit.edu.vn	TDV100178	Phan Thanh Tùng (TDV100178)		2e6efe19-a90e-4379-bf85-988b5aae37a4	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b3aabcfb-d50b-4fbc-bec7-83d44c765591	902	Trần Thanh Tùng	d8830b10-c021-4aed-9ccc-8242903807aa		TG0104	Trần Thanh Tùng (TG0104)		d8830b10-c021-4aed-9ccc-8242903807aa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b31999e6-57e6-45ed-84a1-6169438d0187	945	Trần Thanh Tùng	a2f8905f-1baa-4194-bff1-93a1ac844e6d		TG0332	Trần Thanh Tùng (TG0332)		a2f8905f-1baa-4194-bff1-93a1ac844e6d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f4dbc014-8475-44c7-bc36-b53438cdc5e3	1077	Trần Văn Tùng	315c2b02-c8ac-496f-b783-0d5073155302	tungtv@ptit.edu.vn	KQT100949	Trần Văn Tùng (KQT100949)		315c2b02-c8ac-496f-b783-0d5073155302	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c66a740f-aa98-469e-9bc3-e475f7081077	1106	Vũ Thanh Tùng	a08cec48-bc6f-493c-af8b-77cb6d75a753		TG0319	Vũ Thanh Tùng (TG0319)		a08cec48-bc6f-493c-af8b-77cb6d75a753	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
85ccc2fc-0cb4-4469-b2f8-77a4d9803826	684	Đào Thanh Tùng	143add8a-453c-4af2-81bd-ebc52c9c167a		TG0371	Đào Thanh Tùng (TG0371)		143add8a-453c-4af2-81bd-ebc52c9c167a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
70c53b0c-cfb0-4601-bf12-0a62186f23e3	557	Đặng Văn Tùng	aff425a8-cabb-4237-bd0c-c839a0b6f1e1	tungdv@ptit.edu.vn	PDT100058	Đặng Văn Tùng (PDT100058)		aff425a8-cabb-4237-bd0c-c839a0b6f1e1	t	t	34	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d53f4a81-be8c-49d8-bec1-671754391b02	261	Dương Thị Thanh Tú	461b5a5d-0a3a-4cb7-8b13-4a965369a69a	tudtt@ptit.edu.vn	KVT100306	Dương Thị Thanh Tú (KVT100306)		461b5a5d-0a3a-4cb7-8b13-4a965369a69a	t	t	215	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3b8b7378-aec0-452e-8af5-4f7d7308fae1	597	Nguyễn Ngọc Tú	e91c4b61-54c8-4e83-b911-af7fb85d779a	tunn@ptit.edu.vn	VPH100663	Nguyễn Ngọc Tú (VPH100663)		e91c4b61-54c8-4e83-b911-af7fb85d779a	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a8e00225-9b04-4bfc-832d-9d301848262c	1068	Nguyễn Đình Tú	72b8414c-f175-47d9-9f9c-f054d49421b9		TG0482	Nguyễn Đình Tú (TG0482)		72b8414c-f175-47d9-9f9c-f054d49421b9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e345ea2e-3d95-4b13-83d2-f419b118f4ea	1309	Phạm Vũ Minh Tú	97334d2e-0e8b-403a-a66b-795fea6c7481	tupvm@ptit.edu.vn	TQT100146	Phạm Vũ Minh Tú (TQT100146)		97334d2e-0e8b-403a-a66b-795fea6c7481	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7f752879-fed0-4a46-ad49-e546703e103e	627	Vương Thanh Tú	7aa4be20-276b-49d8-9843-6794f8a0e8bd	tuvt.tg@ptit.edu.vn	TG0392	Vương Thanh Tú (TG0392)		7aa4be20-276b-49d8-9843-6794f8a0e8bd	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2ae958cc-9dbb-4696-8da6-7fc34ea72570	435	Đào Đức Tú	e73a0ce9-d3b9-4569-a796-a5cd0ce4cc58	tudd@ptit.edu.vn	KTN101013	Đào Đức Tú (KTN101013)		e73a0ce9-d3b9-4569-a796-a5cd0ce4cc58	t	t	253	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2d85657d-ff7f-4ece-bb2f-61b15ee832bc	998	Nguyễn Văn Tăng	1af802cc-369b-4252-b807-e121d1afc392		TG0290	Nguyễn Văn Tăng (TG0290)		1af802cc-369b-4252-b807-e121d1afc392	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7bb9c5cd-66bc-4fc9-bebe-bb183de80b88	1232	Lê Văn Tươi	f57883ee-9a74-4c74-8a11-374a7091e887	tuoilv@ptit.edu.vn	KVT200763	Lê Văn Tươi (KVT200763)		f57883ee-9a74-4c74-8a11-374a7091e887	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6b3d021d-4763-4935-8d9d-c8a5f60c91b4	988	Ngô Quốc Tạo	272a32ba-e56f-4747-a74f-3ed33ab4de40		TG0310	Ngô Quốc Tạo (TG0310)		272a32ba-e56f-4747-a74f-3ed33ab4de40	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b0848a34-99b2-42b5-8eab-d624af7d00d0	62	Nguyễn Hồng Anh Tấn	43040354-e883-4e9c-970d-e64998665571	tannha@ptit.edu.vn	VKH100910	Nguyễn Hồng Anh Tấn (VKH100910)		43040354-e883-4e9c-970d-e64998665571	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1ad08f5e-1a5f-4aff-84ca-0695b4bfeec1	198	Tạ Ngọc Tấn	4f06b90c-3671-47e6-84ed-510dc3524b27	tantn@ptit.edu.vn	KDP100718	Tạ Ngọc Tấn (KDP100718)		4f06b90c-3671-47e6-84ed-510dc3524b27	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dbf34168-b142-4588-9837-54d614d8a915	752	Nguyễn Văn Tới	fe006516-2f51-4e42-9278-661029edae5d		TG0537	Nguyễn Văn Tới (TG0537)		fe006516-2f51-4e42-9278-661029edae5d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1f07be14-58f3-4a5b-8c5f-baba6bc388ac	323	Nguyễn Quốc Uy	0ab40844-1fa9-4110-a660-da71ffbca6cc	uynq@ptit.edu.vn	KDT100240	Nguyễn Quốc Uy (KDT100240)		0ab40844-1fa9-4110-a660-da71ffbca6cc	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8828189e-f276-4f41-acf7-fc453f194ec6	965	Lê Thụy Diệu Uyên	375ca3af-4a17-41b7-b49a-1f9c1a7b001a	uyenltd.tg@ptit.edu.vn	TG0617	Lê Thụy Diệu Uyên (TG0617)		375ca3af-4a17-41b7-b49a-1f9c1a7b001a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
64471bdb-d7d7-4dde-9eaa-dc4505dad69a	1215	Nguyễn Thị Hải Uyên	8ab3e220-b64b-4f26-8030-42170ff4332b	uyennth@ptit.edu.vn	KQT200483	Nguyễn Thị Hải Uyên (KQT200483)		8ab3e220-b64b-4f26-8030-42170ff4332b	t	t	177	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a1f8d98-4d36-437b-83a8-1ad3f9fe3981	1275	Trần Tố Uyên	86f121d2-1b3e-4ac2-aca0-2a0942da283b	uyentt@ptit.edu.vn	TDT100633	Trần Tố Uyên (TDT100633)		86f121d2-1b3e-4ac2-aca0-2a0942da283b	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
38ce6f1f-173b-4af9-854e-6a000b8de92c	1369	Võ Ngọc Bích Uyên	02acf2cf-6862-4923-abcd-ec5e0595f9c6	uyenvnb@ptit.edu.vn	KTN101093	Võ Ngọc Bích Uyên (KTN101093)		02acf2cf-6862-4923-abcd-ec5e0595f9c6	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4dc78260-adf1-49e9-b533-e256d031f5f8	51	Đặng Thị Tố Uyên	75def4d0-7195-4a1e-b022-df1385c482c6	uyendt@ptit.edu.vn	VKH100526	Đặng Thị Tố Uyên (VKH100526)	Văn thư Viện Khoa học Kỹ thuật Bưu điện	75def4d0-7195-4a1e-b022-df1385c482c6	t	t	69	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
41fd7022-a7db-433d-8c42-9394a0f5d52a	38	VAN_THU_TEST	VAN_THU_TEST	tranglou1003@gmail.com		VAN_THU_TEST		van_thu_test	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c88128ea-c975-4d22-b3fd-66663ef39dac	39	VIEN_TRUONG_TEST	VIEN_TRUONG_TEST	tranglou1003@gmail.com		VIEN_TRUONG_TEST		vien_truong_test	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ae5f7db8-6e84-4c34-bb97-662fd3d8a273	55	VT_VKT	VT_VKT	tranglou1003@gmail.com		VT_VKT			f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a8d6edd9-0d05-47fc-aacd-b8aacfd8e515	136	Trần Thị Nhã Vi	674828cc-6716-470d-9fab-001a58882fe0	vittn@ptit.edu.vn	KCN200446	Trần Thị Nhã Vi (KCN200446)		674828cc-6716-470d-9fab-001a58882fe0	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9c0b9448-eef7-4172-a227-93758ecd732f	1341	Dương Thị Thùy Vinh	4d181cc3-7f8d-4fd7-97be-aa3b91fc273a	vinhdtt.tg@ptit.edu.vn	2025.KCB1.15.809	Dương Thị Thùy Vinh (2025.KCB1.15.809)		4d181cc3-7f8d-4fd7-97be-aa3b91fc273a	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6e660f10-e919-4699-85b4-c599754f0ca2	1273	Hoàng Thị Vinh	f1f5b528-82f1-4a73-b998-2c932a7ddb37	vinhht@ptit.edu.vn	TDT100639	Hoàng Thị Vinh (TDT100639)		f1f5b528-82f1-4a73-b998-2c932a7ddb37	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7eaa6d9b-d314-4b9e-bafa-ec5c763e5328	154	Lê H' Vinh	3ca3d824-4c66-4614-8c80-04e674bb08de	vinhlh@ptit.edu.vn	KCB200423	Lê H' Vinh (KCB200423)		3ca3d824-4c66-4614-8c80-04e674bb08de	t	t	192	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
564a6098-2189-4814-bbdb-7aaf02eb0a39	481	Nguyễn Xuân Vinh	41ad65e5-8744-42a6-9162-9efb156c965f		TG0240	Nguyễn Xuân Vinh (TG0240)		41ad65e5-8744-42a6-9162-9efb156c965f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
15ae389c-6195-4887-9d3b-b46401248f6b	477	Ngô Xuân Vinh	2a5d22a5-c070-444a-8ecf-ac87cfc8f002		TG0051	Ngô Xuân Vinh (TG0051)		2a5d22a5-c070-444a-8ecf-ac87cfc8f002	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
144ed829-2fc8-4d2c-8f3f-fa4fa927ff12	1447	Trần Lê Vinh	b0c07f10-6fab-4018-a32a-4b5f0de17800	vinhtl@ptit.edu.vn	VKH101149	Trần Lê Vinh (VKH101149)		b0c07f10-6fab-4018-a32a-4b5f0de17800	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4dc1fa96-5ebf-4223-8dd9-559828ce8845	686	Lê Hải Việt	7881057b-9fc8-43bf-b5ab-cc4d2e922a23		TG0388	Lê Hải Việt (TG0388)		7881057b-9fc8-43bf-b5ab-cc4d2e922a23	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ebde1518-b563-4fb1-9be9-355c064f63ff	817	Nguyễn Đức Việt	d26ed6c9-2d8f-4048-a1c7-e1501444a16d	vietnd@ptit.edu.vn	KDT100132	Nguyễn Đức Việt (KDT100132)		d26ed6c9-2d8f-4048-a1c7-e1501444a16d	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
50916d28-a0bf-4889-8d27-d8f2fd08c2e1	1403	Phạm Hoàng Việt	2acb0123-2b75-4124-8e53-a070cdbd6fe1	vietph@ptit.edu.vn	KCN101089	Phạm Hoàng Việt (KCN101089)		2acb0123-2b75-4124-8e53-a070cdbd6fe1	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d76f9599-2e43-44ab-8601-b02cc9762d87	1411	Đỗ Sỹ Việt	VietDS.B24CC287@gmail.com	tranglou1003@gmail.com		Đỗ Sỹ Việt - VietDS.B24CC287@gmail.com		983083c0-4655-4279-a28b-29efddad7200	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
55cfb7e3-eb71-44c4-9c94-d4904f619db7	391	Đỗ Trung Việt	5affd0f0-10a2-4c4f-954a-151f5ff89145	vietdt@ptit.edu.vn	TDV100158	Đỗ Trung Việt (TDV100158)		5affd0f0-10a2-4c4f-954a-151f5ff89145	t	t	236	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
30a9b852-b228-4862-a3f4-6f6d1775092e	400	Lê Nguyên Vy	fef2b19b-5f7f-40a7-9a64-04b87ad533d4	vyln@ptit.edu.vn	PTH200518	Lê Nguyên Vy (PTH200518)		fef2b19b-5f7f-40a7-9a64-04b87ad533d4	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
729b5594-9702-441b-b6dc-151b93dc0ed4	1183	Châu Văn Vân	7400acb7-ec03-4bc1-a8fc-d151d1d56ec2	vancv@ptit.edu.vn	KCN201069	Châu Văn Vân (KCN201069)		7400acb7-ec03-4bc1-a8fc-d151d1d56ec2	t	t	244	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f236072-4ce9-453f-88a5-019626e2691c	410	Dương Thị Ngọc Vân	ca92eb68-a0b9-4676-88c6-f63a19d7aa33	vandtn@ptit.edu.vn	PTH200920	Dương Thị Ngọc Vân (PTH200920)		ca92eb68-a0b9-4676-88c6-f63a19d7aa33	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
59414b89-0cbb-4f13-acf9-d5a19203fd6b	734	Dương Thị Vân	44e2ec7a-14b0-4654-af98-20bf55c48f3b		TG0370	Dương Thị Vân (TG0370)		44e2ec7a-14b0-4654-af98-20bf55c48f3b	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9ed69aa-59d6-4814-9442-7789fd8c67af	535	Lê Thị Vân	7735fdda-71d0-4985-aac5-1a8e8c696c5d	vanlt@ptit.edu.vn	PTC100041	Lê Thị Vân (PTC100041)		7735fdda-71d0-4985-aac5-1a8e8c696c5d	t	t	36	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c2d2e540-f880-4ea6-b6b7-3eadffb82916	382	Nguyễn Hồng Vân	6ed25d3d-b692-4d30-88da-7b752d9be959	vannh@ptit.edu.vn	TDV100182	Nguyễn Hồng Vân (TDV100182)		6ed25d3d-b692-4d30-88da-7b752d9be959	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2254da1b-118a-424b-8a97-5f6c61913f36	1080	Nguyễn Mỹ Vân	f6e49b0a-ed1a-4aeb-8369-f8b7a59047f4	vannm@ptit.edu.vn	KQT100865	Nguyễn Mỹ Vân (KQT100865)		f6e49b0a-ed1a-4aeb-8369-f8b7a59047f4	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
04e60685-99c9-412e-ae9f-7ad1f37721a2	425	Nguyễn Thanh Vân	7d53108f-ec93-4754-9656-47e19bbeb0c2	vannt@ptit.edu.vn	PTH200505	Nguyễn Thanh Vân (PTH200505)		7d53108f-ec93-4754-9656-47e19bbeb0c2	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
75177a03-7b18-4237-84dc-ccd610e2b531	1376	Nguyễn Thanh Vân	1fe94fe5-cf13-46d1-b8b5-d6de54c3c814	ntvan@ptit.edu.vn	VPH101105	Nguyễn Thanh Vân (VPH101105)		1fe94fe5-cf13-46d1-b8b5-d6de54c3c814	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a0169d43-bc71-4bb7-b642-364b689dcc1e	622	Nguyễn Thu Vân	fdf8b024-ce85-468b-9fb7-689a3ac02d2c		TG0034	Nguyễn Thu Vân (TG0034)		fdf8b024-ce85-468b-9fb7-689a3ac02d2c	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
71217200-8616-433b-8a1b-3551100abd75	1154	Nguyễn Thị Hồng Vân	18a6a752-4c3a-4c3b-acba-d7daeed05a9e	vannth@ptit.edu.vn	PDT200731	Nguyễn Thị Hồng Vân (PDT200731)		18a6a752-4c3a-4c3b-acba-d7daeed05a9e	t	t	15	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f53153ee-fe1d-419f-a460-a15fd3a7bdd5	882	Nguyễn Thị Hồng Vân	1b572f0f-e8b9-4293-8c59-d7d6d40a2e87		TG0488	Nguyễn Thị Hồng Vân (TG0488)		1b572f0f-e8b9-4293-8c59-d7d6d40a2e87	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
563f0aaa-d3ab-4efa-84f5-f039b6d4045d	1088	Nguyễn Thị Ngọc Vân	b938db68-5a40-491f-b87b-c5d9bc05896b	vanntn@ptit.edu.vn	KDP100935	Nguyễn Thị Ngọc Vân (KDP100935)		b938db68-5a40-491f-b87b-c5d9bc05896b	t	t	199	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
966ef482-d3fc-4373-922c-fd2bd29aaa4f	924	Nguyễn Thị Thúy Vân	c66471be-46ab-457f-9a41-5e81d41dae65		TG0112	Nguyễn Thị Thúy Vân (TG0112)		c66471be-46ab-457f-9a41-5e81d41dae65	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f07be04b-8028-4020-933a-5fafbb0c8a67	207	Ngô Thị Lê Vân	33066b6b-8ffb-410d-b325-ac96efb4d11a	vanntl@ptit.edu.vn	KQT100342	Ngô Thị Lê Vân (KQT100342)		33066b6b-8ffb-410d-b325-ac96efb4d11a	t	t	19	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7a87a5e-7716-4ff3-804f-d958b636f60b	1313	Phạm Trần Cẩm Vân	fddbed5d-9d7a-4da3-b835-cb02959b1370	vanptc@ptit.edu.vn	TQT100148	Phạm Trần Cẩm Vân (TQT100148)		fddbed5d-9d7a-4da3-b835-cb02959b1370	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4b717123-b392-4b8c-84ae-1a6cf51d16ae	1181	Trần Thị Vân	d236261b-09b3-47d3-a9d8-eb65c4838570	vantt@ptit.edu.vn	KCB200915	Trần Thị Vân (KCB200915)		d236261b-09b3-47d3-a9d8-eb65c4838570	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ad36e0f0-06a3-405d-940c-978270022c06	841	Chu Văn Vệ	12edc234-2cbc-4736-b747-0a926fd8be6a	vecv@ptit.edu.vn	KSD100684	Chu Văn Vệ (KSD100684)		12edc234-2cbc-4736-b747-0a926fd8be6a	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1c240675-9554-4621-b03a-eb401e2944a4	120	Nguyễn Toàn Văn	7ce030c7-30da-4111-8f87-cd1b11fa3640	vannt1@ptit.edu.vn	KDT200729	Nguyễn Toàn Văn (KDT200729)		7ce030c7-30da-4111-8f87-cd1b11fa3640	t	t	180	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
095de4f9-9ea6-4222-988e-488ac70baa6a	863	Nguyễn Thế Vĩnh	0c096e71-6151-47ac-a92f-0a9d8dae857c	vinhnt@ptit.edu.vn	KDT101039	Nguyễn Thế Vĩnh (KDT101039)		0c096e71-6151-47ac-a92f-0a9d8dae857c	t	t	250	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
994e2111-3452-44ef-9901-f14d450605c6	771	Lê Anh Vũ	6681510b-7931-400d-a227-e819b3e09861		TG0411	Lê Anh Vũ (TG0411)		6681510b-7931-400d-a227-e819b3e09861	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cb8c460d-ed3b-4d58-88db-0f9f00624ed0	1423	Lê Tuấn Vũ	VuLT.B24CC293@stu.ptit.edu.vn	tranglou1003@gmail.com		Lê Tuấn Vũ		f1a39641-91e6-4c44-9f37-58f26cf046cb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0db5560d-66fb-4237-bd08-e7171dc25a05	1442	Lưu Huy Vũ	VuLH.B25CC272@stu.ptit.edu.vn	tranglou1003@gmail.com		Lưu Huy Vũ		0c2f8338-263e-4011-a1b3-42e539582959	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ce4bc0c1-7487-412a-996a-c6e4ec569648	904	Nguyễn Hoàn Vũ	e5bf1bc8-95a6-462d-8575-5ac01e8e2595		TG0252	Nguyễn Hoàn Vũ (TG0252)		e5bf1bc8-95a6-462d-8575-5ac01e8e2595	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
129026ca-93a4-449a-b01a-b9b8d0ff9232	1365	Phan Anh Vũ	8a8ed8a8-d3bc-4c1f-a1bc-2354474393ff	vupa.tg@ptit.edu.vn	TG0628	Phan Anh Vũ (TG0628)		8a8ed8a8-d3bc-4c1f-a1bc-2354474393ff	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4153adfe-2e2c-4d9e-8824-17c5a913f780	424	Đoàn Đại Long Vũ	33377b6c-566e-4b23-b221-6ed15cd90248	vuddl@ptit.edu.vn	PTH200724	Đoàn Đại Long Vũ (PTH200724)		33377b6c-566e-4b23-b221-6ed15cd90248	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4c49f1f5-c4de-4f32-87b0-99c1fbf01e2e	1052	Nguyễn Thị Bích Vượng	db7e82da-4069-438b-9af0-d3d1b85509f0		TG0064	Nguyễn Thị Bích Vượng (TG0064)		db7e82da-4069-438b-9af0-d3d1b85509f0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d34aa1dc-9374-42c4-84ad-568f6d24c196	967	Lê Văn Vịnh	f77b699d-66ff-41f0-b10b-6cb339882925	vinhlv@ptit.edu.vn	KCN101079	Lê Văn Vịnh (KCN101079)		f77b699d-66ff-41f0-b10b-6cb339882925	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
def342c8-b683-419d-9c59-711f8d8bdcdb	1143	Lê Thị Hồng Xinh	ce8a0d3c-e6ca-4873-8169-8894a53e1ccc	xinhlth@ptit.edu.vn	PKT200388	Lê Thị Hồng Xinh (PKT200388)		ce8a0d3c-e6ca-4873-8169-8894a53e1ccc	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ff2de4d-20d4-4696-96e6-cf0712e714de	824	Bùi Lệ Xuân	fdba4743-e5d4-4ef4-84bb-dea12b985014	xuanbl@ptit.edu.vn	KSD100186	Bùi Lệ Xuân (KSD100186)		fdba4743-e5d4-4ef4-84bb-dea12b985014	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f617b269-8869-41ea-8ca1-972fc129d8dc	1297	Nguyễn Quang Xuân	a481d6c0-a4eb-45fa-9c2a-8ab89db22e36	xuannq@ptit.edu.vn	VPH100033	Nguyễn Quang Xuân (VPH100033)		a481d6c0-a4eb-45fa-9c2a-8ab89db22e36	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b206edae-d5ec-4308-85dc-b9855f6ab8ad	1120	Nguyễn Thị Xuân	1130d93a-40f1-4e1d-a394-d61a5786d3a9		TG0057	Nguyễn Thị Xuân (TG0057)		1130d93a-40f1-4e1d-a394-d61a5786d3a9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc43eba7-b9f9-4414-a259-371c1478a46f	770	Ngô Thị Thanh Xuân	4f1da339-e9f7-4e30-8fc3-796e676e5e80		TG0495	Ngô Thị Thanh Xuân (TG0495)		4f1da339-e9f7-4e30-8fc3-796e676e5e80	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ae3ccfc9-c3d0-407c-bc18-afd67fce8437	729	Ngô Thị Thanh Xuân	79410f1f-b9de-4a18-bab6-282630e5e74f		TG0554	Ngô Thị Thanh Xuân (TG0554)		79410f1f-b9de-4a18-bab6-282630e5e74f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8c6cbd50-c667-488e-bbba-4411d30404ec	411	Phạm Thị Xuân	7a447e3e-6ef9-4f02-972d-c3ec34bd4682	xuanpt@ptit.edu.vn	PTH201020	Phạm Thị Xuân (PTH201020)		7a447e3e-6ef9-4f02-972d-c3ec34bd4682	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
757c3c02-c75b-43a6-8441-11af440746c5	200	Vũ Duy Yên	c8f3cc77-fbbf-4dad-935d-e84394da597b	yenvd@ptit.edu.vn	KDP100722	Vũ Duy Yên (KDP100722)		c8f3cc77-fbbf-4dad-935d-e84394da597b	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
220e4786-8e9c-4cd2-b1c6-df7e699ad888	1115	Hoàng Thị Yến	2e2495eb-c493-45c1-a44e-8c1b1a891c9d		TG0243	Hoàng Thị Yến (TG0243)		2e2495eb-c493-45c1-a44e-8c1b1a891c9d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0619f60c-664d-442d-aeca-2ceaf3c81a32	825	Lê Thị Hồng Yến	77a7b69a-b239-40a5-b01a-fc1f3275d643	yenlth@ptit.edu.vn	KSD100185	Lê Thị Hồng Yến (KSD100185)		77a7b69a-b239-40a5-b01a-fc1f3275d643	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
51980938-b26f-4307-b617-e9c4ede6ca05	573	Nguyễn Hải Yến	a2a07a1d-f90a-4af3-842f-131a62e813e9	yennh@ptit.edu.vn	PQL100068	Nguyễn Hải Yến (PQL100068)		a2a07a1d-f90a-4af3-842f-131a62e813e9	t	t	33	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3328172e-3428-4003-a294-ab690a8e9af2	1239	Nguyễn Thị Hoàng Yến	956518cb-bfa9-4ffb-a161-3ce3e0851340	yennth@ptit.edu.vn	VKT100569	Nguyễn Thị Hoàng Yến (VKT100569)		956518cb-bfa9-4ffb-a161-3ce3e0851340	t	t	4	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f74de8da-1939-40ee-9e04-1c588e6a26a6	421	Ngô Thị Yến	9bb3d0de-6283-44f1-afa9-7d296627e0db	yennt@ptit.edu.vn	PTH200381	Ngô Thị Yến (PTH200381)		9bb3d0de-6283-44f1-afa9-7d296627e0db	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cf25565d-c4a7-46e7-81a8-5290f68d9083	223	Phi Hải Yến	1724384d-0568-462e-a79a-2a98cb1f9c8e	yenph@ptit.edu.vn	KTC100096	Phi Hải Yến (KTC100096)		1724384d-0568-462e-a79a-2a98cb1f9c8e	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
37e7da7e-9f86-44e6-b2e7-6a304d935ebb	1166	Đinh Thị Hoàng Yến	ec9e8234-6e3f-4bf7-ba61-5777ba3270a1	yendth@ptit.edu.vn	PSV200405	Đinh Thị Hoàng Yến (PSV200405)		ec9e8234-6e3f-4bf7-ba61-5777ba3270a1	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d63649b1-7e8f-4bd1-8033-21eb6cd74654	549	Đỗ Hải Yến	7159c4df-6035-4770-8e85-cc828bbf0c0a	yendh@ptit.edu.vn	PGV100045	Đỗ Hải Yến (PGV100045)		7159c4df-6035-4770-8e85-cc828bbf0c0a	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
172f341d-051a-4230-9852-9444992c35dd	166	Đỗ Ngọc Yến	009fc749-02a5-493d-b12f-ef88bc7cb653	yendn@ptit.edu.vn	KCB200424	Đỗ Ngọc Yến (KCB200424)		009fc749-02a5-493d-b12f-ef88bc7cb653	t	t	195	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
73e8b04b-f2c1-431f-919e-417f7b6c00e5	507	Đỗ Thị Hải Yến	ea749118-cefb-402a-afa0-292e6ad78ca4	dthyen@ptit.edu.vn	KSD100610	Đỗ Thị Hải Yến (KSD100610)		ea749118-cefb-402a-afa0-292e6ad78ca4	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
98ba0fff-d07e-45b2-8d68-ecdd1dd16a89	52	Đối tác bên ngoài	DOI_TAC	tranglou1003@gmail.com		Đối tác bên ngoài		doi_tac	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
12483cdf-8ebd-4551-8a6a-e2c0897b6701	329	Phạm Minh Ái	3d93b6f4-a36d-450c-bf43-a3c4466fe3c0	aipm@ptit.edu.vn	KCB100191	Phạm Minh Ái (KCB100191)		3d93b6f4-a36d-450c-bf43-a3c4466fe3c0	t	t	229	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
76879583-d255-4c93-9288-a60256517285	232	Lê Thị Ánh	322085e4-e141-496d-a1fd-12fbc43f057d	anhlt1@ptit.edu.vn	KTC100317	Lê Thị Ánh (KTC100317)		322085e4-e141-496d-a1fd-12fbc43f057d	t	t	208	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3089c366-bf71-49ff-be6f-841c309174f7	1105	Nguyễn Văn Ánh	da0455f9-b3cc-48a8-8e1b-8190f858b975		TG0038	Nguyễn Văn Ánh (TG0038)		da0455f9-b3cc-48a8-8e1b-8190f858b975	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
88c1080c-836d-4afb-b963-ef0c01e9afbc	909	Trần Thị Ân	df614a55-9a02-49e0-b8d1-2eb8ef175bd5		TG0117	Trần Thị Ân (TG0117)		df614a55-9a02-49e0-b8d1-2eb8ef175bd5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
05bae293-8bf7-403e-af55-940788196365	548	Phạm Thị Như Ý	64c55b84-b078-401d-9808-91096ec8cb3e	yptn@ptit.edu.vn	PSV100057	Phạm Thị Như Ý (PSV100057)		64c55b84-b078-401d-9808-91096ec8cb3e	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4dca4772-7882-471b-96fa-44195d3acae7	691	Lê Thị Điệp	fae48f44-8421-410c-bc45-7171343b4654		TG0399	Lê Thị Điệp (TG0399)		fae48f44-8421-410c-bc45-7171343b4654	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4a2f762c-d330-41c1-90ae-d9bcb7db8fd6	135	Lưu Ngọc Điệp	5269e90c-c500-4d81-b84e-00d8726a00fc	diepln@ptit.edu.vn	KCN200429	Lưu Ngọc Điệp (KCN200429)		5269e90c-c500-4d81-b84e-00d8726a00fc	t	t	186	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
30b1f7f3-74d8-4196-a0a2-a1a930ecf0ff	532	Nguyễn Ngọc Điệp	7402f015-f448-4f92-a6be-427751313d13	diepnguyenngoc@ptit.edu.vn	KAT100257	Nguyễn Ngọc Điệp (KAT100257)		7402f015-f448-4f92-a6be-427751313d13	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
06a79126-571f-4df9-b87b-32a4d0996b67	813	Bùi Văn Đoàn	d54f9344-ac93-4258-87ff-a70a2bb76333	doanbv@ptit.edu.vn	VPH100134	Bùi Văn Đoàn (VPH100134)		d54f9344-ac93-4258-87ff-a70a2bb76333	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8fda2b6a-2d7b-4616-aa0d-10abe6733a44	765	Lê Xuân Đoàn	adf4badc-2c2f-489f-8691-819757150621		TG0364	Lê Xuân Đoàn (TG0364)		adf4badc-2c2f-489f-8691-819757150621	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9571964d-65a0-4f0c-a126-9d881018fa1c	977	Đặng Hữu Đoàn	3398d1c1-1a57-409e-ab86-5785763a4ff4		TG1332	Đặng Hữu Đoàn (TG1332)		3398d1c1-1a57-409e-ab86-5785763a4ff4	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4f2d532c-c2e0-40d9-862a-4879ccecf8d1	399	Trần Đăng Đoái	9f28e437-87c0-457a-ae19-d727d2bca8f3	doaitd@ptit.edu.vn	PTH200507	Trần Đăng Đoái (PTH200507)		9f28e437-87c0-457a-ae19-d727d2bca8f3	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
24aae873-ead6-4ffd-92e2-045d7e74dbfc	103	Phạm Thanh Đàm	b339828e-86de-4e9a-9ba9-ae72a8e81a91	dampt@ptit.edu.vn	KVT200493	Phạm Thanh Đàm (KVT200493)		b339828e-86de-4e9a-9ba9-ae72a8e81a91	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dd4a613c-fa82-4b2b-a1d7-4761dae25b08	318	Vũ Anh Đào	baa34d0b-0b93-43aa-bdf2-b5e266254149	daova@ptit.edu.vn	KDT100233	Vũ Anh Đào (KDT100233)		baa34d0b-0b93-43aa-bdf2-b5e266254149	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cbab623f-e683-4180-8acb-32fbc18a71aa	828	Vũ Đức Đán	4ba6dc49-88ce-4545-a246-167823e93328	danvd@ptit.edu.vn	KSD100669	Vũ Đức Đán (KSD100669)		4ba6dc49-88ce-4545-a246-167823e93328	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3a6cb524-62c8-4e1a-ba78-24b971cafa67	366	Nguyễn Văn Đông	6abfba40-52b9-425a-80f2-e2a96412edde	dongnv@ptit.edu.vn	TDV100163	Nguyễn Văn Đông (TDV100163)		6abfba40-52b9-425a-80f2-e2a96412edde	t	t	233	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e30dc636-f02b-4e7a-a0d1-02917747b646	974	Phạm Ngọc Đĩnh	5c388a8f-8867-45a7-8a4a-47da082b2309	dinhpn.tg@ptit.edu.vn	TG0073	Phạm Ngọc Đĩnh (TG0073)		5c388a8f-8867-45a7-8a4a-47da082b2309	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
eacde988-b6f5-4fe7-8e6e-4a833d6ac4fc	32	Trần Quang Đại	d15f9f62-61ca-47cb-91b5-a566e71923e7	daitq@ptit.edu.vn	VKH100879	Trần Quang Đại (VKH100879)		d15f9f62-61ca-47cb-91b5-a566e71923e7	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
19af065f-6baf-48f7-95cb-ca1e640db987	502	Hoàng Đắc Đạt	e61c74e4-1776-42b3-a01d-b52a9c51056c	dathd@ptit.edu.vn	VCN100771	Hoàng Đắc Đạt (VCN100771)		e61c74e4-1776-42b3-a01d-b52a9c51056c	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5cc933a1-4422-4b8e-99e1-143d5c46c9c9	260	Lê Sỹ Đạt	efc58185-37c5-4e56-86be-903bf7c307e4	datls@ptit.edu.vn	KVT100700	Lê Sỹ Đạt (KVT100700)		efc58185-37c5-4e56-86be-903bf7c307e4	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
247d11b5-b8ff-44d6-94a4-05fbe3c77fb4	1413	Nguyễn Mạnh Đạt	DatNM.B24CC053@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Mạnh Đạt		c0faa7ec-b31e-4a2e-832b-4ce2fa1e96d5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f28f0511-e7a5-42b9-ae1a-9d6dc48d27cc	874	Nguyễn Tiến Đạt	f10df4ad-4752-4463-844d-bc9a11847031	datnt1@ptit.edu.vn	KCB100947	Nguyễn Tiến Đạt (KCB100947)		f10df4ad-4752-4463-844d-bc9a11847031	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3987bec2-907c-4d8b-9f87-1ce86da0e554	86	Nguyễn Đình Đạt	DatND.B23CC032@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Đình Đạt		4df47f78-188b-4ef7-8711-1a988fcaf542	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ec456d78-fdb3-4582-a0b4-5c4e686517b8	1303	Ngô Tiến Đạt	e0b73d5c-3289-4969-ba90-2e4ea0fa1f6a	datnt@ptit.edu.vn	VPH101053	Ngô Tiến Đạt (VPH101053)		e0b73d5c-3289-4969-ba90-2e4ea0fa1f6a	t	t	37	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
15f92fbb-5193-4299-b2bd-fb1aa417544e	1451	Phạm Thành Đạt	70423d2d-13fb-4305-922c-281e09ca7566	datpt@ptit.edu.vn	VKH101147	Phạm Thành Đạt (VKH101147)		70423d2d-13fb-4305-922c-281e09ca7566	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0dd5b249-4987-4c5d-b554-6b3a72b50bb6	1417	Phạm Tiến Đạt	DatPT.B24CC058@stu.ptit.edu.vn	tranglou1003@gmail.com		Phạm Tiến Đạt		7a3ab855-2e33-426d-8c58-e65f82b2d40f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b1f57f27-ca9d-4fab-8d38-b420d554ab9f	717	Trần Anh Đạt	56f6ecd3-01c0-466d-b6e6-58f45d6117c9	datta.tg@ptit.edu.vn	TG0548	Trần Anh Đạt (TG0548)		56f6ecd3-01c0-466d-b6e6-58f45d6117c9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e9960385-e4e4-44cd-8ea2-ae94d9a1df62	117	Trần Đình Đạt	4441849e-9978-4251-af49-c50f6f448d8b	dattd@ptit.edu.vn	KDT200455	Trần Đình Đạt (KDT200455)		4441849e-9978-4251-af49-c50f6f448d8b	t	t	179	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4c594375-8116-4904-8a3c-5863ddb99930	1391	Tưởng Văn Đạt	a195d0ca-95dd-4072-ba9a-698e6fb62b3a	dattv@ptit.edu.vn	KCN101123	Tưởng Văn Đạt (KCN101123)		a195d0ca-95dd-4072-ba9a-698e6fb62b3a	t	t	22	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2242c34-bffe-47d0-b4a5-2c5c74964a88	464	Tạ Quốc Đạt	b44671a4-02d4-482f-9c2c-dec26bf66bb7	dattq@ptit.edu.vn	VKT101047	Tạ Quốc Đạt (VKT101047)		b44671a4-02d4-482f-9c2c-dec26bf66bb7	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1b1b79ea-3764-4cc4-836d-9726b5a66612	453	Đậu Xuân Đạt	f11ee089-30d2-4b76-b2a4-26adf9e1e2a8	datdx@ptit.edu.vn	VKT100931	Đậu Xuân Đạt (VKT100931)		f11ee089-30d2-4b76-b2a4-26adf9e1e2a8	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
383eca63-34e1-4627-82e8-a04cd95d8877	741	Đỗ Hoàng Đạt	14852d8b-aebd-4047-913f-4723ad1ffc82		TG0512	Đỗ Hoàng Đạt (TG0512)		14852d8b-aebd-4047-913f-4723ad1ffc82	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
43107a9a-201b-4c39-b362-ccc3ac48faf3	1027	Nguyễn Viết Đảm	dc76c8a0-9e74-4301-8c4a-c4c51c09907e	damnv@ptit.edu.vn	KVT100292	Nguyễn Viết Đảm (KVT100292)		dc76c8a0-9e74-4301-8c4a-c4c51c09907e	t	t	214	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1e729968-6a1b-4577-9f45-25a90d90faac	713	Chu Thị Kim Định	ff88023d-1da8-41bd-888b-f8b76e7187a8		TG0397	Chu Thị Kim Định (TG0397)		ff88023d-1da8-41bd-888b-f8b76e7187a8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
c2cf7a2e-5794-47be-a142-a61de28a90a7	383	Nguyễn Quang Định	4baf2f6a-acf1-43d9-a370-19a24129ea7b	nqdinh@ptit.edu.vn	TDV100162	Nguyễn Quang Định (TDV100162)		4baf2f6a-acf1-43d9-a370-19a24129ea7b	t	t	234	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
88f47033-2e41-44f6-8dcd-533301da7054	723	Nguyễn Thị Kim Định	5d061e20-b68e-4820-a652-ba00daa7f1e8		TG0424	Nguyễn Thị Kim Định (TG0424)		5d061e20-b68e-4820-a652-ba00daa7f1e8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d53dab29-d2f6-4f26-996c-b3f49d2ac0a1	87	Trần Đức Định	DinhTD.B23CC038@stu.ptit.edu.vn	tranglou1003@gmail.com		Trần Đức Định		7d2e79bd-59b0-4cb8-ac86-b79a8a7f778f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0be86d22-6c88-4dde-bff3-63ea2156df11	1009	Nguyễn Trung Đồng	27837dca-e591-4492-a504-19755682c1f1		TG0040	Nguyễn Trung Đồng (TG0040)		27837dca-e591-4492-a504-19755682c1f1	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ab6bc280-5190-444f-9af8-2a9cfa06b195	685	Nguyễn Văn Đợi	8f0c202f-8b35-4a3a-958a-0eb4481dde19		TG0560	Nguyễn Văn Đợi (TG0560)		8f0c202f-8b35-4a3a-958a-0eb4481dde19	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b3b5bcb-055b-4e45-99cb-061382ea7880	1231	Bùi Quang Đức	114b684c-cab8-476c-bf5f-386b1511c0f8	ducbq@ptit.edu.vn	KVT200762	Bùi Quang Đức (KVT200762)		114b684c-cab8-476c-bf5f-386b1511c0f8	t	t	171	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d15b8e3d-4a55-4517-b342-145737f2bf4e	283	Dương Trần Đức	5e77d76e-a430-4957-ac64-7ee719766bdf	ducdt@ptit.edu.vn	KCN100258	Dương Trần Đức (KCN100258)		5e77d76e-a430-4957-ac64-7ee719766bdf	t	t	222	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d06272f8-a8ea-4647-bc3e-97ef222c18a3	1017	Khuất Văn Đức	4c47982e-25c9-417b-a630-84fc6fcdc738	duckv@ptit.edu.vn	KVT100696	Khuất Văn Đức (KVT100696)		4c47982e-25c9-417b-a630-84fc6fcdc738	t	t	212	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cf561cf5-a0da-4037-9d27-8b994599c559	1246	Kiều Trung Đức	a579cf31-bd8a-417a-93a1-bdd85e8b2680	duckt@ptit.edu.vn	VCN100859	Kiều Trung Đức (VCN100859)		a579cf31-bd8a-417a-93a1-bdd85e8b2680	t	t	59	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20696b7e-2614-4b3c-9aa4-7d2fc3408fa1	1258	Lê Anh Đức	25f29e55-396f-4690-90ee-7fe96efa7f0b	ducla@ptit.edu.vn	TDT100939	Lê Anh Đức (TDT100939)		25f29e55-396f-4690-90ee-7fe96efa7f0b	t	t	49	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8afaca12-23ed-4e4d-9b66-25bad6c4021e	1245	Nguyễn Minh Đức	dec3d873-13ed-4b93-bb55-fbf7c8904385	ducnm@ptit.edu.vn	VCN100842	Nguyễn Minh Đức (VCN100842)		dec3d873-13ed-4b93-bb55-fbf7c8904385	t	t	58	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20f9e439-7ae9-4557-8a37-ee8fbb0430d5	85	Nguyễn Minh Đức	DucNM.B23CC042@stu.ptit.edu.vn	tranglou1003@gmail.com		Nguyễn Minh Đức		27f13a0b-3ba9-4d30-936b-62aef89e3daa	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d4474334-c973-4c60-956a-3b0136cc79c2	1372	Nguyễn Xuân Đức	06c14937-5255-4018-b67b-91a357a15300	ducnx@ptit.edu.vn	KCN101090	Nguyễn Xuân Đức (KCN101090)		06c14937-5255-4018-b67b-91a357a15300	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8430249b-5edd-47e9-866f-ccee5d9c38bf	973	Ngô Tiến Đức	2331eee6-cd00-4559-ab79-31b51f074cba	ducnt@ptit.edu.vn	KCN100926	Ngô Tiến Đức (KCN100926)		2331eee6-cd00-4559-ab79-31b51f074cba	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02517dd6-c65f-45dd-9e4a-8faf58b6901d	159	Phạm Hồng Đức	ab6839c8-5a5d-4097-9d28-562bf0fbc5c7	ducph@ptit.edu.vn	KCB200415	Phạm Hồng Đức (KCB200415)		ab6839c8-5a5d-4097-9d28-562bf0fbc5c7	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
02598f1d-cd97-4810-8374-990bfbdfd58c	300	Trương Minh Đức	3ac48242-1cff-4402-b6d2-1200055f1e1c	ductm@ptit.edu.vn	KDT100789	Trương Minh Đức (KDT100789)		3ac48242-1cff-4402-b6d2-1200055f1e1c	t	t	225	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
027d2258-b481-44f0-b064-a7f83015800f	872	Trần Đình Đức	662b3741-9ed2-4016-bda0-88b91b92202c	ductd@ptit.edu.vn	KCB101060	Trần Đình Đức (KCB101060)		662b3741-9ed2-4016-bda0-88b91b92202c	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2170b433-d1f4-4df6-9dc9-a6966d516bc3	1064	Đàm Truyền Đức	e6ce9d06-2060-48b7-9d58-87d06048d1fb		TG0320	Đàm Truyền Đức (TG0320)		e6ce9d06-2060-48b7-9d58-87d06048d1fb	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
72b68079-b273-4440-9113-5bf537db33bf	231	Đặng Thị Việt Đức	47d84592-2cad-4ead-a6f5-68ee740cf845	ducdtv@ptit.edu.vn	KTC100313	Đặng Thị Việt Đức (KTC100313)		47d84592-2cad-4ead-a6f5-68ee740cf845	t	t	20	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8395701a-2d3e-456e-ae33-dab21d62ca09	1131	Đỗ Quang Đức	ec81b8cd-0e5c-449d-8e10-942995df8df5		TG0464	Đỗ Quang Đức (TG0464)		ec81b8cd-0e5c-449d-8e10-942995df8df5	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3dc7ecb7-276b-4b0d-90b5-3d37d6bce3fb	1071	Đỗ Văn Đức	bcae1f2c-55da-4e28-9715-55b96206e243	ducdv1@ptit.edu.vn	KQT101064	Đỗ Văn Đức (KQT101064)		bcae1f2c-55da-4e28-9715-55b96206e243	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9e4dca17-3dbe-478b-bbe1-2068f728551d	10	Demo Lãnh đạo	DEMOLD	tranglou1003@gmail.com		Demo Lãnh đạo		demold	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5ea691e5-ee5f-4b94-b4ef-5e68a5e74d7e	1540	Bùi Anh Tuấn	de2c8a43-369e-475d-89f6-d32ca508e949	batuan@ptit.edu.vn	VKT101271	Bùi Anh Tuấn (VKT101271)		de2c8a43-369e-475d-89f6-d32ca508e949	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
67168468-ef01-4fa7-92f9-ea0dfab62c25	1586	Bùi Mai Chi	a5b04c56-6e8a-4956-b603-4488317a6a0c	chibm@ptit.edu.vn	VKH101270	Bùi Mai Chi (VKH101270)		a5b04c56-6e8a-4956-b603-4488317a6a0c	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a2acf920-73d1-4372-b445-c40052bde0de	1483	Bùi Minh Hải	7967b0a6-91bd-41f5-af18-1c990709983a	haibm@ptit.edu.vn	VKH101143	Bùi Minh Hải (VKH101143)		7967b0a6-91bd-41f5-af18-1c990709983a	t	t	257	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cc37662b-68bf-4d32-9bf2-87969359426b	1500	Bùi Quốc Huy	9b5dd4bd-4a42-4d4b-afe0-4262c966cdbd	huybq@ptit.edu.vn	KDP101173	Bùi Quốc Huy (KDP101173)		9b5dd4bd-4a42-4d4b-afe0-4262c966cdbd	t	t	200	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
16ef6d64-827a-4d0e-95aa-676276d2adaa	1589	Bùi Thanh Hoa	61007a67-47b8-4e44-8e20-efbc667ede1e	hoabt.tg@ptit.edu.vn	RA005	Bùi Thanh Hoa (RA005)		61007a67-47b8-4e44-8e20-efbc667ede1e	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
1955352a-bafb-4ac6-9b60-11fcbddda715	1520	Bùi Thị Bích Hường	52a0047f-ce33-4fd3-ab9a-eae22afd72da	huongbtb@ptit.edu.vn	PSV101238	Bùi Thị Bích Hường (PSV101238)		52a0047f-ce33-4fd3-ab9a-eae22afd72da	t	t	35	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
849e008f-b0f6-4ef6-a80c-5e388376e7a2	1560	Bùi Tiến Đức	0347d368-620b-4625-bddf-565f6c83b90b	ducbt@ptit.edu.vn	KCN201253	Bùi Tiến Đức (KCN201253)		0347d368-620b-4625-bddf-565f6c83b90b	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6380ac0a-7d6e-4895-964e-05aa24484b2f	1486	Bùi Văn Công	62911547-47e3-40be-85ca-d8282e322776	congbv@ptit.edu.vn	KAT101239	Bùi Văn Công (KAT101239)		62911547-47e3-40be-85ca-d8282e322776	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4581e9c8-e4ca-4056-9416-3c0bf065b919	1470	Bùi Đình Quế	7bcd8cc9-4f5c-4cfc-be9d-caad0aed9378	quebd@ptit.edu.vn	KQT201166	Bùi Đình Quế (KQT201166)		7bcd8cc9-4f5c-4cfc-be9d-caad0aed9378	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b493456e-9306-4590-830b-5fae75d72dfd	1490	Dương Ngọc Sơn	f49b57ff-4d8f-40c0-ba04-4d1d90a3da25	sondn@ptit.edu.vn	KDT101179	Dương Ngọc Sơn (KDT101179)		f49b57ff-4d8f-40c0-ba04-4d1d90a3da25	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
34205064-4926-4fab-afc7-1914517517ce	1501	Dương Ngọc Ánh	79b9be56-d563-4a33-90bb-ddeac35775e8	anhdn@ptit.edu.vn	TDM101201	Dương Ngọc Ánh (TDM101201)		79b9be56-d563-4a33-90bb-ddeac35775e8	t	t	255	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4fcf0c2c-f080-4339-bf31-865d1bdb0b25	1598	Hà Thị Thanh	9e46b56d-8556-4561-9fbe-7e30add02ab6	thanhht.tg@ptit.edu.vn	TG006	Hà Thị Thanh (TG006)		9e46b56d-8556-4561-9fbe-7e30add02ab6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8d40d264-224f-4c8c-9162-d9cb5c8bd3f3	1561	Hoàng Bảo Long	499fdb0b-d029-4da1-9f97-65ab1a82dcff	longhb.tg@ptit.edu.vn	TG0686	Hoàng Bảo Long (TG0686)		499fdb0b-d029-4da1-9f97-65ab1a82dcff	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2d332489-4453-4119-8e5a-0da69b6ad4ae	1534	Hoàng Duy Linh	7f842fa4-07fb-4ee6-b328-41e707cb96fe	linhhd@ptit.edu.vn	KDP101275	Hoàng Duy Linh (KDP101275)		7f842fa4-07fb-4ee6-b328-41e707cb96fe	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
485a9a9d-111a-451c-837b-1ac12002c512	1535	Hoàng Hà Dung	9bbaa6ea-082d-4aed-a03f-155e49577a24	dunghh@ptithcm.edu.vn	PTH201251	Hoàng Hà Dung (PTH201251)		9bbaa6ea-082d-4aed-a03f-155e49577a24	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
72431fc7-8c2d-480e-8185-171e3d3abe27	1461	Hoàng Thị Phương Anh	fcf101cb-c3f2-43c6-9b38-0bef533013cd	anhhtp@ptit.edu.vn	KVT201200	Hoàng Thị Phương Anh (KVT201200)		fcf101cb-c3f2-43c6-9b38-0bef533013cd	t	t	173	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5d093e0d-db28-4ff6-92ee-25ab96b975b6	1603	Hà Thanh Thư	c466811e-b808-4971-a772-f52643e957d1	thuht1@ptit.edu.vn	KDP101299	Hà Thanh Thư (KDP101299)		c466811e-b808-4971-a772-f52643e957d1	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
6af7de76-76f9-47d1-a5ba-0b19a3d551f3	1542	Hồ Nam Trân	808ffb33-38ef-4a5b-9537-d95872db3d1d	tranhn.tg@ptit.edu.vn	TG0689	Hồ Nam Trân (TG0689)		808ffb33-38ef-4a5b-9537-d95872db3d1d	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a9189f19-b0a9-4145-90d3-7f372245b5b4	1546	Hồ Thị Minh Hòa	4118812d-8d61-4bf6-9e5b-481f7a31dd2b	hoahtm@ptit.edu.vn	KCB201210	Hồ Thị Minh Hòa (KCB201210)		4118812d-8d61-4bf6-9e5b-481f7a31dd2b	t	t	11	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e2977f22-e2b2-47f8-bb8b-74eef1acb490	1526	Kiều Thị Hương Nhàn	27a25980-cac7-49f0-b1d0-4cf9a5994108	nhankth@ptit.edu.vn	VLD101194	Kiều Thị Hương Nhàn (VLD101194)		27a25980-cac7-49f0-b1d0-4cf9a5994108	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
229daf56-57af-4808-857d-3e30317033fd	1528	Lê Hữu Phương	7cca47a0-505c-451c-8e5a-d2613b150cf7	phuonglh@ptit.edu.vn	KDP101220	Lê Hữu Phương (KDP101220)		7cca47a0-505c-451c-8e5a-d2613b150cf7	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7cbf235-9789-45c1-a59e-b84225366184	1584	Lê Ngọc Hiếu	735357f3-8e17-4087-ae94-05e8b130575e	lnhieu@ptit.edu.vn	KCN101221	Lê Ngọc Hiếu (KCN101221)		735357f3-8e17-4087-ae94-05e8b130575e	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ef5826cc-32d4-4511-a7d4-f989a8457979	1504	Lê Như Quỳnh	bd504be1-f596-4c99-a322-0de95f176bb6	quynhln@ptit.edu.vn	KCN101223	Lê Như Quỳnh (KCN101223)		bd504be1-f596-4c99-a322-0de95f176bb6	t	t	221	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
308f594c-5337-4988-9e84-c888c3576919	1531	Lương Ngọc Sơn	1afd24e5-3622-4a72-9d28-7a3e40c52e5f	sonln@ptit.edu.vn	KTC101240	Lương Ngọc Sơn (KTC101240)		1afd24e5-3622-4a72-9d28-7a3e40c52e5f	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4313a78b-15a5-4544-bc20-dd5f9b35a6a1	1519	Mai Hồng Anh	8b61ada1-ab91-4a70-b15b-6b517e2c6d9d	anhmh@ptit.edu.vn	KVT201207	Mai Hồng Anh (KVT201207)		8b61ada1-ab91-4a70-b15b-6b517e2c6d9d	t	t	7	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
900f2946-dcc2-4020-b65e-43bf6dbe0c23	1592	Mai Ngọc Lương	5674263c-b6f3-4ed8-82d5-661ec6515218	luongmn.tg@ptit.edu.vn	LUONGMN	Mai Ngọc Lương (LUONGMN)		5674263c-b6f3-4ed8-82d5-661ec6515218	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
59cd6e2d-52ea-4d81-9a9a-95ed188c721a	1468	Mai Thị Diệu Hải	ae730dcf-f5f6-435e-9c89-5f287eb3bf55	haimtd@ptit.edu.vn	TDM101164	Mai Thị Diệu Hải (TDM101164)		ae730dcf-f5f6-435e-9c89-5f287eb3bf55	t	t	255	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8e990090-ebd4-4100-b4cd-85ac7fa244f6	1488	Mai Xuân Nhật	d3e5c79f-f73b-4436-9d77-7beb4bc73c8e	nhatmx@ptit.edu.vn	KAT101189	Mai Xuân Nhật (KAT101189)		d3e5c79f-f73b-4436-9d77-7beb4bc73c8e	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
69171ad5-f375-46ba-81da-95bc1666f65a	1513	Mai Đức Bình	a2857475-79d4-46e2-a0d9-394d57531ca4	binhmd@ptit.edu.vn	KTN101216	Mai Đức Bình (KTN101216)		a2857475-79d4-46e2-a0d9-394d57531ca4	t	t	240	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3ec5b5c2-2919-43e6-ad8c-20e96dba48c2	1595	Nguyễn Duy Quang	73193c17-0704-4b19-b034-5e8aa5068c37	quangnd.tg@ptit.edu.vn	RA002	Nguyễn Duy Quang (RA002)		73193c17-0704-4b19-b034-5e8aa5068c37	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
fe378ee5-67b8-4b71-97bd-53080028ca86	1516	Nguyễn Dũng Chinh	89e06cd6-12d2-4076-9ad8-b6a71bcf7db6	ndchinh@ptit.edu.vn	KCB201209	Nguyễn Dũng Chinh (KCB201209)		89e06cd6-12d2-4076-9ad8-b6a71bcf7db6	t	t	193	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bc02ea2e-8617-41b3-a3ca-7e932e62263d	1469	Nguyễn Huỳnh An	9142189e-2998-4d5c-924f-79f613fbb8c1	annh1@ptit.edu.vn	KQT201165	Nguyễn Huỳnh An (KQT201165)		9142189e-2998-4d5c-924f-79f613fbb8c1	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
dde45ae5-910d-4cb8-b35a-b732390f0b64	1463	Nguyễn Hạnh Mỹ	ef6ce907-06b1-43b3-a231-45b3a5d50b1c	mynh@ptit.edu.vn	KDP101180	Nguyễn Hạnh Mỹ (KDP101180)		ef6ce907-06b1-43b3-a231-45b3a5d50b1c	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b6a649ff-c374-4fa1-8b7d-8aeadca1c263	1495	Nguyễn Hải Anh	27ce2b1b-1368-44d6-8d43-f6fc1e0c12ef	anhhn@ptit.edu.vn	KQT101196	Nguyễn Hải Anh (KQT101196)		27ce2b1b-1368-44d6-8d43-f6fc1e0c12ef	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f7bd38e2-2a88-47c2-8ece-44c3d5310386	1505	Nguyễn Hải Yến	a622efaa-b72d-4bef-8f3b-11d2c39b4884	nhyen@ptit.edu.vn	KCN101224	Nguyễn Hải Yến (KCN101224)		a622efaa-b72d-4bef-8f3b-11d2c39b4884	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b4c250a4-1966-4092-bb6b-79bb33da3f49	1476	Nguyễn Hằng Phương	c04aebf0-0078-435f-a820-42640c6c4fe3	phuongnh@ptit.edu.vn	KTN101162	Nguyễn Hằng Phương (KTN101162)		c04aebf0-0078-435f-a820-42640c6c4fe3	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
abd8eaab-2c0e-4500-a480-a0c9ae08c7d2	1544	Nguyễn Hồng Kim Yến	fb8e76d8-f848-449b-bddb-bcf5941651df	yennhk@ptit.edu.vn	PSV201250	Nguyễn Hồng Kim Yến (PSV201250)		fb8e76d8-f848-449b-bddb-bcf5941651df	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0f55c64a-c9c9-43e0-8f3d-a627688768dc	1489	Nguyễn Hồng Quảng	ef3a6ffd-bb66-4b9e-9ea4-3e94a12fc566	quangnh1@ptit.edu.vn	KDP101184	Nguyễn Hồng Quảng (KDP101184)		ef3a6ffd-bb66-4b9e-9ea4-3e94a12fc566	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
797a1bc6-76f7-4134-8b51-1793c8528168	1530	Nguyễn Minh Quang	be1143cb-f15a-4939-b64a-94e0501343c1	quangnm@ptit.edu.vn	KTN101243	Nguyễn Minh Quang (KTN101243)		be1143cb-f15a-4939-b64a-94e0501343c1	t	t	240	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9660057f-b279-4d4b-8323-f4a5af603fb2	1554	Nguyễn Minh Triết	05a97ca2-4dbb-46ac-8aea-4f5da0cdb3c4	trietnm@ptit.edu.vn	KDT201259	Nguyễn Minh Triết (KDT201259)		05a97ca2-4dbb-46ac-8aea-4f5da0cdb3c4	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2ec21bb1-dc63-4ace-87e7-c6b1b47bab00	1559	Nguyễn Minh Tâm	8300a373-08d1-401b-b351-f5d416444144	tamnm@ptit.edu.vn	KCN201241	Nguyễn Minh Tâm (KCN201241)		8300a373-08d1-401b-b351-f5d416444144	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
999ca35e-6b4c-45bb-aaa1-4104f492893c	1596	Nguyễn Mạnh Tuấn	9b1b8061-1a8f-4abf-9fa4-90da5269462f	tuannm.tg@ptit.edu.vn	RA003	Nguyễn Mạnh Tuấn (RA003)		9b1b8061-1a8f-4abf-9fa4-90da5269462f	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
bc65ac9f-6419-4c37-bde9-12f39b7d92d3	1497	Nguyễn Ngọc Hải	0c4d3e48-7af0-45d1-9cd1-c9e3bea7937e	hainn1@ptit.edu.vn	VLD101212	Nguyễn Ngọc Hải (VLD101212)		0c4d3e48-7af0-45d1-9cd1-c9e3bea7937e	t	t	245	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2e8cbeec-5064-4700-9097-5aaf45b98590	1521	Nguyễn Ngọc Tiến	d273677c-ce10-45d0-99b8-5bffd1029fb7	tiennn@ptit.edu.vn	KSD101218	Nguyễn Ngọc Tiến (KSD101218)		d273677c-ce10-45d0-99b8-5bffd1029fb7	t	t	25	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ff8029c1-7443-44fb-8f22-e2b6ef04df6a	1587	Nguyễn Phương Hải	7ac02ff8-6fdc-47a9-9b1c-da6e9c9998c9	hainp@ptit.edu.vn	VKH101292	Nguyễn Phương Hải (VKH101292)		7ac02ff8-6fdc-47a9-9b1c-da6e9c9998c9	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
25a9842a-7b94-4876-940f-dddfe907b3a9	1487	Nguyễn Phương Mai	9be08676-2a58-42b0-82ec-675a5d325f02	mainp@ptit.edu.vn	KAT101188	Nguyễn Phương Mai (KAT101188)		9be08676-2a58-42b0-82ec-675a5d325f02	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5b8220af-a56c-4bfa-a830-f4e279136949	1536	Nguyễn Phương Thảo	7c5f1ad5-dcc9-4c06-ae77-231a755ab33a	thaonp1@ptit.edu.vn	VKT101273	Nguyễn Phương Thảo (VKT101273)		7c5f1ad5-dcc9-4c06-ae77-231a755ab33a	t	t	63	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7bd838b7-9e63-4edd-8ca4-2aec554be836	1478	Nguyễn Quỳnh Phương	8383b687-1042-4195-b3bd-d7ddf1a2143b	phuongnq@ptit.edu.vn	TDT101169	Nguyễn Quỳnh Phương (TDT101169)		8383b687-1042-4195-b3bd-d7ddf1a2143b	t	t	47	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a7e47461-79da-425b-b126-b85d0cbd244c	1523	Nguyễn Thu Hằng	8667c1c1-e66b-4e3b-aa9a-cf02e65ccb2c	hangnt@ptit.edu.vn	VKT101195	Nguyễn Thu Hằng (VKT101195)		8667c1c1-e66b-4e3b-aa9a-cf02e65ccb2c	t	t	4	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
071069b3-5426-49da-a8f8-aabfd4d7711a	1464	Nguyễn Thành Long	42515680-61d9-43c9-8e48-a2e2bf13cd63	longnt@ptit.edu.vn	PTH201159	Nguyễn Thành Long (PTH201159)		42515680-61d9-43c9-8e48-a2e2bf13cd63	t	t	239	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e2668f95-090f-4c37-b173-f66bffd84f41	1527	Nguyễn Thành Phúc	d34d4507-b5d7-4b78-af97-26efd6b2cf53	phucntp@ptit.edu.vn	KDP101219	Nguyễn Thành Phúc (KDP101219)		d34d4507-b5d7-4b78-af97-26efd6b2cf53	t	t	198	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7a1b9e35-3ccb-445c-b32f-0ba6eb5b931e	1518	Nguyễn Thái Bình	7a621a7a-331a-4e17-a7f9-547045cd3844	ntbinh@ptit.edu.vn	KQT201206	Nguyễn Thái Bình (KQT201206)		7a621a7a-331a-4e17-a7f9-547045cd3844	t	t	176	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e28bfde6-c0af-41c1-b3ad-2e202481b881	1493	Nguyễn Thái Hà	bfd22408-4050-4817-ad13-6847ea567f65	hant.tg@ptit.edu.vn	TG0693	Nguyễn Thái Hà (TG0693)		bfd22408-4050-4817-ad13-6847ea567f65	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0d329dff-ade2-4d6b-af99-ca24c3d20d05	1550	Nguyễn Thị Diệu Hiền	d682e887-1e95-438f-a2c5-c39af92e0a72	hienntd@ptit.edu.vn	KDT201208	Nguyễn Thị Diệu Hiền (KDT201208)		d682e887-1e95-438f-a2c5-c39af92e0a72	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
23b3b8e6-762b-4a0e-85dc-fff5a2f9b21c	1537	Nguyễn Thị Hồng	a7b8f219-0388-477f-aeba-13ea4be3528b	nthong@ptit.edu.vn	VKT101272	Nguyễn Thị Hồng (VKT101272)		a7b8f219-0388-477f-aeba-13ea4be3528b	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a0e77005-a532-4c56-9591-22f558e57701	1602	Nguyễn Thị Kim Oanh	a2d58f32-509c-4da7-a46c-815680a95981	oanhntk@ptit.edu.vn	KDP101282	Nguyễn Thị Kim Oanh (KDP101282)		a2d58f32-509c-4da7-a46c-815680a95981	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
3781ff8f-de88-4fb8-883b-87005567719f	1494	Nguyễn Thị Lan Anh	6ef5e8f9-534e-4856-b130-716f39ce7983	anhntl@ptit.edu.vn	KQT101197	Nguyễn Thị Lan Anh (KQT101197)		6ef5e8f9-534e-4856-b130-716f39ce7983	t	t	205	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
cf707589-2f2b-4f8f-982a-21d808a26552	1541	Nguyễn Thị Lý	3013ede0-5cda-44e8-94c7-be72ba497c43	lynt1.tg@ptit.edu.vn	TG0688	Nguyễn Thị Lý (TG0688)		3013ede0-5cda-44e8-94c7-be72ba497c43	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2712b832-32b6-465b-a950-588f3886268c	1473	Nguyễn Thị Nga	1fc73ecc-65e0-4bc4-9192-e8e74393066b	ngant1@ptit.edu.vn	KCB101141	Nguyễn Thị Nga (KCB101141)		1fc73ecc-65e0-4bc4-9192-e8e74393066b	t	t	232	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
728d6bbd-5515-4860-a5d7-2072cdd46598	1471	Nguyễn Thị Ngọc Huyền	c39aa7a2-ab93-49b6-aa23-c009e95944ad	huyenntn@ptit.edu.vn	KTN101163	Nguyễn Thị Ngọc Huyền (KTN101163)		c39aa7a2-ab93-49b6-aa23-c009e95944ad	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
ec0b9f65-08eb-460e-9994-2a73ca1d3079	1481	Nguyễn Thị Ngọc Ánh	e67ce7b0-9d3a-4c37-8661-bff683625358	anhntn1@ptit.edu.vn	VKH101128	Nguyễn Thị Ngọc Ánh (VKH101128)		e67ce7b0-9d3a-4c37-8661-bff683625358	t	t	237	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
d5cdc89f-9b18-4b34-ad0e-82abcb858e39	1594	Nguyễn Thị Oanh	804fc6a9-0e19-40cf-97b6-d23a39798f24	oanhnt.tg@ptit.edu.vn	OANHNT	Nguyễn Thị Oanh (OANHNT)		804fc6a9-0e19-40cf-97b6-d23a39798f24	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0d951f60-61a3-47e0-8ba6-22393e455dbb	1467	Nguyễn Thị Phương Anh	619bd1de-612c-4380-9845-1cd65ff7ec29	anhntp@ptit.edu.vn	TDM101158	Nguyễn Thị Phương Anh (TDM101158)		619bd1de-612c-4380-9845-1cd65ff7ec29	t	t	255	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f31944d0-678f-4fcd-817f-4e9d48e9fc68	1562	Nguyễn Thị Quỳnh Anh	da2b687c-6369-4c8c-8d69-319829cb0a55	anhntq.tg@ptit.edu.vn	TG0685	Nguyễn Thị Quỳnh Anh (TG0685)		da2b687c-6369-4c8c-8d69-319829cb0a55	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a5215b85-8ea3-46b4-b697-2884978afcb5	1512	Nguyễn Thị Thoan	3950c933-65f8-4b28-ae6a-0c1588e9e54d	thoannt@ptit.edu.vn	KQT101227	Nguyễn Thị Thoan (KQT101227)		3950c933-65f8-4b28-ae6a-0c1588e9e54d	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7bf60129-78cf-4d9d-a3af-94d692dab5e3	1465	Nguyễn Thị Thuý	03ddd959-af10-4afc-8c65-6d8b47e4ab71	thuynt1.tg@ptit.edu.vn	TG0625	Nguyễn Thị Thuý (TG0625)		03ddd959-af10-4afc-8c65-6d8b47e4ab71	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
de27b1fa-6e0c-4c83-8bbd-070ea1f9cfca	1485	Nguyễn Thị Trang	6ad1048d-6624-43a6-9f62-53be241321c9	trangnt1.tg@ptit.edu.vn	TG0621	Nguyễn Thị Trang (TG0621)		6ad1048d-6624-43a6-9f62-53be241321c9	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5feb1ffb-58dc-4175-a6d0-207ac1a9ef6c	1597	Nguyễn Thị Điệu	8b9cee74-941e-4202-b18a-350a0bd56254	dieunt.tg@ptit.edu.vn	RA004	Nguyễn Thị Điệu (RA004)		8b9cee74-941e-4202-b18a-350a0bd56254	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8c6f6a0f-4e3e-410f-9299-8b718c6457d2	1590	Nguyễn Tiến Duy	ca9409de-d6c4-478f-aebb-e8ede8d62cb0	duynt.tg@ptit.edu.vn	DUYNT	Nguyễn Tiến Duy (DUYNT)		ca9409de-d6c4-478f-aebb-e8ede8d62cb0	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f4fbed83-da7a-4a82-b0a9-d80708d24509	1591	Nguyễn Tiến Hùng	8417dd6b-bdd7-413e-b7eb-093374787ad6	hungnt@ptit.edu.vn	HUNGNT	Nguyễn Tiến Hùng (HUNGNT)		8417dd6b-bdd7-413e-b7eb-093374787ad6	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e3e87c8f-ca18-4e73-887f-86ed097f6530	1538	Nguyễn Trịnh Thảo Uyên	4b13a631-3789-4b59-8e06-a90a59738a10	uyenntt1@ptit.edu.vn	VKT101276	Nguyễn Trịnh Thảo Uyên (VKT101276)		4b13a631-3789-4b59-8e06-a90a59738a10	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
173d42d6-9b18-4d7a-bec3-11273d11c2a3	1548	Nguyễn Viết Sang	37ecce26-7299-4e2b-b44b-0a152f942ba9	sangnv@ptit.edu.vn	KCB201280	Nguyễn Viết Sang (KCB201280)		37ecce26-7299-4e2b-b44b-0a152f942ba9	t	t	11	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2a9561fc-89b1-4f72-ad0e-cc20fe23047e	1498	Nguyễn Việt Dũng	642d94dd-f246-41f0-90f3-8baee803ce49	dungnv2@ptit.edu.vn	KTN1-HM01214	Nguyễn Việt Dũng (KTN1-HM01214)		642d94dd-f246-41f0-90f3-8baee803ce49	t	t	253	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5504b82c-0986-4889-949d-84f4cd0edc40	1479	Nguyễn Văn Minh Sang	c345ea80-d297-47bf-a9fe-e1c0167b34fc	sangnvm@ptit.edu.vn	KVT201133	Nguyễn Văn Minh Sang (KVT201133)		c345ea80-d297-47bf-a9fe-e1c0167b34fc	t	t	172	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
677450b9-27a2-465a-95ed-d5d662a75735	1547	Nguyễn Văn Phước	9c6be342-fc7e-4149-b00c-176c22d56a32	nvphuoc@ptit.edu.vn	KCB201252	Nguyễn Văn Phước (KCB201252)		9c6be342-fc7e-4149-b00c-176c22d56a32	t	t	11	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e4e3902c-49ec-40a4-9cbb-bda18a007337	1539	Nguyễn Đình Hải	771b0986-4036-470d-8a30-d2a7d860f4d5	haind@ptit.edu.vn	KAT101277	Nguyễn Đình Hải (KAT101277)		771b0986-4036-470d-8a30-d2a7d860f4d5	t	t	218	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
10f36ae9-9364-4c27-b981-b48efb415a2c	1515	Nguyễn Đình Minh Thắng	4682a80d-ecc9-4f1d-a7e7-1041ccdf917f	thangndm@ptit.edu.vn	KCB201211	Nguyễn Đình Minh Thắng (KCB201211)		4682a80d-ecc9-4f1d-a7e7-1041ccdf917f	t	t	194	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5a52d6ec-e4c1-4128-ba59-530fdce12fa6	1474	Nguyễn Đức Hiếu	1bf5d4bf-40a1-443e-9da1-b9cc33286703	hieund@ptit.edu.vn	KTC101156	Nguyễn Đức Hiếu (KTC101156)		1bf5d4bf-40a1-443e-9da1-b9cc33286703	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
68347dda-1386-4100-ad1e-df27d213f438	1558	Nguyễn Đức Minh Quang	59d5b94b-99a4-459d-8e60-61a2cc2fc4d0	quangndm@ptit.edu.vn	PGV101278	Nguyễn Đức Minh Quang (PGV101278)		59d5b94b-99a4-459d-8e60-61a2cc2fc4d0	t	t	30	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
be460ad9-435a-4a91-9932-bae453534d42	1491	Ngô Mai Phương	ac1f3a5f-e3f6-4693-b36e-020b3f424726	phuongnm@ptit.edu.vn	TQT101155	Ngô Mai Phương (TQT101155)		ac1f3a5f-e3f6-4693-b36e-020b3f424726	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
409c92d9-c818-466c-b25c-34e01444ab15	1517	Nông Vương Phi	6ab96578-cc6c-48ef-a9ec-17bc9d5ce5b2	phinv@ptit.edu.vn	KQT201205	Nông Vương Phi (KQT201205)		6ab96578-cc6c-48ef-a9ec-17bc9d5ce5b2	t	t	175	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
955f2519-756c-441e-bf6e-50809afda876	1607	Phan Bá Hải Triều	dd9f315a-f087-4a12-b693-ecc0599dd168	trieuhaipb@ptit.edu.vn	KDP101300	Phan Bá Hải Triều (KDP101300)		dd9f315a-f087-4a12-b693-ecc0599dd168	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
154506a7-9abb-4090-9173-671ef7658f00	1477	Phan Hoàng Nam	5ed39c3f-d8a1-4d0c-b249-e0f00501ad69	namph1@ptit.edu.vn	KCB201174	Phan Hoàng Nam (KCB201174)		5ed39c3f-d8a1-4d0c-b249-e0f00501ad69	t	t	195	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9924a204-84d2-4495-bd7b-f7a71c5b6429	1514	Phan Quỳnh Hương	f3dcf80b-cc26-4623-b88e-09b89d9635cd	huongpq@ptit.edu.vn	KVT101225	Phan Quỳnh Hương (KVT101225)		f3dcf80b-cc26-4623-b88e-09b89d9635cd	t	t	21	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
931fee34-1ce9-430a-a24d-768b5c0a412b	1499	Phan Thị Hải Linh	4ba6ce67-c2eb-4331-b7f5-1a38eaf55a84	linhpth@ptit.edu.vn	KDP101213	Phan Thị Hải Linh (KDP101213)		4ba6ce67-c2eb-4331-b7f5-1a38eaf55a84	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
9db1ba69-d621-4652-841c-5856ed0ac68b	1525	Phan Thị Mỹ Hạnh	768d5b62-f93b-4e45-acf6-3b295a7f5a9c	hanhptm@ptit.edu.vn	VKT101193	Phan Thị Mỹ Hạnh (VKT101193)		768d5b62-f93b-4e45-acf6-3b295a7f5a9c	t	t	4	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
20c82c22-2a49-4524-954d-f44fb845dfe6	1593	Phạm Quang Hiếu	d256a7b8-90c2-4133-8eed-e9b9ba35c698	hieupq.tg@ptit.edu.vn	TG005	Phạm Quang Hiếu (TG005)		d256a7b8-90c2-4133-8eed-e9b9ba35c698	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b2851746-7498-486a-b907-b683d1726c54	1529	Phạm Danh Tuyên	f9bbacaa-2249-4f82-9b9b-99f1181bacd2	tuyenpd@ptit.edu.vn	KDT101242	Phạm Danh Tuyên (KDT101242)		f9bbacaa-2249-4f82-9b9b-99f1181bacd2	t	t	226	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8f622c58-cded-49e8-8041-417e64e185d4	1475	Phạm Lưu Thuỳ Linh	8d540c02-f79c-4f89-8182-414567fb7be3	linhplq@ptit.edu.vn	VKT101160	Phạm Lưu Thuỳ Linh (VKT101160)		8d540c02-f79c-4f89-8182-414567fb7be3	t	t	64	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
69bef286-f139-48a1-87f9-9b5acf1057e2	1606	Phạm Minh Triển	253f4c75-0c4a-4e62-b654-f9286f83d976	trienpm@ptit.edu.vn	KDT101301	Phạm Minh Triển (KDT101301)		253f4c75-0c4a-4e62-b654-f9286f83d976	t	t	24	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0a0a46c7-659e-4c0e-9e0d-ab81ec82e9af	1545	Phạm Ngọc Anh	831c94ee-c280-438f-85f0-4f32cc71b063	pnanh@ptit.edu.vn	PSV201284	Phạm Ngọc Anh (PSV201284)		831c94ee-c280-438f-85f0-4f32cc71b063	t	t	13	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e1d54258-4b3e-4f04-a1d3-fc126c4c2bb4	1480	Phạm Quang Gia Bảo	f918f072-5b5b-452a-808f-af7a3271980a	baopqg@ptit.edu.vn	TDT101168	Phạm Quang Gia Bảo (TDT101168)		f918f072-5b5b-452a-808f-af7a3271980a	t	t	46	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b1df1747-34fd-4cf9-b47d-c2c2dccadef6	1466	Phạm Tuấn Anh	5c32e5eb-6119-43c5-8000-057116deaa47	anhpt.tg@ptit.edu.vn	TG0632	Phạm Tuấn Anh (TG0632)		5c32e5eb-6119-43c5-8000-057116deaa47	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
01e60371-c19b-47d6-827c-822cba5cdbdc	1496	Phạm Văn Cự	97b06a53-d10e-4373-9746-3429512fb4b0	cupv@ptit.edu.vn	VKH101186	Phạm Văn Cự (VKH101186)		97b06a53-d10e-4373-9746-3429512fb4b0	t	t	75	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
db1758cb-5890-4773-a6c0-35f8c4456bb4	1462	Thạch Minh Trang	e9b3ed15-6fb2-45df-bba5-263049fb0f47	trangtm@ptit.edu.vn	KDP101181	Thạch Minh Trang (KDP101181)		e9b3ed15-6fb2-45df-bba5-263049fb0f47	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
2dfdba3e-5b25-4f65-a052-f909729ed12b	1460	Trương Đông Nam	a0c6328a-45fc-4db4-a928-00a206175560	tdnam@ptit.edu.vn	KCN201198	Trương Đông Nam (KCN201198)		a0c6328a-45fc-4db4-a928-00a206175560	t	t	189	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b62ccf56-0f45-451c-98ca-0319ea65070e	1506	Trần Anh Đức	a1a72f9d-e6e2-4cac-89e4-673b6c93b49c	ducanht@ptit.edu.vn	KCN101222	Trần Anh Đức (KCN101222)		a1a72f9d-e6e2-4cac-89e4-673b6c93b49c	t	t	223	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
67fa5ea1-b612-4cbf-ba9d-aa04ec170198	1502	Trần Minh Tuấn	dd8fda2e-b18a-40ed-9fad-8508b9f70093	tuantm@ptit.edu.vn	VKH101202	Trần Minh Tuấn (VKH101202)		dd8fda2e-b18a-40ed-9fad-8508b9f70093	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
53c7c8fb-d2e9-45a2-a1d6-c0724f529180	1601	Trần Minh Đức	bd12de72-0e67-46fc-9c59-806c14b8dddd	ductm1@ptit.edu.vn	TQT101296	Trần Minh Đức (TQT101296)		bd12de72-0e67-46fc-9c59-806c14b8dddd	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
b387e20e-b4a0-4434-9004-efdf77947353	1532	Trần Nguyên Phúc	165530fe-64d1-4c30-8e72-c3277b44d47f	phuctn@ptit.edu.vn	KQT101244	Trần Nguyên Phúc (KQT101244)		165530fe-64d1-4c30-8e72-c3277b44d47f	t	t	204	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0104942b-6bf8-49b1-8b66-704cbd5cbac4	1585	Trần Ngô Thanh Vân	fdcaa055-445e-4e76-9c3b-f2b3c5142c89	vantnt@ptit.edu.vn	VKH101293	Trần Ngô Thanh Vân (VKH101293)		fdcaa055-445e-4e76-9c3b-f2b3c5142c89	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a343c22d-eeab-4299-ac70-65a6644a06ab	1556	Trần Ngọc Diễm Châu	8bd03a52-2194-476e-8ccd-999c21c0ec4a	chautnd@ptit.edu.vn	KQT201261	Trần Ngọc Diễm Châu (KQT201261)		8bd03a52-2194-476e-8ccd-999c21c0ec4a	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
0ec4200e-3938-45a6-b7ad-70c3ba8838e8	1522	Trần Quý Dương	d2a9c6df-55d6-4a4a-b96f-0d6fb946504a	duongtq@ptit.edu.vn	KTN101215	Trần Quý Dương (KTN101215)		d2a9c6df-55d6-4a4a-b96f-0d6fb946504a	t	t	252	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
affa55b7-0640-4513-b8c0-c973a2edde9e	1553	Trần Thanh Hưng	0eb13a69-e7a6-4d2f-9ca6-a2fe7a50aee1	hungtt@ptit.edu.vn	KDT201258	Trần Thanh Hưng (KDT201258)		0eb13a69-e7a6-4d2f-9ca6-a2fe7a50aee1	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
e6977a95-904c-4872-9cd6-80a434a03d8d	1482	Trần Thị Kim Loan	86990f67-5715-44b1-8c75-59834c4e03e5	loanttk@ptit.edu.vn	VKH101172	Trần Thị Kim Loan (VKH101172)		86990f67-5715-44b1-8c75-59834c4e03e5	t	t	74	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a5c1708b-5e0b-418a-8c29-532af8f06422	1524	Trần Thị Thuý Hiền	9408beac-56b1-48b5-9450-c8f075990019	hienttt@ptit.edu.vn	VKT101192	Trần Thị Thuý Hiền (VKT101192)		9408beac-56b1-48b5-9450-c8f075990019	t	t	4	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
16d2b990-5b4c-4ec0-a6c1-1c3dc1e6ca22	1551	Trần Văn Sướng	58d65882-0e8a-4305-8ef1-ac7ce93ec6e0	suongtv@ptit.edu.vn	KDT201246	Trần Văn Sướng (KDT201246)		58d65882-0e8a-4305-8ef1-ac7ce93ec6e0	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
f2fd9f48-1179-4210-a6e1-cfe405444a3a	1543	Trần Yến Nhi	8758f3e4-70e6-4084-b1c3-42d1f77e970f	nhity@ptit.edu.vn	PKT201249	Trần Yến Nhi (PKT201249)		8758f3e4-70e6-4084-b1c3-42d1f77e970f	t	t	16	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
57ba2801-9be5-4ad5-bd4e-5356ab080945	1549	Tống Thanh Văn	f2992df9-7e5f-4bcd-b9cb-126cede8ce7c	vantt1@ptit.edu.vn	KCN201254	Tống Thanh Văn (KCN201254)		f2992df9-7e5f-4bcd-b9cb-126cede8ce7c	t	t	10	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
16b0df28-1869-4adb-8d49-f4d27b0ec466	1555	Võ Thanh Tùng	35763cbb-a358-4894-8cf7-624535dadecc	tungvt@ptit.edu.vn	KDT201279	Võ Thanh Tùng (KDT201279)		35763cbb-a358-4894-8cf7-624535dadecc	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a15f3a39-0abe-4610-a39f-c4d0bc448bac	1604	Vũ Anh Quân	80a68519-c465-4a3f-b7ed-fb038c485613	quanva@ptit.edu.vn	TQT101297	Vũ Anh Quân (TQT101297)		80a68519-c465-4a3f-b7ed-fb038c485613	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
7b6f3b69-e963-43a3-8209-13316cf93d1a	1599	Vũ Công Nam Anh	64a12a3f-7631-43d8-982b-f483a0f6f00f	anhvcn@ptit.edu.vn	TQT101294	Vũ Công Nam Anh (TQT101294)		64a12a3f-7631-43d8-982b-f483a0f6f00f	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
04a7fd9e-9cd6-4a73-8e60-cf759d0866da	1492	Vũ Lê Quỳnh Giang	8a2f5a4b-b0d6-41cb-b819-8f0892f4f804	giangvlq.tg@ptit.edu.vn	TG0692	Vũ Lê Quỳnh Giang (TG0692)		8a2f5a4b-b0d6-41cb-b819-8f0892f4f804	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
822fea63-7b5f-4bed-9da0-15e75fe48159	1484	Vũ Tất Thắng	c9e20fd9-f617-4eaf-ac6c-1956db33fa67	thangvt@ptit.edu.vn	VKH101170	Vũ Tất Thắng (VKH101170)		c9e20fd9-f617-4eaf-ac6c-1956db33fa67	t	t	257	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
4dd750e5-b071-44a8-8b3c-61a6b77e5882	1511	Vũ Văn Tâm	819dfdf1-9343-4c92-9363-d101c1e92173	tamvv@ptit.edu.vn	VKT101203	Vũ Văn Tâm (VKT101203)		819dfdf1-9343-4c92-9363-d101c1e92173	t	t	256	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
feeb9e8f-31e0-4683-8962-d8dee8b286c2	1533	Vũ Đình Toàn	3b801d49-ebda-4bdf-b109-f4cb12d42b27	toanvd@ptit.edu.vn	KDP101274	Vũ Đình Toàn (KDP101274)		3b801d49-ebda-4bdf-b109-f4cb12d42b27	t	t	201	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a1f2dfd8-6e10-462c-8ad6-5168cb68af73	1503	Vũ Đình Tân	5e233368-e247-4a00-af01-322c98325ec8	tanvd.tg@ptit.edu.vn	2025.PGV1.15.796	Vũ Đình Tân (2025.PGV1.15.796)		5e233368-e247-4a00-af01-322c98325ec8	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
a53696bb-dff6-4fce-8acd-082441f894bc	1552	Đinh Văn Chuyên	4e500fd2-c604-4815-bb09-ce9f64547137	chuyendv@ptit.edu.vn	KDT201257	Đinh Văn Chuyên (KDT201257)		4e500fd2-c604-4815-bb09-ce9f64547137	t	t	9	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
14bcd45e-e843-409e-ab59-62a8c502365b	1605	Đoàn Ngọc Hà	ef92abce-b172-4733-8639-b516289f3301	hadn.tg@ptit.edu.vn	TG0691	Đoàn Ngọc Hà (TG0691)		ef92abce-b172-4733-8639-b516289f3301	f	t	\N	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
5356e2c1-4b16-42a2-9452-73a92a6d5d39	1600	Đoàn Tiến Đạt	eacde19d-2c49-411e-a100-4290fd7f6b07	datdt@ptit.edu.vn	TQT101295	Đoàn Tiến Đạt (TQT101295)		eacde19d-2c49-411e-a100-4290fd7f6b07	t	t	27	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
01feaf87-1c6e-4ba6-819d-362ca107b734	1557	Đào Thị Thanh Hằng	cc1bbdc8-a321-4604-ab37-9fdb9697af6a	hangdtt@ptit.edu.vn	KQT201262	Đào Thị Thanh Hằng (KQT201262)		cc1bbdc8-a321-4604-ab37-9fdb9697af6a	t	t	8	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
23dac614-ab5c-4555-85fa-3ed484f9c273	1588	Đặng Hồng Lê	2058a244-0ef7-491e-8d7f-1d4e08175fea	ledh@ptit.edu.vn	VKH101269	Đặng Hồng Lê (VKH101269)		2058a244-0ef7-491e-8d7f-1d4e08175fea	t	t	91	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
8ff00f93-3673-4f93-b83e-47754839a556	1472	Đỗ Huyền Vy	fe425294-211a-4cff-8075-1bc387680d1e	vydh@ptit.edu.vn	KTC101157	Đỗ Huyền Vy (KTC101157)		fe425294-211a-4cff-8075-1bc387680d1e	t	t	209	2026-06-13 17:54:21.167323+07	2026-06-13 17:54:21.167323+07
\.


--
-- TOC entry 5272 (class 0 OID 45448)
-- Dependencies: 228
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, document_id, bot_id, to_user_id, status, sent_at, delivered_at) FROM stdin;
\.


--
-- TOC entry 5265 (class 0 OID 36876)
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
-- TOC entry 5266 (class 0 OID 36886)
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
-- TOC entry 5264 (class 0 OID 36865)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (role_id, name, description, created_at) FROM stdin;
4d72e024-9343-4474-bd07-6ac5cebf3243	admin	Quản trị hệ thống	2026-03-27 14:10:40.554724+07
6a449204-dc9c-4e3c-8ad9-46ebbb2c8783	user	Người dùng thường	2026-03-27 14:10:40.554724+07
\.


--
-- TOC entry 5270 (class 0 OID 37129)
-- Dependencies: 226
-- Data for Name: system_parameters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_parameters (param_key, param_value, description, updated_at) FROM stdin;
\.


--
-- TOC entry 5268 (class 0 OID 37047)
-- Dependencies: 224
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (tag_id, name, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5274 (class 0 OID 78199)
-- Dependencies: 230
-- Data for Name: translation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.translation_logs (id, filename, file_type, file_hash, status, comment, source_language, target_language, result_file_url, created_at, updated_at, user_id) FROM stdin;
\.


--
-- TOC entry 5267 (class 0 OID 36910)
-- Dependencies: 223
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, display_name, password_hash, auth_provider, department_id, role_id, phone, is_active, created_at, last_login_at, telegram_chat_id) FROM stdin;
\.


--
-- TOC entry 5090 (class 2606 OID 37105)
-- Name: bots bots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT bots_pkey PRIMARY KEY (bot_id);


--
-- TOC entry 5066 (class 2606 OID 70129)
-- Name: departments departments_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_id_key UNIQUE (id);


--
-- TOC entry 5068 (class 2606 OID 36859)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 5094 (class 2606 OID 45437)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (document_id);


--
-- TOC entry 5098 (class 2606 OID 70176)
-- Name: human_resources human_resources_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.human_resources
    ADD CONSTRAINT human_resources_id_key UNIQUE (id);


--
-- TOC entry 5100 (class 2606 OID 70174)
-- Name: human_resources human_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.human_resources
    ADD CONSTRAINT human_resources_pkey PRIMARY KEY (human_resource_id);


--
-- TOC entry 5096 (class 2606 OID 45455)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 5074 (class 2606 OID 36885)
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- TOC entry 5076 (class 2606 OID 36883)
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- TOC entry 5078 (class 2606 OID 36890)
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- TOC entry 5070 (class 2606 OID 36875)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 5072 (class 2606 OID 36873)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 5092 (class 2606 OID 37136)
-- Name: system_parameters system_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT system_parameters_pkey PRIMARY KEY (param_key);


--
-- TOC entry 5086 (class 2606 OID 37057)
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- TOC entry 5088 (class 2606 OID 37055)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 5103 (class 2606 OID 78211)
-- Name: translation_logs translation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation_logs
    ADD CONSTRAINT translation_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5080 (class 2606 OID 36924)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5082 (class 2606 OID 36920)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5084 (class 2606 OID 36922)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5101 (class 1259 OID 78213)
-- Name: idx_translation_logs_file_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_translation_logs_file_hash ON public.translation_logs USING btree (file_hash);


--
-- TOC entry 5104 (class 2606 OID 70130)
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id);


--
-- TOC entry 5110 (class 2606 OID 45438)
-- Name: documents documents_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5111 (class 2606 OID 45443)
-- Name: documents documents_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- TOC entry 5112 (class 2606 OID 45471)
-- Name: documents documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(user_id) NOT VALID;


--
-- TOC entry 5116 (class 2606 OID 70177)
-- Name: human_resources human_resources_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.human_resources
    ADD CONSTRAINT human_resources_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- TOC entry 5113 (class 2606 OID 45461)
-- Name: notifications notifications_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(bot_id) ON DELETE SET NULL;


--
-- TOC entry 5114 (class 2606 OID 45456)
-- Name: notifications notifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE SET NULL;


--
-- TOC entry 5115 (class 2606 OID 45466)
-- Name: notifications notifications_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5105 (class 2606 OID 36896)
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- TOC entry 5106 (class 2606 OID 36891)
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- TOC entry 5109 (class 2606 OID 37058)
-- Name: tags tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- TOC entry 5117 (class 2606 OID 78214)
-- Name: translation_logs translation_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation_logs
    ADD CONSTRAINT translation_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) NOT VALID;


--
-- TOC entry 5107 (class 2606 OID 36925)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- TOC entry 5108 (class 2606 OID 36930)
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE SET NULL;


-- Completed on 2026-06-17 09:56:09

--
-- PostgreSQL database dump complete
--

