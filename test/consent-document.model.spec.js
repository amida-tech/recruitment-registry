/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const ConsentDocumentHistory = require('./util/consent-document-history');
const consentTypeCommon = require('./util/consent-type-common');
const consentDocumentCommon = require('./util/consent-document-common');

describe('consent document unit', function consentDocumentUnit() {
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

    before(shared.setUpFn());

    _.range(2).forEach((i) => {
        it(`create consent type ${i}`, typeTests.createConsentTypeFn());
        it(`add translated (es) consent type ${i}`, typeTests.translateConsentTypeFn(i, 'es'));
    });

    _.range(2).forEach((i) => {
        it(`create consent document of type ${i}`, tests.createConsentDocumentFn(i));
        it(`get consent document of type ${i}`, tests.getConsentDocumentFn(i));
        it(`get consent document of type ${i} (type id)`, tests.getConsentDocumentByTypeIdFn(i));
        it(`add translated (es) consent document ${i}`, tests.translateConsentDocumentFn(i, 'es'));
        it(`get translated (es) consent document of type ${i}`,
            tests.getTranslatedConsentDocumentFn(i, 'es'));
    });

    it('list consent documents', tests.listConsentDocumentsFn());
    it('list translated (es) consent documents', tests.listConsentDocumentsFn({
        language: 'es',
    }));

    it('error: no consent documents with type id',
        tests.errorGetConsentDocumentByTypeIdFn(99999, 'consentTypeNotFound'));

    it('add consent type 2', typeTests.createConsentTypeFn());
    it('create consent document of type 2', tests.createConsentDocumentFn(2));
    it('get consent document of type 2', tests.getConsentDocumentFn(2));

    it('delete consent type 1', typeTests.deleteConsentTypeFn(1));
    it('list consent types', typeTests.listConsentTypesFn());

    it('get consent document of type 0', tests.getConsentDocumentFn(0));
    it('get consent document of type 2', tests.getConsentDocumentFn(2));

    it('list consent documents', tests.listConsentDocumentsFn());
    it('list translated (es) consent documents', tests.listConsentDocumentsFn({
        language: 'es',
    }));

    it('list consent document full history', tests.listConsentDocumentsHistoryFn());
});
