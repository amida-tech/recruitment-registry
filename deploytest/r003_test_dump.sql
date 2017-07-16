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
-- Name: enum_assessment_sequence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_assessment_sequence_type AS ENUM (
    'ondemand',
    'biyearly'
);


--
-- Name: enum_registry_user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_registry_user_role AS ENUM (
    'admin',
    'participant',
    'clinician',
    'import'
);


--
-- Name: enum_survey_consent_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_survey_consent_action AS ENUM (
    'read',
    'create'
);


--
-- Name: enum_user_assessment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_user_assessment_status AS ENUM (
    'scheduled',
    'not-in-protocol',
    'failed-to-collect',
    'collected',
    'started',
    'refused',
    'no-status',
    'technical-difficulties',
    'unable-to-perform'
);


--
-- Name: enum_user_survey_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE enum_user_survey_status AS ENUM (
    'new',
    'in-progress',
    'completed'
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
    language_code text NOT NULL,
    question_id integer NOT NULL,
    question_choice_id integer,
    multiple_index integer,
    value text,
    meta json,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
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
-- Name: answer_identifier; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer_identifier (
    id integer NOT NULL,
    type text NOT NULL,
    identifier text NOT NULL,
    question_id integer NOT NULL,
    question_choice_id integer,
    multiple_index integer,
    tag integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: answer_identifier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE answer_identifier_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: answer_identifier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE answer_identifier_id_seq OWNED BY answer_identifier.id;


--
-- Name: answer_rule; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer_rule (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    logic text NOT NULL,
    question_id integer,
    section_id integer,
    answer_question_id integer,
    line integer,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: answer_rule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE answer_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: answer_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE answer_rule_id_seq OWNED BY answer_rule.id;


--
-- Name: answer_rule_logic; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer_rule_logic (
    name text NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: answer_rule_value; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer_rule_value (
    id integer NOT NULL,
    answer_rule_id integer NOT NULL,
    question_choice_id integer,
    value text,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: answer_rule_value_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE answer_rule_value_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: answer_rule_value_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE answer_rule_value_id_seq OWNED BY answer_rule_value.id;


--
-- Name: answer_type; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE answer_type (
    name text NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: assessment; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE assessment (
    id integer NOT NULL,
    name text NOT NULL,
    sequence_type enum_assessment_sequence_type NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: assessment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE assessment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assessment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE assessment_id_seq OWNED BY assessment.id;


--
-- Name: assessment_survey; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE assessment_survey (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    survey_id integer NOT NULL,
    lookback boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: assessment_survey_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE assessment_survey_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assessment_survey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE assessment_survey_id_seq OWNED BY assessment_survey.id;


--
-- Name: choice_set; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE choice_set (
    id integer NOT NULL,
    reference text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: choice_set_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE choice_set_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: choice_set_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE choice_set_id_seq OWNED BY choice_set.id;


--
-- Name: consent; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: consent_document; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent_document (
    id integer NOT NULL,
    type_id integer NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: consent_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_document_id_seq OWNED BY consent_document.id;


--
-- Name: consent_document_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent_document_text (
    id integer NOT NULL,
    consent_document_id integer NOT NULL,
    content text NOT NULL,
    update_comment text,
    language_code text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: consent_document_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_document_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_document_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_document_text_id_seq OWNED BY consent_document_text.id;


--
-- Name: consent_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_id_seq OWNED BY consent.id;


--
-- Name: consent_section; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent_section (
    id integer NOT NULL,
    consent_id integer NOT NULL,
    type_id integer NOT NULL,
    line integer,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: consent_section_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_section_id_seq OWNED BY consent_section.id;


--
-- Name: consent_signature; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent_signature (
    id integer NOT NULL,
    consent_document_id integer NOT NULL,
    user_id integer NOT NULL,
    language_code text NOT NULL,
    ip text,
    user_agent text,
    created_at timestamp with time zone
);


--
-- Name: consent_signature_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_signature_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_signature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_signature_id_seq OWNED BY consent_signature.id;


--
-- Name: consent_type; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent_type (
    id integer NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: consent_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_type_id_seq OWNED BY consent_type.id;


--
-- Name: consent_type_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE consent_type_text (
    id integer NOT NULL,
    consent_type_id integer NOT NULL,
    language_code text NOT NULL,
    title text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: consent_type_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE consent_type_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consent_type_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE consent_type_text_id_seq OWNED BY consent_type_text.id;


--
-- Name: language; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE language (
    code text NOT NULL,
    name text NOT NULL,
    native_name text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: profile_survey; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE profile_survey (
    id integer NOT NULL,
    survey_id integer,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: profile_survey_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE profile_survey_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_survey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE profile_survey_id_seq OWNED BY profile_survey.id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question (
    id integer NOT NULL,
    type text NOT NULL,
    choice_set_id integer,
    version integer,
    group_id integer,
    meta json,
    multiple boolean,
    max_count integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: question_choice; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_choice (
    id integer NOT NULL,
    question_id integer,
    type text NOT NULL,
    code text,
    meta json,
    line integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    choice_set_id integer,
    deleted_at timestamp with time zone
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
-- Name: question_choice_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_choice_text (
    id integer NOT NULL,
    question_choice_id integer NOT NULL,
    language_code text NOT NULL,
    text text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: question_choice_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE question_choice_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_choice_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE question_choice_text_id_seq OWNED BY question_choice_text.id;


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
-- Name: question_identifier; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_identifier (
    id integer NOT NULL,
    type text NOT NULL,
    identifier text NOT NULL,
    question_id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: question_identifier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE question_identifier_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_identifier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE question_identifier_id_seq OWNED BY question_identifier.id;


--
-- Name: question_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_text (
    id integer NOT NULL,
    question_id integer NOT NULL,
    language_code text NOT NULL,
    text text NOT NULL,
    instruction text,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: question_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE question_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE question_text_id_seq OWNED BY question_text.id;


--
-- Name: question_type; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE question_type (
    name text NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: registry_user; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE registry_user (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role enum_registry_user_role NOT NULL,
    original_username text,
    reset_password_token character varying(255),
    reset_password_expires timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
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
-- Name: research_site; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE research_site (
    id integer NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: research_site_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE research_site_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_site_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE research_site_id_seq OWNED BY research_site.id;


--
-- Name: research_site_vicinity; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE research_site_vicinity (
    id integer NOT NULL,
    research_site_id integer NOT NULL,
    zip text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: research_site_vicinity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE research_site_vicinity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: research_site_vicinity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE research_site_vicinity_id_seq OWNED BY research_site_vicinity.id;


--
-- Name: section; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE section (
    id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: section_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE section_id_seq OWNED BY section.id;


--
-- Name: section_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE section_text (
    id integer NOT NULL,
    section_id integer NOT NULL,
    language_code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: section_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE section_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: section_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE section_text_id_seq OWNED BY section_text.id;


--
-- Name: smtp; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE smtp (
    id integer NOT NULL,
    protocol text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    host text NOT NULL,
    email_from text NOT NULL,
    other_options json NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: smtp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE smtp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: smtp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE smtp_id_seq OWNED BY smtp.id;


--
-- Name: smtp_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE smtp_text (
    id integer NOT NULL,
    language_code text NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: smtp_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE smtp_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: smtp_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE smtp_text_id_seq OWNED BY smtp_text.id;


--
-- Name: staging_bhr_gap; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE staging_bhr_gap (
    id integer NOT NULL,
    username text,
    assessment_name text NOT NULL,
    status text,
    line_index integer,
    question_id integer,
    question_choice_id integer,
    multiple_index integer,
    value text,
    language_code text,
    last_answer boolean,
    days_after_baseline integer
);


--
-- Name: staging_bhr_gap_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE staging_bhr_gap_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: staging_bhr_gap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE staging_bhr_gap_id_seq OWNED BY staging_bhr_gap.id;


--
-- Name: survey; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey (
    id integer NOT NULL,
    status text DEFAULT 'published'::text NOT NULL,
    version integer,
    group_id integer,
    meta json,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: survey_consent; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_consent (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    consent_id integer,
    consent_type_id integer NOT NULL,
    action enum_survey_consent_action NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: survey_consent_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_consent_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_consent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_consent_id_seq OWNED BY survey_consent.id;


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
-- Name: survey_identifier; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_identifier (
    id integer NOT NULL,
    type text NOT NULL,
    identifier text NOT NULL,
    survey_id integer NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: survey_identifier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_identifier_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_identifier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_identifier_id_seq OWNED BY survey_identifier.id;


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
    deleted_at timestamp with time zone
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
-- Name: survey_section; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_section (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    section_id integer NOT NULL,
    parent_id integer,
    parent_question_id integer,
    line integer NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: survey_section_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_section_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_section_id_seq OWNED BY survey_section.id;


--
-- Name: survey_section_question; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_section_question (
    id integer NOT NULL,
    survey_section_id integer NOT NULL,
    question_id integer NOT NULL,
    line integer NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: survey_section_question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_section_question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_section_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_section_question_id_seq OWNED BY survey_section_question.id;


--
-- Name: survey_status; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_status (
    name text NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: survey_text; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE survey_text (
    id integer NOT NULL,
    survey_id integer NOT NULL,
    language_code text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: survey_text_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE survey_text_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_text_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE survey_text_id_seq OWNED BY survey_text.id;


--
-- Name: user_assessment; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_assessment (
    id integer NOT NULL,
    user_id integer NOT NULL,
    assessment_id integer NOT NULL,
    meta json,
    sequence integer NOT NULL,
    status enum_user_assessment_status NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: user_assessment_answer; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_assessment_answer (
    id integer NOT NULL,
    answer_id integer NOT NULL,
    user_assessment_id integer NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: user_assessment_answer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_assessment_answer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_assessment_answer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE user_assessment_answer_id_seq OWNED BY user_assessment_answer.id;


--
-- Name: user_assessment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_assessment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_assessment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE user_assessment_id_seq OWNED BY user_assessment.id;


--
-- Name: user_audit; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_audit (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    operation text NOT NULL,
    created_at timestamp with time zone
);


--
-- Name: user_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE user_audit_id_seq OWNED BY user_audit.id;


--
-- Name: user_survey; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE user_survey (
    id integer NOT NULL,
    user_id integer NOT NULL,
    survey_id integer NOT NULL,
    status enum_user_survey_status NOT NULL,
    created_at timestamp with time zone,
    deleted_at timestamp with time zone
);


--
-- Name: user_survey_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE user_survey_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_survey_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE user_survey_id_seq OWNED BY user_survey.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer ALTER COLUMN id SET DEFAULT nextval('answer_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_identifier ALTER COLUMN id SET DEFAULT nextval('answer_identifier_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule ALTER COLUMN id SET DEFAULT nextval('answer_rule_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule_value ALTER COLUMN id SET DEFAULT nextval('answer_rule_value_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY assessment ALTER COLUMN id SET DEFAULT nextval('assessment_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY assessment_survey ALTER COLUMN id SET DEFAULT nextval('assessment_survey_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY choice_set ALTER COLUMN id SET DEFAULT nextval('choice_set_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent ALTER COLUMN id SET DEFAULT nextval('consent_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_document ALTER COLUMN id SET DEFAULT nextval('consent_document_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_document_text ALTER COLUMN id SET DEFAULT nextval('consent_document_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_section ALTER COLUMN id SET DEFAULT nextval('consent_section_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_signature ALTER COLUMN id SET DEFAULT nextval('consent_signature_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_type ALTER COLUMN id SET DEFAULT nextval('consent_type_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_type_text ALTER COLUMN id SET DEFAULT nextval('consent_type_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY profile_survey ALTER COLUMN id SET DEFAULT nextval('profile_survey_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question ALTER COLUMN id SET DEFAULT nextval('question_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice ALTER COLUMN id SET DEFAULT nextval('question_choice_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice_text ALTER COLUMN id SET DEFAULT nextval('question_choice_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_identifier ALTER COLUMN id SET DEFAULT nextval('question_identifier_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_text ALTER COLUMN id SET DEFAULT nextval('question_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY registry_user ALTER COLUMN id SET DEFAULT nextval('registry_user_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY research_site ALTER COLUMN id SET DEFAULT nextval('research_site_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY research_site_vicinity ALTER COLUMN id SET DEFAULT nextval('research_site_vicinity_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY section ALTER COLUMN id SET DEFAULT nextval('section_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY section_text ALTER COLUMN id SET DEFAULT nextval('section_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY smtp ALTER COLUMN id SET DEFAULT nextval('smtp_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY smtp_text ALTER COLUMN id SET DEFAULT nextval('smtp_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY staging_bhr_gap ALTER COLUMN id SET DEFAULT nextval('staging_bhr_gap_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey ALTER COLUMN id SET DEFAULT nextval('survey_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_consent ALTER COLUMN id SET DEFAULT nextval('survey_consent_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_identifier ALTER COLUMN id SET DEFAULT nextval('survey_identifier_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_question ALTER COLUMN id SET DEFAULT nextval('survey_question_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section ALTER COLUMN id SET DEFAULT nextval('survey_section_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section_question ALTER COLUMN id SET DEFAULT nextval('survey_section_question_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_text ALTER COLUMN id SET DEFAULT nextval('survey_text_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_assessment ALTER COLUMN id SET DEFAULT nextval('user_assessment_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_assessment_answer ALTER COLUMN id SET DEFAULT nextval('user_assessment_answer_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_audit ALTER COLUMN id SET DEFAULT nextval('user_audit_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_survey ALTER COLUMN id SET DEFAULT nextval('user_survey_id_seq'::regclass);


--
-- Data for Name: answer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY answer (id, user_id, survey_id, language_code, question_id, question_choice_id, multiple_index, value, meta, created_at, deleted_at) FROM stdin;
1	2	1	en	1	\N	\N	firstname_0	\N	2017-07-14 14:57:56.701798-04	\N
2	2	1	en	2	\N	\N	lastname_0	\N	2017-07-14 14:57:56.701798-04	\N
3	2	1	en	3	\N	\N	20000	\N	2017-07-14 14:57:56.701798-04	\N
4	2	1	en	4	\N	\N	1970	\N	2017-07-14 14:57:56.701798-04	\N
5	3	1	en	1	\N	\N	firstname_1	\N	2017-07-14 14:57:56.842999-04	\N
6	3	1	en	2	\N	\N	lastname_1	\N	2017-07-14 14:57:56.842999-04	\N
7	3	1	en	3	\N	\N	20001	\N	2017-07-14 14:57:56.842999-04	\N
8	3	1	en	4	\N	\N	1971	\N	2017-07-14 14:57:56.842999-04	\N
9	4	1	en	1	\N	\N	firstname_2	\N	2017-07-14 14:57:56.986519-04	\N
10	4	1	en	2	\N	\N	lastname_2	\N	2017-07-14 14:57:56.986519-04	\N
11	4	1	en	3	\N	\N	20002	\N	2017-07-14 14:57:56.986519-04	\N
12	4	1	en	4	\N	\N	1972	\N	2017-07-14 14:57:56.986519-04	\N
13	5	1	en	1	\N	\N	firstname_3	\N	2017-07-14 14:57:57.102587-04	\N
14	5	1	en	2	\N	\N	lastname_3	\N	2017-07-14 14:57:57.102587-04	\N
15	5	1	en	3	\N	\N	20003	\N	2017-07-14 14:57:57.102587-04	\N
16	5	1	en	4	\N	\N	1973	\N	2017-07-14 14:57:57.102587-04	\N
17	6	1	en	1	\N	\N	firstname_4	\N	2017-07-14 14:57:57.213004-04	\N
18	6	1	en	2	\N	\N	lastname_4	\N	2017-07-14 14:57:57.213004-04	\N
19	6	1	en	3	\N	\N	20004	\N	2017-07-14 14:57:57.213004-04	\N
20	6	1	en	4	\N	\N	1974	\N	2017-07-14 14:57:57.213004-04	\N
\.


--
-- Name: answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('answer_id_seq', 20, true);


--
-- Data for Name: answer_identifier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY answer_identifier (id, type, identifier, question_id, question_choice_id, multiple_index, tag, created_at, updated_at) FROM stdin;
\.


--
-- Name: answer_identifier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('answer_identifier_id_seq', 1, false);


--
-- Data for Name: answer_rule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY answer_rule (id, survey_id, logic, question_id, section_id, answer_question_id, line, created_at, deleted_at) FROM stdin;
\.


--
-- Name: answer_rule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('answer_rule_id_seq', 1, false);


--
-- Data for Name: answer_rule_logic; Type: TABLE DATA; Schema: public; Owner: -
--

COPY answer_rule_logic (name, created_at) FROM stdin;
equals	2017-07-14 14:57:56.119-04
not-equals	2017-07-14 14:57:56.119-04
exists	2017-07-14 14:57:56.119-04
not-exists	2017-07-14 14:57:56.119-04
\.


--
-- Data for Name: answer_rule_value; Type: TABLE DATA; Schema: public; Owner: -
--

COPY answer_rule_value (id, answer_rule_id, question_choice_id, value, created_at, deleted_at) FROM stdin;
\.


--
-- Name: answer_rule_value_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('answer_rule_value_id_seq', 1, false);


--
-- Data for Name: answer_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY answer_type (name, created_at) FROM stdin;
choice	2017-07-14 14:57:56.027-04
text	2017-07-14 14:57:56.027-04
zip	2017-07-14 14:57:56.027-04
bool	2017-07-14 14:57:56.027-04
bool-sole	2017-07-14 14:57:56.027-04
date	2017-07-14 14:57:56.027-04
year	2017-07-14 14:57:56.027-04
month	2017-07-14 14:57:56.027-04
day	2017-07-14 14:57:56.027-04
integer	2017-07-14 14:57:56.027-04
float	2017-07-14 14:57:56.028-04
pounds	2017-07-14 14:57:56.028-04
feet-inches	2017-07-14 14:57:56.029-04
blood-pressure	2017-07-14 14:57:56.029-04
\.


--
-- Data for Name: assessment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY assessment (id, name, sequence_type, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Name: assessment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('assessment_id_seq', 1, false);


--
-- Data for Name: assessment_survey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY assessment_survey (id, assessment_id, survey_id, lookback, created_at, deleted_at) FROM stdin;
\.


--
-- Name: assessment_survey_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('assessment_survey_id_seq', 1, false);


--
-- Data for Name: choice_set; Type: TABLE DATA; Schema: public; Owner: -
--

COPY choice_set (id, reference, created_at, deleted_at) FROM stdin;
\.


--
-- Name: choice_set_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('choice_set_id_seq', 1, false);


--
-- Data for Name: consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent (id, name, created_at, deleted_at) FROM stdin;
1	terms-of-use	2017-07-14 14:57:56.646-04	\N
2	consent	2017-07-14 14:57:56.647-04	\N
\.


--
-- Data for Name: consent_document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent_document (id, type_id, created_at, deleted_at) FROM stdin;
1	2	2017-07-14 14:57:56.634-04	\N
2	1	2017-07-14 14:57:56.636-04	\N
\.


--
-- Name: consent_document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_document_id_seq', 2, true);


--
-- Data for Name: consent_document_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent_document_text (id, consent_document_id, content, update_comment, language_code, created_at, deleted_at) FROM stdin;
1	1	This is a terms of use document.	\N	en	2017-07-14 14:57:56.641-04	\N
2	2	This is a document.	\N	en	2017-07-14 14:57:56.642-04	\N
\.


--
-- Name: consent_document_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_document_text_id_seq', 2, true);


--
-- Name: consent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_id_seq', 2, true);


--
-- Data for Name: consent_section; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent_section (id, consent_id, type_id, line, created_at, deleted_at) FROM stdin;
1	1	2	0	2017-07-14 14:57:56.649-04	\N
2	2	1	0	2017-07-14 14:57:56.651-04	\N
\.


--
-- Name: consent_section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_section_id_seq', 2, true);


--
-- Data for Name: consent_signature; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent_signature (id, consent_document_id, user_id, language_code, ip, user_agent, created_at) FROM stdin;
1	1	2	en	\N	\N	2017-07-14 14:57:56.782-04
2	1	3	en	\N	\N	2017-07-14 14:57:56.928-04
3	1	4	en	\N	\N	2017-07-14 14:57:57.06-04
4	1	5	en	\N	\N	2017-07-14 14:57:57.177-04
5	1	6	en	\N	\N	2017-07-14 14:57:57.288-04
\.


--
-- Name: consent_signature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_signature_id_seq', 5, true);


--
-- Data for Name: consent_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent_type (id, name, type, created_at, deleted_at) FROM stdin;
2	terms-of-use	single	2017-07-14 14:57:56.612-04	\N
1	consent	single	2017-07-14 14:57:56.612-04	\N
\.


--
-- Name: consent_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_type_id_seq', 2, true);


--
-- Data for Name: consent_type_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY consent_type_text (id, consent_type_id, language_code, title, created_at, deleted_at) FROM stdin;
1	2	en	Terms of Use	2017-07-14 14:57:56.621-04	\N
2	1	en	Consent Form	2017-07-14 14:57:56.623-04	\N
\.


--
-- Name: consent_type_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('consent_type_text_id_seq', 2, true);


--
-- Data for Name: language; Type: TABLE DATA; Schema: public; Owner: -
--

COPY language (code, name, native_name, created_at, updated_at, deleted_at) FROM stdin;
en	English	English	2017-07-14 14:57:56.077-04	2017-07-14 14:57:56.077-04	\N
ru	Russian	Русский	2017-07-14 14:57:56.077-04	2017-07-14 14:57:56.077-04	\N
jp	Japanese	日本語	2017-07-14 14:57:56.077-04	2017-07-14 14:57:56.077-04	\N
es	Spanish	Español	2017-07-14 14:57:56.077-04	2017-07-14 14:57:56.077-04	\N
fr	French	Le français	2017-07-14 14:57:56.077-04	2017-07-14 14:57:56.077-04	\N
\.


--
-- Data for Name: profile_survey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY profile_survey (id, survey_id, created_at, deleted_at) FROM stdin;
1	1	2017-07-14 14:57:56.608-04	\N
\.


--
-- Name: profile_survey_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('profile_survey_id_seq', 1, true);


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: -
--

COPY question (id, type, choice_set_id, version, group_id, meta, multiple, max_count, created_at, updated_at, deleted_at) FROM stdin;
1	text	\N	\N	\N	\N	\N	\N	2017-07-14 14:57:56.565-04	2017-07-14 14:57:56.565-04	\N
2	text	\N	\N	\N	\N	\N	\N	2017-07-14 14:57:56.565-04	2017-07-14 14:57:56.565-04	\N
3	zip	\N	\N	\N	\N	\N	\N	2017-07-14 14:57:56.565-04	2017-07-14 14:57:56.565-04	\N
4	year	\N	\N	\N	\N	\N	\N	2017-07-14 14:57:56.565-04	2017-07-14 14:57:56.565-04	\N
\.


--
-- Data for Name: question_choice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY question_choice (id, question_id, type, code, meta, line, created_at, updated_at, choice_set_id, deleted_at) FROM stdin;
\.


--
-- Name: question_choice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('question_choice_id_seq', 1, false);


--
-- Data for Name: question_choice_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY question_choice_text (id, question_choice_id, language_code, text, created_at, deleted_at) FROM stdin;
\.


--
-- Name: question_choice_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('question_choice_text_id_seq', 1, false);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('question_id_seq', 4, true);


--
-- Data for Name: question_identifier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY question_identifier (id, type, identifier, question_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: question_identifier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('question_identifier_id_seq', 1, false);


--
-- Data for Name: question_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY question_text (id, question_id, language_code, text, instruction, created_at, deleted_at) FROM stdin;
1	1	en	First Name	\N	2017-07-14 14:57:56.582-04	\N
2	2	en	Last Name	\N	2017-07-14 14:57:56.585-04	\N
3	3	en	Zip Code	\N	2017-07-14 14:57:56.586-04	\N
4	4	en	Year of Birth	\N	2017-07-14 14:57:56.588-04	\N
\.


--
-- Name: question_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('question_text_id_seq', 4, true);


--
-- Data for Name: question_type; Type: TABLE DATA; Schema: public; Owner: -
--

COPY question_type (name, created_at) FROM stdin;
text	2017-07-14 14:57:55.961-04
integer	2017-07-14 14:57:55.961-04
date	2017-07-14 14:57:55.961-04
month	2017-07-14 14:57:55.962-04
blood-pressure	2017-07-14 14:57:55.962-04
choice	2017-07-14 14:57:55.961-04
choices	2017-07-14 14:57:55.961-04
bool	2017-07-14 14:57:55.961-04
float	2017-07-14 14:57:55.961-04
zip	2017-07-14 14:57:55.961-04
pounds	2017-07-14 14:57:55.962-04
year	2017-07-14 14:57:55.962-04
day	2017-07-14 14:57:55.962-04
feet-inches	2017-07-14 14:57:55.962-04
choice-ref	2017-07-14 14:57:55.962-04
\.


--
-- Data for Name: registry_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY registry_user (id, username, email, password, role, original_username, reset_password_token, reset_password_expires, created_at, updated_at, deleted_at) FROM stdin;
1	super	rr_demo@amida.com	$2a$10$aXyjw8IiXHGs2rU6MvW7.uSnfmUqFXlxrXH4J.rgFO4B4SJH885OG	admin	\N	\N	\N	2017-07-14 14:57:55.947833-04	2017-07-14 14:57:55.866-04	\N
2	email_0@example.com	email_0@example.com	$2a$10$KOroreOd3Hw6DJ.Cxkk4o.gt2aX5.oYz/GYMM9cyt34WlrTcWanVK	participant	email_0@example.com	\N	\N	2017-07-14 14:57:56.701798-04	2017-07-14 14:57:56.705-04	\N
3	email_1@example.com	email_1@example.com	$2a$10$ExO3vIGrLqvWf6nMLr.lOekkjwuguidPeqfGKuxeBCz2r2uvl5xny	participant	email_1@example.com	\N	\N	2017-07-14 14:57:56.842999-04	2017-07-14 14:57:56.845-04	\N
4	email_2@example.com	email_2@example.com	$2a$10$OKk1uhp9OU4RTUEZY5tn4uSrB4ACE.etPPkwawr/0nI/nPuBO6yFO	participant	email_2@example.com	\N	\N	2017-07-14 14:57:56.986519-04	2017-07-14 14:57:56.988-04	\N
5	email_3@example.com	email_3@example.com	$2a$10$1Z0ssw3/Igb35t.oLZ23bOfzBKJ.PnceEtmVyLq3JbXWava0ln5n2	participant	email_3@example.com	\N	\N	2017-07-14 14:57:57.102587-04	2017-07-14 14:57:57.104-04	\N
6	email_4@example.com	email_4@example.com	$2a$10$mjtqvcO6oPkt/ujp9IbyvuXVr11XikNIYGyjnObKFzJs0YFq15H5O	participant	email_4@example.com	\N	\N	2017-07-14 14:57:57.213004-04	2017-07-14 14:57:57.215-04	\N
\.


--
-- Name: registry_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('registry_user_id_seq', 6, true);


--
-- Data for Name: research_site; Type: TABLE DATA; Schema: public; Owner: -
--

COPY research_site (id, name, url, city, state, zip, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Name: research_site_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('research_site_id_seq', 1, false);


--
-- Data for Name: research_site_vicinity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY research_site_vicinity (id, research_site_id, zip, created_at, deleted_at) FROM stdin;
\.


--
-- Name: research_site_vicinity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('research_site_vicinity_id_seq', 1, false);


--
-- Data for Name: section; Type: TABLE DATA; Schema: public; Owner: -
--

COPY section (id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Name: section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('section_id_seq', 1, false);


--
-- Data for Name: section_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY section_text (id, section_id, language_code, name, description, created_at, deleted_at) FROM stdin;
\.


--
-- Name: section_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('section_text_id_seq', 1, false);


--
-- Data for Name: smtp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY smtp (id, protocol, username, password, host, email_from, other_options, created_at, deleted_at) FROM stdin;
\.


--
-- Name: smtp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('smtp_id_seq', 1, false);


--
-- Data for Name: smtp_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY smtp_text (id, language_code, subject, content, created_at, deleted_at) FROM stdin;
\.


--
-- Name: smtp_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('smtp_text_id_seq', 1, false);


--
-- Data for Name: staging_bhr_gap; Type: TABLE DATA; Schema: public; Owner: -
--

COPY staging_bhr_gap (id, username, assessment_name, status, line_index, question_id, question_choice_id, multiple_index, value, language_code, last_answer, days_after_baseline) FROM stdin;
\.


--
-- Name: staging_bhr_gap_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('staging_bhr_gap_id_seq', 1, false);


--
-- Data for Name: survey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey (id, status, version, group_id, meta, created_at, updated_at, deleted_at) FROM stdin;
1	published	\N	\N	\N	2017-07-14 14:57:56.553-04	2017-07-14 14:57:56.553-04	\N
\.


--
-- Data for Name: survey_consent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_consent (id, survey_id, consent_id, consent_type_id, action, created_at, deleted_at) FROM stdin;
\.


--
-- Name: survey_consent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_consent_id_seq', 1, false);


--
-- Name: survey_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_id_seq', 1, true);


--
-- Data for Name: survey_identifier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_identifier (id, type, identifier, survey_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: survey_identifier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_identifier_id_seq', 1, false);


--
-- Data for Name: survey_question; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_question (id, survey_id, question_id, line, required, created_at, deleted_at) FROM stdin;
1	1	1	0	t	2017-07-14 14:57:56.596-04	\N
2	1	2	1	t	2017-07-14 14:57:56.596-04	\N
3	1	3	2	t	2017-07-14 14:57:56.596-04	\N
4	1	4	3	t	2017-07-14 14:57:56.597-04	\N
\.


--
-- Name: survey_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_question_id_seq', 4, true);


--
-- Data for Name: survey_section; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_section (id, survey_id, section_id, parent_id, parent_question_id, line, created_at, deleted_at) FROM stdin;
\.


--
-- Name: survey_section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_section_id_seq', 1, false);


--
-- Data for Name: survey_section_question; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_section_question (id, survey_section_id, question_id, line, created_at) FROM stdin;
\.


--
-- Name: survey_section_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_section_question_id_seq', 1, false);


--
-- Data for Name: survey_status; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_status (name, created_at) FROM stdin;
draft	2017-07-14 14:57:55.82-04
published	2017-07-14 14:57:55.821-04
retired	2017-07-14 14:57:55.821-04
\.


--
-- Data for Name: survey_text; Type: TABLE DATA; Schema: public; Owner: -
--

COPY survey_text (id, survey_id, language_code, name, description, created_at, deleted_at) FROM stdin;
1	1	en	Alzheimer	\N	2017-07-14 14:57:56.561-04	\N
\.


--
-- Name: survey_text_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('survey_text_id_seq', 1, true);


--
-- Data for Name: user_assessment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_assessment (id, user_id, assessment_id, meta, sequence, status, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: user_assessment_answer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_assessment_answer (id, answer_id, user_assessment_id, created_at) FROM stdin;
\.


--
-- Name: user_assessment_answer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_assessment_answer_id_seq', 1, false);


--
-- Name: user_assessment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_assessment_id_seq', 1, false);


--
-- Data for Name: user_audit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_audit (id, user_id, endpoint, operation, created_at) FROM stdin;
\.


--
-- Name: user_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_audit_id_seq', 1, false);


--
-- Data for Name: user_survey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY user_survey (id, user_id, survey_id, status, created_at, deleted_at) FROM stdin;
1	2	1	completed	2017-07-14 14:57:56.801-04	\N
2	3	1	completed	2017-07-14 14:57:56.941-04	\N
3	4	1	completed	2017-07-14 14:57:57.07-04	\N
4	5	1	completed	2017-07-14 14:57:57.185-04	\N
5	6	1	completed	2017-07-14 14:57:57.296-04	\N
\.


--
-- Name: user_survey_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('user_survey_id_seq', 5, true);


--
-- Name: answer_identifier_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_identifier
    ADD CONSTRAINT answer_identifier_pkey PRIMARY KEY (id);


--
-- Name: answer_identifier_type_identifier_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_identifier
    ADD CONSTRAINT answer_identifier_type_identifier_key UNIQUE (type, identifier);


--
-- Name: answer_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_pkey PRIMARY KEY (id);


--
-- Name: answer_rule_logic_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_rule_logic
    ADD CONSTRAINT answer_rule_logic_pkey PRIMARY KEY (name);


--
-- Name: answer_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_rule
    ADD CONSTRAINT answer_rule_pkey PRIMARY KEY (id);


--
-- Name: answer_rule_value_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_rule_value
    ADD CONSTRAINT answer_rule_value_pkey PRIMARY KEY (id);


--
-- Name: answer_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY answer_type
    ADD CONSTRAINT answer_type_pkey PRIMARY KEY (name);


--
-- Name: assessment_name_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY assessment
    ADD CONSTRAINT assessment_name_key UNIQUE (name);


--
-- Name: assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY assessment
    ADD CONSTRAINT assessment_pkey PRIMARY KEY (id);


--
-- Name: assessment_survey_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY assessment_survey
    ADD CONSTRAINT assessment_survey_pkey PRIMARY KEY (id);


--
-- Name: choice_set_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY choice_set
    ADD CONSTRAINT choice_set_pkey PRIMARY KEY (id);


--
-- Name: consent_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_document
    ADD CONSTRAINT consent_document_pkey PRIMARY KEY (id);


--
-- Name: consent_document_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_document_text
    ADD CONSTRAINT consent_document_text_pkey PRIMARY KEY (id);


--
-- Name: consent_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent
    ADD CONSTRAINT consent_pkey PRIMARY KEY (id);


--
-- Name: consent_section_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_section
    ADD CONSTRAINT consent_section_pkey PRIMARY KEY (id);


--
-- Name: consent_signature_consent_document_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_signature
    ADD CONSTRAINT consent_signature_consent_document_id_user_id_key UNIQUE (consent_document_id, user_id);


--
-- Name: consent_signature_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_signature
    ADD CONSTRAINT consent_signature_pkey PRIMARY KEY (id);


--
-- Name: consent_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_type
    ADD CONSTRAINT consent_type_pkey PRIMARY KEY (id);


--
-- Name: consent_type_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY consent_type_text
    ADD CONSTRAINT consent_type_text_pkey PRIMARY KEY (id);


--
-- Name: language_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY language
    ADD CONSTRAINT language_pkey PRIMARY KEY (code);


--
-- Name: profile_survey_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY profile_survey
    ADD CONSTRAINT profile_survey_pkey PRIMARY KEY (id);


--
-- Name: question_choice_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_pkey PRIMARY KEY (id);


--
-- Name: question_choice_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_choice_text
    ADD CONSTRAINT question_choice_text_pkey PRIMARY KEY (id);


--
-- Name: question_identifier_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_identifier
    ADD CONSTRAINT question_identifier_pkey PRIMARY KEY (id);


--
-- Name: question_identifier_type_identifier_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_identifier
    ADD CONSTRAINT question_identifier_type_identifier_key UNIQUE (type, identifier);


--
-- Name: question_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: question_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_text
    ADD CONSTRAINT question_text_pkey PRIMARY KEY (id);


--
-- Name: question_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY question_type
    ADD CONSTRAINT question_type_pkey PRIMARY KEY (name);


--
-- Name: registry_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_pkey PRIMARY KEY (id);


--
-- Name: registry_user_reset_password_token_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_reset_password_token_key UNIQUE (reset_password_token);


--
-- Name: registry_user_username_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY registry_user
    ADD CONSTRAINT registry_user_username_key UNIQUE (username);


--
-- Name: research_site_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY research_site
    ADD CONSTRAINT research_site_pkey PRIMARY KEY (id);


--
-- Name: research_site_vicinity_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY research_site_vicinity
    ADD CONSTRAINT research_site_vicinity_pkey PRIMARY KEY (id);


--
-- Name: section_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY section
    ADD CONSTRAINT section_pkey PRIMARY KEY (id);


--
-- Name: section_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY section_text
    ADD CONSTRAINT section_text_pkey PRIMARY KEY (id);


--
-- Name: smtp_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY smtp
    ADD CONSTRAINT smtp_pkey PRIMARY KEY (id);


--
-- Name: smtp_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY smtp_text
    ADD CONSTRAINT smtp_text_pkey PRIMARY KEY (id);


--
-- Name: staging_bhr_gap_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY staging_bhr_gap
    ADD CONSTRAINT staging_bhr_gap_pkey PRIMARY KEY (id);


--
-- Name: survey_consent_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_consent
    ADD CONSTRAINT survey_consent_pkey PRIMARY KEY (id);


--
-- Name: survey_identifier_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_identifier
    ADD CONSTRAINT survey_identifier_pkey PRIMARY KEY (id);


--
-- Name: survey_identifier_type_identifier_key; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_identifier
    ADD CONSTRAINT survey_identifier_type_identifier_key UNIQUE (type, identifier);


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
-- Name: survey_section_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_section
    ADD CONSTRAINT survey_section_pkey PRIMARY KEY (id);


--
-- Name: survey_section_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_section_question
    ADD CONSTRAINT survey_section_question_pkey PRIMARY KEY (id);


--
-- Name: survey_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_status
    ADD CONSTRAINT survey_status_pkey PRIMARY KEY (name);


--
-- Name: survey_text_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY survey_text
    ADD CONSTRAINT survey_text_pkey PRIMARY KEY (id);


--
-- Name: user_assessment_answer_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_assessment_answer
    ADD CONSTRAINT user_assessment_answer_pkey PRIMARY KEY (id);


--
-- Name: user_assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_assessment
    ADD CONSTRAINT user_assessment_pkey PRIMARY KEY (id);


--
-- Name: user_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_audit
    ADD CONSTRAINT user_audit_pkey PRIMARY KEY (id);


--
-- Name: user_survey_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY user_survey
    ADD CONSTRAINT user_survey_pkey PRIMARY KEY (id);


--
-- Name: answer_identifier_question_id_question_choice_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX answer_identifier_question_id_question_choice_id ON answer_identifier USING btree (question_id, question_choice_id);


--
-- Name: answer_rule_survey_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX answer_rule_survey_id ON answer_rule USING btree (survey_id) WHERE (deleted_at IS NULL);


--
-- Name: answer_survey_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX answer_survey_id ON answer USING btree (survey_id) WHERE (deleted_at IS NULL);


--
-- Name: choice_set_reference; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE UNIQUE INDEX choice_set_reference ON choice_set USING btree (reference) WHERE (deleted_at IS NULL);


--
-- Name: question_choice_choice_set_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX question_choice_choice_set_id ON question_choice USING btree (choice_set_id) WHERE (deleted_at IS NULL);


--
-- Name: question_choice_question_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX question_choice_question_id ON question_choice USING btree (question_id) WHERE (deleted_at IS NULL);


--
-- Name: question_identifier_question_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX question_identifier_question_id ON question_identifier USING btree (question_id);


--
-- Name: registry_user_lower_email_key; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE UNIQUE INDEX registry_user_lower_email_key ON registry_user USING btree (lower(email));


--
-- Name: research_site_vicinity_zip_research_site_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE UNIQUE INDEX research_site_vicinity_zip_research_site_id ON research_site_vicinity USING btree (zip, research_site_id) WHERE (deleted_at IS NULL);


--
-- Name: staging_bhr_gap_username_assessment_name_line_index; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX staging_bhr_gap_username_assessment_name_line_index ON staging_bhr_gap USING btree (username, assessment_name, line_index);


--
-- Name: survey_consent_survey_id_consent_type_id_action; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE UNIQUE INDEX survey_consent_survey_id_consent_type_id_action ON survey_consent USING btree (survey_id, consent_type_id, action);


--
-- Name: survey_identifier_survey_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX survey_identifier_survey_id ON survey_identifier USING btree (survey_id);


--
-- Name: survey_question_survey_id_question_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE UNIQUE INDEX survey_question_survey_id_question_id ON survey_question USING btree (survey_id, question_id) WHERE (deleted_at IS NULL);


--
-- Name: survey_section_question_survey_section_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX survey_section_question_survey_section_id ON survey_section_question USING btree (survey_section_id);


--
-- Name: survey_section_survey_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX survey_section_survey_id ON survey_section USING btree (survey_id) WHERE (deleted_at IS NULL);


--
-- Name: user_assessment_assessment_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX user_assessment_assessment_id ON user_assessment USING btree (assessment_id);


--
-- Name: user_assessment_user_id; Type: INDEX; Schema: public; Owner: -; Tablespace: 
--

CREATE INDEX user_assessment_user_id ON user_assessment USING btree (user_id);


--
-- Name: answer_identifier_question_choice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_identifier
    ADD CONSTRAINT answer_identifier_question_choice_id_fkey FOREIGN KEY (question_choice_id) REFERENCES question_choice(id) ON UPDATE CASCADE;


--
-- Name: answer_identifier_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_identifier
    ADD CONSTRAINT answer_identifier_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id) ON UPDATE CASCADE;


--
-- Name: answer_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: answer_question_choice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_question_choice_id_fkey FOREIGN KEY (question_choice_id) REFERENCES question_choice(id) ON UPDATE CASCADE;


--
-- Name: answer_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id) ON UPDATE CASCADE;


--
-- Name: answer_rule_answer_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule
    ADD CONSTRAINT answer_rule_answer_question_id_fkey FOREIGN KEY (answer_question_id) REFERENCES question(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: answer_rule_logic_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule
    ADD CONSTRAINT answer_rule_logic_fkey FOREIGN KEY (logic) REFERENCES answer_rule_logic(name);


--
-- Name: answer_rule_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule
    ADD CONSTRAINT answer_rule_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id) ON UPDATE CASCADE;


--
-- Name: answer_rule_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule
    ADD CONSTRAINT answer_rule_section_id_fkey FOREIGN KEY (section_id) REFERENCES section(id);


--
-- Name: answer_rule_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule
    ADD CONSTRAINT answer_rule_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: answer_rule_value_answer_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule_value
    ADD CONSTRAINT answer_rule_value_answer_rule_id_fkey FOREIGN KEY (answer_rule_id) REFERENCES answer_rule(id);


--
-- Name: answer_rule_value_question_choice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer_rule_value
    ADD CONSTRAINT answer_rule_value_question_choice_id_fkey FOREIGN KEY (question_choice_id) REFERENCES question_choice(id) ON UPDATE CASCADE;


--
-- Name: answer_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: answer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY answer
    ADD CONSTRAINT answer_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id) ON UPDATE CASCADE;


--
-- Name: assessment_survey_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY assessment_survey
    ADD CONSTRAINT assessment_survey_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessment(id);


--
-- Name: assessment_survey_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY assessment_survey
    ADD CONSTRAINT assessment_survey_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: consent_document_text_consent_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_document_text
    ADD CONSTRAINT consent_document_text_consent_document_id_fkey FOREIGN KEY (consent_document_id) REFERENCES consent_document(id);


--
-- Name: consent_document_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_document_text
    ADD CONSTRAINT consent_document_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: consent_document_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_document
    ADD CONSTRAINT consent_document_type_id_fkey FOREIGN KEY (type_id) REFERENCES consent_type(id);


--
-- Name: consent_section_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_section
    ADD CONSTRAINT consent_section_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES consent(id);


--
-- Name: consent_section_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_section
    ADD CONSTRAINT consent_section_type_id_fkey FOREIGN KEY (type_id) REFERENCES consent_type(id);


--
-- Name: consent_signature_consent_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_signature
    ADD CONSTRAINT consent_signature_consent_document_id_fkey FOREIGN KEY (consent_document_id) REFERENCES consent_document(id);


--
-- Name: consent_signature_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_signature
    ADD CONSTRAINT consent_signature_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: consent_signature_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_signature
    ADD CONSTRAINT consent_signature_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id);


--
-- Name: consent_type_text_consent_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_type_text
    ADD CONSTRAINT consent_type_text_consent_type_id_fkey FOREIGN KEY (consent_type_id) REFERENCES consent_type(id);


--
-- Name: consent_type_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY consent_type_text
    ADD CONSTRAINT consent_type_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: profile_survey_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY profile_survey
    ADD CONSTRAINT profile_survey_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: question_choice_choice_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_choice_set_id_fkey FOREIGN KEY (choice_set_id) REFERENCES choice_set(id);


--
-- Name: question_choice_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: question_choice_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question
    ADD CONSTRAINT question_choice_set_id_fkey FOREIGN KEY (choice_set_id) REFERENCES choice_set(id);


--
-- Name: question_choice_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice_text
    ADD CONSTRAINT question_choice_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: question_choice_text_question_choice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice_text
    ADD CONSTRAINT question_choice_text_question_choice_id_fkey FOREIGN KEY (question_choice_id) REFERENCES question_choice(id);


--
-- Name: question_choice_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_choice
    ADD CONSTRAINT question_choice_type_fkey FOREIGN KEY (type) REFERENCES answer_type(name);


--
-- Name: question_identifier_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_identifier
    ADD CONSTRAINT question_identifier_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id) ON UPDATE CASCADE;


--
-- Name: question_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_text
    ADD CONSTRAINT question_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: question_text_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question_text
    ADD CONSTRAINT question_text_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: question_type_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY question
    ADD CONSTRAINT question_type_fkey FOREIGN KEY (type) REFERENCES question_type(name);


--
-- Name: research_site_vicinity_research_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY research_site_vicinity
    ADD CONSTRAINT research_site_vicinity_research_site_id_fkey FOREIGN KEY (research_site_id) REFERENCES research_site(id) ON UPDATE CASCADE;


--
-- Name: section_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY section_text
    ADD CONSTRAINT section_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: section_text_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY section_text
    ADD CONSTRAINT section_text_section_id_fkey FOREIGN KEY (section_id) REFERENCES section(id);


--
-- Name: smtp_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY smtp_text
    ADD CONSTRAINT smtp_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: staging_bhr_gap_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY staging_bhr_gap
    ADD CONSTRAINT staging_bhr_gap_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: survey_consent_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_consent
    ADD CONSTRAINT survey_consent_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES consent(id);


--
-- Name: survey_consent_consent_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_consent
    ADD CONSTRAINT survey_consent_consent_type_id_fkey FOREIGN KEY (consent_type_id) REFERENCES consent_type(id);


--
-- Name: survey_consent_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_consent
    ADD CONSTRAINT survey_consent_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: survey_identifier_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_identifier
    ADD CONSTRAINT survey_identifier_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: survey_question_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_question
    ADD CONSTRAINT survey_question_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id) ON UPDATE CASCADE;


--
-- Name: survey_question_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_question
    ADD CONSTRAINT survey_question_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: survey_section_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section
    ADD CONSTRAINT survey_section_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES survey_section(id);


--
-- Name: survey_section_parent_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section
    ADD CONSTRAINT survey_section_parent_question_id_fkey FOREIGN KEY (parent_question_id) REFERENCES question(id);


--
-- Name: survey_section_question_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section_question
    ADD CONSTRAINT survey_section_question_question_id_fkey FOREIGN KEY (question_id) REFERENCES question(id);


--
-- Name: survey_section_question_survey_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section_question
    ADD CONSTRAINT survey_section_question_survey_section_id_fkey FOREIGN KEY (survey_section_id) REFERENCES survey_section(id);


--
-- Name: survey_section_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section
    ADD CONSTRAINT survey_section_section_id_fkey FOREIGN KEY (section_id) REFERENCES section(id);


--
-- Name: survey_section_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_section
    ADD CONSTRAINT survey_section_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: survey_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey
    ADD CONSTRAINT survey_status_fkey FOREIGN KEY (status) REFERENCES survey_status(name);


--
-- Name: survey_text_language_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_text
    ADD CONSTRAINT survey_text_language_code_fkey FOREIGN KEY (language_code) REFERENCES language(code);


--
-- Name: survey_text_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY survey_text
    ADD CONSTRAINT survey_text_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: user_assessment_answer_answer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_assessment_answer
    ADD CONSTRAINT user_assessment_answer_answer_id_fkey FOREIGN KEY (answer_id) REFERENCES answer(id);


--
-- Name: user_assessment_answer_user_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_assessment_answer
    ADD CONSTRAINT user_assessment_answer_user_assessment_id_fkey FOREIGN KEY (user_assessment_id) REFERENCES user_assessment(id);


--
-- Name: user_assessment_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_assessment
    ADD CONSTRAINT user_assessment_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessment(id) ON UPDATE CASCADE;


--
-- Name: user_assessment_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_assessment
    ADD CONSTRAINT user_assessment_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id);


--
-- Name: user_audit_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_audit
    ADD CONSTRAINT user_audit_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id);


--
-- Name: user_survey_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_survey
    ADD CONSTRAINT user_survey_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES survey(id);


--
-- Name: user_survey_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY user_survey
    ADD CONSTRAINT user_survey_user_id_fkey FOREIGN KEY (user_id) REFERENCES registry_user(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM afsinustundag;
GRANT ALL ON SCHEMA public TO afsinustundag;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

