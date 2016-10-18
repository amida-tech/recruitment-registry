/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');

const SharedSpec = require('./util/shared-spec');
const Generator = require('./util/entity-generator');
const History = require('./util/entity-history');
const models = require('../models');

const expect = chai.expect;
const generator = new Generator();

const shared = new SharedSpec(generator);
const ConsentType = models.ConsentType;

describe('consent unit', function () {
    const typeCount = 12;

    const hxType = new History();

    before(shared.setUpFn());

    const createConsentTypeFn = function () {
        return function () {
            const cst = generator.newConsentType();
            return models.ConsentType.createConsentType(cst)
                .then(server => hxType.pushWithId(cst, server.id));
        };
    };

    const getConsentTypeFn = function (index) {
        return function () {
            const consentType = hxType.server(index);
            return ConsentType.getConsentType(consentType.id)
                .then(result => {
                    expect(result).to.deep.equal(consentType);
                });
        };
    };

    const listConsentTypesFn = function () {
        return function () {
            return ConsentType.listConsentTypes()
                .then(result => {
                    const expected = hxType.listServers();
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    for (let i = 0; i < typeCount; ++i) {
        it(`create consent type ${i}`, createConsentTypeFn(hxType));
        it(`get and verify consent type ${i}`, getConsentTypeFn(i));
    }

    it('list consent types and verify', listConsentTypesFn());

    const getTranslatedConsentTypeFn = function (index, language) {
        return function () {
            const id = hxType.id(index);
            return ConsentType.getConsentType(id, { language })
                .then(result => {
                    const expected = hxType.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const listTranslatedConsentTypesFn = function (language) {
        return function () {
            return ConsentType.listConsentTypes({ language })
                .then(result => {
                    const expected = hxType.listTranslatedServers(language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('get consent type 3 in spanish when no name translation', getTranslatedConsentTypeFn(3, 'es'));

    it('list consent types in spanish when no translation', listTranslatedConsentTypesFn('es'));

    for (let i = 0; i < typeCount; ++i) {
        it(`add translated (es) consent type ${i}`, shared.translateConsentTypeFn(i, 'es', hxType));
        it(`get and verify tanslated consent type ${i}`, getTranslatedConsentTypeFn(i, 'es'));
    }

    it('list and verify translated (es) consent types', listTranslatedConsentTypesFn('es'));

    for (let i = 0; i < typeCount; i += 2) {
        it(`add translated (fr) consent type ${i}`, shared.translateConsentTypeFn(i, 'fr', hxType));
        it(`get and verify tanslated (fr) consent type ${i}`, getTranslatedConsentTypeFn(i, 'fr'));
    }

    it('list and verify translated (fr) consent types', listTranslatedConsentTypesFn('fr'));

    it('list consent types in english (original)', listTranslatedConsentTypesFn('en'));
});
