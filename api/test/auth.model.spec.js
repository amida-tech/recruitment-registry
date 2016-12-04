/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const History = require('./util/entity-history');
const models = require('../models');
const Generator = require('./util/entity-generator');
const testJsutil = require('./util/test-jsutil');

const generator = new Generator();
const shared = new SharedSpec(generator);
const expect = chai.expect;

describe('auth unit', function () {
    const userCount = 4;

    const hxUser = new History();

    before(shared.setUpFn());

    const createUserFn = function () {
        return function () {
            const user = generator.newUser();
            return models.user.createUser(user)
                .then(({ id }) => {
                    hxUser.push(user, { id });
                });
        };
    };

    const authenticateUserFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return models.auth.authenticateUser(username, client.password);
        };
    };

    const authenticateUserErrorFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return models.auth.authenticateUser(username, client.password + 'a')
                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
        };
    };

    const authenticateOppositeCaseUserFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            if (!client.username) {
                const username = testJsutil.oppositeCase(client.email);
                return models.auth.authenticateUser(username, client.password);
            }
        };
    };

    const authenticateOppositeCaseUserErrorFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            if (client.username) {
                const username = testJsutil.oppositeCase(client.username);
                return models.auth.authenticateUser(username, client.password)
                    .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
            }
        };
    };

    const updateUserPasswordFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            const password = client.password + 'updated';
            const id = hxUser.id(index);
            return models.user.updateUser(id, { password })
                .then(() => client.password = password);
        };
    };

    const updateUserFn = function (index) {
        return function () {
            const client = hxUser.client(index);
            let { username, email, password } = client;
            const updateFields = { email: 'u' + email, password: 'u' + password };
            if (username) {
                updateFields.username = 'u' + username;
            }
            const id = hxUser.id(index);
            return models.user.updateUser(id, updateFields)
                .then(() => {
                    if (username) {
                        client.username = updateFields.username;
                    }
                    client.email = updateFields.email;
                    client.password = updateFields.password;
                });
        };
    };

    _.range(userCount).forEach(index => {
        it(`create user ${index}`, createUserFn());
        it(`authenticate user ${index}`, authenticateUserFn(index));
        it(`error: authenticate user ${index} with wrong password`, authenticateUserErrorFn(index));
        it(`authenticate user ${index} with wrong password`, authenticateUserErrorFn(index));
        it(`update password for user ${index}`, updateUserPasswordFn(index));
        it(`authenticate user ${index}`, authenticateUserFn(index));
        it(`error: authenticate opposite case username user ${index}`, authenticateOppositeCaseUserErrorFn(index));
        it(`authenticate opposite case username (when email) user ${index}`, authenticateOppositeCaseUserFn(index));
    });

    _.range(userCount).forEach(index => {
        it(`update user ${index}`, updateUserFn(index));
        it(`authenticate user ${index}`, authenticateUserFn(index));
    });

    it('sanity check both direct username and email username are tested', function () {
        const counts = _.range(userCount).reduce((r, index) => {
            if (hxUser.client(index).username) {
                ++r.username;
            } else {
                ++r.email;
            }
            return r;
        }, { username: 0, email: 0 });
        expect(counts.username).to.be.above(0);
        expect(counts.email).to.be.above(0);
    });
});
