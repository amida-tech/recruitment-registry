/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const tokener = require('../lib/tokener');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

const Registry = models.Registry;

describe('registry unit', function () {
    before(shared.setUpFn());

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();
    const hxAnswers = [];

    it('error: get profile survey when none created', function () {
        return Registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function () {
        const clientSurvey = generator.newSurvey();
        return function () {
            return Registry.createProfileSurvey(clientSurvey)
                .then(idOnlyServer => hxSurvey.push(clientSurvey, idOnlyServer));
        };
    };

    const verifyProfileSurveyFn = function (index) {
        return function () {
            return Registry.getProfileSurvey()
                .then(server => {
                    const id = hxSurvey.id(index);
                    expect(server.id).to.equal(id);
                    hxSurvey.updateServer(index, server);
                    return comparator.survey(hxSurvey.client(index), server);
                });
        };
    };

    it('create profile survey', createProfileSurveyFn());
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    it('setup user with profile', function () {
        const survey = hxSurvey.server(0);
        const clientUser = generator.newUser();
        const answers = generator.answerQuestions(survey.questions);
        hxAnswers.push(answers);
        return Registry.createProfile({
                user: clientUser,
                answers
            })
            .then(({ token }) => tokener.verifyJWT(token))
            .then(({ id }) => hxUser.push(clientUser, { id }));
    });

    it('verify user profile', function () {
        const survey = hxSurvey.server(0);
        const userId = hxUser.id(0);
        return Registry.getProfile({ userId })
            .then(function (result) {
                comparator.user(hxUser.client(0), result.user);
                comparator.answeredSurvey(survey, hxAnswers[0], result.survey);
            });
    });

    it('update user profile', function () {
        const survey = hxSurvey.server(0);
        const answers = generator.answerQuestions(survey.questions);
        const userUpdates = {
            email: 'updated0@example.com'
        };
        hxUser.client(0).email = userUpdates.email;
        const updateObj = {
            user: userUpdates,
            answers
        };
        const userId = hxUser.id(0);
        hxAnswers[0] = answers;
        return Registry.updateProfile(userId, updateObj);
    });

    it('verify user profile', function () {
        const survey = hxSurvey.server(0);
        const userId = hxUser.id(0);
        return Registry.getProfile({ userId })
            .then(function (result) {
                comparator.user(hxUser.client(0), result.user);
                comparator.answeredSurvey(survey, hxAnswers[0], result.survey);
            });
    });

    it('create profile survey', createProfileSurveyFn());
    it('get/verify profile survey', verifyProfileSurveyFn(1));
});
