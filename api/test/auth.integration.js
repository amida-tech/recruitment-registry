/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const jwt = require('jsonwebtoken');
const chai = require('chai');
const sinon = require('sinon');

const db = require('../models/db');
const config = require('../config');
const tokener = require('../lib/tokener');

const SharedIntegration = require('./util/shared-integration');

const expect = chai.expect;
const shared = new SharedIntegration();

describe('auth integration', function () {
    const store = {
        server: null
    };

    const testUser = {
        username: 'testusername',
        password: 'testpassword',
        email: 'test@test.com'
    };

    before(shared.setUpFn(store));

    it('create test user directly on db', function () {
        return db.User.create(testUser)
            .then(user => (testUser.id = user.id));
    });

    it('successfull login', function (done) {
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(testUser.username, testUser.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const token = res.body.token;
                jwt.verify(token, config.jwt.secret, {}, function (err, jwtObject) {
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
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(testUser.username + 'a', testUser.password)
            .expect(401)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(typeof res.body).to.equal('object');
                expect(Boolean(res.body.message)).to.equal(true);
                done();
            });
    });

    it('wrong password', function (done) {
        store.server
            .get('/api/v1.0/auth/basic')
            .auth(testUser.username, testUser.password + 'a')
            .expect(401)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(typeof res.body).to.equal('object');
                expect(Boolean(res.body.message)).to.equal(true);
                done();
            });
    });

    it('token creation throws', function (done) {
        sinon.stub(tokener, 'createJWT', function () {
            throw new Error('stub error');
        });

        store.server
            .get('/api/v1.0/auth/basic')
            .auth(testUser.username, testUser.password)
            .expect(401)
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
