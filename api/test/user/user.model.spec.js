/* global describe,before,after,beforeEach,afterEach,it,xit*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const _ = require('lodash');

const config = require('../../config');
const helper = require('../helpers');
const models = require('../../models');
const userExamples = require('../fixtures/user-examples');

const expect = chai.expect;

const Ethnicity = models.Ethnicity;
const User = models.User;

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

        it('reject null/undefined/missing/empty', function () {
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

    describe('password', function () {
        it('normal set and authenticate', function () {
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                return User.findOne({
                    where: {
                        id: user.id
                    }
                });
            }).then(function (user) {
                return user.authenticate(inputUser.password).then(function () {
                    return user;
                });
            }).then(function (user) {
                return user.authenticate(inputUser.password + 'f').then(function () {
                    throw new Error('expected error no');
                }).catch(function (err) {
                    expect(err.message).not.to.equal('expected error no');
                    expect(err.message).to.equal('Authentication error.');
                });
            });
        });

        it('reject null/undefined/missing/empty', function () {
            var p = models.sequelize.Promise.resolve(fnNewUser());
            [null, undefined, '--', ''].forEach(function (value) {
                p = p.then(function (inputUser) {
                    if (value === '--') {
                        delete inputUser.password;
                    } else {
                        inputUser.password = value;
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

    describe('create/get users', function () {
        it('post/get user', function () {
            return User.create(example).then(function (user) {
                var id = user.id;
                return User.getUser(user.id).then(function (actual) {
                    var expected = _.cloneDeep(example);
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
            exampleWNull.zip = null;
            return User.create(exampleWNull).then(function (user) {
                var id = user.id;
                return User.getUser(user.id).then(function (actual) {
                    var expected = _.cloneDeep(exampleWNull);
                    expected.id = user.id;
                    delete actual.role;
                    delete expected.password;
                    expect(actual).to.deep.equal(expected);
                });
            });
        });
    });

    describe('reset password', function () {
        var id;

        it('normal flow', function () {
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                let token;

                return User.resetPasswordToken(user.email).then(function (result) {
                    token = result;
                    expect(!!token).to.equal(true);
                    return token;
                }).then(function (token) {
                    return User.findOne({
                        where: {
                            email: inputUser.email
                        }
                    }).then(function (user) {
                        return user.authenticate(inputUser.password).then(function () {
                            throw new Error('authentication should not have succeeded');
                        }).catch(function (err) {
                            expect(err.message).not.to.equal('authentication should not have succeeded');
                            expect(err.message).to.equal('Authentication error.');
                            return token;
                        });
                    });
                }).then(function (token) {
                    const wrongToken = '1' + token.slice(1);
                    return User.resetPassword(wrongToken, 'newPassword').then(function () {
                        throw new Error('unexpected no error for no token');
                    }).catch(function (err) {
                        expect(err.message).not.to.equal('unexpected no error for no token');
                        expect(err.message).to.equal('Password reset token is invalid or has expired.');
                        return token;
                    }).then(function (token) {
                        return User.resetPassword(token, 'newPassword');
                    });
                });
            }).then(function () {
                return User.findOne({
                    where: {
                        email: inputUser.email
                    }
                }).then(function (user) {
                    return user.authenticate('newPassword');
                });
            });
        });

        it('invalid email', function () {
            return User.resetPasswordToken('a@a.com').then(function () {
                throw new Error('unexpected no error ');
            }).catch(function (err) {
                expect(err.message).not.to.equal('unexpected no error');
                expect(err.message).to.equal('Email is invalid.');
            });
        });

        it('expired reset token', function () {
            const stub = sinon.stub(config, 'expiresForDB', function () {
                let m = moment.utc();
                m.add(250, 'ms');
                return m.toISOString();
            });
            const inputUser = fnNewUser();
            return User.create(inputUser).then(function (user) {
                return User.resetPasswordToken(user.email);
            }).then(function (token) {
                return User.resetPassword(token, 'newPassword').then(function () {
                    return models.sequelize.Promise.delay(600);
                }).then(function () {
                    return User.resetPassword(token, 'newPassword');
                }).then(function () {
                    throw new Error('unexpected no expiration error');
                }).catch(function (err) {
                    expect(err.message).not.to.equal('unexpected no expiration error');
                    expect(err.message).to.equal('Password reset token is invalid or has expired.');
                }).then(function () {
                    config.expiresForDB.restore();
                });
            });
        });
    });
});
