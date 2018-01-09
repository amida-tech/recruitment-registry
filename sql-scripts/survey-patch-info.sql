SELECT
	survey.status, survey.type, survey_text.name, survey_text.description, survey_question.question_ids AS "questionIds", survey_section.section_count AS "sectionCount"
FROM survey
LEFT JOIN survey_text
	ON :text_needed AND survey_text.survey_id = survey.id AND survey_text.language_code = 'en' AND survey_text.deleted_at IS NULL
LEFT JOIN (SELECT ARRAY_AGG(survey_question.question_id) AS question_ids FROM survey_question WHERE survey_id = :survey_id AND deleted_at IS NULL) AS survey_question
	ON :questions_needed
LEFT JOIN (SELECT COUNT(*) AS section_count FROM survey_section WHERE survey_id = :survey_id AND deleted_at IS NULL) AS survey_section
	ON :sections_needed
WHERE survey.id = :survey_id AND survey.deleted_at IS NULL;