/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const SharedSpec = require('./util/shared-spec');
const smtpCommon = require('./util/smtp-common');

describe('smtp unit', () => {
    const shared = new SharedSpec();
    const tests = new smtpCommon.SpecTests();

    before(shared.setUpFn());

    it('get null when no smtp server ever specified', tests.checkNullFn());

    it('create smtp server setting without subject/content', tests.createSmtpFn());

    it('get/verify smtp settings', tests.getSmtpFn());

    it('add subject/content', tests.updateSmtpTextFn('en'));

    it('get/verify smtp settings', tests.getSmtpFn());

    it('update smtp server setting with subject/content', tests.createSmtpFn(true));

    it('get/verify smtp settings', tests.getSmtpFn());

    it('get/verify smtp settings in spanish when no translation', tests.getTranslatedSmtpFn('es'));

    it('translate to spanish', tests.translateSmtpFn('es'));

    it('get/verify smtp settings', tests.getSmtpFn());

    it('get/verify smtp settings in explicit english', tests.getSmtpFn(true));

    it('get/verify smtp settings in spanish', tests.getTranslatedSmtpFn('es', true));

    it('update smtp server setting without subject/content', tests.createSmtpFn());

    it('get/verify smtp settings', tests.getSmtpFn());

    it('get/verify smtp settings in spanish', tests.getTranslatedSmtpFn('es', true));

    it('delete smtp server settings', tests.deleteSmtpFn());

    it('get null when smtp server settings deactivated', tests.checkNullFn());

    it('update smtp server setting without subject/content', tests.createSmtpFn());

    it('get/verify smtp settings', tests.getSmtpFn());

    it('add subject/content', tests.updateSmtpTextFn());

    it('get/verify smtp settings', tests.getSmtpFn());

    it('get/verify smtp settings in spanish', tests.getTranslatedSmtpFn('es', true));
});
