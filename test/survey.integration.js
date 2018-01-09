/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const MultiQuestionSurveyGenerator = require('./util/generator/multi-question-survey-generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const comparator = require('./util/comparator');
const translator = require('./util/translator');
const surveyCommon = require('./util/survey-common');
const choiceSetCommon = require('./util/choice-set-common');

// const invalidSurveysJSON = require('./fixtures/json-schema-invalid/new-survey');
const invalidSurveysSwagger = require('./fixtures/swagger-invalid/new-survey');

const expect = chai.expect;

describe('survey integration', function surveyIntegration() {
    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const user = generator.newUser();
    const hxUser = new History();
    let surveyCount = 8;
    const hxSurvey = new SurveyHistory();
    const hxChoiceSet = new History();

    const tests = new surveyCommon.IntegrationTests(rrSuperTest, generator, hxSurvey);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);
    let surveyTemp = null;

    before(shared.setUpFn());

    it('error: create survey unauthorized', (done) => {
        const survey = generator.newSurvey();
        rrSuperTest.post('/surveys', survey, 401).end(done);
    });

    it('login as super', shared.loginFn(config.superUser));

    it('create a new participant', shared.createUserFn(hxUser, user));
    it('create a new admin', shared.createUserFn(hxUser, undefined, { role: 'admin' }));

    const patchSurveyMetaFn = function (index) {
        return function patchSurveyMeta(done) {
            const id = hxSurvey.id(index);
            const survey = hxSurvey.server(index);
            const update = { meta: { anyProperty: 2 } };
            Object.assign(survey, update);
            rrSuperTest.patch(`/surveys/${id}`, update, 204)
                .end(done);
        };
    };

    const revertPatchedSurveyMetaFn = function (index) {
        return function revertPatchedSurveyMeta(done) {
            const id = hxSurvey.id(index);
            const survey = hxSurvey.server(index);
            let { meta } = hxSurvey.client(index);
            if (!meta) {
                delete survey.meta;
                meta = {};
            } else {
                Object.assign(survey, { meta });
            }
            rrSuperTest.patch(`/surveys/${id}`, { meta }, 204)
                .end(done);
        };
    };

    const patchSurveyTextFn = function (index) {
        return function patchSurveyText(done) {
            const survey = hxSurvey.server(index);
            const name = `${hxSurvey.client(index).name}xyz`;
            const update = { id: survey.id, name };
            survey.name = name;
            const description = hxSurvey.client(index).description;
            if (description) {
                update.description = `${description}zyx`;
                survey.description = `${description}zyx`;
            }
            rrSuperTest.patch('/surveys/text/en', update, 204)
                .end(done);
        };
    };

    const revertUpdateSurveyTextFn = function (index) {
        return function revertUpdateSurveyText(done) {
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
            rrSuperTest.patch('/surveys/text/en', update, 204)
                .end(done);
        };
    };

    const patchSurveyQuestionsSectionsFn = function (index, sourceIndex) {
        return function patchSurveyQuestionsSections(done) {
            const survey = hxSurvey.server(index);
            const sourceSurvey = hxSurvey.server(sourceIndex);
            surveyTemp = _.cloneDeep(survey);
            const surveyPatch = surveyCommon.formQuestionsSectionsSurveyPatch(survey, sourceSurvey);
            rrSuperTest.patch(`/surveys/${survey.id}`, surveyPatch, 204).end(done);
        };
    };

    const revertPatchedSurveyQuestionSectionsFn = function (index) {
        return function revertPatchedSurveyQuestionSections(done) {
            const survey = hxSurvey.server(index);
            const sourceSurvey = surveyTemp;
            const surveyPatch = surveyCommon.formQuestionsSectionsSurveyPatch(survey, sourceSurvey);
            rrSuperTest.patch(`/surveys/${survey.id}`, surveyPatch, 204).end(done);
        };
    };

    // const invalidSurveyJSONFn = function (index) {
    //    return function (done) {
    //        const survey = invalidSurveysJSON[index];
    //        rrSuperTest.post('/surveys', survey, 400)
    //            .expect(res => shared.verifyErrorMessage(res, 'jsonSchemaFailed', 'newSurvey'))
    //            .end(done);
    //    };
    // };

    // _.range(invalidSurveysJSON.length).forEach(index => {
    //    it(`error: invalid (json) survey input ${index}`, invalidSurveyJSONFn(index));
    // });

    const invalidSurveySwaggerFn = function (index) {
        return function invalidSurveySwagger(done) {
            const survey = invalidSurveysSwagger[index];
            rrSuperTest.post('/surveys', survey, 400)
                .expect((res) => {
                    expect(Boolean(res.body.message)).to.equal(true);
                })
                .end(done);
        };
    };

    _.range(invalidSurveysSwagger.length).forEach((index) => {
        it(`error: invalid (swagger) survey input ${index}`, invalidSurveySwaggerFn(index));
    });

    _.range(surveyCount).forEach((index) => {
        if (index === 3) {
            it('logout as super', shared.logoutFn());
            it('login as admin', shared.loginIndexFn(hxUser, 1)); // so that seperate authors
        }
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
        it(`update survey ${index}`, patchSurveyMetaFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        it(`update survey ${index}`, revertPatchedSurveyMetaFn(index));
        it(`update survey text ${index}`, patchSurveyTextFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        it(`revert update survey ${index}`, revertUpdateSurveyTextFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        if (index > 0) {
            it(`patch survey ${index} from survey ${index - 1} (questions/sections)`, patchSurveyQuestionsSectionsFn(index, index - 1));
            it(`verify survey ${index}`, tests.verifySurveyFn(index, { noSectionId: true }));
            it(`revert patched survey ${index} back (question/sections)`, revertPatchedSurveyQuestionSectionsFn(index));
            it(`get survey ${index}`, tests.getSurveyFn(index));
        }
        it('list surveys and verify', tests.listSurveysFn());
    });

    it('verify author ids', function verifyAuthorIds() {
        const expected = [1, 1, 1];
        const adminId = hxUser.id(1);
        _.range(3, 8).forEach(() => expected.push(adminId));
        const list = hxSurvey.listServers(['authorId', 'status']);
        const actual = _.map(list, 'authorId');
        expect(actual).to.deep.equal(expected);
    });

    _.range(9).forEach((index) => {
        const status = ['draft', 'published', 'retired'][parseInt(index / 3, 10)];
        it(`create survey ${surveyCount + index}`, tests.createSurveyFn({ status }));
        it(`get survey ${surveyCount + index}`, tests.getSurveyFn(surveyCount + index));
    });

    surveyCount += 9;

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 3));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 3));

    it('error: change published survey to draft status', (function errorChangePublishedToDraftFn(index) {
        return function errorChangePublishedToDraft(done) {
            const id = hxSurvey.id(index);
            rrSuperTest.patch(`/surveys/${id}`, { status: 'draft' }, 409)
                .expect(res => shared.verifyErrorMessage(res, 'surveyPublishedToDraftUpdate'))
                .end(done);
        };
    }(surveyCount - 4)));

    it('error: retire draft survey', (function errorRetireDraftFn(index) {
        return function errorRetireDraft(done) {
            const id = hxSurvey.id(index);
            rrSuperTest.patch(`/surveys/${id}`, { status: 'retired' }, 403)
                .expect(res => shared.verifyErrorMessage(res, 'surveyDraftToRetiredUpdate'))
                .end(done);
        };
    }(surveyCount - 7)));

    it('error: patch retired survey', (function patchRetiredFn(index) {
        return function patchRetired(done) {
            const id = hxSurvey.id(index);
            rrSuperTest.patch(`/surveys/${id}`, { status: 'retired' }, 409)
                .expect(res => shared.verifyErrorMessage(res, 'surveyRetiredStatusUpdate'))
                .end(done);
        };
    }(surveyCount - 2)));

    [
        ['draft', 'published', surveyCount - 9],
        ['published', 'retired', surveyCount - 6],
    ].forEach(([status, updateStatus, index]) => {
        it(`update survey ${index} status ${status} to ${updateStatus}`, function updateSurvey(done) {
            const id = hxSurvey.id(index);
            rrSuperTest.patch(`/surveys/${id}`, { status: updateStatus }, 204)
                .expect(() => {
                    hxSurvey.server(index).status = updateStatus;
                })
                .end(done);
        });
    });

    [surveyCount - 9, surveyCount - 8, surveyCount - 5].forEach((index) => {
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
    });

    it('logout as admin', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 4));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 2));

    it('get survey 3 in spanish when no name translation', tests.verifySurveyFn(3));

    it('list surveys in spanish when no translation', tests.listSurveysFn());

    const translateTextFn = function (index, language) {
        return function translateText(done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            rrSuperTest.patch(`/surveys/text/${language}`, translation, 204)
                .expect(() => {
                    hxSurvey.translate(index, language, translation);
                })
                .end(done);
        };
    };

    const verifyTranslatedSurveyFn = function (index, language) {
        return function verifyTranslatedSurvey(done) {
            const id = hxSurvey.id(index);
            rrSuperTest.get(`/surveys/${id}`, true, 200, { language })
                .expect((res) => {
                    translator.isSurveyTranslated(res.body, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listTranslatedSurveysFn = function (language) {
        return function listTranslatedSurveys(done) {
            rrSuperTest.get('/surveys', true, 200, { language })
                .expect((res) => {
                    const opt = { admin: rrSuperTest.userRole === 'admin' };
                    const expected = hxSurvey.listTranslatedServers(language, 'published', opt);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    _.range(0, surveyCount, 2).forEach((index) => {
        it(`add translation (es) to survey ${index}`, translateTextFn(index, 'es'));
        it(`get and verify translated (es) survey ${index}`, verifyTranslatedSurveyFn(index, 'es'));
    });

    it('list and verify translated surveys', listTranslatedSurveysFn('es'));

    it('list surveys in english (original)', listTranslatedSurveysFn('en'));

    const replaceSurveyFn = function (index) {
        return function replaceSurvey(done) {
            const replacement = generator.newSurvey();
            replacement.parentId = hxSurvey.id(index);
            rrSuperTest.post('/surveys', replacement, 201)
                .expect((res) => {
                    hxSurvey.replace(index, replacement, res.body);
                })
                .end(done);
        };
    };

    it('replace survey 3', replaceSurveyFn(3));
    it('verify survey 3 replacement', tests.getSurveyFn(surveyCount));
    it('list surveys and verify', tests.listSurveysFn());

    surveyCount += 1;

    it('delete survey 5', tests.deleteSurveyFn(5));
    it('remove deleted survey locally', () => {
        hxSurvey.remove(5);
    });
    it('list surveys and verify', tests.listSurveysFn());

    it('logout as super', shared.logoutFn());

    it('login as user', shared.loginIndexFn(hxUser, 0));

    it('error: create survey as non admin', (done) => {
        const survey = generator.newSurvey();
        rrSuperTest.post('/surveys', survey, 403).end(done);
    });

    it('list surveys (all)', tests.listSurveysFn());

    it('logout as user', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    it('create survey', tests.createSurveyFn());
    it('verify survey', tests.getSurveyFn());

    surveyCount += 1;

    it('translate survey', (done) => {
        const name = 'puenno';
        const description = 'descripto';
        const id = hxSurvey.lastId();
        rrSuperTest.patch('/surveys/text/es', { id, name, description }, 204).end(done);
    });

    it('logout as super', shared.logoutFn());

    let answers;

    it('login as user', shared.loginIndexFn(hxUser, 0));

    it('answer survey', (done) => {
        answers = generator.answerSurvey(hxSurvey.lastServer());
        const surveyId = hxSurvey.lastId();
        rrSuperTest.post('/answers', { surveyId, answers }, 204).end(done);
    });

    it('get answered survey', function getAnsweredSurvey() {
        const server = _.cloneDeep(hxSurvey.lastServer());
        return rrSuperTest.get(`/answered-surveys/${server.id}`, true, 200)
            .then((res) => {
                if (rrSuperTest.userRole !== 'admin') {
                    delete server.authorId;
                }
                comparator.answeredSurvey(server, answers, res.body);
            });
    });

    it('get answered translated survey', (done) => {
        const id = hxSurvey.lastId();
        rrSuperTest.get(`/answered-surveys/${id}`, true, 200, { language: 'es' })
            .expect((res) => {
                const server = _.cloneDeep(hxSurvey.lastServer());
                if (rrSuperTest.userRole !== 'admin') {
                    delete server.authorId;
                }
                const survey = _.cloneDeep(server);
                survey.name = 'puenno';
                survey.description = 'descripto';
                comparator.answeredSurvey(survey, answers, res.body);
            })
            .end(done);
    });

    it('update survey generator for multi questions', () => {
        generator.updateSurveyGenerator(MultiQuestionSurveyGenerator);
    });

    it('logout as user', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(surveyCount, surveyCount + 7).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    surveyCount += 7;

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        generator.surveyGenerator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(surveyCount, surveyCount + 3).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    surveyCount += 3;

    it('logout as super', shared.logoutFn());

    it('login as user', shared.loginIndexFn(hxUser, 0));
    _.range(surveyCount - 10, surveyCount - 3).forEach((index) => {
        it('answer survey', (done) => {
            const survey = hxSurvey.server(index);
            answers = generator.answerQuestions(survey.questions);
            const surveyId = survey.id;
            rrSuperTest.post('/answers', { surveyId, answers }, 204).end(done);
        });

        it('get answered survey', (done) => {
            const server = hxSurvey.server(index);
            rrSuperTest.get(`/answered-surveys/${server.id}`, true, 200)
                .expect((res) => {
                    if (rrSuperTest.userRole !== 'admin') {
                        delete server.authorId;
                    }
                    comparator.answeredSurvey(server, answers, res.body);
                })
                .end(done);
        });
    });

    it('logout as user', shared.logoutFn());


    it('login as super', shared.loginFn(config.superUser));
    it('create survey with identifying', (done) => {
        const postData = {
            name: 'Identifying Test',
            description: 'test',
            status: 'published',
            questions: [{
                isIdentifying: true,
                text: 'Identifying Question',
                type: 'bool',
                required: false,
            }],
        };
        rrSuperTest.post('/surveys', postData, 201).end(done);
    });
    it('logout as super', shared.logoutFn());


    it('login as user', shared.loginIndexFn(hxUser, 0));

    let identifyingSurveyQuestionid = null;

    it('get survey with identifying', (done) => {
        rrSuperTest.get(`/surveys/${surveyCount}`, true, 200)
            .expect((res) => {
                identifyingSurveyQuestionid = res.body.questions[0].id;
                expect(res.body.questions.length).to.equal(1);
            })
            .end(done);
    });


    it('answer survey with identifying', (done) => {
        const postData = {
            status: 'completed',
            answers: [{
                questionId: identifyingSurveyQuestionid,
                language: 'en',
                answer: { boolValue: true },
            }],
        };
        rrSuperTest.post(`/user-surveys/${surveyCount}/answers`, postData, 204).end(done);
    });

    it('get answered survey with identifying', (done) => {
        rrSuperTest.get(`/user-surveys/${surveyCount}/answers?isIdentifying=true`, true, 200)
            .expect((res) => {
                expect(res.body.answers.length).to.equal(1);
            })
            .end(done);
    });
    it('get answered survey without identifying', (done) => {
        rrSuperTest.get(`/user-surveys/${surveyCount}/answers`, true, 200)
            .expect((res) => {
                expect(res.body.answers.length).to.equal(0);
            })
            .end(done);
    });
    it('logout as user', shared.logoutFn());

    surveyCount += 1;
});
