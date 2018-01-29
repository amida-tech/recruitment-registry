/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');
const userConsentDocumentCommon = require('./util/user-consent-document-common');

describe('consent document/signature unit', function consentDocumentUnit() {
    const userCount = 4;

    const generator = new Generator();
    const shared = new SharedSpec(generator);

    const history = new ConsentDocumentHistory(userCount);
    const typeTests = new consentTypeCommon.SpecTests({
        generator, hxConsentType: history.hxType,
    });
    const tests = new consentDocumentCommon.SpecTests({
        generator, hxConsentDocument: history,
    });
    const userTests = new userConsentDocumentCommon.SpecTests({
        hxConsentDocument: history,
    });

    before(shared.setUpFn());

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, typeTests.createConsentTypeFn());
        it(`add translated (es) consent type ${i}`, typeTests.translateConsentTypeFn(i, 'es'));
    });

    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(history.hxUser));
    });

    it('error: no consent documents of existing types',
        userTests.errorListUserConsentDocumentsFn(0, 'noSystemConsentDocuments'));

    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, tests.createConsentDocumentFn(i));
        it(`get consent document of type ${i}`, tests.getConsentDocumentFn(i));
        it(`get consent document of type ${i} (type name)`, tests.getConsentDocumentByTypeIdFn(i));
        it(`add translated (es) consent document ${i}`, tests.translateConsentDocumentFn(i, 'es'));
        it(`verify translated (es) consent document of type ${i}`,
            tests.getTranslatedConsentDocumentFn(i, 'es'));
    });

    it('error: no consent documents with type name',
        tests.errorGetConsentDocumentByTypeIdFn(99999, 'consentTypeNotFound'));

    const verifyConsentDocuments = function (userIndex, expectedIndices) {
        it(`list consent documents (required) for user ${userIndex}`,
            userTests.listUserConsentDocumentsFn(userIndex, expectedIndices));

        it(`get consent documents (required) for user ${userIndex}`,
            tests.listConsentDocumentsFn(expectedIndices));

        it(`list consent documents (all) for user ${userIndex}`,
            userTests.listSignedUserConsentDocumentsFn(userIndex, expectedIndices));
    };

    const verifyTranslatedConsentDocuments = function (userIndex, expectedIndices, language) {
        it(`verify translated consent document list (required) for user ${userIndex}`,
            userTests.listTranslatedUserConsentDocumentsFn(userIndex, expectedIndices, language));

        it(`verify translated consent documents (required) for user ${userIndex}`,
            tests.listTranslatedConsentDocumentsFn(expectedIndices, language));
    };

    _.range(4).forEach((i) => {
        verifyConsentDocuments(i, [0, 1]);
        verifyTranslatedConsentDocuments(i, [0, 1], 'es');
    });

    it('user 0 signs consent document of type 0', userTests.signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 1', userTests.signConsentTypeFn(0, 1));
    it('user 1 signs consent document of type 0', userTests.signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 1', userTests.signConsentTypeFn(1, 1, 'es'));
    it('user 2 signs consent document of type 0', userTests.signConsentTypeFn(2, 0));
    it('user 3 signs consent document of type 1', userTests.signConsentTypeFn(3, 1));

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, []);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0]);

    it('error: invalid user signs already signed consent document of type 0 ',
        userTests.errorSignConsentTypeFn(null, 0));

    it('error: user 0 signs invalid consent document',
        userTests.errorSignConsentTypeFn(0, null));

    it('add consent type 2', typeTests.createConsentTypeFn());

    it('error: no consent document of existing types',
        userTests.errorListUserConsentDocumentsFn(2, 'noSystemConsentDocuments'));

    it('create consent document of type 2', tests.createConsentDocumentFn(2));
    it('get consent document of type 2)', tests.getConsentDocumentFn(2));

    verifyConsentDocuments(0, [2]);
    verifyConsentDocuments(1, [2]);
    verifyConsentDocuments(2, [1, 2]);
    verifyConsentDocuments(3, [0, 2]);

    it('user 2 signs consent document of type 2', userTests.signConsentTypeFn(2, 2, 'en'));
    verifyConsentDocuments(2, [1]);

    it('create consent document of type 1', tests.createConsentDocumentFn(1));
    it('get consent document of type 1', tests.getConsentDocumentFn(1));

    verifyConsentDocuments(0, [1, 2]);
    verifyConsentDocuments(1, [1, 2]);
    verifyConsentDocuments(2, [1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    it('user 1 signs consent document of type 2', userTests.signConsentTypeFn(1, 2, 'es'));
    verifyConsentDocuments(1, [1]);

    it('create consent document of type 0', tests.createConsentDocumentFn(0));
    it('get consent document of type 0)', tests.getConsentDocumentFn(0));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    it('user 2 signs consent document of type 1', userTests.signConsentTypeFn(2, 1));
    it('user 3 signs consent document of type 1', userTests.signConsentTypeFn(3, 1));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    it('create consent document of type 1', tests.createConsentDocumentFn(1));
    it('get consent document of type 1)', tests.getConsentDocumentFn(1));

    verifyConsentDocuments(0, [0, 1, 2]);
    verifyConsentDocuments(1, [0, 1]);
    verifyConsentDocuments(2, [0, 1]);
    verifyConsentDocuments(3, [0, 1, 2]);

    it('user 0 signs consent document of type 1', userTests.signConsentTypeFn(0, 1));
    verifyConsentDocuments(0, [0, 2]);
    it('user 0 signs consent document of type 2', userTests.signConsentTypeFn(0, 2, 'en'));
    verifyConsentDocuments(0, [0]);
    it('user 0 signs consent document of type 0', userTests.signConsentTypeFn(0, 0, 'es'));
    verifyConsentDocuments(0, []);

    it('delete consent type 1', typeTests.deleteConsentTypeFn(1));
    it('list consent types', typeTests.listConsentTypesFn());

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [0]);
    verifyConsentDocuments(2, [0]);
    verifyConsentDocuments(3, [0, 2]);

    _.range(userCount).forEach((i) => {
        it(`verify all signings still exists for user ${i}`,
            userTests.verifySignatureExistenceFn(i));
    });

    it('verify all consent documents still exists', tests.listAllConsentDocumentsFn());

    it('verify all consent documents still exists', tests.listConsentDocumentsSummaryFn([0, 2]));
});
