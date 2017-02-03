/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const MultiQuestionSurveyGenerator = require('./util/generator/multi-question-survey-generator');
const EnumerationQuestionGenerator = require('./util/generator/enumeration-question-generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const comparator = require('./util/comparator');
const translator = require('./util/translator');
const surveyCommon = require('./util/survey-common');
const enumerationCommon = require('./util/enumeration-common');

const invalidSurveysJSON = require('./fixtures/json-schema-invalid/new-survey');
const invalidSurveysSwagger = require('./fixtures/swagger-invalid/new-survey');

const RRError = require('../lib/rr-error');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('survey integration', function () {
    const store = new RRSuperTest();
    const user = generator.newUser();
    const hxUser = new History();
    let surveyCount = 8;
    const hxSurvey = new SurveyHistory();
    const hxEnumeration = new History();

    const tests = new surveyCommon.IntegrationTests(store, generator, hxSurvey);
    const enumerationTests = new enumerationCommon.SpecTests(generator, hxEnumeration);

    before(shared.setUpFn(store));

    it('error: create survey unauthorized', function (done) {
        const survey = generator.newSurvey();
        store.post('/surveys', survey, 401).end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const verifySurveyFn = function (index) {
        return function (done) {
            const server = hxSurvey.server(index);
            store.get(`/surveys/${server.id}`, true, 200)
                .expect(function (res) {
                    expect(res.body).to.deep.equal(server);
                })
                .end(done);
        };
    };

    const updateSurveyFn = function (index, meta) {
        return function (done) {
            if (hxSurvey.client(index).meta === undefined) {
                return done();
            }
            const id = hxSurvey.id(index);
            meta = meta || hxSurvey.client(index).meta;
            hxSurvey.server(index).meta = meta;
            store.patch(`/surveys/${id}`, { meta }, 204)
                .end(done);
        };
    };

    const updateSurveyTextFn = function (index) {
        return function (done) {
            const survey = hxSurvey.server(index);
            const name = hxSurvey.client(index).name + 'xyz';
            const update = { id: survey.id, name };
            survey.name = name;
            const description = hxSurvey.client(index).description;
            if (description) {
                update.description = description + 'zyx';
                survey.description = description + 'zyx';
            }
            store.patch('/surveys/text/en', update, 204)
                .end(done);
        };
    };

    const revertUpdateSurveyTextFn = function (index) {
        return function (done) {
            const survey = hxSurvey.server(index);
            const { name, description } = hxSurvey.client(index);
            const update = { id: survey.id, name };
            survey.name = name;
            if (description) {
                update.description = description;
                survey.description = description;
            } else {
                delete survey.description;
            }
            store.patch('/surveys/text/en', update, 204)
                .end(done);
        };
    };

    const invalidSurveyJSONFn = function (index) {
        return function (done) {
            const survey = invalidSurveysJSON[index];
            store.post('/surveys', survey, 400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('jsonSchemaFailed', 'newSurvey'));
                })
                .end(done);
        };
    };

    _.range(invalidSurveysJSON.length).forEach(index => {
        it(`error: invalid (json) survey input ${index}`, invalidSurveyJSONFn(index));
    });

    const invalidSurveySwaggerFn = function (index) {
        return function (done) {
            const survey = invalidSurveysSwagger[index];
            store.post('/surveys', survey, 400)
                .expect(function (res) {
                    expect(Boolean(res.body.message)).to.equal(true);
                })
                .end(done);
        };
    };

    _.range(invalidSurveysSwagger.length).forEach(index => {
        it(`error: invalid (swagger) survey input ${index}`, invalidSurveySwaggerFn(index));
    });

    _.range(surveyCount).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
        const meta = {
            anyProperty: true
        };
        it(`update survey ${index}`, updateSurveyFn(index, meta));
        it(`verify survey ${index}`, verifySurveyFn(index));
        it(`update survey ${index}`, updateSurveyFn(index));
        it(`update survey text ${index}`, updateSurveyTextFn(index));
        it(`verify survey ${index}`, verifySurveyFn(index));
        it(`revert update survey ${index}`, revertUpdateSurveyTextFn(index));
        it(`verify survey ${index}`, verifySurveyFn(index));
        it(`list surveys and verify`, tests.listSurveysFn());
    });

    _.range(9).forEach(index => {
        const status = ['draft', 'published', 'retired'][parseInt(index / 3)];
        it(`create survey ${surveyCount+index}`, tests.createSurveyFn({ status }));
        it(`get survey ${surveyCount+index}`, tests.getSurveyFn(surveyCount + index));
    });

    surveyCount += 9;

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 3));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 3));

    [
        ['published', 'draft', surveyCount - 4],
        ['retired', 'draft', surveyCount - 3],
        ['retired', 'published', surveyCount - 2]
    ].forEach(([status, updateStatus, index]) => {
        it(`error: change status ${status} to ${updateStatus}`, function (done) {
            const id = hxSurvey.id(index);
            store.patch(`/surveys/${id}`, { status: updateStatus }, 400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('surveyInvalidStatusUpdate', status, updateStatus));
                })
                .end(done);
        });
    });

    [
        ['draft', 'published', surveyCount - 9],
        ['draft', 'retired', surveyCount - 8],
        ['published', 'retired', surveyCount - 6]
    ].forEach(([status, updateStatus, index]) => {
        it(`update survey ${index} status ${status} to ${updateStatus}`, function (done) {
            const id = hxSurvey.id(index);
            store.patch(`/surveys/${id}`, { status: updateStatus }, 204)
                .expect(function () {
                    hxSurvey.server(index).status = updateStatus;
                })
                .end(done);
        });
    });

    [surveyCount - 9, surveyCount - 8, surveyCount - 5].forEach(index => {
        it(`verify survey ${index}`, verifySurveyFn(index));
    });

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 5));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 1));

    it('replace sections of first survey with sections', function (done) {
        const index = _.findIndex(hxSurvey.listClients(), client => client.sections);
        const survey = hxSurvey.server(index);
        const count = survey.questions.length;
        const newSectionCount = (count - count % 2) / 2;
        const newSections = [{
            name: 'new_section_0',
            indices: _.range(newSectionCount)
        }, {
            name: 'new_section_1',
            indices: _.rangeRight(newSectionCount, newSectionCount * 2)
        }];
        const clientSurvey = hxSurvey.client(index);
        clientSurvey.sections = newSections;
        hxSurvey.updateClient(index, clientSurvey);
        store.patch(`/surveys/${survey.id}/sections`, newSections, 204).end(done);
    });

    it('get/verify sections of first survey with sections', function (done) {
        const index = _.findIndex(hxSurvey.listClients(), client => client.sections);
        const id = hxSurvey.id(index);
        store.get(`/surveys/${id}`, true, 200)
            .expect(function (res) {
                hxSurvey.updateServer(index, res.body);
                const clientSurvey = hxSurvey.client(index);
                comparator.survey(clientSurvey, res.body);
            })
            .end(done);
    });

    it('get survey 3 in spanish when no name translation', verifySurveyFn(3));

    it('list surveys in spanish when no translation', tests.listSurveysFn());

    const translateTextFn = function (index, language) {
        return function (done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            store.patch(`/surveys/text/${language}`, translation, 204)
                .expect(function () {
                    hxSurvey.translate(index, language, translation);
                })
                .end(done);
        };
    };

    const verifyTranslatedSurveyFn = function (index, language) {
        return function (done) {
            const id = hxSurvey.id(index);
            store.get(`/surveys/${id}`, true, 200, { language })
                .expect(function (res) {
                    translator.isSurveyTranslated(res.body, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listTranslatedSurveysFn = function (language) {
        return function (done) {
            store.get('/surveys', true, 200, { language })
                .expect(function (res) {
                    const expected = hxSurvey.listTranslatedServers(language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    _.range(0, surveyCount, 2).forEach(index => {
        it(`add translation (es) to survey ${index}`, translateTextFn(index, 'es'));
        it(`get and verify translated (es) survey ${index}`, verifyTranslatedSurveyFn(index, 'es'));
    });

    it('list and verify translated surveys', listTranslatedSurveysFn('es'));

    it('list surveys in english (original)', listTranslatedSurveysFn('en'));

    const replaceSurveyFn = function (index) {
        return function (done) {
            const replacement = generator.newSurvey();
            replacement.parentId = hxSurvey.id(index);
            store.post('/surveys', replacement, 201)
                .expect(function (res) {
                    hxSurvey.replace(index, replacement, res.body);
                })
                .end(done);

        };
    };

    it('replace survey 3', replaceSurveyFn(3));
    it('verify survey 3 replacement', tests.getSurveyFn(surveyCount));
    it(`list surveys and verify`, tests.listSurveysFn());

    ++surveyCount;

    it('delete survey 5', tests.deleteSurveyFn(5));
    it('remove deleted survey locally', function () {
        hxSurvey.remove(5);
    });
    it(`list surveys and verify`, tests.listSurveysFn());

    it('create a new user', shared.createUserFn(store, hxUser, user));

    it('login as user', shared.loginFn(store, user));

    it('error: create survey as non admin', function (done) {
        const survey = generator.newSurvey();
        store.post('/surveys', survey, 403).end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('create survey', tests.createSurveyFn());
    it('verify survey', tests.getSurveyFn());

    ++surveyCount;

    it('translate survey', function (done) {
        const name = 'puenno';
        const description = 'descripto';
        const id = hxSurvey.lastId();
        store.patch('/surveys/text/es', { id, name, description }, 204).end(done);
    });

    let answers;

    it('login as user', shared.loginFn(store, user));

    it('answer survey', function (done) {
        answers = generator.answerQuestions(hxSurvey.lastServer().questions);
        const surveyId = hxSurvey.lastId();
        store.post('/answers', { surveyId, answers }, 204).end(done);
    });

    it('get answered survey', function (done) {
        const server = hxSurvey.lastServer();
        store.get(`/answered-surveys/${server.id}`, true, 200)
            .expect(function (res) {
                comparator.answeredSurvey(server, answers, res.body);
            })
            .end(done);
    });

    it('get answered translated survey', function (done) {
        const id = hxSurvey.lastId();
        store.get(`/answered-surveys/${id}`, true, 200, { language: 'es' })
            .expect(function (res) {
                const server = hxSurvey.lastServer();
                const survey = _.cloneDeep(server);
                survey.name = 'puenno';
                survey.description = 'descripto';
                comparator.answeredSurvey(survey, answers, res.body);
            })
            .end(done);
    });

    it('update survey generator for multi questions', function () {
        generator.updateSurveyGenerator(MultiQuestionSurveyGenerator);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    _.range(surveyCount, surveyCount + 7).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    surveyCount += 7;

    _.range(8).forEach(index => {
        it(`create enumeration ${index}`, enumerationTests.createEnumerationFn());
        it(`get enumeration ${index}`, enumerationTests.getEnumerationFn(index));
    });

    it('replace generator to enumeration question generator', function () {
        const enumerations = _.range(8).map(index => hxEnumeration.server(index));
        const enumerationGenerator = new EnumerationQuestionGenerator(generator.questionGenerator, enumerations);
        generator.questionGenerator = enumerationGenerator;
        generator.surveyGenerator.questionGenerator = enumerationGenerator;
        comparator.updateEnumerationMap(enumerations);
    });

    _.range(surveyCount, surveyCount + 3).forEach(index => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    surveyCount += 3;

    it('logout as super', shared.logoutFn(store));

    it('login as user', shared.loginFn(store, user));
    _.range(surveyCount - 10, surveyCount - 3).forEach(index => {
        it('answer survey', function (done) {
            const survey = hxSurvey.server(index);
            answers = generator.answerQuestions(survey.questions);
            const surveyId = survey.id;
            store.post('/answers', { surveyId, answers }, 204).end(done);
        });

        it('get answered survey', function (done) {
            const server = hxSurvey.server(index);
            store.get(`/answered-surveys/${server.id}`, true, 200)
                .expect(function (res) {
                    comparator.answeredSurvey(server, answers, res.body);
                })
                .end(done);
        });
    });
});
