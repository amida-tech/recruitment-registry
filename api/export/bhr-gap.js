'use strict';

//const models = require('../models');
//
//const query = 'select answer.question_id, question.type, answer.question_choice_id, question_choice.type, answer.value, assessment.name, registry_user.username from answer left join user_assessment_answer on user_assessment_answer.answer_id = answer.id left join user_assessment on user_assessment.id = user_assessment_answer.user_assessment_id left join assessment on user_assessment.assessment_id = assessment.id left join registry_user on registry_user.id = answer.user_id left join question on question.id = answer.question_id left join question_choice on question_choice.id = answer.question_choice_id where answer.survey_id = 2 and answer.question_choice_id is not null order by answer.id';
//const exportCurrentMedications = function () {
//    return models.answerIdentifier.getIdentifiersByAnswerId('bhr-gap-current-meds-column')
//        .then(identifierMap => {
//        	return models.surveyIdentifier.getIdsBySurveyIdentifier('bhr-gap', 'current-medications')
//        		.then(surveyId => {
//
//        		})
//        });
//};
//
//module.exports = {
//    exportCurrentMedications
//};
