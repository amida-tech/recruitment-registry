/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const chai = require('chai');
const sinon = require('sinon');
const _ = require('lodash');

const config = require('../config');
const tokener = require('../lib/tokener');

const SharedIntegration = require('./util/shared-integration');
const SharedSpec = require('./util/shared-spec');
const RRSuperTest = require('./util/rr-super-test');
const RRError = require('../lib/rr-error');
const History = require('./util/entity-history');
const Generator = require('./util/entity-generator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);
const sharedSpec = new SharedSpec(generator);

describe('auth integration', function () {
    const userCount = 4;

    const store = new RRSuperTest();

    const hxUser = new History();

    before(shared.setUpFn(store));

    _.range(userCount).forEach(index => {
        it(`create user ${index} using model`, sharedSpec.createUserFn(hxUser));
    });

    const successfullLoginFn = function (index) {
        return function (done) {
            const client = hxUser.client(index);
            let { username, email, password } = client;
            if (!username) {
                username = email;
            }
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
                        expect(jwtObject.username).to.equal(client.username || client.email.toLowerCase());
                        expect(jwtObject.id).to.equal(id);
                        done();
                    });
                });
        };
    };

    const wrongUsernameFn = function (index) {
        return function (done) {
            const client = hxUser.client(index);
            let { username, email, password } = client;
            if (!username) {
                username = email;
            }
            username += 'u' + username;
            store.authBasic({ username, password }, 401)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('authenticationError'));
                })
                .end(done);
        };
    };

    const wrongPasswordFn = function (index) {
        return function (done) {
            const client = hxUser.client(index);
            let { username, email, password } = client;
            if (!username) {
                username = email;
            }
            password += 'a';
            store.authBasic({ username, password }, 401)
                .expect(function (res) {
                    expect(res.body.message).to.equal(RRError.message('authenticationError'));
                })
                .end(done);
        };
    };

    _.range(userCount).forEach(index => {
        it(`user ${index} successfull login`, successfullLoginFn(index));
        it(`user ${index} wrong username`, wrongUsernameFn(index));
        it(`user ${index} wrong password`, wrongPasswordFn(index));
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
