'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');
const _ = require('lodash');
const Base = require('./base');

module.exports = class DemographicsDAO extends Base {
    listDemographics(options = {}) { // TODO: orderBy query param?
        let role = options.role ? options.role : { [Op.in]: ['clinician', 'participant'] };
        if (role === 'all') {
            role = { [Op.in]: ['admin', 'clinician', 'participant'] };
        }
        const where = { role };
        return this.db.ProfileSurvey.findAll({
            raw: true,
            attributes: [
                'id',
            ],
        })
        .then((surveyIds) => {
            surveyIds = surveyIds.map((surveyId) => surveyId.id);
            return this.db.SurveyQuestion.findAll({
                raw: true,
                attributes: [
                    'id',
                ],
                where: {
                    surveyId: surveyIds,
                },
            })
            .then((questionIds) => {
                questionIds = questionIds.map((questionId) => questionId.id);
                return this.db.QuestionText.findAll({
                    raw: true,
                    attributes: [
                        'id',
                        'text'
                    ],
                    where: {
                        id: questionIds
                    },
                })
                .then((questionTextObjs) => {
                    return this.db.Answer.findAll({
                        raw: true,
                        attributes: [
                            'value',
                        ],
                        where: {
                            questionId: questionIds,
                        },
                        include: [

                            {
                                model: this.db.User,
                                as: 'user',
                                raw: true,
                                attributes: [
                                    'id',
                                    'createdAt',
                                ],
                                where,
                            },

                            {
                                model: this.db.Question,
                                as: 'question',
                                raw: true,
                                attributes: [
                                    'id',
                                ],
                            },
                        ],
                    })
                    .then(demographics => {
                        return this.formatAndMergeDemographics(demographics, questionTextObjs);
                    });
                });
            });
        });
    }

    formatAndMergeDemographics(demographics, questionTextObjs) {
        demographics = demographics.map((demographic) => {
            const formattedDemographic = {
                userId: demographic['user.id'],
            };
            const demographicKeyText = questionTextObjs.find((textObj) => {
                return textObj.id === demographic['question.id'];
            }).text;
            formattedDemographic[demographicKeyText] = demographic.value;
            formattedDemographic.registrationDate = moment(demographic['user.createdAt'],'YYYY-MM-DD')
                .format('YYYY-MM-DD');
            return formattedDemographic;
        });
        demographics = _.chain(demographics)
            .groupBy('userId')
            .map((userRecordSet) => {
                let unifiedRecord = {};
                userRecordSet.forEach((record) => {
                    unifiedRecord = Object.assign(unifiedRecord, record);
                });
                delete unifiedRecord.userId;
                return unifiedRecord;
            })
            .flattenDeep()
            .value();
        return demographics;
    }
};
