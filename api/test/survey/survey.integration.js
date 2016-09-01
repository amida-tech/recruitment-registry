/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');

const db = require('../../db');

const config = require('../../config');
const request = require('supertest');

const app = require('../..');

const userExamples = require('../fixtures/user-examples');
const surveyExamples = require('../fixtures/survey-examples');

const expect = chai.expect;

const User = db.User;
const Ethnicity = db.Ethnicity;

describe('survey integration', function () {
    const example = surveyExamples.Example;
    const user = userExamples.Example;

    before(function () {
        return db.sequelize.sync({
            force: true
        }).then(function () {
            return User.create(user);
        });
    });

    it('post survey example unauthorized', function (done) {
        request(app)
            .post('/api/v1.0/survey')
            .send(example)
            .expect(401)
            .end(done);
    });

    let token;

    it('authenticate user', function (done) {
        request(app)
            .get('/api/v1.0/user/token')
            .auth(user.username, user.password)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                token = res.body.token;
                done();
            });
    });

    it('post survey example authorized', function (done) {
        request(app)
            .post('/api/v1.0/survey')
            .set('Authorization', 'Bearer ' + token)
            .send(example)
            .expect(201)
            .expect(function (res) {
                expect(!!res.body.id).to.equal(true);
            })
            .end(done);
    });
});
