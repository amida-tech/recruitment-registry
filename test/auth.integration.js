/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

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
const History = require('./util/history');
const Generator = require('./util/generator');

const expect = chai.expect;

describe('auth integration', () => {
    const userCount = 4;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const sharedSpec = new SharedSpec(generator);
    const hxUser = new History();

    before(shared.setUpFn());

    _.range(userCount).forEach((index) => {
        it(`create user ${index} using model`, sharedSpec.createUserFn(hxUser));
    });

    const successfullLoginFn = function (index) {
        return function successfullLogin() {
            const client = hxUser.client(index);
            let username = client.username;
            const email = client.email;
            const password = client.password;
            if (!username) {
                username = email;
            }
            return rrSuperTest.authBasic({ username, password })
                .then(() => {
                    const jwtCookie = rrSuperTest.getJWT();
                    return jwt.verify(jwtCookie.value, config.jwt.secret, {}, (err2, jwtObject) => {
                        if (err2) {
                            throw err2;
                        }
                        const id = hxUser.id(index);
                        expect(jwtObject.username).to.equal(client.username || client.email.toLowerCase());
                        expect(jwtObject.id).to.equal(id);
                    });
                });
        };
    };

    const wrongUsernameFn = function (index) {
        return function wrongUsername(done) {
            const client = hxUser.client(index);
            let username = client.username;
            const email = client.email;
            const password = client.password;
            if (!username) {
                username = email;
            }
            username += `u${username}`;
            rrSuperTest.authBasic({ username, password }, 401)
                .expect(res => shared.verifyErrorMessage(res, 'authenticationError'))
                .end(done);
        };
    };

    const wrongPasswordFn = function (index) {
        return function wrongPassword(done) {
            const client = hxUser.client(index);
            let username = client.username;
            const email = client.email;
            let password = client.password;
            if (!username) {
                username = email;
            }
            password += 'a';
            rrSuperTest.authBasic({ username, password }, 401)
                .expect(res => shared.verifyErrorMessage(res, 'authenticationError'))
                .end(done);
        };
    };

    _.range(userCount).forEach((index) => {
        it(`user ${index} successfull login`, successfullLoginFn(index));
        it(`log out user ${index}`, () => {
            rrSuperTest.resetAuth();
        });
        it(`user ${index} wrong username`, wrongUsernameFn(index));
        it(`user ${index} wrong password`, wrongPasswordFn(index));
    });

    it('token creation throws', (done) => {
        sinon.stub(tokener, 'createJWT', () => {
            throw new Error('stub error');
        });
        const { username, password } = hxUser.client(0);

        rrSuperTest.authBasic({ username, password }, 401)
            .end((err, res) => {
                tokener.createJWT.restore();
                if (err) {
                    return done(err);
                }
                expect(typeof res.body).to.equal('object');
                expect(res.body.message).to.equal('stub error');
                return done();
            });
    });
});
