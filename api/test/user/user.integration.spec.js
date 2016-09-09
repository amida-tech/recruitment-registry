/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const appgen = require('../../app-generator');

const models = require('../../models');
const userExamples = require('../fixtures/user-examples');

const config = require('../../config');
const request = require('supertest');

const expect = chai.expect;

const User = models.User;
const Ethnicity = models.Ethnicity;

describe('user integration', function () {
    const user = userExamples.Example;

    let server;

    before(function (done) {
        appgen.generate(function (err, app) {
            if (err) {
                return done(err);
            }
            server = request(app);
            done();
        });
    });

    var ethnicities;
    var genders;

    it('get available ethnicities', function (done) {
        server
            .get('/api/v1.0/ethnicities')
            .expect(200)
            .expect(function (res) {
                var expected = Ethnicity.ethnicities();
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    it('get available genders', function (done) {
        server
            .get('/api/v1.0/genders')
            .expect(200)
            .expect(function (res) {
                var expected = User.genders();
                expect(res.body).to.deep.equal(expected);
            })
            .end(done);
    });

    let token;

    it('no user authentication error', function (done) {
        server
            .get('/api/v1.0/users/me')
            .expect(401, done);
    });

    it('login default user', function (done) {
        const iu = config.initialUser;
        server
            .get('/api/v1.0/auth/basic')
            .auth(iu.username, iu.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                token = res.body.token;
                done();
            });
    });

    it('get default user', function (done) {
        server
            .get('/api/v1.0/users/me')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                var user = res.body;
                expect(!user).to.equal(false);
                expect(user.username).to.equal(config.initialUser.username);
                expect(user.role).to.equal('admin');
                done();
            });
    });

    it('create a new user', function (done) {
        server
            .post('/api/v1.0/users')
            .send(user)
            .expect(201, done);
    });

    it('login with the new user', function (done) {
        server
            .get('/api/v1.0/auth/basic')
            .auth(user.username, 'password')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                token = res.body.token;
                done();
            });
    });

    it('get the new user', function (done) {
        server
            .get('/api/v1.0/users/me')
            .set('Authorization', 'Bearer ' + token)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                delete res.body.id;
                var expectedUser = _.cloneDeep(user);
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(res.body).to.deep.equal(expectedUser);
                done();
            });
    });

    xit('handle database error (invalid email)', function (done) {
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = user.username + '1';
        server
            .post('/api/v1.0/users')
            .send(userEmailErr)
            .expect(400)
            .end(done);
    });

    it('create the new user again to err', function (done) {
        server
            .post('/api/v1.0/users')
            .send(user)
            .expect(400)
            .end(done);
    });
});
