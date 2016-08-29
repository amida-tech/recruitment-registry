/* global describe,before,after,beforeEach,afterEach,it,xit,expect*/
'use strict';
process.env.NODE_ENV = 'test';

const db = require('../../db');

const config = require('../../config');
const request = require('supertest');

const app = require('../..');

let server;
let jwt;

const UserModel = db.User;

let user = {
    username: 'test',
    password: 'password',
    email: 'test@example.com',
    zip: '20850'
};

describe('Starting API Server', function() {

    before(function() {
        return UserModel.sync({
            force: true
        }).then(function() {
            return UserModel.destroy({
                where: {}
            });
        })
    });

    it('Creates a user via REST api.', function createUser(done) {
        request(app)
            .post('/api/v1.0/user')
            .send(user)
            .expect(201, done)
    });

    it('Authenticates a user and returns a JWT', function createToken(done) {
        request(app)
            .get('/api/v1.0/user/token')
            .auth(user.username, 'password')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);
                jwt = res.body.token;
                done();
            });
    });

    it('Returns a user\'s own data after authenticating the API', function showUser(done) {
        request(app)
            .get('/api/v1.0/user')
            .set('Authorization', 'Bearer ' + jwt)
            .expect(200, {
                username: user.username,
                email: user.email,
                zip: user.zip
            }, done);
    });
});