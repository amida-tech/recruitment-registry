'use strict';

const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');
const _ = require('lodash');
const Base = require('./base');

module.exports = class DemographicsDAO extends Base {
    listDemographics(options = {}) {
        // TODO: orderBy query param?
        let role = options.role ? options.role : { [Op.in]: ['clinician', 'participant'] };
        if (role === 'all') {
            role = { [Op.in]: ['admin', 'clinician', 'participant'] };
        }
        const where = { role };
        return this.db.User.findAll({
            raw: true,
            where,
            attributes: [
                'id',
                'createdAt', // registration_date
                'role',
            ],
        })
        .then((users) => {
            users = users.map(user => _.omitBy(user, _.isNil));
            // Assumes that there will always only ever be one profile-survey at a time
            return this.db.ProfileSurvey.find()
            .then((profileSurvey) => {
                const profileSurveyId = profileSurvey.id;
                return this.db.Survey.find({
                    where: {
                        id: profileSurveyId,
                    },
                })
                .then((surveys) => {
                    const userIds = users.map((user) => {
                        return user.id;
                    });
                    return this.db.Answer.findAll({
                        where: {
                            userId: userIds,
                            surveyId: profileSurveyId,
                        },
                        attributes: [
                            'userId',
                            'questionId',
                            // 'question_choice_id', // Not sure if we will need, yet
                            'value'
                        ],
                    })
                    .then((answers) => {
                        const questionIds = answers.map((answer) => {
                            return answer.questionId;
                        });
                        return this.db.Question.findAll({
                            where: {
                                id: questionIds,
                                type: [
                                    'zip',
                                    'year',
                                ],
                            },
                            attributes: [
                                'id',
                                'type',
                            ],
                        })
                        .then((questions) => {
                            let demographics = answers.map((answer) => {
                                let demographic = {
                                    userId: answer.userId,
                                };
                                if(questions.find(question => answer.questionId === question.id && question.type === 'zip')) {
                                    demographic.zip = answer.value;
                                }
                                if(questions.find(question => answer.questionId === question.id && question.type === 'year')) {
                                    demographic.yob = answer.value;
                                }
                                console.log('>>>>> DAO > listDemographics > users[3]: ', users);
                                demographic.registrationDate = users.find(user => {
                                    console.log('!!!!! DAO > listDemographics > user: ', user);
                                    return answer.userId === user.id;
                                }).createdAt;
                                demographic.registrationDate = moment(demographic.registrationDate,'YYYY-MM-DD')
                                    .format('YYYY-MM-DD');
                                return demographic;
                            });

                            demographics = _.chain(demographics)
                                .groupBy('userId')
                                .map((userRecordSet) => {
                                    const zipRecord = userRecordSet.find((record) => record.zip);
                                    const yobRecord = userRecordSet.find((record) => record.yob);
                                    let unifiedRecord = Object.assign({},
                                        zipRecord,
                                        yobRecord
                                    );
                                    let anonymizedUnifiedRecord = {
                                        zip: unifiedRecord.zip,
                                        yob: unifiedRecord.yob,
                                        registrationDate: unifiedRecord.registrationDate,
                                    };
                                    return anonymizedUnifiedRecord;
                                })
                                .flattenDeep()
                                .value();
                            return demographics;
                        });
                    });
                });
            });
        });

        // TODO: Table JOIN query instead of the above?

    }
};
