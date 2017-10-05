/* global describe,before,it */

'use strict';

/* eslint max-len: 0 */

process.env.NODE_ENV = 'test';

const constNames = require('../models/const-names');

const SharedSpec = require('./util/shared-spec');
const smtpCommon = require('./util/smtp-common');

describe('smtp unit', function smtpUnit() {
    const shared = new SharedSpec();
    const tests = new smtpCommon.SpecTests();

    before(shared.setUpFn());

    const types = constNames.smtpTypes;

    types.forEach((type) => {
        it(`handle smtp ${type} not specified`, tests.checkNullFn(type));
        it(`create smtp ${type}  without subject/content`, tests.createSmtpFn(type));
        it(`get/verify smtp s${type} `, tests.getSmtpFn(type));
        it(`add subject/content to smtp ${type}`, tests.updateSmtpTextFn(type, 'en'));
        it(`get/verify smtp ${type}`, tests.getSmtpFn(type));
        it(`update smtp server ${type} with subject/content`, tests.createSmtpFn(type, true));
        it(`get/verify smtp ${type}`, tests.getSmtpFn(type));
        it(`get/verify smtp ${type} in spanish when no translation`, tests.getTranslatedSmtpFn(type, 'es'));
        it(`translate smtp ${type} to spanish`, tests.translateSmtpFn(type, 'es'));
        it(`get/verify smtp ${type}`, tests.getSmtpFn(type));
        it(`get/verify smtp ${type} in explicit english`, tests.getSmtpFn(type, true));
        it(`get/verify smtp ${type} in spanish`, tests.getTranslatedSmtpFn(type, 'es', true));
        it(`update smtp ${type} without subject/content`, tests.createSmtpFn(type));
        it(`get/verify smtp ${type}`, tests.getSmtpFn(type));
        it(`get/verify smtp ${type} in spanish`, tests.getTranslatedSmtpFn(type, 'es', true));
    });

    types.forEach((type, index) => {
        it(`delete smtp ${type}`, tests.deleteSmtpFn(type));
        it(`get null when smtp ${type} deactivated`, tests.checkNullFn(type));

        if (index < types.length - 1) {
            const nextType = types[index + 1];
            it(`get/verify smtp ${nextType} `, tests.getSmtpFn(nextType));
            it(`get/verify smtp ${nextType}  in spanish`, tests.getTranslatedSmtpFn(nextType, 'es', true));
        }
    });

    types.forEach((type) => {
        it(`update smtp ${type} without subject/content`, tests.createSmtpFn(type));
        it(`get/verify smtp ${type}`, tests.getSmtpFn(type));
        it(`add subject/content to smtp ${type}`, tests.updateSmtpTextFn(type));
        it(`get/verify smtp ${type}`, tests.getSmtpFn(type));
        it(`get/verify smtp ${type} in spanish`, tests.getTranslatedSmtpFn(type, 'es', true));
    });
});
