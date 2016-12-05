/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const tokener = require('../lib/tokener');
const security = require('../security');

const SharedSpec = require('./util/shared-spec');

const expect = chai.expect;
const shared = new SharedSpec();

describe('security unit', function () {
    const admin = {
        username: 'admin',
        password: 'admin',
        email: 'admin@test.com',
        role: 'admin'
    };

    let adminJWT;

    const participant = {
        username: 'participant',
        password: 'participant',
        email: 'participant@test.com',
        role: 'participant'
    };

    let participantJWT;

    const deleted = {
        username: 'deleted',
        password: 'deleted',
        email: 'deleted@test.com',
        role: 'participant'
    };

    let deletedJWT;

    const other = {
        username: 'other',
        password: 'other',
        email: 'other@test.com',
        role: 'clinician'
    };

    let otherJWT;

    before(shared.setUpFn());

    it('create users', function () {
        return models.user.createUser(admin)
            .then(user => {
                admin.id = user.id;
                adminJWT = tokener.createJWT({
                    id: admin.id,
                    originalUsername: admin.username
                });
            })
            .then(() => models.user.createUser(participant))
            .then(user => {
                participant.id = user.id;
                participantJWT = tokener.createJWT({
                    id: participant.id,
                    originalUsername: participant.username
                });
            })
            .then(() => models.user.createUser(other))
            .then(user => {
                other.id = user.id;
                otherJWT = tokener.createJWT({
                    id: other.id,
                    originalUsername: other.username
                });
            })
            .then(() => models.user.createUser(deleted))
            .then(user => {
                deleted.id = user.id;
                deletedJWT = tokener.createJWT({
                    id: deleted.id,
                    originalUsername: deleted.username
                });
                return user.id;
            })
            .then(id => models.user.deleteUser(id));
    });

    it('valid admin for admin', function (done) {
        const req = {};
        const header = `Bearer ${adminJWT}`;
        security.admin(req, undefined, header, function (err) {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(admin, 'password');
            expect(actual).to.deep.equal(expected);
            done();
        });
    });

    it('valid participant for participant', function (done) {
        const req = {};
        const header = `Bearer ${participantJWT}`;
        security.participant(req, undefined, header, function (err) {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(participant, 'password');
            expect(actual).to.deep.equal(expected);
            done();
        });
    });

    it('valid admin for self', function (done) {
        const req = {};
        const header = `Bearer ${adminJWT}`;
        security.self(req, undefined, header, function (err) {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(admin, 'password');
            expect(actual).to.deep.equal(expected);
            done();
        });
    });

    it('valid participant for self', function (done) {
        const req = {};
        const header = `Bearer ${participantJWT}`;
        security.self(req, undefined, header, function (err) {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(participant, 'password');
            expect(actual).to.deep.equal(expected);
            done();
        });
    });

    it('error: no Bearer', function (done) {
        const req = {};
        const header = `${adminJWT}`;
        security.admin(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.invalidAuth);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });

    it('error: no token', function (done) {
        const req = {};
        const header = 'Bearer';
        security.admin(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.invalidAuth);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });

    it('error: no header', function (done) {
        const req = {};
        const header = '';
        security.admin(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.noAuth);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });

    it('error: invalid token', function (done) {
        const req = {};
        const header = 'Bearer xxx';
        security.admin(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.invalidAuth);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });

    it('error: invalid user', function (done) {
        const req = {};
        const header = `Bearer ${deletedJWT}`;
        security.participant(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.invalidUser);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });

    it('error: participant for admin', function (done) {
        const req = {};
        const header = `Bearer ${participantJWT}`;
        security.admin(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.unauthorizedUser);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });

    it('error: other for participant', function (done) {
        const req = {};
        const header = `Bearer ${otherJWT}`;
        security.participant(req, undefined, header, function (err) {
            if (err) {
                expect(err).to.deep.equal(security.unauthorizedUser);
                return done();
            } else {
                done(new Error('unexpected no error'));
            }
        });
    });
});
