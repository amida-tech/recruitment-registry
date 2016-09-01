/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';

const _ = require('lodash');

const helper = require('../helpers');

exports.buildServerSurveyFromClientSurvey = function (clientSurvey, serverSurvey) {
    const ids = _.map(serverSurvey.questions, 'id');
    return helper.buildServerQuestions(clientSurvey.questions, ids).then(function (expectedQuestions) {
        const result = {
            id: serverSurvey.id,
            name: clientSurvey.name,
            questions: expectedQuestions
        };
        return result;
    });
};
