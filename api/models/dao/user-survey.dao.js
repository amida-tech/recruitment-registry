'use strict';

const db = require('../db');

const sequelize = db.sequelize;

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
        return sequelize.transaction(transaction => {
            return UserSurvey.findOne({
                    where: { userId, surveyId },
                    raw: true,
                    attributes: ['status'],
                    transaction
                })
                .then(userSurvey => {
                    if (!userSurvey) {
                        return UserSurvey.create({ userId, surveyId, status }, { transaction });
                    } else if (userSurvey.status !== status) {
                        return UserSurvey.destroy({ where: { userId, surveyId } }, { transaction })
                            .then(() => UserSurvey.create({ userId, surveyId, status }, { transaction }));
                    }
                })
                .then(() => this.answer.createAnswers({ userId, surveyId, answers, language, status }, transaction));
        });
    }

    getUserSurveyAnswers(userId, surveyId, options) {
    	const result = {};
    	return this.getUserSurveyStatus(userId, surveyId)
    		.then(status => result.status = status)
    		.then(() => this.answer.getAnswers({ userId, surveyId }))
    		.then(answers => result.answers = answers || [])
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
};
