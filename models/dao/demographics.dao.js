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
                                'type',
                            ],
                            where: {
                                type: [
                                    'zip',
                                    'year',
                                ],
                            },
                        },
                    ],
                })
                .then(demographics => {
                    return this.formatAndMergeDemographics(demographics);
                });
            });
        });
    }

    formatAndMergeDemographics(demographics) {
        demographics = demographics.map((demographic) => {
            const formattedDemographic = {
                userId: demographic['user.id'],
            };
            if(demographic['question.type'] === 'zip') {
                formattedDemographic.zip = demographic.value;
            }
            if(demographic['question.type'] === 'year') {
                formattedDemographic.yob = demographic.value;
            }
            formattedDemographic.registrationDate = moment(demographic['user.createdAt'],'YYYY-MM-DD')
                .format('YYYY-MM-DD');
            return formattedDemographic;
        });
        demographics = _.chain(demographics)
            .groupBy('userId')
            .map((userRecordSet) => {
                const zipRecord = userRecordSet.find((record) => record.zip);
                const yobRecord = userRecordSet.find((record) => record.yob);
                const unifiedRecord = Object.assign({},
                    zipRecord,
                    yobRecord
                );
                const anonymizedUnifiedRecord = {
                    zip: unifiedRecord.zip,
                    yob: unifiedRecord.yob,
                    registrationDate: unifiedRecord.registrationDate,
                };
                return anonymizedUnifiedRecord;
            })
            .flattenDeep()
            .value();
        return demographics;
    }
};
