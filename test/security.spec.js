/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const tokener = require('../lib/tokener');
const security = require('../security');

const SharedSpec = require('./util/shared-spec');

const expect = chai.expect;
const shared = new SharedSpec();

describe('security unit', () => {
    const admin = {
        username: 'admin',
        password: 'admin',
        email: 'admin@test.com',
        role: 'admin',
    };

    let adminJWT;

    const participant = {
        username: 'participant',
        password: 'participant',
        email: 'participant@test.com',
        role: 'participant',
    };

    let participantJWT;

    const deleted = {
        username: 'deleted',
        password: 'deleted',
        email: 'deleted@test.com',
        role: 'participant',
    };

    let deletedJWT;

    const clinician = {
        username: 'clinician',
        password: 'clinician',
        email: 'clinician@test.com',
        role: 'clinician',
    };

    let clinicianJWT;

    before(shared.setUpFn());

    it('create users', () => models.user.createUser(admin)
            .then((user) => {
                admin.id = user.id;
                adminJWT = tokener.createJWT({
                    id: admin.id,
                    originalUsername: admin.username,
                });
            })
            .then(() => models.user.createUser(participant))
            .then((user) => {
                participant.id = user.id;
                participantJWT = tokener.createJWT({
                    id: participant.id,
                    originalUsername: participant.username,
                });
            })
            .then(() => models.user.createUser(clinician))
            .then((user) => {
                clinician.id = user.id;
                clinicianJWT = tokener.createJWT({
                    id: clinician.id,
                    originalUsername: clinician.username,
                });
            })
            .then(() => models.user.createUser(deleted))
            .then((user) => {
                deleted.id = user.id;
                deletedJWT = tokener.createJWT({
                    id: deleted.id,
                    originalUsername: deleted.username,
                });
                return user.id;
            })
            .then(id => models.user.deleteUser(id)));

    it('valid admin for admin', (done) => {
        const req = { models };
        const header = `Bearer ${adminJWT}`;
        security.admin(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(admin, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid admin for clinician', (done) => {
        const req = { models };
        const header = `Bearer ${adminJWT}`;
        security.clinician(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(admin, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid admin for participant', (done) => {
        const req = { models };
        const header = `Bearer ${adminJWT}`;
        security.participant(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(admin, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid participant for participant', (done) => {
        const req = { models };
        const header = `Bearer ${participantJWT}`;
        security.participant(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(participant, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid clinician for clinician', (done) => {
        const req = { models };
        const header = `Bearer ${clinicianJWT}`;
        security.clinician(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(clinician, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid admin for self', (done) => {
        const req = { models };
        const header = `Bearer ${adminJWT}`;
        security.self(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(admin, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid participant for self', (done) => {
        const req = { models };
        const header = `Bearer ${participantJWT}`;
        security.self(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(participant, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('valid clinician for self', (done) => {
        const req = { models };
        const header = `Bearer ${clinicianJWT}`;
        security.self(req, undefined, header, (err) => {
            if (err) {
                return done(err);
            }
            const actual = _.pick(req.user, ['id', 'username', 'email', 'role']);
            const expected = _.omit(clinician, 'password');
            expect(actual).to.deep.equal(expected);
            return done();
        });
    });

    it('error: no Bearer', (done) => {
        const req = { models };
        const header = `${adminJWT}`;
        security.admin(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.invalidAuth);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: no token', (done) => {
        const req = { models };
        const header = 'Bearer';
        security.admin(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.invalidAuth);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: no header', (done) => {
        const req = { models };
        const header = '';
        security.admin(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.noAuth);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: invalid token', (done) => {
        const req = { models };
        const header = 'Bearer xxx';
        security.admin(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.invalidAuth);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: invalid user', (done) => {
        const req = { models };
        const header = `Bearer ${deletedJWT}`;
        security.participant(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.invalidUser);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: participant for admin', (done) => {
        const req = { models };
        const header = `Bearer ${participantJWT}`;
        security.admin(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.unauthorizedUser);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: participant for clinician', (done) => {
        const req = { models };
        const header = `Bearer ${participantJWT}`;
        security.clinician(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.unauthorizedUser);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: clinician for admin', (done) => {
        const req = { models };
        const header = `Bearer ${clinicianJWT}`;
        security.admin(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.unauthorizedUser);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });

    it('error: clinician for participant', (done) => {
        const req = { models };
        const header = `Bearer ${clinicianJWT}`;
        security.participant(req, undefined, header, (err) => {
            if (err) {
                expect(err).to.deep.equal(security.unauthorizedUser);
                return done();
            }
            return done(new Error('unexpected no error'));
        });
    });
});
