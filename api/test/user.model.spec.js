/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const config = require('../config');
const models = require('../models');
const Generator = require('./util/entity-generator');

const userExamples = require('./fixtures/example/user');

const expect = chai.expect;
const entityGen = new Generator();
const shared = new SharedSpec();

const User = models.User;

describe('user unit', function () {
    const example = userExamples.Example;

    before(shared.setUpFn());

    describe('username', function () {
        it('create and update', function () {
            const inputUser = entityGen.newUser();
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
                return user;
            }).then(function (user) {
                return User.updateUser(user.id, {
                    username: 'rejectusername'
                }).then(function () {
                    throw new Error('unexpected no error');
                }).catch(function (err) {
                    expect(err.message).to.not.equal('unexpected no error');
                    expect(err.message).to.equal('Field username cannot be updated.');
                });
            });
        });

        it('reject non unique username', function () {
            const inputUser = entityGen.newUser();
            return User.create(inputUser).then(function (user) {
                expect(user.username).to.equal(inputUser.username);
                return user;
            }).then(function () {
                const nextInputUser = entityGen.newUser();
                nextInputUser.username = inputUser.username;
                return User.create(nextInputUser).then(function () {
                    throw new Error('unique username accepted');
                }).catch(function (err) {
                    expect(err).not.to.equal('unique username accepted');
                });
            });
        });

        it('reject null/undefined/missing/empty', function () {
            let p = models.sequelize.Promise.resolve(entityGen.newUser());
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
        it('create, update and authenticate', function () {
            const inputUser = entityGen.newUser();
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
                    return user.id;
                });
            }).then(function (id) {
                return User.updateUser(id, {
                    password: 'newPassword'
                }).then(function () {
                    return User.findById(id).then(function (user) {
                        return user.authenticate('newPassword');
                    });
                });
            });
        });

        it('reject null/undefined/missing/empty', function () {
            let p = models.sequelize.Promise.resolve(entityGen.newUser());
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

        it('reject update with null/undefined/empty', function () {
            const inputValue = entityGen.newUser();
            let p = User.create(inputValue).then(function (user) {
                return user.id;
            });
            [null, undefined, ''].forEach(function (value) {
                p = p.then(function (id) {
                    return User.updateUser(id, {
                        password: value
                    }).then(function () {
                        throw new Error('no error for \'' + value + '\'');
                    }).catch(function (err) {
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
            const inputUser = entityGen.newUser();
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
            const inputUser = entityGen.newUser();
            return User.create(inputUser).then(function (user) {
                expect(user.email).to.equal(inputUser.email);
                return user;
            }).then(function () {
                const nextInputUser = entityGen.newUser();
                nextInputUser.email = inputUser.email;
                return User.create(nextInputUser).then(function () {
                    throw new Error('unique email accepted');
                }).catch(function (err) {
                    expect(err).not.to.equal('unique email accepted');
                });
            });
        });

        it('lowercase emails with capital letters', function () {
            const inputUser = entityGen.newUser({
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

        it('reject create invalid/null/undefined/missing/empty', function () {
            let p = models.sequelize.Promise.resolve(entityGen.newUser());
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

        it('reject update with invalid/null/undefined/empty', function () {
            const inputValue = entityGen.newUser();
            let p = User.create(inputValue).then(function (user) {
                return user.id;
            });
            ['noatemail', null, undefined, ''].forEach(function (value) {
                p = p.then(function (id) {
                    return User.updateUser(id, {
                        email: value
                    }).then(function () {
                        throw new Error('no error for \'' + value + '\'');
                    }).catch(function (err) {
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
            return User.create(example).then(function (user) {
                return User.getUser(user.id).then(function (actual) {
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
            return User.create(exampleWNull).then(function (user) {
                return User.getUser(user.id).then(function (actual) {
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
            const inputUser = entityGen.newUser();
            return User.create(inputUser).then(function (user) {
                const id = user.id;
                const attributes = ['email'];
                let updateObj = {
                    email: 'newone@example.com',
                    password: 'newpasword!!'
                };
                return User.updateUser(id, updateObj).then(function () {
                    return User.authenticateUser(id, updateObj.password);
                }).then(function () {
                    return User.findById(id, {
                        attributes
                    }).then(function (user) {
                        const actualAttrs = user.get();
                        delete updateObj.password;
                        expect(actualAttrs).to.deep.equal(updateObj);
                    });
                });
            });
        });
    });

    describe('reset password', function () {
        it('normal flow', function () {
            const inputUser = entityGen.newUser();
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
                            throw new Error('authentication should have failed');
                        }).catch(function (err) {
                            expect(err.message).not.to.equal('authentication should have failed');
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
                        const emsg = 'Password reset token is invalid or has expired.';
                        expect(err.message).to.equal(emsg);
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
            const inputUser = entityGen.newUser();
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
                    expect(stub.called).to.equal(true);
                    config.expiresForDB.restore();
                });
            });
        });
    });
});
