DROP TABLE IF EXISTS staging_bhr_gap;
DROP TABLE IF EXISTS afsin;

CREATE TABLE staging_bhr_gap (
	id INTEGER NOT NULL,
	username TEXT,
	assessment_name TEXT,
	status TEXT,
	line_index INTEGER,
	question_id INTEGER,
	question_choice_id INTEGER,
	multiple_index INTEGER,
	value TEXT,
	language_code TEXT
);

CREATE SEQUENCE staging_bhr_gap_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE staging_bhr_gap_id_seq OWNED BY staging_bhr_gap.id;
ALTER TABLE ONLY staging_bhr_gap ALTER COLUMN id SET DEFAULT nextval('staging_bhr_gap_id_seq'::regclass);
ALTER TABLE ONLY staging_bhr_gap ADD CONSTRAINT staging_bhr_gap_pkey PRIMARY KEY (id);

COPY staging_bhr_gap (username, assessment_name, status, line_index, question_id, question_choice_id, multiple_index, value, language_code) FROM :filepath CSV HEADER;

TRUNCATE user_assessment_answer, user_assessment, answer, assessment_survey, assessment RESTART IDENTITY;

WITH
	assessment_id AS (
		INSERT INTO
			assessment (name, "sequenceType", created_at, updated_at)
		SELECT DISTINCT
			:identifier || '-' || assessment_name, 'ondemand'::"enum_assessment_sequenceType", NOW(), NOW()
		FROM staging_bhr_gap
			RETURNING id
	)
INSERT INTO
	assessment_survey (assessment_id, survey_id, created_at)
SELECT
	assessment_id.id AS assessment_id,
	:survey_id AS survey_id,
	NOW() AS created_at
FROM
	assessment_id
;

WITH
	user_assesment_start_id AS (
		SELECT MIN(id) AS id FROM staging_bhr_gap GROUP BY username, assessment_name, line_index
	),
	user_assessment_row AS (
		SELECT
			username, :identifier || '-' || assessment_name as assessment_name, status, line_index, ROW_NUMBER() OVER (PARTITION BY username, assessment_name ORDER BY id) as sequence
		FROM
			staging_bhr_gap
		WHERE
			id IN (SELECT id FROM user_assesment_start_id)
	),
	user_assessment_result AS (
		INSERT INTO
			user_assessment (user_id, assessment_id, sequence, status, meta, created_at)
		SELECT
			registry_user.id as user_id,
			assessment.id as assessment_id,
			user_assessment_row.sequence AS sequence,
			user_assessment_row.status::enum_user_assessment_status,
			('{"bhr_source_line_index":' || line_index::text || '}')::json,
			NOW()
		FROM
			user_assessment_row, registry_user, assessment
		WHERE
			registry_user.username = user_assessment_row.username AND
			assessment.name = user_assessment_row.assessment_name
		RETURNING id, (meta->'bhr_source_line_index')::text::int AS line_index
	),
	answer_result AS (
		INSERT INTO
			answer (user_id, survey_id, language_code, question_id, question_choice_id, value, multiple_index, meta, created_at)
		SELECT
			registry_user.id as user_id,
			:survey_id as survey_id,
			'en' as language_code,
			staging_bhr_gap.question_id as question_id,
			staging_bhr_gap.question_choice_id as question_choice_id,
			staging_bhr_gap.value as value,
			staging_bhr_gap.multiple_index as multiple_index,
			('{"bhr_source_line_index":' || staging_bhr_gap.line_index::text || '}')::json as meta,
			NOW() as created_at
		FROM
			staging_bhr_gap
			LEFT JOIN registry_user ON registry_user.username = staging_bhr_gap.username
		WHERE
			question_id IS NOT NULL
		RETURNING id, (meta->'bhr_source_line_index')::text::int AS line_index
	)
INSERT INTO
	user_assessment_answer (user_assessment_id, answer_id, created_at)
SELECT
	user_assessment_result.id, answer_result.id, NOW()
FROM
	answer_result, user_assessment_result
WHERE
	answer_result.line_index = user_assessment_result.line_index
;
