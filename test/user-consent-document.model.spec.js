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

describe('user consent document/signature unit', function userConsentDocumentUnit() {
    const userCount = 6;
    const documentCount = 9;

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
            shared.createUserFn(history.hxUser, { role }));
    });

    it('error: no consent documents of existing types',
        userTests.errorListUserConsentDocumentsFn(0, 'noSystemConsentDocuments'));

    _.range(documentCount).forEach((index) => {
        it(`create consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`add translated (es) consent document ${index}`,
            tests.translateConsentDocumentFn(index, 'es'));
    });

    const verifyConsentDocuments = (userIndex, expectedIndices, language) => {
        it(`list consent documents (unsigned) for user ${userIndex}`,
            userTests.listUserConsentDocumentsFn(userIndex, expectedIndices));

        it(`list consent documents (required + signed) for user ${userIndex}`,
            userTests.listSignedUserConsentDocumentsFn(userIndex, { includeSigned: true }));

        it(`list consent documents (role only) for user ${userIndex}`,
            userTests.listSignedUserConsentDocumentsFn(userIndex, { roleOnly: true }));

        if (!language) {
            return;
        }

        it(`list translated consent document list (required) for user ${userIndex}`,
            userTests.listTranslatedUserConsentDocumentsFn(userIndex, expectedIndices, language));
    };

    [0, 1, 2].forEach((index) => {
        verifyConsentDocuments(index, [0, 1, 3, 4, 6, 7], 'es');

        [1, 4, 7].forEach((docIndex) => {
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
        });

        verifyConsentDocuments(index, [0, 3, 6], 'es');
    });

    [3, 4, 5].forEach((index) => {
        verifyConsentDocuments(index, [0, 2, 3, 5, 6, 8], 'es');

        [2, 5, 8].forEach((docIndex) => {
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
            it(`user ${index} get consent document of type ${docIndex}`,
                userTests.getConsentDocumentFn(index, docIndex));
        });

        verifyConsentDocuments(index, [0, 3, 6], 'es');
    });

    it('user 0 signs consent document of type 0', userTests.signConsentTypeFn(0, 0));
    it('user 0 signs consent document of type 3', userTests.signConsentTypeFn(0, 3));
    it('user 0 signs consent document of type 6', userTests.signConsentTypeFn(0, 6));
    it('user 1 signs consent document of type 0', userTests.signConsentTypeFn(1, 0, 'en'));
    it('user 1 signs consent document of type 3', userTests.signConsentTypeFn(1, 3, 'es'));
    it('user 2 signs consent document of type 0', userTests.signConsentTypeFn(2, 0));

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [3, 6]);

    it('user 3 signs consent document of type 0', userTests.signConsentTypeFn(3, 0));
    it('user 3 signs consent document of type 3', userTests.signConsentTypeFn(3, 3));
    it('user 3 signs consent document of type 6', userTests.signConsentTypeFn(3, 6));
    it('user 4 signs consent document of type 0', userTests.signConsentTypeFn(4, 0, 'en'));
    it('user 4 signs consent document of type 3', userTests.signConsentTypeFn(4, 3, 'es'));
    it('user 5 signs consent document of type 0', userTests.signConsentTypeFn(5, 0));

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [3, 6]);

    it('error: invalid user signs already signed consent document of type 0 ',
        userTests.errorSignConsentTypeFn(null, 0));

    it('error: user 0 signs invalid consent document',
        userTests.errorSignConsentTypeFn(0, null));

    [0, 1, 2].forEach((index) => {
        it(`update consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
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
        [0, 1].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
    });

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [3, 6]);

    [3, 4, 5].forEach((index) => {
        [0, 2].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
    });

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [3, 6]);

    [3, 4, 5].forEach((index) => {
        it(`update consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`get consent document of type ${index}`,
            tests.getConsentDocumentFn(index));
    });

    verifyConsentDocuments(0, [3, 4]);
    verifyConsentDocuments(1, [3, 4, 6]);
    verifyConsentDocuments(2, [3, 4, 6]);

    verifyConsentDocuments(3, [3, 5]);
    verifyConsentDocuments(4, [3, 5, 6]);
    verifyConsentDocuments(5, [3, 5, 6]);

    [3, 4, 5].forEach((index) => {
        it(`delete consent type ${index}`, typeTests.deleteConsentTypeFn(index));
    });

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [6]);

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [6]);

    _.range(documentCount, documentCount + 3).forEach((index) => {
        const options = { role: roles[index % 3] };
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn(options));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });

    [0, 3].forEach((index) => {
        it(`error: no consent document of existing types (user ${index})`,
            userTests.errorListUserConsentDocumentsFn(index, 'noSystemConsentDocuments'));
    });

    _.range(documentCount, documentCount + 3).forEach((index) => {
        it(`create consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`add translated (es) consent document ${index}`,
            tests.translateConsentDocumentFn(index, 'es'));
    });

    verifyConsentDocuments(0, [9, 10]);
    verifyConsentDocuments(1, [6, 9, 10]);
    verifyConsentDocuments(2, [6, 9, 10]);

    verifyConsentDocuments(3, [9, 11]);
    verifyConsentDocuments(4, [6, 9, 11]);
    verifyConsentDocuments(5, [6, 9, 11]);

    [0, 1, 2].forEach((index) => {
        [9, 10].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
    });

    verifyConsentDocuments(0, []);
    verifyConsentDocuments(1, [6]);
    verifyConsentDocuments(2, [6]);

    [3, 4, 5].forEach((index) => {
        [9, 11].forEach((docIndex) => {
            it(`user ${index} signs consent document of type ${docIndex}`,
                userTests.signConsentTypeFn(index, docIndex));
        });
    });

    verifyConsentDocuments(3, []);
    verifyConsentDocuments(4, [6]);
    verifyConsentDocuments(5, [6]);

    _.range(userCount).forEach((index) => {
        it(`verify all signings still exists for user ${index}`,
            userTests.verifySignatureExistenceFn(index));
    });
});
