/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SPromise = require('../lib/promise');
const SharedSpec = require('./util/shared-spec');
const History = require('./util/history');
const config = require('../config');
const models = require('../models');
const Generator = require('./util/generator');
const comparator = require('./util/comparator');
const testJsutil = require('./util/test-jsutil');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('user unit', function userUnit() {
    let userCount = 8;

    const hxUser = new History();

    before(shared.setUpFn());

    const getUserFn = function (index) {
        return function getUser() {
            const id = hxUser.id(index);
            return models.user.getUser(id)
                .then((user) => {
                    const client = hxUser.client(index);
                    comparator.user(client, user);
                    hxUser.updateServer(index, user);
                });
        };
    };

    const verifyUserFn = function (index) {
        return function verifyUser() {
            const server = hxUser.server(index);
            return models.user.getUser(server.id)
                .then(user => expect(user).to.deep.equal(server));
        };
    };

    const updateUserFn = function (index) {
        return function updateUser() {
            const { email, password } = generator.newUser();
            const id = hxUser.id(index);
            return models.user.updateUser(id, { email, password })
                .then(() => {
                    const client = hxUser.client(index);
                    const server = hxUser.server(index);
                    if (!client.username) {
                        server.username = email.toLowerCase();
                    }
                    server.email = email;
                    client.email = email;
                    client.password = password;
                });
        };
    };

    _.range(userCount / 2).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser));
        it(`get user ${index}`, getUserFn(index));
    });

    _.range(userCount / 2, userCount).forEach((index) => {
        it(`create user ${index}`, shared.createUserFn(hxUser, { role: 'clinician' }));
        it(`get user ${index}`, getUserFn(index));
    });

    it('list all non admin users', () => models.user.listUsers()
            .then((users) => {
                let expected = _.cloneDeep(hxUser.listServers());
                expected = _.sortBy(expected, 'username');
                const actual = _.sortBy(users, 'username');
                expect(actual).to.deep.equal(expected);
            }));

    it('list all participant users', () => models.user.listUsers({ role: 'participant' })
            .then((users) => {
                const halfNumUsers = hxUser.length() / 2;
                let expected = _.cloneDeep(hxUser.listServers(undefined, _.range(halfNumUsers)));
                expected = _.sortBy(expected, 'username');
                const actual = _.sortBy(users, 'username');
                expect(actual).to.deep.equal(expected);
            }));

    it('list all clinician users', () => models.user.listUsers({ role: 'clinician' })
            .then((users) => {
                const numUsers = hxUser.length();
                const halfNumUsers = numUsers / 2;
                let expected = hxUser.listServers(undefined, _.range(halfNumUsers, numUsers));
                expected = _.sortBy(_.cloneDeep(expected), 'username');
                const actual = _.sortBy(users, 'username');
                expect(actual).to.deep.equal(expected);
            }));

    it('error: identical specified username and email', () => {
        const user = generator.newUser();
        user.username = user.email;
        return models.user.createUser(user)
            .then(shared.throwingHandler, shared.expectedErrorHandler('userIdenticalUsernameEmail'));
    });

    const updateUsernameWhenEmailFn = function (index) {
        return function updateUsernameWhenEmail() {
            const client = hxUser.client(index);
            if (!client.username) {
                const newUser = generator.newUser();
                if (!newUser.username) {
                    newUser.username = newUser.email.split('@')[0];
                }
                const id = hxUser.id(index);
                return models.user.updateUser(id, newUser)
                    .then(shared.throwingHandler, shared.expectedErrorHandler('userNoUsernameChange'));
            }
            return null;
        };
    };

    _.range(userCount).forEach((index) => {
        it(`error: update user ${index} error when email as username`, updateUsernameWhenEmailFn(index));
    });

    const uniqUsernameErrorFn = function (index) {
        return function uniqUsernameError() {
            const client = hxUser.client(index);
            const user = generator.newUser();
            const username = client.username || client.email.toLowerCase();
            user.username = username;
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { username }));
        };
    };

    const uniqEmailErrorFn = function (index) {
        return function uniqEmailError() {
            const client = hxUser.client(index);
            const user = generator.newUser();
            user.email = client.email;
            let fields;
            if (client.username || user.username) {
                fields = { 'lower(email)': user.email.toLowerCase() };
            } else {
                fields = { username: user.email.toLowerCase() };
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', fields));
        };
    };

    const uniqOppCaseEmailErrorFn = function (index) {
        return function uniqOppCaseEmailError() {
            const client = hxUser.client(index);
            const user = generator.newUser();
            user.email = testJsutil.oppositeCase(client.email);
            let fields;
            if (client.username || user.username) {
                fields = { 'lower(email)': user.email.toLowerCase() };
            } else {
                fields = { username: user.email.toLowerCase() };
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', fields));
        };
    };

    const uniqUserErrorFn = function (index) {
        return function uniqUserError() {
            const client = hxUser.client(index);
            const username = client.username || client.email.toLowerCase();
            return models.user.createUser(client)
                .then(shared.throwingHandler, shared.expectedSeqErrorHandler('SequelizeUniqueConstraintError', { username }));
        };
    };

    [0, 2, 1, 3].forEach((index) => {
        it(`error: create user with username of user ${index}`, uniqUsernameErrorFn(index));
        it(`error: create user with email of user ${index}`, uniqEmailErrorFn(index));
        it(`error: create user with opposite case email of user ${index}`, uniqOppCaseEmailErrorFn(index));
        it(`error: create user with username and email of user ${index}`, uniqUserErrorFn(index));
    });

    _.range(userCount).forEach((index) => {
        it(`update user ${index}`, updateUserFn(index));
        it(`verify user ${index}`, verifyUserFn(index));
    });

    const invalidPasswordErrorFn = function (value) {
        return function invalidPasswordError() {
            const user = generator.newUser();
            if (value === '--') {
                delete user.password;
            } else {
                user.password = value;
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, (err) => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['--', 'no'],
        ['', 'empty'],
    ].forEach(([value, msg]) => {
        it(`error: create user with ${msg} password`, invalidPasswordErrorFn(value));
    });

    const invalidPasswordUpdateErrorFn = function (value) {
        return function invalidPasswordUpdateError() {
            const id = hxUser.id(0);
            return models.user.updateUser(id, { password: value })
                .then(shared.throwingHandler, (err) => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['', 'empty'],
    ].forEach(([value, msg]) => {
        it(`error: update user with ${msg} password`, invalidPasswordUpdateErrorFn(value));
    });

    const invalidEmailErrorFn = function (value) {
        return function invalidEmailError() {
            const user = generator.newUser();
            if (value === '--') {
                delete user.email;
            } else {
                user.email = value;
            }
            return models.user.createUser(user)
                .then(shared.throwingHandler, (err) => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['--', 'no'],
        ['', 'empty'],
        ['notemail', 'invalid (no @) '],
    ].forEach(([value, msg]) => {
        it(`error: create user with ${msg} email`, invalidEmailErrorFn(value));
    });

    const invalidEmailUpdateErrorFn = function (value) {
        return function invalidEmailUpdateError() {
            const id = hxUser.id(0);
            return models.user.updateUser(id, { email: value })
                .then(shared.throwingHandler, (err) => {
                    expect(!!err.message).to.equal(true);
                });
        };
    };

    [
        [null, 'null'],
        [undefined, 'undefined'],
        ['', 'empty'],
        ['notemail', 'invalid (no @)'],
    ].forEach(([value, msg]) => {
        it(`error: update user with ${msg} email`, invalidEmailUpdateErrorFn(value));
    });

    const oldPasswords = new Array(userCount);
    const tokens = new Array(userCount);

    const resetPasswordTokenFn = function (index) {
        return function resetPasswordToken() {
            const client = hxUser.client(index);
            oldPasswords[index] = client.password;
            let email = client.email;
            if ((index + 1) % 2 === 0) {
                email = testJsutil.oppositeCase(email);
            }
            return models.user.resetPasswordToken(email)
                .then((token) => {
                    expect(!!token).to.equal(true);
                    tokens[index] = token;
                });
        };
    };

    const authenticateUserOldPWFn = function (index) {
        return function authenticateUserOldPW() {
            const client = hxUser.client(index);
            const username = client.username || client.email;
            return models.auth.authenticateUser(username, oldPasswords[index])
                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
        };
    };

    const resetPasswordWrongTokenFn = function (index) {
        return function resetPasswordWrongToken() {
            const token = tokens[index];
            const wrongToken = (token.charAt(0) === '1' ? '2' : '1') + token.slice(1);
            return models.user.resetPassword(wrongToken, 'newPassword')
                .then(shared.throwingHandler, shared.expectedErrorHandler('invalidOrExpiredPWToken'));
        };
    };

    const resetPasswordFn = function (index) {
        return function resetPassword() {
            const token = tokens[index];
            const password = generator.newUser().password;
            hxUser.client(index).password = password;
            return models.user.resetPassword(token, password);
        };
    };

    it('sanity check both direct username and email username are tested', shared.sanityEnoughUserTested(hxUser));

    _.range(userCount).forEach((index) => {
        it(`get reset password token for user ${index}`, resetPasswordTokenFn(index));
        it(`error: authenticate user ${index} with old password`, authenticateUserOldPWFn(index));
        it(`error: reset password with wrong token for user ${index}`, resetPasswordWrongTokenFn(index));
        it(`reset password for user ${index}`, resetPasswordFn(index));
        it(`authenticate user ${index}`, shared.authenticateUserFn(hxUser, index));
    });

    it('error: reset password token for invalid email', () => models.user.resetPasswordToken('a@a.com')
            .then(shared.throwingHandler, shared.expectedErrorHandler('invalidEmail')));

    let resetExpires;
    let resetExpiresUnit;

    it('reduce password token expiration duration', () => {
        resetExpires = config.crypt.resetExpires;
        resetExpiresUnit = config.crypt.resetExpiresUnit;
        config.crypt.resetExpires = 250;
        config.crypt.resetExpiresUnit = 'ms';
    });

    it('get reset password token for user 0', resetPasswordTokenFn(0));
    it('delay to cause password tokenn expiration', () => SPromise.delay(600));
    it('error: reset password with expired reset token', () => models.user.resetPassword(tokens[0], 'newPassword')
            .then(shared.throwingHandler, shared.expectedErrorHandler('invalidOrExpiredPWToken')));

    it('restore password token expiration duraction', () => {
        config.crypt.resetExpires = resetExpires;
        config.crypt.resetExpiresUnit = resetExpiresUnit;
    });

    const patchUserFn = function (index, userPatch) {
        return function patchUser() {
            const id = hxUser.id(index);
            return models.user.updateUser(id, userPatch)
                .then(() => {
                    const server = hxUser.server(index);
                    ['firstname', 'lastname'].forEach((key) => {
                        if (userPatch[key]) {
                            server[key] = userPatch[key];
                        } else {
                            delete server[key];
                        }
                    });
                });
        };
    };

    it(`create user ${userCount}`, shared.createUserFn(hxUser, {
        lastname: 'lastname',
        firstname: 'firstname',
    }));
    it(`get user ${userCount}`, getUserFn(userCount));
    it(`patch user ${userCount}`, patchUserFn(userCount, { firstname: 'updfn', lastname: '' }));
    it(`verify user ${userCount}`, verifyUserFn(userCount));
    it(`patch user ${userCount}`, patchUserFn(userCount, { firstname: '', lastname: 'updln' }));

    it(`verify user ${userCount}`, verifyUserFn(userCount));

    userCount += 1;
});
