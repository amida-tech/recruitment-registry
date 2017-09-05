/* global describe,before,it*/

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/generator');
const History = require('./util/history');
const models = require('../models');

const expect = chai.expect;
const generator = new Generator();

const shared = new SharedSpec(generator);

describe('consent unit', () => {
    const typeCount = 12;

    const hxType = new History();

    before(shared.setUpFn());

    const createConsentTypeFn = function () {
        return function createConsentType() {
            const cst = generator.newConsentType();
            return models.consentType.createConsentType(cst)
                .then(server => hxType.pushWithId(cst, server.id));
        };
    };

    const getConsentTypeFn = function (index) {
        return function getConsentType() {
            const consentType = hxType.server(index);
            return models.consentType.getConsentType(consentType.id)
                .then((result) => {
                    expect(result).to.deep.equal(consentType);
                });
        };
    };

    const listConsentTypesFn = function () {
        return function listConsentTypes() {
            return models.consentType.listConsentTypes()
                .then((result) => {
                    const expected = hxType.listServers();
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    _.range(typeCount).forEach((i) => {
        it(`create consent type ${i}`, createConsentTypeFn(hxType));
        it(`get and verify consent type ${i}`, getConsentTypeFn(i));
    });

    it('list consent types and verify', listConsentTypesFn());

    const getTranslatedConsentTypeFn = function (index, language) {
        return function getTranslatedConsentType() {
            const id = hxType.id(index);
            return models.consentType.getConsentType(id, { language })
                .then((result) => {
                    const expected = hxType.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const listTranslatedConsentTypesFn = function (language) {
        return function listTranslatedConsentTypes() {
            return models.consentType.listConsentTypes({ language })
                .then((result) => {
                    const expected = hxType.listTranslatedServers(language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('get consent type 3 in spanish when no name translation', getTranslatedConsentTypeFn(3, 'es'));

    it('list consent types in spanish when no translation', listTranslatedConsentTypesFn('es'));

    _.range(typeCount).forEach((i) => {
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(i, 'es', hxType));
        it(`get and verify tanslated consent type ${i}`, getTranslatedConsentTypeFn(i, 'es'));
    });

    it('list and verify translated (es) consent types', listTranslatedConsentTypesFn('es'));

    _.range(0, typeCount, 2).forEach((i) => {
        it(`add translated (fr) consent type ${i}`, shared.translateConsentTypeFn(i, 'fr', hxType));
        it(`get and verify tanslated (fr) consent type ${i}`, getTranslatedConsentTypeFn(i, 'fr'));
    });

    it('list and verify translated (fr) consent types', listTranslatedConsentTypesFn('fr'));

    it('list consent types in english (original)', listTranslatedConsentTypesFn('en'));
});
