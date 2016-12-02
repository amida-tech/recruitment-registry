/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const _ = require('lodash');

const SPromise = require('../lib/promise');
const SharedSpec = require('./util/shared-spec');
const config = require('../config');
const models = require('../models');
const Generator = require('./util/entity-generator');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('user unit', function () {
    const example = generator.newUser();

    before(shared.setUpFn());

    describe('username', function () {
        it('create and update', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(function (user) {
                    expect(user.username).to.equal(inputUser.username);
                    return user;
                })
                .then(({ id }) => {
                    return models.user.getUser(id);
                })
                .then(user => {
                    expect(user.username).to.equal(inputUser.username);
                    return user;
                })
                .then(({ id }) => {
                    return models.user.updateUser(id, {
                            username: 'rejectusername'
                        })
                        .then(function () {
                            throw new Error('unexpected no error');
                        })
                        .catch(function (err) {
                            expect(err.message).to.not.equal('unexpected no error');
                            expect(err.message).to.equal('Field username cannot be updated.');
                        });
                });
        });

        it('reject non unique username', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(user => {
                    expect(user.username).to.equal(inputUser.username);
                    return user;
                })
                .then(() => {
                    const nextInputUser = generator.newUser();
                    nextInputUser.username = inputUser.username;
                    return models.user.createUser(nextInputUser)
                        .then(shared.throwingHandler, shared.expectedSeqErrorHandler('uniqueUsername'));
                });
        });

        it('reject null/undefined/missing/empty', function () {
            let p = SPromise.resolve(generator.newUser());
            [null, undefined, '--', ''].forEach(function (value) {
                p = p.then(function (inputUser) {
                    if (value === '--') {
                        delete inputUser.username;
                    } else {
                        inputUser.username = value;
                    }
                    return models.user.createUser(inputUser)
                        .then(shared.throwingHandler, err => {
                            expect(!!err.message).to.equal(true);
                            return inputUser;
                        });
                });
            });
            return p;
        });
    });

    describe('password', function () {
        it('create, update and authenticate', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(({ id }) => {
                    return models.user.authenticateUser(inputUser.username, inputUser.password)
                        .then(() => {
                            return models.user.authenticateUser(inputUser.username, inputUser.password + 'f')
                                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'));
                        })
                        .then(() => {
                            return models.user.updateUser(id, { password: 'newPassword' })
                                .then(() => models.user.authenticateUser(inputUser.username, 'newPassword'));
                        });
                });
        });

        it('reject null/undefined/missing/empty', function () {
            let p = SPromise.resolve(generator.newUser());
            [null, undefined, '--', ''].forEach(function (value) {
                p = p.then(function (inputUser) {
                    if (value === '--') {
                        delete inputUser.password;
                    } else {
                        inputUser.password = value;
                    }
                    return models.user.createUser(inputUser)
                        .then(function () {
                            throw new Error('no error for \'' + value + '\'');
                        })
                        .catch(function (err) {
                            expect(!!err.message).to.equal(true);
                            expect(err.message).not.to.equal('no error for \'' + value + '\'');
                            return inputUser;
                        });
                });
            });
            return p;
        });

        it('reject update with null/undefined/empty', function () {
            const inputValue = generator.newUser();
            let p = models.user.createUser(inputValue).then(function (user) {
                return user.id;
            });
            [null, undefined, ''].forEach(function (value) {
                p = p.then(function (id) {
                    return models.user.updateUser(id, {
                            password: value
                        })
                        .then(function () {
                            throw new Error('no error for \'' + value + '\'');
                        })
                        .catch(function (err) {
                            expect(!!err.message).to.equal(true);
                            expect(err.message).not.to.equal('no error for \'' + value + '\'');
                            return id;
                        });
                });
            });
            return p;
        });
    });

    describe('e-mail', function () {
        it('normal set/get', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(user => {
                    expect(user.email).to.equal(inputUser.email);
                    return user;
                })
                .then(({ id }) => models.user.getUser(id))
                .then(user => {
                    expect(user.email).to.equal(inputUser.email);
                });
        });

        it('reject non unique e-mail', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(user => {
                    expect(user.email).to.equal(inputUser.email);
                    return user;
                })
                .then(() => {
                    const nextInputUser = generator.newUser();
                    nextInputUser.email = inputUser.email;
                    return models.user.createUser(nextInputUser)
                        .then(shared.throwingHandler, shared.expectedSeqErrorHandler('uniqueEmail'));
                });
        });

        it('lowercase emails with capital letters', function () {
            const inputUser = generator.newUser({
                email: 'CamelCase@EXAMPLE.COM'
            });
            return models.user.createUser(inputUser)
                .then(user => {
                    expect(user.email).to.equal(inputUser.email.toLowerCase());
                    return user;
                })
                .then(user => models.user.getUser(user.id))
                .then(user => {
                    expect(user.email).to.equal(inputUser.email.toLowerCase());
                });
        });

        it('reject create invalid/null/undefined/missing/empty', function () {
            let p = SPromise.resolve(generator.newUser());
            ['noatemail', null, undefined, '--', ''].forEach(function (value) {
                p = p.then(function (inputUser) {
                    if (value === '--') {
                        delete inputUser.email;
                    } else {
                        inputUser.email = value;
                    }
                    return models.user.createUser(inputUser)
                        .then(function () {
                            throw new Error('no error for ' + value);
                        })
                        .catch(function (err) {
                            expect(!!err.message).to.equal(true);
                            expect(err.message).not.to.equal('no error for ' + value);
                            return inputUser;
                        });
                });
            });
            return p;
        });

        it('reject update with invalid/null/undefined/empty', function () {
            const inputValue = generator.newUser();
            let p = models.user.createUser(inputValue).then(function (user) {
                return user.id;
            });
            ['noatemail', null, undefined, ''].forEach(function (value) {
                p = p.then(function (id) {
                    return models.user.updateUser(id, {
                            email: value
                        })
                        .then(function () {
                            throw new Error('no error for \'' + value + '\'');
                        })
                        .catch(function (err) {
                            expect(!!err.message).to.equal(true);
                            expect(err.message).not.to.equal('no error for \'' + value + '\'');
                            return id;
                        });
                });
            });
            return p;
        });
    });

    describe('create/get users', function () {
        it('post/get user', function () {
            return models.user.createUser(example).then(function (user) {
                return models.user.getUser(user.id)
                    .then(function (actual) {
                        const expected = _.cloneDeep(example);
                        expected.id = user.id;
                        delete actual.role;
                        delete expected.password;
                        expect(actual).to.deep.equal(expected);
                    });
            });
        });

        it('post/get user with null values', function () {
            const exampleWNull = _.cloneDeep(example);
            exampleWNull.username += '1';
            exampleWNull.email = 'a' + exampleWNull.email;
            return models.user.createUser(exampleWNull)
                .then(function (user) {
                    return models.user.getUser(user.id)
                        .then(function (actual) {
                            const expected = _.cloneDeep(exampleWNull);
                            expected.id = user.id;
                            delete actual.role;
                            delete expected.password;
                            expect(actual).to.deep.equal(expected);
                        });
                });
        });
    });

    describe('update users', function () {
        it('normal flow', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(user => {
                    const id = user.id;
                    let updateObj = {
                        email: 'newone@example.com',
                        password: 'newpasword!!'
                    };
                    return models.user.updateUser(id, updateObj)
                        .then(() => models.user.authenticateUser(inputUser.username, updateObj.password))
                        .then(() => models.user.getUser(id))
                        .then(user => {
                            expect(user.email).equal(updateObj.email);

                        });
                });
        });
    });

    describe('reset password', function () {
        it('normal flow', function () {
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(user => {
                    return models.user.resetPasswordToken(user.email)
                        .then(token => {
                            expect(!!token).to.equal(true);
                            return token;
                        })
                        .then(token => {
                            return models.user.authenticateUser(inputUser.username, inputUser.password)
                                .then(shared.throwingHandler, shared.expectedErrorHandler('authenticationError'))
                                .then(() => token);
                        })
                        .then(token => {
                            const wrongToken = (token.charAt(0) === '1' ? '2' : '1') + token.slice(1);
                            return models.user.resetPassword(wrongToken, 'newPassword')
                                .then(shared.throwingHandler, shared.expectedErrorHandler('invalidOrExpiredPWToken'))
                                .then(() => models.user.resetPassword(token, 'newPassword'));
                        })
                        .then(() => models.user.authenticateUser(inputUser.username, 'newPassword'));
                });
        });

        it('invalid email', function () {
            return models.user.resetPasswordToken('a@a.com')
                .then(shared.throwingHandler, shared.expectedErrorHandler('invalidEmail'));
        });

        it('expired reset token', function () {
            const stub = sinon.stub(config, 'expiresForDB', function () {
                let m = moment.utc();
                m.add(250, 'ms');
                return m.toISOString();
            });
            const inputUser = generator.newUser();
            return models.user.createUser(inputUser)
                .then(user => models.user.resetPasswordToken(user.email))
                .then(function (token) {
                    return models.user.resetPassword(token, 'newPassword')
                        .then(() => SPromise.delay(600))
                        .then(() => models.user.resetPassword(token, 'newPassword'))
                        .then(shared.throwingHandler, shared.expectedErrorHandler('invalidOrExpiredPWToken'))
                        .then(() => {
                            expect(stub.called).to.equal(true);
                            config.expiresForDB.restore();
                        });
                });
        });
    });
});
