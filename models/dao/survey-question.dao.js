'use strict';

const db = require('../db');

const SurveyQuestion = db.SurveyQuestion;

module.exports = class SurveyQuestionsDAO {
    constructor() {}

    listSurveyQuestions(surveyId) {
        const options = {
            where: { surveyId },
            raw: true,
            attributes: ['questionId', 'required'],
            order: 'line'
        };
        return SurveyQuestion.findAll(options);
    }
};
