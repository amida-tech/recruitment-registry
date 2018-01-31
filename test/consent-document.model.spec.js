/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const constNames = require('../models/const-names');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');

describe('consent document unit', function consentDocumentUnit() {
    const userCount = 4;
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

    before(shared.setUpFn());

    const roles = [null, ...constNames.consentRoles];
    _.range(documentCount).forEach((index) => {
        const options = { role: roles[index % 3] };
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn(options));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
    });

    _.range(documentCount).forEach((index) => {
        it(`create consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`get consent document of type ${index}`,
            tests.getConsentDocumentFn(index));
        it(`get consent document of type ${index} (type id)`,
            tests.getConsentDocumentByTypeIdFn(index));
        it(`add translated (es) consent document ${index}`,
            tests.translateConsentDocumentFn(index, 'es'));
        it(`get translated (es) consent document of type ${index}`,
            tests.getTranslatedConsentDocumentFn(index, 'es'));
    });

    const listConsentDocuments = () => {
        it('list consent documents', tests.listConsentDocumentsFn());
        it('list translated (es) consent documents', tests.listConsentDocumentsFn({
            language: 'es',
        }));
        it('list consent documents (with content)',
            tests.listConsentDocumentsFn({ detailed: true }));

        constNames.consentRoles.forEach((role) => {
            it(`list consent documents (for role ${role})`,
                tests.listConsentDocumentsFn({ role }));
            it(`list consent documents (for role ${role}) role only`,
                tests.listConsentDocumentsFn({ role, roleOnly: true }));
        });
    };

    listConsentDocuments();

    it('error: get consent document of invalid type id',
        tests.errorGetConsentDocumentByTypeIdFn(99999, 'consentTypeNotFound'));

    [0, 3, 5, 7].forEach((index) => {
        it(`update consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`get consent document of type ${index}`,
            tests.getConsentDocumentFn(index));
    });

    listConsentDocuments();

    [1, 5].forEach((index) => {
        it(`delete consent type ${index}`, typeTests.deleteConsentTypeFn(index));
    });
    it('list consent types', typeTests.listConsentTypesFn());

    listConsentDocuments();

    _.range(documentCount, documentCount + 3).forEach((index) => {
        const options = { role: roles[index % 3] };
        it(`create consent type ${index}`,
            typeTests.createConsentTypeFn(options));
        it(`add translated (es) consent type ${index}`,
            typeTests.translateConsentTypeFn(index, 'es'));
        it(`create consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
    });

    listConsentDocuments();

    [0, 6, 7, 8].forEach((index) => {
        it(`update consent document of type ${index}`,
            tests.createConsentDocumentFn(index));
        it(`get consent document of type ${index}`,
            tests.getConsentDocumentFn(index));
    });

    listConsentDocuments();

    it('list consent document full history', tests.listConsentDocumentsHistoryFn());
});
