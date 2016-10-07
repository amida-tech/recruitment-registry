--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: enum_registry_user_gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_registry_user_gender AS ENUM (
    'male',
    'female',
    'other'
);


--
-- Name: enum_registry_user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_registry_user_role AS ENUM (
    'admin',
    'participant',
    'clinician'
);


--
-- Name: enum_survey_document_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_survey_document_action AS ENUM (
    'read',
    'create',
    'edit'
);


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: answer; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer (
    id integer NOT NULL,
    user_id integer NOT NULL,
    survey_id integer NOT NULL,
    question_id integer NOT NULL,
    question_choice_id integer,
    value text,
    answer_type_id text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: answer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE answer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE answer_id_seq OWNED BY answer.id;


--
-- Name: answer_type; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer_type (
    name text NOT NULL,
    created_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: document; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE document (
    id integer NOT NULL,
    type_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE document_id_seq OWNED BY document.id;


--
-- Name: document_signature; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE document_signature (
    id integer NOT NULL,
    document_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: document_signature_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE document_signature_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_signature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE document_signature_id_seq OWNED BY document_signature.id;


--
-- Name: document_type; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE document_type (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: document_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE document_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE document_type_id_seq OWNED BY document_type.id;


--
-- Name: ethnicity; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE ethnicity (
    id integer NOT NULL,
    name text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: ethnicity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE ethnicity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ethnicity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE ethnicity_id_seq OWNED BY ethnicity.id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question (
    id integer NOT NULL,
    text text,
    type text NOT NULL,
    version integer NOT NULL,
    group_id integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: question_action; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_action (
    id integer NOT NULL,
    question_id integer NOT NULL,
    text text NOT NULL,
    type text NOT NULL,
    line integer,
    created_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: question_action_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE question_action_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_action_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE question_action_id_seq OWNED BY question_action.id;


--
-- Name: question_choice; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_choice (
    id integer NOT NULL,
    question_id integer NOT NULL,
    text text,
    type text NOT NULL,
    line integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: question_choice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE question_choice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_choice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE question_choice_id_seq OWNED BY question_choice.id;


--
-- Name: question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE question_id_seq OWNED BY question.id;


--
-- Name: question_type; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_type (
    name text NOT NULL,
    created_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: registry; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE registry (
    id integer NOT NULL,
    profile_survey_id integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: registry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE registry_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE registry_id_seq OWNED BY registry.id;


--
-- Name: registry_user; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE registry_user (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    zip text,
    ethnicity integer,
    gender enum_registry_user_gender,
    role enum_registry_user_role,
    "resetPasswordToken" character varying(255),
    "resetPasswordExpires" timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: registry_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE registry_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: registry_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE registry_user_id_seq OWNED BY registry_user.id;


--
-- Name: survey; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey (
    id integer NOT NULL,
    name text,
    version integer NOT NULL,
    group_id integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: survey_document; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_document (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    document_type_id integer NOT NULL,
    action enum_survey_document_action NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: survey_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_document_id_seq OWNED BY survey_document.id;


--
-- Name: survey_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_id_seq OWNED BY survey.id;


--
-- Name: survey_question; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_question (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    question_id integer NOT NULL,
    line integer,
    required boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: survey_question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_question_id_seq OWNED BY survey_question.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer ALTER COLUMN id SET DEFAULT nextval('answer_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY document ALTER COLUMN id SET DEFAULT nextval('document_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY document_signature ALTER COLUMN id SET DEFAULT nextval('document_signature_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY document_type ALTER COLUMN id SET DEFAULT nextval('document_type_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY ethnicity ALTER COLUMN id SET DEFAULT nextval('ethnicity_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question ALTER COLUMN id SET DEFAULT nextval('question_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_action ALTER COLUMN id SET DEFAULT nextval('question_action_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice ALTER COLUMN id SET DEFAULT nextval('question_choice_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY registry ALTER COLUMN id SET DEFAULT nextval('registry_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY registry_user ALTER COLUMN id SET DEFAULT nextval('registry_user_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey ALTER COLUMN id SET DEFAULT nextval('survey_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_document ALTER COLUMN id SET DEFAULT nextval('survey_document_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_question ALTER COLUMN id SET DEFAULT nextval('survey_question_id_seq'::regclass);


--
-- Name: answer_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_pkey PRIMARY KEY (id);


--
-- Name: answer_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_type
    ADD CONSTRAINT answer_type_pkey PRIMARY KEY (name);


--
-- Name: document_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: document_signature_document_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY document_signature
    ADD CONSTRAINT document_signature_document_id_user_id_key UNIQUE (document_id, user_id);


--
-- Name: document_signature_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY document_signature
    ADD CONSTRAINT document_signature_pkey PRIMARY KEY (id);


--
-- Name: document_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY document_type
    ADD CONSTRAINT document_type_pkey PRIMARY KEY (id);


--
-- Name: ethnicity_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY ethnicity
    ADD CONSTRAINT ethnicity_pkey PRIMARY KEY (id);


--
-- Name: question_action_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_action
    ADD CONSTRAINT question_action_pkey PRIMARY KEY (id);


--
-- Name: question_choice_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_pkey PRIMARY KEY (id);


--
-- Name: question_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: question_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_type
    ADD CONSTRAINT question_type_pkey PRIMARY KEY (name);


--
-- Name: registry_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry
    ADD CONSTRAINT registry_pkey PRIMARY KEY (id);


--
-- Name: registry_user_email_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_email_key UNIQUE (email);


--
-- Name: registry_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_pkey PRIMARY KEY (id);


--
-- Name: registry_user_resetPasswordToken_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT "registry_user_resetPasswordToken_key" UNIQUE ("resetPasswordToken");


--
-- Name: registry_user_username_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_username_key UNIQUE (username);


--
-- Name: survey_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_document
    ADD CONSTRAINT survey_document_pkey PRIMARY KEY (id);


--
-- Name: survey_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey
    ADD CONSTRAINT survey_pkey PRIMARY KEY (id);


--
-- Name: survey_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_question
    ADD CONSTRAINT survey_question_pkey PRIMARY KEY (id);


--
-- Name: answer_answer_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_answer_type_id_fkey FOREIGN KEY (answer_type_id) REFERENCES answer_type(name);


--
-- Name: answer_question_choice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_question_choice_id_fkey FOREIGN KEY (question_choice_id) REFERENCES question_choice(id);


--
-- Name: answer_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: answer_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: answer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id);


--
-- Name: document_signature_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY document_signature
    ADD CONSTRAINT document_signature_document_id_fkey FOREIGN KEY (document_id) REFERENCES document(id);


--
-- Name: document_signature_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY document_signature
    ADD CONSTRAINT document_signature_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id);


--
-- Name: document_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY document
    ADD CONSTRAINT document_type_id_fkey FOREIGN KEY (type_id) REFERENCES document_type(id);


--
-- Name: question_action_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_action
    ADD CONSTRAINT question_action_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: question_choice_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: question_choice_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_type_fkey FOREIGN KEY (type) REFERENCES answer_type(name);


--
-- Name: question_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question
    ADD CONSTRAINT question_type_fkey FOREIGN KEY (type) REFERENCES question_type(name);


--
-- Name: registry_profile_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY registry
    ADD CONSTRAINT registry_profile_survey_id_fkey FOREIGN KEY (profile_survey_id) REFERENCES survey(id);


--
-- Name: registry_user_ethnicity_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_ethnicity_fkey FOREIGN KEY (ethnicity) REFERENCES ethnicity(id);


--
-- Name: survey_document_document_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_document
    ADD CONSTRAINT survey_document_document_type_id_fkey FOREIGN KEY (document_type_id) REFERENCES document_type(id);


--
-- Name: survey_document_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_document
    ADD CONSTRAINT survey_document_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: survey_question_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_question
    ADD CONSTRAINT survey_question_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: survey_question_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_question
    ADD CONSTRAINT survey_question_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- PostgreSQL database dump complete
--

