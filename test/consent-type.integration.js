/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const config = require('../config');
const History = require('./util/history');

const expect = chai.expect;

describe('consent section integration', () => {
    const typeCount = 12;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);

    const hxType = new History();

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    const createConsentTypeFn = function () {
        return function createConsentType(done) {
            const cst = generator.newConsentType();
            rrSuperTest.post('/consent-types', cst, 201)
                .expect((res) => {
                    hxType.pushWithId(cst, res.body.id);
                })
                .end(done);
        };
    };

    const getConsentTypeFn = function (index) {
        return function getConsentType(done) {
            const consentType = hxType.server(index);
            rrSuperTest.get(`/consent-types/${consentType.id}`, true, 200)
                .expect((res) => {
                    expect(res.body).to.deep.equal(consentType);
                })
                .end(done);
        };
    };

    const listConsentTypesFn = function () {
        return function listConsentTypes(done) {
            rrSuperTest.get('/consent-types', true, 200)
                .expect((res) => {
                    const expected = hxType.listServers();
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    _.range(typeCount).forEach((i) => {
        it(`create consent type ${i}`, createConsentTypeFn(hxType));
        it(`get and verify consent type ${i}`, getConsentTypeFn(i));
    });

    it('list consent types and verify', listConsentTypesFn());

    const getTranslatedConsentTypeFn = function (index, language) {
        return function getTranslatedConsentType(done) {
            const id = hxType.id(index);
            rrSuperTest.get(`/consent-types/${id}`, true, 200, { language })
                .expect((res) => {
                    const expected = hxType.translatedServer(index, language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    const listTranslatedConsentTypesFn = function (language) {
        return function listTranslatedConsentTypes(done) {
            rrSuperTest.get('/consent-types', true, 200, { language })
                .expect((res) => {
                    const expected = hxType.listTranslatedServers(language);
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('get consent type 3 in spanish when no name translation', getTranslatedConsentTypeFn(3, 'es'));

    it('list consent types in spanish when no translation', listTranslatedConsentTypesFn('es'));

    _.range(typeCount).forEach((i) => {
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(i, 'es', hxType));
        it(`get and verify tanslated consent type ${i}`, getTranslatedConsentTypeFn(i, 'es'));
    });

    it('list and verify translated (es) consent types', listTranslatedConsentTypesFn('es'));

    _.range(0, typeCount, 2).forEach((i) => {
        it(`add translated (fr) consent type ${i}`, shared.translateConsentTypeFn(i, 'fr', hxType));
        it(`get and verify tanslated (fr) consent type ${i}`, getTranslatedConsentTypeFn(i, 'fr'));
    });

    it('list and verify translated (fr) consent types', listTranslatedConsentTypesFn('fr'));

    it('list consent types in english (original)', listTranslatedConsentTypesFn('en'));

    it('logout as super', shared.logoutFn());

    shared.verifyUserAudit();
});
