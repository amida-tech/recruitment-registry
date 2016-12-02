/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const chai = require('chai');
const sinon = require('sinon');

const models = require('../models');
const config = require('../config');
const tokener = require('../lib/tokener');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('auth integration', function () {
    const store = new RRSuperTest();

    const testUser = {
        username: 'testusername',
        password: 'testpassword',
        email: 'test@test.com'
    };

    before(shared.setUpFn(store));

    it('create test user directly on db', function () {
        return models.user.createUser(testUser)
            .then(user => (testUser.id = user.id));
    });

    it('successfull login', function (done) {
        store.authBasic(testUser)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                jwt.verify(store.jwt, config.jwt.secret, {}, function (err, jwtObject) {
                    if (err) {
                        return done(err);
                    }
                    expect(jwtObject.username).to.equal(testUser.username);
                    expect(jwtObject.id).to.equal(testUser.id);
                    done();
                });
            });
    });

    it('wrong username', function (done) {
        const credentials = {
            username: testUser.username + 'a',
            password: testUser.password
        };
        store.authBasic(credentials, 401)
            .expect(function (res) {
                expect(typeof res.body).to.equal('object');
                expect(Boolean(res.body.message)).to.equal(true);
            })
            .end(done);
    });

    it('wrong password', function (done) {
        const credentials = {
            username: testUser.username,
            password: testUser.password + 'a'
        };
        store.authBasic(credentials, 401)
            .expect(function (res) {
                expect(typeof res.body).to.equal('object');
                expect(Boolean(res.body.message)).to.equal(true);
            })
            .end(done);
    });

    it('token creation throws', function (done) {
        sinon.stub(tokener, 'createJWT', function () {
            throw new Error('stub error');
        });

        store.authBasic(testUser, 401)
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
