'use strict';

/* eslint max-len: 0 */

const moment = require('moment');
const _ = require('lodash');
const Base = require('./base');

// TODO: eventually assign these to the key of answerValueType?
const castAnswerValueByType = (demographic) => {
    const type = demographic['question.type'];
    if (type === 'text') {
        return demographic.value;
    } else if (type === 'integer') {
        return parseInt(demographic.value, 10);
    } else if (type === 'zip') {
        return demographic.value;
    } else if (type === 'year') {
        return demographic.value;
    } else if (type === 'bool') {
        if (demographic.value === 'true') {
            return true;
        }
        return false;
    } else if (type === 'date') {
        return demographic.value;
    }
    // // FIXME: only returns a true value... need to join with questionChoice
    // else if(type === 'choice') {
    //     return demographic.value;
    // }
    // // FIXME will always be null... need to join with questionChoice
    // else if(type === 'choices') {
    //     return demographic.value;
    // }

    return demographic.value;
};

const formatAndMergeDemographics = (demographics, questionTextObjs) => {
    let formattedDemographics = demographics.map((demographic) => {
        const formattedDemographic = {
            userId: demographic['user.id'],
        };
        const demographicKeyText = questionTextObjs.find(textObj => textObj.questionId === demographic['question.id']).text;
        formattedDemographic[demographicKeyText] = castAnswerValueByType(demographic);
        formattedDemographic.registrationDate =
            moment(demographic['user.createdAt'], 'YYYY-MM-DD').format('YYYY-MM-DD');
        return formattedDemographic;
    });
    formattedDemographics = _.chain(formattedDemographics)
        .groupBy('userId')
        .map((userRecordSet) => {
            let unifiedRecord = {};
            userRecordSet.forEach((record) => {
                unifiedRecord = Object.assign(unifiedRecord, record);
            });
            delete unifiedRecord.userId;
            delete unifiedRecord.type;
            return unifiedRecord;
        })
        .flattenDeep()
        .value();
    return formattedDemographics;
};

module.exports = class DemographicsDAO extends Base {
    listDemographics() { // TODO: orderBy query param?
        return this.db.ProfileSurvey.findAll({
            raw: true,
            attributes: [
                'surveyId',
            ],
        })
        .then((surveys) => {
            const surveyIds = surveys.map(survey => survey.surveyId);
            return this.db.SurveyQuestion.findAll({
                raw: true,
                attributes: [
                    'questionId',
                ],
                where: {
                    surveyId: surveyIds,
                },
            })
            .then((surveyQuestions) => {
                const questionIds = surveyQuestions.map(surveyQuestion => surveyQuestion.questionId);
                return this.db.QuestionText.findAll({
                    raw: true,
                    attributes: [
                        'questionId',
                        'text',
                    ],
                    where: {
                        id: questionIds,
                    },
                })
                .then(questionTextObjs => this.db.Answer.findAll({
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
                            where: {
                                role: 'participant',
                            },
                        },
                        {
                            model: this.db.Question,
                            as: 'question',
                            raw: true,
                            attributes: [
                                'id',
                                'type',
                            ],
                        },
                            // FIXME:
                            // {
                            //     model: this.db.QuestionChoice,
                            //     as: 'questionChoice',
                            //     raw: true,
                            //     attributes: [
                            //         'id',
                            //         'type',
                            //         'line',
                            //     ],
                            //     // where: {
                            //     //     questionId: questionIds,
                            //     // },
                            // },
                    ],
                })
                    .then(demographics => formatAndMergeDemographics(demographics, questionTextObjs)));
            });
        });
    }
};
