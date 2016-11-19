/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const SurveyHistory = require('./util/survey-history');
const comparator = require('./util/client-server-comparator');
const translator = require('./util/translator');

const invalidSurveysJSON = require('./fixtures/json-schema-invalid/new-survey');
const invalidSurveysSwagger = require('./fixtures/swagger-invalid/new-survey');

const RRError = require('../lib/rr-error');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('survey integration', function () {
    const user = generator.newUser();
    const hxUser = new History();
    const surveyCount = 8;
    const hxSurvey = new SurveyHistory();

    const store = new RRSuperTest();

    before(shared.setUpFn(store));

    it('error: create survey unauthorized', function (done) {
        const survey = generator.newSurvey();
        store.server
            .post('/api/v1.0/surveys')
            .send(survey)
            .expect(401)
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const createSurveyFn = function () {
        return function (done) {
            const clientSurvey = generator.newSurvey();
            store.server
                .post('/api/v1.0/surveys')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send(clientSurvey)
                .expect(201)
                .expect(function (res) {
                    hxSurvey.push(clientSurvey, res.body);
                })
                .end(done);
        };
    };

    const showSurveyFn = function (index, update = {}) {
        return function (done) {
            if (index === null || index === undefined) {
                index = hxSurvey.lastIndex();
            }
            const id = hxSurvey.id(index);
            store.server
                .get(`/api/v1.0/surveys/${id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    if (_.isEmpty(update)) {
                        hxSurvey.reloadServer(res.body);
                    }
                    const clientSurvey = hxSurvey.client(index);
                    const expected = Object.assign({}, clientSurvey, update);
                    comparator.survey(expected, res.body)
                        .then(done, done);
                });
        };
    };

    const showSurveyMetaFn = function (index, update = {}) {
        return function (done) {
            if (hxSurvey.client(index).meta === undefined) {
                return done();
            }
            showSurveyFn(index, update)(done);
        };
    };

    const verifySurveyFn = function (index) {
        return function (done) {
            const server = hxSurvey.server(index);
            store.server
                .get(`/api/v1.0/surveys/${server.id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
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
            store.server
                .patch(`/api/v1.0/surveys/${id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send({ meta })
                .expect(204)
                .end(done);
        };
    };

    const updateSurveyTextFn = function (index, name) {
        return function (done) {
            const id = hxSurvey.id(index);
            name = name || hxSurvey.client(index).name;
            store.server
                .patch(`/api/v1.0/surveys/text/en`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send({ id, name })
                .expect(204)
                .end(done);
        };
    };

    const listSurveysFn = function () {
        return function (done) {
            store.server
                .get('/api/v1.0/surveys')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(200)
                .expect(function (res) {
                    const surveys = res.body;
                    const expected = hxSurvey.listServers();
                    expect(surveys).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const invalidSurveyJSONFn = function (index) {
        return function (done) {
            const survey = invalidSurveysJSON[index];
            store.server
                .post('/api/v1.0/surveys')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send(survey)
                .expect(400)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('jsonSchemaFailed', 'newSurvey'));
                })
                .end(done);
        };
    };

    for (let i = 0; i < invalidSurveysJSON.length; ++i) {
        it(`error: invalid (json) survey input ${i}`, invalidSurveyJSONFn(i));
    }

    const invalidSurveySwaggerFn = function (index) {
        return function (done) {
            const survey = invalidSurveysSwagger[index];
            store.server
                .post('/api/v1.0/surveys')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send(survey)
                .expect(400)
                .expect(function (res) {
                    expect(Boolean(res.body.message)).to.equal(true);
                })
                .end(done);
        };
    };

    for (let i = 0; i < invalidSurveysSwagger.length; ++i) {
        it(`error: invalid (swagger) survey input ${i}`, invalidSurveySwaggerFn(i));
    }

    for (let i = 0; i < surveyCount; ++i) {
        it(`create survey ${i}`, createSurveyFn());
        it(`verify survey ${i}`, showSurveyFn(i));
        const meta = {
            anyProperty: true
        };
        it(`update survey ${i}`, updateSurveyFn(i, meta));
        it(`verify survey ${i}`, showSurveyMetaFn(i, { meta }));
        it(`update survey ${i}`, updateSurveyFn(i));
        const name = `updated_name_${i}`;
        it(`update survey text ${i}`, updateSurveyTextFn(i, name));
        it(`verify survey ${i}`, showSurveyFn(i, { name }));
        it(`update survey ${i}`, updateSurveyTextFn(i));
        it(`list surveys and verify`, listSurveysFn());
    }

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
        store.server
            .patch(`/api/v1.0/surveys/${survey.id}/sections`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send(newSections)
            .expect(204)
            .end(done);
    });

    it('get/verify sections of first survey with sections', function (done) {
        const index = _.findIndex(hxSurvey.listClients(), client => client.sections);
        const id = hxSurvey.id(index);
        store.server
            .get(`/api/v1.0/surveys/${id}`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                hxSurvey.updateServer(index, res.body);
                const clientSurvey = hxSurvey.client(index);
                comparator.survey(clientSurvey, res.body)
                    .then(done, done);
            });
    });

    it('get survey 3 in spanish when no name translation', verifySurveyFn(3));

    it('list surveys in spanish when no translation', listSurveysFn());

    const translateTextFn = function (index, language) {
        return function (done) {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            store.server
                .patch(`/api/v1.0/surveys/text/${language}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send(translation)
                .expect(204)
                .expect(function () {
                    hxSurvey.translate(index, language, translation);
                })
                .end(done);
        };
    };

    const verifyTranslatedSurveyFn = function (index, language) {
        return function (done) {
            const id = hxSurvey.id(index);
            store.server
                .get(`/api/v1.0/surveys/${id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
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
            store.server
                .get('/api/v1.0/surveys')
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .query({ language })
                .expect(200)
                .expect(function (res) {
                    const expected = hxSurvey.listTranslatedServers(language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    for (let i = 0; i < surveyCount; i += 2) {
        it(`add translation (es) to survey ${i}`, translateTextFn(i, 'es'));
        it(`get and verify translated (es) survey ${i}`, verifyTranslatedSurveyFn(i, 'es'));
    }

    it('list and verify translated surveys', listTranslatedSurveysFn('es'));

    it('list surveys in english (original)', listTranslatedSurveysFn('en'));

    const replaceSurveyFn = function (index) {
        return function (done) {
            const replacement = generator.newSurvey();
            replacement.parentId = hxSurvey.id(index);
            store.server
                .post(`/api/v1.0/surveys`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .send(replacement)
                .expect(201)
                .expect(function (res) {
                    hxSurvey.replace(index, replacement, res.body);
                })
                .end(done);

        };
    };

    it('replace survey 3', replaceSurveyFn(3));
    it('verify survey 3 replacement', showSurveyFn(surveyCount));
    it(`list surveys and verify`, listSurveysFn());

    const deleteSurveyFn = function (index) {
        return function (done) {
            const id = hxSurvey.id(index);
            store.server
                .delete(`/api/v1.0/surveys/${id}`)
                .set('Cookie', `rr-jwt-token=${store.auth}`)
                .expect(204)
                .end(done);
        };
    };

    it('delete survey 5', deleteSurveyFn(5));
    it('remove deleted survey locally', function () {
        hxSurvey.remove(5);
    });
    it(`list surveys and verify`, listSurveysFn());

    it('create a new user', shared.createUserFn(store, hxUser, user));

    it('login as user', shared.loginFn(store, user));

    it('error: create survey as non admin', function (done) {
        const survey = generator.newSurvey();
        store.server
            .post('/api/v1.0/surveys')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send(survey)
            .expect(403, done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('create survey', createSurveyFn());
    it('verify survey', showSurveyFn());

    it('translate survey', function (done) {
        const name = 'puenno';
        const id = hxSurvey.lastId();
        store.server
            .patch(`/api/v1.0/surveys/text/es`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send({ id, name })
            .expect(204)
            .expect(function () {})
            .end(done);
    });

    let answers;

    it('login as user', shared.loginFn(store, user));

    it('answer survey', function (done) {
        answers = generator.answerQuestions(hxSurvey.lastServer().questions);
        const id = hxSurvey.lastId();
        store.server
            .post('/api/v1.0/answers')
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .send({
                surveyId: id,
                answers
            })
            .expect(204)
            .end(done);
    });

    it('get answered survey', function (done) {
        const server = hxSurvey.lastServer();
        store.server
            .get(`/api/v1.0/answered-surveys/${server.id}`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .expect(200)
            .expect(function (res) {
                comparator.answeredSurvey(server, answers, res.body);
            })
            .end(done);
    });

    it('get answered translated survey', function (done) {
        const id = hxSurvey.lastId();
        store.server
            .get(`/api/v1.0/answered-surveys/${id}`)
            .set('Cookie', `rr-jwt-token=${store.auth}`)
            .query({ language: 'es' })
            .expect(200)
            .expect(function (res) {
                const server = hxSurvey.lastServer();
                const survey = _.cloneDeep(server);
                survey.name = 'puenno';
                comparator.answeredSurvey(survey, answers, res.body);
            })
            .end(done);
    });
});
