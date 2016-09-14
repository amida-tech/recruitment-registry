/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

var chai = require('chai');
var _ = require('lodash');

const helper = require('../helpers');
const models = require('../../models');
const userExamples = require('../fixtures/user-examples');

var expect = chai.expect;

var Ethnicity = models.Ethnicity;
var User = models.User;

describe('user unit', function () {
    const example = userExamples.Example;

    before(function () {
        return models.sequelize.sync({
            force: true
        });
    });

    const fnNewUser = (function () {
        var index = -1;

        return function (override) {
            ++index;
            let user = {
                username: 'username_' + index,
                password: 'password_' + index,
                email: 'email_' + index + '@example.com'
            };
            if (override) {
                user = _.assign(user, override);
            }
            return user;
        };
    })();

    describe('username', function () {
        it('normal set/get', function () {
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                expect(user.username).to.equal(inputUser.username);
                return user;
            }).then(function (user) {
                return User.findOne({
                    where: {
                        id: user.id
                    },
                    raw: true,
                    attributes: ['username']
                });
            }).then(function (user) {
                expect(user.username).to.equal(inputUser.username);
            });
        });

        it('reject non unique username', function () {
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                expect(user.username).to.equal(inputUser.username);
                return user;
            }).then(function (user) {
                const nextInputUser = fnNewUser();
                nextInputUser.username = inputUser.username;
                return User.create(nextInputUser).then(function () {
                    throw new Error('unique username accepted');
                }).catch(function (err) {
                    expect(err).not.to.equal('unique username accepted');
                });
            });
        });

        it('reject invalid/null/undefined email/missing/empty string', function () {
            var p = models.sequelize.Promise.resolve(fnNewUser());
            [null, undefined, '--', ''].forEach(function (value) {
                p = p.then(function (inputUser) {
                    if (value === '--') {
                        delete inputUser.username;
                    } else {
                        inputUser.username = value;
                    }
                    return User.create(inputUser).then(function () {
                        throw new Error('no error for \'' + value + '\'');
                    }).catch(function (err) {
                        expect(!!err.message).to.equal(true);
                        expect(err.message).not.to.equal('no error for \'' + value + '\'');
                        return inputUser;
                    });
                });
            });
            return p;
        });
    });

    describe('e-mail', function () {
        it('normal set/get', function () {
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                expect(user.email).to.equal(inputUser.email);
                return user;
            }).then(function (user) {
                return User.findOne({
                    where: {
                        id: user.id
                    },
                    raw: true,
                    attributes: ['email']
                });
            }).then(function (user) {
                expect(user.email).to.equal(inputUser.email);
            });
        });

        it('reject non unique e-mail', function () {
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                expect(user.email).to.equal(inputUser.email);
                return user;
            }).then(function (user) {
                const nextInputUser = fnNewUser();
                nextInputUser.email = inputUser.email;
                return User.create(nextInputUser).then(function () {
                    throw new Error('unique email accepted');
                }).catch(function (err) {
                    expect(err).not.to.equal('unique email accepted');
                });
            });
        });

        it('lowercase emails with capital letters', function () {
            const inputUser = fnNewUser({
                email: 'CamelCase@EXAMPLE.COM'
            });
            return User.create(inputUser).then(function (user) {
                expect(user.email).to.equal(inputUser.email.toLowerCase());
                return user;
            }).then(function (user) {
                return User.findOne({
                    where: {
                        id: user.id
                    },
                    raw: true,
                    attributes: ['email']
                });
            }).then(function (user) {
                expect(user.email).to.equal(inputUser.email.toLowerCase());
            });
        });

        it('reject invalid/null/undefined email/missing/empty string', function () {
            var p = models.sequelize.Promise.resolve(fnNewUser());
            ['noatemail', null, undefined, '--', ''].forEach(function (value) {
                p = p.then(function (inputUser) {
                    if (value === '--') {
                        delete inputUser.email;
                    } else {
                        inputUser.email = value;
                    }
                    return User.create(inputUser).then(function () {
                        throw new Error('no error for ' + value);
                    }).catch(function (err) {
                        expect(!!err.message).to.equal(true);
                        expect(err.message).not.to.equal('no error for ' + value);
                        return inputUser;
                    });
                });
            });
            return p;
        });
    });

    var id;

    it('post/get user', function () {
        return User.create(example).then(function (user) {
            id = user.id;
            return User.getUser(user.id).then(function (actual) {
                var expected = _.cloneDeep(example);
                expected.id = user.id;
                expected.password = user.password;
                delete actual.createdAt;
                delete actual.updatedAt;
                delete actual.role;
                expect(actual).to.deep.equal(expected);
            });
        });
    });

    it('post/get user with null values', function () {
        const exampleWNull = _.cloneDeep(example);
        exampleWNull.username += '1';
        exampleWNull.email = 'a' + exampleWNull.email;
        exampleWNull.zip = null;
        return User.create(exampleWNull).then(function (user) {
            id = user.id;
            return User.getUser(user.id).then(function (actual) {
                var expected = _.cloneDeep(exampleWNull);
                expected.id = user.id;
                expected.password = user.password;
                delete actual.createdAt;
                delete actual.updatedAt;
                delete actual.role;
                expect(actual).to.deep.equal(expected);
            });
        });
    });
});
