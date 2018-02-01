/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const History = require('./util/history');
const consentCommon = require('./util/consent-common');
const ConsentDocumentHistory = require('./util/consent-document-history');

const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');

describe('consent unit', function consentUnit() {
    const userCount = 4;
    const typeCount = 22;

    const consentSpecs = [
        [0, 1, 2, 3, 4],         // consent 0
        [8, 5, 10, 11],          // consent 1
        [2, 3, 6, 7],            // consent 2
        [8, 11, 9],              // consent 3
        [12, 13, 14],            // consent 4, all participant role types
        [17, 18, 19],            // consent 5, all clinician role types
        [15, 16, 20, 21, 0, 5],  // consent 6, mixed roles no roles
    ];

    const generator = new Generator();

    const shared = new SharedSpec(generator);

    const history = new ConsentDocumentHistory(userCount);
    const hxConsent = new History();
    const typeTests = new consentTypeCommon.SpecTests({
        generator, hxConsentType: history.hxType,
    });
    const docTests = new consentDocumentCommon.SpecTests({
        generator, hxConsentDocument: history,
    });
    const tests = new consentCommon.SpecTests({
        hxConsent, history, generator, consentSpecs,
    });

    before(shared.setUpFn());

    _.range(typeCount - 10).forEach((index) => {
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn());
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });

    // 12 - 17 participant types
    _.range(typeCount - 10, typeCount - 5).forEach((index) => {
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn(({ role: 'participant' })));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });

    // 17 - 22 clinician types
    _.range(typeCount - 5, typeCount).forEach((index) => {
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn({ role: 'clinician' }));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });

    _.range(userCount).forEach((index) => {
        const role = index < 2 ? 'participant' : 'clinician';
        it(`create user ${index}`, shared.createUserFn(history.hxUser, { role }));
    });

    consentSpecs.forEach((typeIndices, index) => {
        it(`create consent ${index}`,
            shared.createConsentFn(hxConsent, history, typeIndices));
        it(`get consent ${index}`,
            shared.verifyConsentFn(hxConsent, index));
    });

    _.range(consentSpecs.length).forEach((index) => {
        it(`get consent by name ${index}`,
            tests.getConsentByNameFn(index));
    });

    it('list consents', tests.listConsentsFn());

    it('error: delete consent type when on a consent',
        typeTests.errorDeleteConsentTypeFn(6, 'consentTypeDeleteOnConsent'));

    it('delete consent 2', tests.deleteConsentFn(2));

    it('list consents', tests.listConsentsFn());

    _.range(3).forEach((i) => {
        it(`create/verify consent document of type ${i}`,
            docTests.createConsentDocumentFn(i));
        it(`add translated (es) consent document ${i}`,
            docTests.translateConsentDocumentFn(i, 'es'));
    });

    it('error: get consent 0 documents',
        tests.errorGetConsentFn(0, 'noSystemConsentDocuments'));

    _.range(3, typeCount).forEach((i) => {
        it(`create/verify consent document of type ${i}`,
            docTests.createConsentDocumentFn(i));
        it(`add translated (es) consent document ${i}`,
            docTests.translateConsentDocumentFn(i, 'es'));
    });

    [0, 1, 3, 4, 5, 6].forEach((consentIndex) => {
        it(`list consent ${consentIndex} documents`,
            tests.listConsentDocumentsFn(consentIndex));

        it(`list translated (es) consent ${consentIndex} documents`,
            tests.listTranslatedConsentDocumentsFn(consentIndex));

        it(`list consent ${consentIndex} documents by name`,
            tests.listConsentDocumentsByNameFn(consentIndex));

        it(`list translated (es) consent ${consentIndex} documents by name`,
            tests.listTranslatedConsentDocumentsByNameFn(consentIndex));

        ['participant', 'clinician'].forEach((role) => {
            it(`list consent ${consentIndex} documents (for role ${role})`,
                tests.listConsentDocumentsFn(consentIndex, { role }));
            it(`list consent ${consentIndex} documents (for role ${role} role only)`,
                tests.listConsentDocumentsFn(consentIndex, { role, roleOnly: true }));
        });

        _.range(userCount).forEach((userIndex) => {
            it(`get/verify user consent ${consentIndex} documents`,
                tests.getUserConsentDocumentsFn(userIndex, consentIndex, []));
            it(`get/verify user consent ${consentIndex} documents (role only)`,
                tests.getUserConsentDocumentsFn(userIndex, consentIndex, [], { roleOnly: true }));
            it(`get/verify user consent ${consentIndex} documents by name`,
                tests.getUserConsentDocumentsByNameFn(userIndex, consentIndex, []));
            it(`get/verify translated (es) user consent ${consentIndex} documents`,
                tests.getTranslatedUserConsentDocumentsFn(userIndex, consentIndex, [], 'es'));
            it(`get/verify translated (es) user consent ${consentIndex} documents by name`,
                tests.getTranslatedUserConsentDocumentsByNameFn(userIndex, consentIndex, [], 'es'));
        });
    });

    it('user 0 signs consent 0 (1, 2, 3)', tests.signDocumentsFn(0, 0, [1, 2, 3], 'es'));
    it('user 1 signs consent 1 (5, 10, 11)', tests.signDocumentsFn(1, 1, [5, 10, 11], 'en'));
    it('user 2 signs consent 3 (8, 9, 10)', tests.signDocumentsFn(2, 3, [8, 9, 10]));
    it('user 3 signs consent 0 (0, 2, 3, 4)', tests.signDocumentsFn(3, 0, [0, 2, 3, 4]));


    it('get/verify user 0 consent 0 documents', tests.getUserConsentDocumentsFn(0, 0, [
        [1, 'es'],
        [2, 'es'],
        [3, 'es'],
    ]));
    it('get/verify user 0 consent 0 documents by name', tests.getUserConsentDocumentsByNameFn(0, 0, [
        [1, 'es'],
        [2, 'es'],
        [3, 'es'],
    ]));
    it('get/verify user 1 consent 1 documents', tests.getUserConsentDocumentsFn(1, 1, [5, 10, 11]));
    it('get/verify user 2 consent 3 documents', tests.getUserConsentDocumentsFn(2, 3, [8, 9, 10]));
    it('get/verify user 3 consent 0 documents', tests.getUserConsentDocumentsFn(3, 0, [0, 2, 3, 4]));

    [2, 10, 8, 4].forEach((typeIndex) => {
        it(`create/verify consent document of type ${typeIndex}`, docTests.createConsentDocumentFn(typeIndex));
        it(`add translated (es) consent document ${typeIndex}`, docTests.translateConsentDocumentFn(typeIndex, 'es'));
    });

    it('get/verify user 0 consent 0 documents', tests.getUserConsentDocumentsFn(0, 0, [
            [1, 'es'],
            [3, 'es'],
    ]));
    it('get/verify user 0 consent 0 documents by name', tests.getUserConsentDocumentsByNameFn(0, 0, [
            [1, 'es'],
            [3, 'es'],
    ]));
    it('get/verify user 1 consent 1 documents',
        tests.getUserConsentDocumentsFn(1, 1, [5, 11]));
    it('get/verify user 2 consent 3 documents',
        tests.getUserConsentDocumentsFn(2, 3, [9]));
    it('get/verify user 3 consent 0 documents',
        tests.getUserConsentDocumentsFn(3, 0, [0, 3]));

    it('get/verify translated (es) user 1 consent 1 documents',
        tests.getTranslatedUserConsentDocumentsFn(1, 1, [5, 11], 'es'));
    it('get/verify translated (es) user 2 consent 3 documents',
        tests.getTranslatedUserConsentDocumentsFn(2, 3, [9], 'es'));
    it('get/verify translated (es) user 3 consent 0 documents',
        tests.getTranslatedUserConsentDocumentsFn(3, 0, [0, 3], 'es'));

    it('user 0 signs consent 0 (0, 2)', tests.signDocumentsFn(0, 0, [0, 2], 'en'));
    it('user 1 signs consent 1 (8, 10)', tests.signDocumentsFn(1, 1, [8, 10], 'es'));
    it('user 2 signs consent 3 (8, 11)', tests.signDocumentsFn(2, 3, [8, 11]));
    it('user 3 signs consent 0 (2, 4)', tests.signDocumentsFn(3, 0, [2, 4]));

    it('get/verify user 0 consent 0 documents',
        tests.getUserConsentDocumentsFn(0, 0, [0, [1, 'es'], 2, [3, 'es']]));

    it('get/verify user 1 consent 1 documents',
        tests.getUserConsentDocumentsFn(1, 1, [5, [8, 'es'], [10, 'es'], 11]));

    it('get/verify user 2 consent 3 documents', tests.getUserConsentDocumentsFn(2, 3, [8, 9, 11]));

    it('get/verify user 3 consent 0 documents', tests.getUserConsentDocumentsFn(3, 0, [0, 2, 3, 4]));

    [2, 10].forEach((typeIndex) => {
        it(`create/verify consent document of type ${typeIndex}`,
            docTests.createConsentDocumentFn(typeIndex));
        it(`add translated (es) consent document ${typeIndex}`,
            docTests.translateConsentDocumentFn(typeIndex, 'es'));
    });

    it('update history for type 2', docTests.getUpdateCommentHistoryFn(2));

    it('translated (es) update history for type 2',
        docTests.getTranslatedUpdateCommentHistoryFn(2, 'es'));
});
