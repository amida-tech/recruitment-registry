/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const config = require('../config');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');

describe('consent document integration', function consentDocumentIntegration() {
    const userCount = 4;

    const rrSuperTest = new RRSuperTest();
    const generator = new Generator();
    const shared = new SharedIntegration(rrSuperTest, generator);
    const history = new ConsentDocumentHistory(userCount);
    const typeTests = new consentTypeCommon.IntegrationTests(rrSuperTest, {
        generator, hxConsentType: history.hxType,
    });
    const tests = new consentDocumentCommon.IntegrationTests(rrSuperTest, {
        generator, hxConsentDocument: history,
    });

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, typeTests.createConsentTypeFn());
        it(`add translated (es) consent type ${i}`,
            typeTests.translateConsentTypeFn(i, 'es'));
    });

    it('logout as super', shared.logoutFn());

    _.range(2).forEach((i) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`create consent document of type ${i}`, tests.createConsentDocumentFn(i));
        it('logout as super', shared.logoutFn());
        it(`get consent document of type ${i}`,
            tests.getConsentDocumentFn(i));
        it(`get consent document content of type ${i} (type id)`,
            tests.getConsentDocumentByTypeIdFn(i));
        it('login as super', shared.loginFn(config.superUser));
        it(`add translated (es) consent document ${i}`,
            tests.translateConsentDocumentFn(i, 'es'));
        it('logout as super', shared.logoutFn());
        it(`get translated (es) consent document of type ${i}`,
            tests.getTranslatedConsentDocumentFn(i, 'es'));
    });

    it('list consent documents', tests.listConsentDocumentsFn());
    it('list translated (es) consent documents', tests.listConsentDocumentsFn({
        language: 'es',
    }));

    it('login as super', shared.loginFn(config.superUser));
    it('create consent type 2', typeTests.createConsentTypeFn());
    it('create consent document of type 2', tests.createConsentDocumentFn(2));
    it('logout as super', shared.logoutFn());

    it('get consent document of type 2', tests.getConsentDocumentFn(2));

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 1', tests.createConsentDocumentFn(1));
    it('logout as super', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 0', tests.createConsentDocumentFn(0));
    it('logout as super', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 1', tests.createConsentDocumentFn(1));
    it('logout as super', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));
    it('delete consent type 1', typeTests.deleteConsentTypeFn(1));
    it('logout as super', shared.logoutFn());

    it('get consent document of type 0', tests.getConsentDocumentFn(0));
    it('get consent document of type 2', tests.getConsentDocumentFn(2));

    it('list consent documents', tests.listConsentDocumentsFn());
    it('list translated (es) consent documents', tests.listConsentDocumentsFn({
        language: 'es',
    }));

    it('list consent document full history', tests.listConsentDocumentsHistoryFn());

    shared.verifyUserAudit();
});
