WITH
	user_assessment_last AS (
		SELECT
			last_value(user_assessment.id) OVER (
				PARTITION BY user_id ORDER BY assessment.id RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
			) AS id
		FROM
			user_assessment
			LEFT JOIN assessment ON assessment.id = user_assessment.assessment_id
		WHERE
			user_assessment.assessment_id IN (SELECT assessment_id FROM assessment_survey WHERE survey_id = :survey_id)
			AND user_assessment.status = 'collected'
	),
	user_assessment_result AS (
		SELECT
			user_assessment.id AS user_assessment_id,
			assessment.name AS assessment_name,
			registry_user.username AS username,
			user_assessment.status AS status,
			(user_assessment.meta->'bhr_days_after_baseline')::text::int AS days_after_baseline,
			user_assessment.id IN (SELECT id FROM user_assessment_last) AS last_answer
		FROM
			user_assessment
			LEFT JOIN assessment ON assessment.id = user_assessment.assessment_id
			LEFT JOIN registry_user ON registry_user.id = user_assessment.user_id
		WHERE
			user_assessment.assessment_id IN (SELECT assessment_id FROM assessment_survey WHERE survey_id = :survey_id)
	),
	answer_result AS (
		SELECT
			user_assessment_answer.user_assessment_id AS user_assessment_id,
			answer.question_id,
			question.type AS question_type,
			question.multiple,
			answer.multiple_index,
			answer.question_choice_id,
			question_choice.type AS choice_type,
			answer.value,
			answer.deleted_at AS deleted_at
		FROM answer
			INNER JOIN user_assessment_answer ON user_assessment_answer.answer_id = answer.id
			LEFT JOIN question ON question.id = answer.question_id
			LEFT JOIN question_choice ON question_choice.id = answer.question_choice_id
		WHERE
			answer.survey_id = :survey_id
	)
SELECT
	user_assessment_result.user_assessment_id AS user_assessment_id,
	user_assessment_result.username AS username,
	user_assessment_result.assessment_name AS assessment_name,
	user_assessment_result.days_after_baseline AS days_after_baseline,
	CASE
		WHEN (answer_result.deleted_at IS NULL AND answer_result.question_id IS NOT NULL) THEN TRUE
		WHEN (user_assessment_result.status = 'collected' AND answer_result.question_id IS NULL AND user_assessment_result.last_answer) THEN TRUE
		ELSE FALSE
	END AS last_answer,
	user_assessment_result.status AS status,
	answer_result.question_id,
	answer_result.question_type,
	answer_result.multiple,
	answer_result.multiple_index,
	answer_result.question_choice_id,
	answer_result.choice_type,
	answer_result.value
FROM
	user_assessment_result
	LEFT OUTER JOIN answer_result ON user_assessment_result.user_assessment_id = answer_result.user_assessment_id
;
