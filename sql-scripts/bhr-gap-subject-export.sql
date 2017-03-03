SELECT
	registry_user.username,
	answer.question_id,
	answer.question_choice_id,
	CASE
		WHEN (question.type = 'choice' OR question.type = 'choices') THEN question_choice_text.text
	 	ELSE answer.value
	END AS value
FROM
	answer
	LEFT JOIN registry_user ON registry_user.id = answer.user_id
	LEFT JOIN question ON question.id = answer.question_id
	LEFT JOIN question_choice ON question_choice.id = answer.question_choice_id
	LEFT JOIN question_choice_text ON question_choice_text.question_choice_id = question_choice.id AND question_choice_text.language_code = 'en'
WHERE
	answer.survey_id = :survey_id
;
