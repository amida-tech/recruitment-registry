id in (
    SELECT user_id
    FROM answer
    WHERE question_id = :question_id
    AND ((:value IS NULL AND value IS NULL) OR (value = :value))
    AND ((:question_choice_id IS NULL AND question_choice_id IS NULL) OR (question_choice_id = :question_choice_id))
    AND ((:multiple_index IS NULL AND multiple_index IS NULL) OR (multiple_index = :multiple_index))
    AND survey_id = :survey_id
    AND deleted_at IS NULL
);