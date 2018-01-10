'use strict';

const Base = require('./base');

const _ = require('lodash');

const demoDemographics = [
    {
       "zip":"20852",
       "yob":1970,
       "registrationDate":"2017-12-12"
     },
     {
       "zip":"23229",
       "yob":1929,
       "registrationDate":"2017-10-05"
     },
     {
       "zip":"20852",
       "yob":1954,
       "registrationDate":"2018-01-01"
     },
     {
        "zip":"25587",
        "yob":1970,
        "registrationDate":"2017-12-12"
      },
      {
        "zip":"25587",
        "yob":1950,
        "registrationDate":"2017-10-05"
      },
      {
        "zip":"25589",
        "yob":1954,
        "registrationDate":"2018-01-01"
      },
      {
         "zip":"25589",
         "yob":1955,
         "registrationDate":"2017-12-12"
       },
       {
         "zip":"25590",
         "yob":1955,
         "registrationDate":"2017-10-05"
       },
       {
         "zip":"25591",
         "yob":1960,
         "registrationDate":"2018-01-01"
       },
];

module.exports = class DemographicsDAO extends Base {
    listDemographics() {
        // TODO: orderBy query param?
        return this.db.User.findAll({
            raw: true,
            attributes: [
                'id',
                'createdAt', // registration_date
            ],
        })
        .then((users) => {
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
                    return this.db.Answer.findAll({
                        where: {
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
                                // NOTE: struct
                                // answer = {
                                //     userId: 5,
                                //     questionId: 2,
                                //     value: 1999,
                                // };
                                let demographic = {
                                    userId: answer.userId,
                                };

                                if(questions.find(question => answer.questionId === question.id && question.type === 'zip')) {
                                    demographic.zip = answer.value;
                                }
                                if(questions.find(question => answer.questionId === question.id && question.type === 'year')) {
                                    demographic.yob = answer.value;
                                }
                                demographic.registrationDate = users.find(user => answer.userId === user.id).createdAt;
                                // TODO: format registrationDate?
                                return demographic;
                            });

                            // TODO: Merge each object values pivoting on userId
                            demographics = _.chain().groupBy('userId').mapValues(value => _.chain(value).pluck('value').flattenDeep()).value();

                            console.log('>>>>> DAO > listDemographics > demographics: ', demographics);
                            // return demographics;
                            return demoDemographics;
                        });
                    });
                });
            });
        });

        // TODO: Table JOIN query instead of the above?

    }
};
