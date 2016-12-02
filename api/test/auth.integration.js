/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');

const models = require('../models');
const config = require('../config');
const tokener = require('../lib/tokener');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const RRError = require('../lib/rr-error');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('auth integration', function () {
    const userCount = 4;

    const store = new RRSuperTest();

    const hxUser = new History();

    before(shared.setUpFn(store));

    const createUserFn = function () {
        const user = generator.newUser();
        return models.user.createUser(user)
            .then(({ id }) => hxUser.pushWithId(user, id));
    };

    _.range(userCount).forEach(index => {
        it(`create user ${index} directly on db`, createUserFn);
    });

    const successfullLoginFn = function (index) {
        return function (done) {
            const clientUser = hxUser.client(index);
            const { username, password } = clientUser;
            store.authBasic({ username, password })
                .end(function (err) {
                    if (err) {
                        return done(err);
                    }
                    jwt.verify(store.jwt, config.jwt.secret, {}, function (err, jwtObject) {
                        if (err) {
                            return done(err);
                        }
                        const id = hxUser.id(index);
                        expect(jwtObject.username).to.equal(clientUser.username);
                        expect(jwtObject.id).to.equal(id);
                        done();
                    });
                });
        };
    };

    const wrongUsernameFn = function (index) {
        return function (done) {
            let { username, password } = hxUser.client(index);
            username += 'a';
            store.authBasic({ username, password }, 401)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('authenticationError'));
                })
                .end(done);
        };
    };

    const wrongPasswordFn = function (index) {
        return function (done) {
            let { username, password } = hxUser.client(index);
            password += 'a';
            store.authBasic({ username, password }, 401)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('authenticationError'));
                })
                .end(done);
        };
    };

    _.range(userCount).forEach(index => {
        it(`user ${index} successfull login`, successfullLoginFn(0));
        it(`user ${index} wrong username`, wrongUsernameFn(0));
        it(`user ${index} wrong password`, wrongPasswordFn(0));
    });

    it('token creation throws', function (done) {
        sinon.stub(tokener, 'createJWT', function () {
            throw new Error('stub error');
        });
        let { username, password } = hxUser.client(0);

        store.authBasic({ username, password }, 401)
            .end(function (err, res) {
                tokener.createJWT.restore();
                if (err) {
                    return done(err);
                }
                expect(typeof res.body).to.equal('object');
                expect(res.body.message).to.equal('stub error');
                done();
            });
    });

});
