SELECT
    q.id AS "questionId",  qc.id AS id, qct.text AS text, qc.code AS code
FROM
    question_choice_text AS qct, question AS q, question_choice AS qc
WHERE
    q.deleted_at IS NULL AND
    qc.deleted_at IS NULL AND
    qct.deleted_at IS NULL AND
    q.id IN :ids AND
    qct.question_choice_id = qc.id AND
    (
        qc.question_id = q.id OR
        qc.choice_set_id = (SELECT choice_set_id FROM question WHERE id = q.id)
    )
;
