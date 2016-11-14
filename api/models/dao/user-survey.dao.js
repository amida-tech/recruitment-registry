'use strict';

const db = require('../db');

const UserSurvey = db.UserSurvey;

module.exports = class UserSurveyDAO {
    constructor() {}

    getUserSurveyStatus(userId, surveyId) {
        return UserSurvey.findOne({
                where: { userId, surveyId },
                raw: true,
                attributes: ['status']
            })
            .then(userSurvey => userSurvey ? userSurvey.status : 'new');
    }
};
