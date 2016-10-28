/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const SharedSpec = require('./util/shared-spec.js');
const tokener = require('../lib/tokener');
const helper = require('./util/survey-common');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');
const comparator = require('./util/client-server-comparator');

const surveyExamples = require('./fixtures/example/survey');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

const Registry = models.Registry;

describe('registry unit', function () {
    const surveyExample = surveyExamples.Alzheimer;

    before(shared.setUpFn());

    const hxSurvey = new History(['id', 'name']);
    const hxUser = new History();

    it('error: get profile survey when none created', function () {
        return Registry.getProfileSurvey()
            .then(shared.throwingHandler, shared.expectedErrorHandler('registryNoProfileSurvey'));
    });

    const createProfileSurveyFn = function (survey) {
        return function () {
            return Registry.createProfileSurvey(survey)
                .then(rawServer => hxSurvey.push(survey, rawServer));
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

    it('create profile survey', createProfileSurveyFn(surveyExample.survey));
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    it('check soft sync does not reset registry', function () {
        return models.sequelize.sync({ force: false });
    });
    it('get/verify profile survey', verifyProfileSurveyFn(0));

    let answers;

    it('setup user with profile', function () {
        const survey = hxSurvey.server(0);
        const clientUser = generator.newUser();
        answers = helper.formAnswersToPost(survey, surveyExample.answer);
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
                const expectedUser = _.cloneDeep(hxUser.client(0));
                const user = result.user;
                expectedUser.id = user.id;
                delete expectedUser.password;
                delete user.createdAt;
                delete user.updatedAt;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });

    it('update user profile', function () {
        const survey = hxSurvey.server(0);
        answers = helper.formAnswersToPost(survey, surveyExample.answerUpdate);
        const userUpdates = {
            email: 'updated0@example.com'
        };
        const updateObj = {
            user: userUpdates,
            answers
        };
        const userId = hxUser.id(0);
        return Registry.updateProfile(userId, updateObj);
    });

    it('verify user profile', function () {
        const survey = hxSurvey.server(0);
        const userId = hxUser.id(0);
        return Registry.getProfile({ userId })
            .then(function (result) {
                const expectedUser = _.cloneDeep(hxUser.client(0));
                const user = result.user;
                expectedUser.id = user.id;
                expectedUser.email = 'updated0@example.com';
                delete expectedUser.password;
                expect(user).to.deep.equal(expectedUser);

                const actualSurvey = result.survey;
                const expectedSurvey = helper.formAnsweredSurvey(survey, answers);
                expect(actualSurvey).to.deep.equal(expectedSurvey);
            });
    });

    const replacement = _.cloneDeep(surveyExamples.Example.survey);
    it('create profile survey', createProfileSurveyFn(replacement));
    it('get/verify profile survey', verifyProfileSurveyFn(1));
});
