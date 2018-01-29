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
const userConsentDocumentCommon = require('./util/user-consent-document-common');

describe('consent document/signature integration', function consentDocumentIntegration() {
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
    const userTests = new userConsentDocumentCommon.IntegrationTests(rrSuperTest, {
        hxConsentDocument: history,
    });

    before(shared.setUpFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, typeTests.createConsentTypeFn());
        it(`add translated (es) consent type ${i}`, typeTests.translateConsentTypeFn(i, 'es'));
    });

    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(history.hxUser));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('error: no consent documents of existing types',
        userTests.errorListUserConsentDocumentsFn(0, 'noSystemConsentDocuments'));
    it('logout as user 0', shared.logoutFn());

    _.range(2).forEach((i) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`create consent document of type ${i}`, tests.createConsentDocumentFn(i));
        it('logout as super', shared.logoutFn());
        it(`get/verify consent document content of type ${i}`,
            tests.getConsentDocumentFn(i));
        it(`get/verify consent document content of type ${i} (type id)`,
            tests.getConsentDocumentByTypeIdFn(i));
        it('login as super', shared.loginFn(config.superUser));
        it(`add translated (es) consent document ${i}`,
            tests.translateConsentDocumentFn(i, 'es'));
        it('logout as super', shared.logoutFn());
        it(`verify translated (es) consent document of type ${i}`,
            tests.getTranslatedConsentDocumentFn(i, 'es'));
    });

    it('logout as super', shared.logoutFn());

    _.range(4).forEach((i) => {
        it(`login as user ${i}`, shared.loginIndexFn(history.hxUser, i));
        it(`verify consent documents required for user ${i}`,
            userTests.listUserConsentDocumentsFn(i, [0, 1]));
        it(`verify translated consent documents required for user ${i}`,
            userTests.listTranslatedUserConsentDocumentsFn(i, [0, 1], 'es'));
        it(`logout as user ${i}`, shared.logoutFn());
        it(`user ${i} get consent document of type 0`, tests.getConsentDocumentFn(0));
        it(`user ${i} get consent document of type 1`, tests.getConsentDocumentFn(1));
        it(`user ${i} get translated (es) consent document of type 0`,
            tests.getTranslatedConsentDocumentFn(0, 'es'));
        it(`user ${i} get translated (es) consent document of type 1`,
            tests.getTranslatedConsentDocumentFn(1, 'es'));
    });

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('user 0 signs consent document of type 0', userTests.signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 1', userTests.signConsentTypeFn(0, 1));
    it('logout as user 0', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('user 0 signs consent document of type again 0', userTests.errorSignConsentTypeFn(0, 0));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(history.hxUser, 1));
    it('user 1 signs consent document of type 0', userTests.signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 1', userTests.signConsentTypeFn(1, 1, 'es'));
    it('logout as user 1', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(history.hxUser, 2));
    it('user 2 signs consent document of type 1', userTests.signConsentTypeFn(2, 0));
    it('logout as user 2', shared.logoutFn());

    it('login as user 3', shared.loginIndexFn(history.hxUser, 3));
    it('user 3 signs consent document of type 0', userTests.signConsentTypeFn(3, 1));
    it('logout as user 3', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('verify consent documents required for user 0',
        userTests.listUserConsentDocumentsFn(0, []));
    it('logout as user 0', shared.logoutFn());

    it('login as user 1', shared.loginIndexFn(history.hxUser, 1));
    it('verify consent documents required for user 1',
        userTests.listUserConsentDocumentsFn(1, []));
    it('logout as user 1', shared.logoutFn());

    it('login as user 2', shared.loginIndexFn(history.hxUser, 2));
    it('verify consent documents required for user 2',
        userTests.listUserConsentDocumentsFn(2, [1]));
    it('logout as user 2', shared.logoutFn());
    it('user 2 get consent document of 1', tests.getConsentDocumentFn(1));

    it('login as user 3', shared.loginIndexFn(history.hxUser, 3));
    it('verify consent documents required for user 3',
        userTests.listUserConsentDocumentsFn(3, [0]));
    it('logout as user 3', shared.logoutFn());
    it('user 3 get consent document of 0', tests.getConsentDocumentFn(0));

    it('login as super', shared.loginFn(config.superUser));
    it('add a new consent type', typeTests.createConsentTypeFn());

    it('create/verify consent document of type 2', tests.createConsentDocumentFn(2));
    it('logout as super', shared.logoutFn());

    const signConsentType = ((userIndex, consentDocumentIndex, language) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(history.hxUser, userIndex));
        it(`user ${userIndex} signs consent document of type ${consentDocumentIndex}`,
            userTests.signConsentTypeFn(userIndex, consentDocumentIndex, language));
        it(`logout as user ${userIndex}`, shared.logoutFn());
    });

    const verifyConsentDocuments = ((userIndex, consentDocumentIndices) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(history.hxUser, userIndex));
        it(`verify consent documents list (required) for user ${userIndex}`,
            userTests.listUserConsentDocumentsFn(userIndex, consentDocumentIndices));
        it(`verify consent documents list (all) for user ${userIndex}`,
            userTests.listSignedUserConsentDocumentsFn(userIndex));
        it(`logout as user ${userIndex}`, shared.logoutFn());
        _.range(consentDocumentIndices.length).forEach((i) => {
            it(`user ${userIndex} get consent document of ${i}`,
                tests.getConsentDocumentFn(consentDocumentIndices[i]));
        });
    });

    verifyConsentDocuments(0, [2]);
    verifyConsentDocuments(1, [2]);
    verifyConsentDocuments(2, [1, 2]);
    verifyConsentDocuments(3, [0, 2]);

    signConsentType(2, 2, 'en');

    verifyConsentDocuments(2, [1]);

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 1', tests.createConsentDocumentFn(1));
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, [1, 2]);
    verifyConsentDocuments(1, [1, 2]);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(1, 2, 'es');
    verifyConsentDocuments(1, [1]);

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 0', tests.createConsentDocumentFn(0));
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(2, 1);
    signConsentType(3, 1);

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    it('login as super', shared.loginFn(config.superUser));
    it('create consent document of type 1', tests.createConsentDocumentFn(1));
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    signConsentType(0, 1, 'en');
    verifyConsentDocuments(0, [0, 2]);
    signConsentType(0, 2, 'es');
    verifyConsentDocuments(0, [0]);
    signConsentType(0, 0);
    verifyConsentDocuments(0, []);

    it('login as super', shared.loginFn(config.superUser));
    it('delete consent type 1', typeTests.deleteConsentTypeFn(1));
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [0]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    it('login as super', shared.loginFn(config.superUser));
    _.range(userCount).forEach((i) => {
        it('verify signatures', userTests.verifySignatureExistenceFn(i));
    });
    it('logout as super', shared.logoutFn());

    it('check ip and browser (user-agent) of signature',
        userConsentDocumentCommon.verifySignatureIpAndUserAgent);

    shared.verifyUserAudit();
});
