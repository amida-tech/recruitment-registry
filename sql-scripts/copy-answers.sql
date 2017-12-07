INSERT INTO answer (user_id, survey_id, language_code, question_id, question_choice_id, file_id, multiple_index, value, meta, created_at, deleted_at, assessment_id)
	SELECT
		:user_id AS user_id,
		a.survey_id AS survey_id,
		a.language_code AS language_code,
		a.question_id AS question_id,
		a.question_choice_id question_choice_id,
		a.file_id AS file_id,
		a.multiple_index AS multiple_index,
		a.value AS value,
		a.meta AS meta,
		NOW() AS created_at,
		NULL AS deleted_at,
		:assessment_id AS assessment_id
	FROM answer AS a
	WHERE
		a.assessment_id = :prev_assessment_id AND a.deleted_at IS NULL;
