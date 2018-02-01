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

describe('user consent document/signature integration', function userConsentDocumentIntegration() {
    const userCount = 6;
    const documentCount = 9;

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

    const roles = [null, 'participant', 'clinician'];
    _.range(documentCount).forEach((index) => {
        const options = { role: roles[index % 3] };
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn(options));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });

    _.range(userCount).forEach((index) => {
        const role = index < 3 ? 'participant' : 'clinician';
        it(`create ${role} user ${index}`,
            shared.createUserFn(history.hxUser, null, { role }));
    });

    it('logout as super', shared.logoutFn());

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('error: no consent documents of existing types',
        userTests.errorListUserConsentDocumentsFn(0, 'noSystemConsentDocuments'));
    it('logout as user 0', shared.logoutFn());

    it('login as super', shared.loginFn(config.superUser));

    _.range(documentCount).forEach((index) => {
        it(`create consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`add translated (es) consent document ${index}`,
            tests.translateConsentDocumentFn(index, 'es'));
    });

    it('logout as super', shared.logoutFn());

    const verifyConsentDocuments = (userIndex, expectedIndices, language) => {
        it(`login as user ${userIndex}`, shared.loginIndexFn(history.hxUser, userIndex));

        it(`list consent documents (unsigned) for user ${userIndex}`,
            userTests.listUserConsentDocumentsFn(userIndex, expectedIndices));

        it(`list consent documents (required + signed) for user ${userIndex}`,
            userTests.listSignedUserConsentDocumentsFn(userIndex, { includeSigned: true }));

        it(`list consent documents (role only) for user ${userIndex}`,
            userTests.listSignedUserConsentDocumentsFn(userIndex, { roleOnly: true }));

        if (!language) {
            it(`logout as user ${userIndex}`, shared.logoutFn());
            return;
        }

        it(`list translated consent document list (required) for user ${userIndex}`,
            userTests.listTranslatedUserConsentDocumentsFn(userIndex, expectedIndices, language));

        it(`logout as user ${userIndex}`, shared.logoutFn());
    };

    [0, 1, 2].forEach((index) => {
        verifyConsentDocuments(index, [0, 1, 3, 4, 6, 7], 'es');

        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        [1, 4, 7].forEach((docIndex) => {
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
        });
        it(`logout as user ${index}`, shared.logoutFn());

        verifyConsentDocuments(index, [0, 3, 6], 'es');
    });

    [3, 4, 5].forEach((index) => {
        verifyConsentDocuments(index, [0, 2, 3, 5, 6, 8], 'es');

        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        [2, 5, 8].forEach((docIndex) => {
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
        });
        it(`logout as user ${index}`, shared.logoutFn());

        verifyConsentDocuments(index, [0, 3, 6], 'es');
    });

    it('login as user 0', shared.loginIndexFn(history.hxUser, 0));
    it('user 0 signs consent document of type 0', userTests.signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 3', userTests.signConsentTypeFn(0, 3));
    it('user 0 signs consent document of type 6', userTests.signConsentTypeFn(0, 6));
    it('logout as user 0', shared.logoutFn());
    it('login as user 1', shared.loginIndexFn(history.hxUser, 1));
    it('user 1 signs consent document of type 0', userTests.signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 3', userTests.signConsentTypeFn(1, 3, 'es'));
    it('logout as user 1', shared.logoutFn());
    it('login as user 2', shared.loginIndexFn(history.hxUser, 2));
    it('user 2 signs consent document of type 0', userTests.signConsentTypeFn(2, 0));
    it('logout as user 2', shared.logoutFn());

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [3, 6]);

    it('login as user 3', shared.loginIndexFn(history.hxUser, 3));
    it('user 3 signs consent document of type 0', userTests.signConsentTypeFn(3, 0));
    it('user 3 signs consent document of type 3', userTests.signConsentTypeFn(3, 3));
    it('user 3 signs consent document of type 6', userTests.signConsentTypeFn(3, 6));
    it('logout as user 3', shared.logoutFn());
    it('login as user 4', shared.loginIndexFn(history.hxUser, 4));
    it('user 4 signs consent document of type 0', userTests.signConsentTypeFn(4, 0, 'en'));
    it('user 4 signs consent document of type 3', userTests.signConsentTypeFn(4, 3, 'es'));
    it('logout as user 4', shared.logoutFn());
    it('login as user 5', shared.loginIndexFn(history.hxUser, 5));
    it('user 5 signs consent document of type 0', userTests.signConsentTypeFn(5, 0));
    it('logout as user 5', shared.logoutFn());

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [3, 6]);

    [0, 1, 2].forEach((index) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`update consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it('logout as super', shared.logoutFn());
        it(`get consent document of type ${index}`,
            tests.getConsentDocumentFn(index));
    });

    verifyConsentDocuments(0, [0, 1]);
    verifyConsentDocuments(1, [0, 1, 6]);
    verifyConsentDocuments(2, [0, 1, 3, 6]);

    verifyConsentDocuments(3, [0, 2]);
    verifyConsentDocuments(4, [0, 2, 6]);
    verifyConsentDocuments(5, [0, 2, 3, 6]);

    [0, 1, 2].forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        [0, 1].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [3, 6]);

    [3, 4, 5].forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        [0, 2].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [3, 6]);

    [3, 4, 5].forEach((index) => {
        it('login as super', shared.loginFn(config.superUser));
        it(`update consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it('logout as super', shared.logoutFn());
        it(`get consent document of type ${index}`,
            tests.getConsentDocumentFn(index));
    });

    verifyConsentDocuments(0, [3, 4]);
    verifyConsentDocuments(1, [3, 4, 6]);
    verifyConsentDocuments(2, [3, 4, 6]);

    verifyConsentDocuments(3, [3, 5]);
    verifyConsentDocuments(4, [3, 5, 6]);
    verifyConsentDocuments(5, [3, 5, 6]);

    it('login as super', shared.loginFn(config.superUser));
    [3, 4, 5].forEach((index) => {
        it(`delete consent type ${index}`, typeTests.deleteConsentTypeFn(index));
    });
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [6]);

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [6]);

    it('login as super', shared.loginFn(config.superUser));
    _.range(documentCount, documentCount + 3).forEach((index) => {
        const options = { role: roles[index % 3] };
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn(options));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });
    it('logout as super', shared.logoutFn());

    [0, 3].forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        it(`error: no consent documents of existing types (user ${index})`,
            userTests.errorListUserConsentDocumentsFn(0, 'noSystemConsentDocuments'));
        it(`logout as user ${index}`, shared.logoutFn());
    });

    it('login as super', shared.loginFn(config.superUser));
    _.range(documentCount, documentCount + 3).forEach((index) => {
        it(`create consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`add translated (es) consent document ${index}`,
            tests.translateConsentDocumentFn(index, 'es'));
    });
    it('logout as super', shared.logoutFn());

    verifyConsentDocuments(0, [9, 10]);
    verifyConsentDocuments(1, [6, 9, 10]);
    verifyConsentDocuments(2, [6, 9, 10]);

    verifyConsentDocuments(3, [9, 11]);
    verifyConsentDocuments(4, [6, 9, 11]);
    verifyConsentDocuments(5, [6, 9, 11]);

    [0, 1, 2].forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        [9, 10].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [6]);

    [3, 4, 5].forEach((index) => {
        it(`login as user ${index}`, shared.loginIndexFn(history.hxUser, index));
        [9, 11].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
        it(`logout as user ${index}`, shared.logoutFn());
    });

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [6]);

    it('login as super', shared.loginFn(config.superUser));
    _.range(userCount).forEach((i) => {
        it('verify signatures', userTests.verifySignatureExistenceFn(i));
    });
    it('logout as super', shared.logoutFn());

    it('check ip and browser (user-agent) of signature', function checkIpBrowser() {
        return userConsentDocumentCommon.verifySignatureIpAndUserAgent(documentCount + 3);
    });

    shared.verifyUserAudit();
});
