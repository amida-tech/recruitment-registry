/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');

const constNames = require('../models/const-names');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const History = require('./util/history');
const consentTypeCommon = require('./util/consent-type-common');

describe('consent unit', function consentTypeUnit() {
    const count = 12;

    const generator = new Generator();
    const shared = new SharedSpec(generator);

    const hxConsentType = new History();
    const tests = new consentTypeCommon.SpecTests({ generator, hxConsentType });

    before(shared.setUpFn());

    const roles = [null, ...constNames.consentRoles];
    _.range(count).forEach((index) => {
        const options = { role: roles[index % 3] };
        it(`create consent type ${index}`, tests.createConsentTypeFn(options));
        it(`get consent type ${index}`, tests.getConsentTypeFn(index));
    });

    it('list consent types', tests.listConsentTypesFn());

    it('get consent type 3 in spanish when no translation',
        tests.getTranslatedConsentTypeFn(3, 'es'));

    it('list consent types in spanish when no translation',
        tests.listTranslatedConsentTypesFn('es'));

    _.range(count).forEach((index) => {
        it(`add translated (es) consent type ${index}`,
            tests.translateConsentTypeFn(index, 'es'));
        it(`get translated consent type ${index}`,
            tests.getTranslatedConsentTypeFn(index, 'es'));
    });

    it('list translated (es) consent types', tests.listTranslatedConsentTypesFn('es'));

    _.range(0, count, 2).forEach((index) => {
        it(`add translated (fr) consent type ${index}`,
            tests.translateConsentTypeFn(index, 'fr'));
        it(`get translated (fr) consent type ${index}`,
            tests.getTranslatedConsentTypeFn(index, 'fr'));
    });

    it('list translated (fr) consent types', tests.listTranslatedConsentTypesFn('fr'));

    it('list consent types in english (original)', tests.listTranslatedConsentTypesFn('en'));

    [2, 4, 7].forEach((index) => {
        it(`delete consent type ${index}`, tests.deleteConsentTypeFn(index));
    });

    it('list consent types', tests.listConsentTypesFn());

    _.range(2).forEach((index) => {
        it(`create consent type ${index}`, tests.createConsentTypeFn());
        it(`get consent type ${index}`, tests.getConsentTypeFn(index));
    });

    it('list consent types', tests.listConsentTypesFn());
    it('list translated (es) consent types', tests.listTranslatedConsentTypesFn('es'));
    it('list translated (fr) consent types', tests.listTranslatedConsentTypesFn('fr'));

    [1, 1, 1, 12, 12, 12].forEach((index, roleIndex) => {
        const role = roles[roleIndex % 3];
        const options = { role };
        it(`put consent type ${index} (role: ${role})`, tests.putConsentTypeFn(index, options));
        it(`get consent type ${index}`, tests.getConsentTypeFn(index));
    });

    [0, 0, 0, 13, 13, 13].forEach((index, roleIndex) => {
        const role = roles[roleIndex % 3];
        const options = { role, language: 'es' };
        it(`put translated (es) consent type ${index} (role: ${role})`,
            tests.putConsentTypeFn(index, options));
        it(`get translated consent type ${index}`,
            tests.getTranslatedConsentTypeFn(index, 'es'));
    });
});
