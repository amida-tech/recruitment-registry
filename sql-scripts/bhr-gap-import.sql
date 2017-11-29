TRUNCATE staging_bhr_gap RESTART IDENTITY;

COPY staging_bhr_gap (username, assessment_name, status, line_index, question_id, question_choice_id, multiple_index, value, language_code, last_answer, days_after_baseline) FROM :filepath CSV HEADER;

WITH
	assesment_row AS (
		SELECT DISTINCT
			assessment_name
		FROM
			staging_bhr_gap
		ORDER BY
			assessment_name
	),
	assessment_id AS (
		INSERT INTO
			assessment (name, created_at)
		SELECT
			:identifier || '-' || assessment_name, NOW()
		FROM
			assesment_row
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
			username, :identifier || '-' || assessment_name as assessment_name, status, line_index, last_answer, days_after_baseline, ROW_NUMBER() OVER (PARTITION BY username, assessment_name ORDER BY id) as version
		FROM
			staging_bhr_gap
		WHERE
			id IN (SELECT id FROM user_assesment_start_id)
	),
	user_assessment_result AS (
		INSERT INTO
			user_assessment (user_id, assessment_id, version, status, meta, created_at)
		SELECT
			registry_user.id as user_id,
			assessment.id as assessment_id,
			user_assessment_row.version AS version,
			user_assessment_row.status::enum_user_assessment_status,
			('{"bhr_source_line_index":' || line_index::text || COALESCE(', "bhr_days_after_baseline":' || days_after_baseline, '') || '}')::json,
			NOW()
		FROM
			user_assessment_row
			LEFT JOIN registry_user ON (registry_user.username = user_assessment_row.username)
			LEFT JOIN assessment ON (assessment.name = user_assessment_row.assessment_name)
		RETURNING id, (meta->'bhr_source_line_index')::text::int AS line_index
	),
	answer_result AS (
		INSERT INTO
			answer (user_id, survey_id, language_code, question_id, question_choice_id, value, multiple_index, meta, created_at, deleted_at)
		SELECT
			registry_user.id as user_id,
			:survey_id as survey_id,
			'en' as language_code,
			staging_bhr_gap.question_id as question_id,
			staging_bhr_gap.question_choice_id as question_choice_id,
			staging_bhr_gap.value as value,
			staging_bhr_gap.multiple_index as multiple_index,
			('{"bhr_source_line_index":' || staging_bhr_gap.line_index::text || '}')::json as meta,
			NOW() as created_at,
			CASE
				WHEN staging_bhr_gap.last_answer THEN NULL
		 		ELSE NOW()
			END
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
