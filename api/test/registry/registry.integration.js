/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../../config');

const shared = require('../shared-integration');
const surveyHelper = require('../helper/survey-helper');
const examples = require('../fixtures/registry-examples');

const expect = chai.expect;

describe('registry integration', function () {
    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    it('error: create registry unauthorized', function (done) {
        store.server
            .post('/api/v1.0/registries')
            .send(examples[0])
            .expect(401)
            .end(done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    const ids = [];

    const createRegistryFn = function (index) {
        return function (done) {
            store.server
                .post('/api/v1.0/registries')
                .set('Authorization', store.auth)
                .send(examples[index])
                .expect(201)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    ids.push(res.body.id);
                    done();
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`create registry ${i}`, createRegistryFn(i));
    }

    const getAndVerifyRegistryFn = function (index) {
        return function (done) {
            store.server
                .get(`/api/v1.0/registries/${ids[index]}`)
                .set('Authorization', store.auth)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        return done(err);
                    }
                    const { name, survey } = res.body;
                    expect(name).to.equal(examples[index].name);
                    return surveyHelper.buildServerSurveyFromClientSurvey(examples[index].survey, survey)
                        .then(function (expected) {
                            expect(survey).to.deep.equal(expected);
                        })
                        .then(() => done())
                        .catch((err) => done(err));
                });
        };
    };

    for (let i = 0; i < examples.length; ++i) {
        it(`get registry ${i}`, getAndVerifyRegistryFn(i));
    }

    it('logout as super', shared.logoutFn(store));
});
