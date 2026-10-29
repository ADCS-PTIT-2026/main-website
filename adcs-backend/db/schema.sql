--
-- PostgreSQL database dump
--

\restrict wQDS4HZMzdAuhf5nORUzNNvG1NWP647YHojMZlFtovT1UWmavSL7HiC53HHdfLO

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

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
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_refresh_tokens (
    token_hash character varying(64) NOT NULL,
    family_id uuid NOT NULL,
    user_id uuid NOT NULL,
    auth_version integer NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bots (
    bot_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    token text,
    channel_type text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
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
    title text,
    file_path text,
    original_filename character varying(500),
    file_size_bytes bigint,
    page_count integer,
    priority integer DEFAULT 1,
    retry_count integer DEFAULT 0,
    error_message text,
    processing_started_at timestamp with time zone,
    suggested_departments jsonb,
    proposed_assignees jsonb
);


--
-- Name: feedbacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedbacks (
    id integer NOT NULL,
    user_id uuid,
    feedback_type character varying(50) DEFAULT 'improvement'::character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedbacks_id_seq OWNED BY public.feedbacks.id;


--
-- Name: human_resources; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    permission_id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    description text
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    system_code character varying(32)
);


--
-- Name: sso_login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sso_login_attempts (
    state_hash character varying(64) NOT NULL,
    nonce_hash character varying(64) NOT NULL,
    code_verifier character varying(128) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: system_parameters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_parameters (
    param_key text NOT NULL,
    param_value text,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    tag_id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: telegram_link_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telegram_link_tokens (
    token_hash character varying(64) NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: translation_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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
    telegram_chat_id text,
    auth_version integer DEFAULT 0 NOT NULL
);


--
-- Name: feedbacks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks ALTER COLUMN id SET DEFAULT nextval('public.feedbacks_id_seq'::regclass);


--
-- Name: auth_refresh_tokens auth_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_refresh_tokens
    ADD CONSTRAINT auth_refresh_tokens_pkey PRIMARY KEY (token_hash);


--
-- Name: bots bots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bots
    ADD CONSTRAINT bots_pkey PRIMARY KEY (bot_id);


--
-- Name: departments departments_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_id_key UNIQUE (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (document_id);


--
-- Name: feedbacks feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);


--
-- Name: human_resources human_resources_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.human_resources
    ADD CONSTRAINT human_resources_id_key UNIQUE (id);


--
-- Name: human_resources human_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.human_resources
    ADD CONSTRAINT human_resources_pkey PRIMARY KEY (human_resource_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: sso_login_attempts sso_login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sso_login_attempts
    ADD CONSTRAINT sso_login_attempts_pkey PRIMARY KEY (state_hash);


--
-- Name: system_parameters system_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT system_parameters_pkey PRIMARY KEY (param_key);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- Name: telegram_link_tokens telegram_link_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_link_tokens
    ADD CONSTRAINT telegram_link_tokens_pkey PRIMARY KEY (token_hash);


--
-- Name: translation_logs translation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_logs
    ADD CONSTRAINT translation_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: auth_refresh_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_refresh_tokens_expires_at_idx ON public.auth_refresh_tokens USING btree (expires_at);


--
-- Name: auth_refresh_tokens_family_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_refresh_tokens_family_id_idx ON public.auth_refresh_tokens USING btree (family_id);


--
-- Name: auth_refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_refresh_tokens_user_id_idx ON public.auth_refresh_tokens USING btree (user_id);


--
-- Name: idx_documents_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documents_queue ON public.documents USING btree (priority, created_at) WHERE (status = 'queued'::text);


--
-- Name: idx_feedbacks_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacks_created_at ON public.feedbacks USING btree (created_at DESC);


--
-- Name: idx_feedbacks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feedbacks_user_id ON public.feedbacks USING btree (user_id);


--
-- Name: idx_translation_logs_file_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_translation_logs_file_hash ON public.translation_logs USING btree (file_hash);


--
-- Name: roles_system_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_system_code_key ON public.roles USING btree (system_code);


--
-- Name: sso_login_attempts_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sso_login_attempts_expires_at_idx ON public.sso_login_attempts USING btree (expires_at);


--
-- Name: telegram_link_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telegram_link_tokens_expires_at_idx ON public.telegram_link_tokens USING btree (expires_at);


--
-- Name: telegram_link_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telegram_link_tokens_user_id_idx ON public.telegram_link_tokens USING btree (user_id);


--
-- Name: auth_refresh_tokens auth_refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_refresh_tokens
    ADD CONSTRAINT auth_refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: departments departments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.departments(id);


--
-- Name: documents documents_assigned_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_department_id_fkey FOREIGN KEY (assigned_department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: documents documents_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: documents documents_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(user_id) NOT VALID;


--
-- Name: feedbacks feedbacks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: human_resources human_resources_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.human_resources
    ADD CONSTRAINT human_resources_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_bot_id_fkey FOREIGN KEY (bot_id) REFERENCES public.bots(bot_id) ON DELETE SET NULL;


--
-- Name: notifications notifications_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id) ON DELETE SET NULL;


--
-- Name: notifications notifications_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(user_id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: tags tags_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: telegram_link_tokens telegram_link_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_link_tokens
    ADD CONSTRAINT telegram_link_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: translation_logs translation_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.translation_logs
    ADD CONSTRAINT translation_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) NOT VALID;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE SET NULL;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict wQDS4HZMzdAuhf5nORUzNNvG1NWP647YHojMZlFtovT1UWmavSL7HiC53HHdfLO

-- Data Service v5 integration (additive).
SET search_path = public;
BEGIN;
-- Crawler records have no human uploader; access remains department/admin scoped.
ALTER TABLE documents ALTER COLUMN uploaded_by_user_id DROP NOT NULL;
ALTER TABLE documents
 ADD COLUMN IF NOT EXISTS source_type varchar(32) NOT NULL DEFAULT 'user_upload',
 ADD COLUMN IF NOT EXISTS source_name text,
 ADD COLUMN IF NOT EXISTS source_url text,
 ADD COLUMN IF NOT EXISTS external_id text,
 ADD COLUMN IF NOT EXISTS source_section text,
 ADD COLUMN IF NOT EXISTS file_hash varchar(64),
 ADD COLUMN IF NOT EXISTS ds_document_id integer,
 ADD COLUMN IF NOT EXISTS sync_status varchar(24) NOT NULL DEFAULT 'pending',
 ADD COLUMN IF NOT EXISTS sync_version integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS duplicate_of jsonb,
 ADD COLUMN IF NOT EXISTS duplicate_reasons jsonb,
 ADD COLUMN IF NOT EXISTS possible_duplicates jsonb,
 ADD COLUMN IF NOT EXISTS sync_warnings jsonb,
 ADD COLUMN IF NOT EXISTS extra_files jsonb;
CREATE INDEX IF NOT EXISTS documents_file_hash_idx ON documents(file_hash);
DROP INDEX IF EXISTS documents_crawler_identity_idx;
CREATE UNIQUE INDEX documents_crawler_identity_idx
 ON documents(source_name, COALESCE(source_section,''), external_id)
 WHERE source_type='crawler' AND external_id IS NOT NULL AND deleted_at IS NULL AND status IS DISTINCT FROM 'duplicate';
ALTER TABLE translation_logs
 ADD COLUMN IF NOT EXISTS input_path text,
 ADD COLUMN IF NOT EXISTS ds_job_id uuid,
 ADD COLUMN IF NOT EXISTS job_status varchar(32) NOT NULL DEFAULT 'queued',
 ADD COLUMN IF NOT EXISTS step varchar(80),
 ADD COLUMN IF NOT EXISTS progress_done integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS progress_total integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS queue_position integer,
 ADD COLUMN IF NOT EXISTS error_code varchar(100),
 ADD COLUMN IF NOT EXISTS error_message text;
UPDATE translation_logs SET job_status=CASE status
 WHEN 'pending' THEN 'queued' WHEN 'translating' THEN 'needs_review' ELSE status END
 WHERE input_path IS NULL;
CREATE TABLE IF NOT EXISTS integration_outbox (
 id uuid PRIMARY KEY, sequence integer NOT NULL, document_id uuid NOT NULL,
 operation varchar(20) NOT NULL, payload jsonb NOT NULL,
 status varchar(24) NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), error_code varchar(100),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,sequence)
);
CREATE INDEX IF NOT EXISTS integration_outbox_ready_idx ON integration_outbox(status,available_at);
CREATE TABLE IF NOT EXISTS processing_jobs (
 id uuid PRIMARY KEY, kind varchar(20) NOT NULL, reference_id uuid NOT NULL UNIQUE,
 priority integer NOT NULL, status varchar(24) NOT NULL DEFAULT 'queued',
 lease_until timestamptz, error_code varchar(100), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS processing_jobs_ready_idx ON processing_jobs(status,priority,created_at);
CREATE TABLE IF NOT EXISTS crawler_source_mappings (
 id uuid PRIMARY KEY, source_name text NOT NULL, section text NOT NULL DEFAULT '',
 department_id uuid NOT NULL REFERENCES departments(department_id), UNIQUE(source_name,section)
);

-- L3, L4, L7 additions (2026-10-29)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS error_details JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS processing_attempts (
 id UUID PRIMARY KEY,
 document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
 job_id UUID,
 request_id VARCHAR(64) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'running',
 error JSONB,
 warnings JSONB,
 started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_processing_attempts_document_id ON processing_attempts(document_id);
CREATE INDEX IF NOT EXISTS ix_processing_attempts_request_id ON processing_attempts(request_id);

CREATE TABLE IF NOT EXISTS login_attempts (
 key VARCHAR(255) PRIMARY KEY,
 failures INTEGER NOT NULL DEFAULT 1,
 window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
 locked_until TIMESTAMPTZ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_login_attempts_locked_until ON login_attempts(locked_until);

COMMIT;
