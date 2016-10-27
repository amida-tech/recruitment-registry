/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const config = require('../../config');

const SharedIntegration = require('../util/shared-integration');
const Generator = require('../util/entity-generator');
const History = require('../util/entity-history');
const consentSeed = require('../util/consent-seed');
const consentExample = require('../fixtures/example/consent-demo');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('consent unit', function () {
    const store = {
        server: null,
        auth: null
    };
    const hxUser = new History();

    before(shared.setUpFn(store));

    it('create Terms of Use and Consent Form records', function () {
        return consentSeed(consentExample);
    });

    let termsOfUse;

    it('get Terms of Use before registration', function (done) {
        store.server
            .get('/api/v1.0/consents/name/terms-of-use/documents')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                const result = res.body;
                expect(result.name).to.equal('terms-of-use');
                termsOfUse = res.body;
                //console.log(res.body);
                done();
            });

    });

    it('login as super', shared.loginFn(store, config.superUser));

    const user = generator.newUser();
    it('create a user', shared.createUserFn(store, hxUser, user));

    it('logout as super', shared.logoutFn(store));

    it('login as user', shared.loginFn(store, user));

    it('sign the Terms of Use document', function (done) {
        store.server
            .post(`/api/v1.0/consent-signatures`)
            .set('Authorization', store.auth)
            .send({ consentDocumentId: termsOfUse.sections[0].id })
            .expect(201)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
    });

    it('get the Terms of Use document with signature', function (done) {
        store.server
            .get(`/api/v1.0/consents/name/terms-of-use/user-documents`)
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                expect(res.body.name).to.equal('terms-of-use');
                expect(res.body.sections[0].signature).to.equal(true);
                //console.log(res.body);
                done();
            });
    });

    let consents;

    it('get the Consents document', function (done) {
        store.server
            .get(`/api/v1.0/consents/name/consent/user-documents`)
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                consents = res.body;
                expect(res.body.name).to.equal('consent');
                expect(res.body.sections[0].signature).to.equal(false);
                //console.log(res.body);
                done();
            });
    });

    it('sign the Consents document', function (done) {
        store.server
            .post(`/api/v1.0/consent-signatures`)
            .set('Authorization', store.auth)
            .send({ consentDocumentId: consents.sections[0].id })
            .expect(201)
            .end(function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
    });

    it('get the Consents document', function (done) {
        store.server
            .get(`/api/v1.0/consents/name/consent/user-documents`)
            .set('Authorization', store.auth)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    return done(err);
                }
                consents = res.body;
                expect(res.body.name).to.equal('consent');
                expect(res.body.sections[0].signature).to.equal(true);
                //console.log(res.body);
                done();
            });
    });

    it('logout as user', shared.logoutFn(store));
});
