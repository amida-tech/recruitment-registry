SELECT id FROM question_choice
WHERE
	code = :code
AND
	(
		question_id = :question_id
	OR
		choice_set_id IN (SELECT choice_set_id FROM question WHERE id = :question_id)
	)
;
