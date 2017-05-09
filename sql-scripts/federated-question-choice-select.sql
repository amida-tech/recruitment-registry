SELECT
	q.id AS "questionId",  qc.id AS "questionChoiceId", qct.text AS "choiceText"
FROM
	question_choice_text AS qct, question AS q, question_choice AS qc
WHERE
	q.id IN :qxids AND q.deleted_at IS NULL AND
	lower(qct.text) IN :texts AND qct.deleted_at IS NULL AND qct.language_code = 'en' AND
	qc.id = qct.question_choice_id AND qc.question_id = q.id AND qc.deleted_at IS NULL
;
