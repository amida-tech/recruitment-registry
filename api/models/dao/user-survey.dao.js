'use strict';

const db = require('../db');

const UserSurvey = db.UserSurvey;

module.exports = class UserSurveyDAO {
    constructor(dependencies) {
        Object.assign(this, dependencies);
    }

    getUserSurveyStatus(userId, surveyId) {
        return UserSurvey.findOne({
                where: { userId, surveyId },
                raw: true,
                attributes: ['status']
            })
            .then(userSurvey => userSurvey ? userSurvey.status : 'new');
    }

    createUserSurveyAnswers(userId, surveyId, input) {
        const { status, language, answers } = input;
        return this.answer.createAnswers({ userId, surveyId, answers, language, status });
    }

    getUserSurveyAnswers(userId, surveyId, options) {
        const result = {};
        return this.getUserSurveyStatus(userId, surveyId)
            .then(status => result.status = status)
            .then(() => this.answer.getAnswers({ userId, surveyId }))
            .then(answers => result.answers = answers)
            .then(() => {
                if (options.includeSurvey) {
                    return this.survey.getSurvey(surveyId, options)
                        .then(survey => result.survey = survey);
                }
            })
            .then(() => result);
    }

    getUserSurvey(userId, surveyId, options) {
        return this.getUserSurveyStatus(userId, surveyId)
            .then(status => {
                return this.survey.getAnsweredSurvey(userId, surveyId, options)
                    .then(survey => ({ status, survey }));
            });
    }

    listUserSurveys(userId, options) {
        return this.survey.listSurveys(options)
            .then(surveys => {
                if (surveys.length) {
                    const ids = surveys.map(survey => survey.id);
                    return UserSurvey.findAll({
                            where: { userId, surveyId: { $in: ids } },
                            raw: true,
                            attributes: ['surveyId', 'status']
                        })
                        .then(userSurveys => {
                            const mapInput = userSurveys.map(userSurvey => [userSurvey.surveyId, userSurvey.status]);
                            const map = new Map(mapInput);
                            surveys.forEach(survey => {
                                survey.status = map.get(survey.id) || 'new';
                            });
                            return surveys;
                        });
                } else {
                    return surveys;
                }
            });
    }
};
