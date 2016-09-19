/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../../models');
const userExamples = require('../fixtures/user-examples');

const config = require('../../config');
const shared = require('../shared.integration');

const expect = chai.expect;

const User = models.User;
const Ethnicity = models.Ethnicity;

describe('user integration', function () {
    const user = userExamples.Example;
    const store = {
        server: null,
        auth: null
    };

    before(shared.setUpFn(store));

    let ethnicities;
    let genders;

    it('invalid path', function (done) {
        store.server
            .get('/xxxxxxx')
            .expect(404)
            .end(done);
    });

    it('get available ethnicities', function (done) {
        store.server
            .get('/api/v1.0/ethnicities')
            .expect(200)
            .expect(function (res) {
                const expected = Ethnicity.ethnicities();
                expect(res.body).to.deep.equal(expected);
                ethnicities = expected;
            })
            .end(done);
    });

    it('get available genders', function (done) {
        store.server
            .get('/api/v1.0/genders')
            .expect(200)
            .expect(function (res) {
                const expected = User.genders();
                expect(res.body).to.deep.equal(expected);
                genders = res.body;
            })
            .end(done);
    });

    it('error: get user without previous authentication', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .expect(401, done);
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: get user with wrong jwt token', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', 'Bearer ' + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ1ZXN0Iiwicm9sZSI6bnVsbCwiaWF0IjoxNDczNTAwNzE5LCJleHAiOjE0NzYwOTI3MTl9.e0ymr0xrDPuQEBmdQLjb5-WegNtYcqAcpKp_DtDRKo8')
            .expect(401, done);
    });

    it('get super user', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const user = res.body;
                expect(!user).to.equal(false);
                expect(user.username).to.equal(config.superUser.username);
                expect(user.role).to.equal('admin');
                done();
            });
    });

    it('create a new user', function (done) {
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(user)
            .expect(201, done);
    });

    it('login as new user', shared.loginFn(store, user));

    it('get new user', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                delete res.body.id;
                const expectedUser = _.cloneDeep(user);
                expectedUser.role = 'participant';
                delete expectedUser.password;
                expect(res.body).to.deep.equal(expectedUser);
                done();
            });
    });

    it('login as super', shared.loginFn(store, config.superUser));

    it('error: create user with bad email', function (done) {
        const userEmailErr = _.cloneDeep(user);
        userEmailErr.email = 'notanemail';
        userEmailErr.username = user.username + '1';
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(userEmailErr)
            .expect(400)
            .end(done);
    });

    it('error: create the same user', function (done) {
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(user)
            .expect(400)
            .end(done);
    });

    it('create user with null items (zip, gender)', function (done) {
        const userWithNulls = _.cloneDeep(user);
        userWithNulls.zip = null;
        userWithNulls.gender = null;
        userWithNulls.username = user.username + '1';
        userWithNulls.email = 'a' + user.email;
        store.server
            .post('/api/v1.0/users')
            .set('Authorization', store.auth)
            .send(userWithNulls)
            .expect(201)
            .end(done);
    });

    it('login as new user', shared.loginFn(store, user));

    let userUpdate = {
        email: 'newone@example.com',
        password: 'newone',
        zip: '20899'
    };

    it('update all user fields including password', function (done) {
        userUpdate.ethnicity = ethnicities[1];
        userUpdate.gender = genders[1];
        store.server
            .put('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .send(userUpdate)
            .expect(200, done);
    });

    it('error: bad login with old password', shared.badLoginFn(store, user));

    it('login with updated password', shared.loginFn(store, {
        username: user.username,
        password: userUpdate.password
    }));

    it('verify updated user fields', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const expected = _.cloneDeep(userUpdate);
                expected.role = 'participant';
                expected.id = res.body.id;
                delete expected.password;
                expected.username = user.username;
                expect(res.body).to.deep.equal(expected);
                done();
            });
    });

    it('update selected user fields', function (done) {
        userUpdate.ethnicity = null;
        userUpdate.gender = genders[0];
        userUpdate.zip = '20817';
        store.server
            .put('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .send(_.pick(userUpdate, ['ethnicity', 'gender', 'zip']))
            .expect(200, done);
    });

    it('verify updated user fields', function (done) {
        store.server
            .get('/api/v1.0/users/me')
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const expected = _.pick(userUpdate, ['zip', 'gender', 'ethnicity', 'email']);
                const actual = _.omit(res.body, ['id', 'role', 'username']);
                if (!actual.hasOwnProperty('ethnicity')) {
                    actual.ethnicity = null;
                }
                expect(actual).to.deep.equal(expected);
                done();
            });
    });
});
