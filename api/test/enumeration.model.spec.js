/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const translator = require('./util/translator');
const enumerationCommon = require('./util/enumeration-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('enumeration unit', function () {
    before(shared.setUpFn());

    const hxEnumeration = new History();
    const tests = new enumerationCommon.SpecTests(generator, hxEnumeration);

    it('list all enums when none', function () {
        return models.enumeration.listEnumerations()
            .then(enumerations => {
                expect(enumerations).to.have.length(0);
            });
    });

    _.range(8).forEach(index => {
        it(`create enumeration ${index}`, tests.createEnumerationFn());
        it(`get enumeration ${index}`, tests.getEnumerationFn(index));
    });

    it('list all enumerations', tests.listEnumerationsFn());

    const translateEnumerationFn = function (index, language) {
        return function () {
            const server = hxEnumeration.server(index);
            const translation = translator.translateEnumeration(server, language);
            return models.enumeral.updateEnumeralTexts(translation.enumerals, language)
                .then(() => {
                    hxEnumeration.translate(index, language, translation);
                });
        };
    };

    const getTranslatedEnumerationFn = function (index, language, notTranslated) {
        return function () {
            const id = hxEnumeration.id(index);
            return models.enumeration.getEnumeration(id, language)
                .then(result => {
                    const expected = hxEnumeration.translatedServer(index, language);
                    if (!notTranslated) {
                        translator.isEnumerationTranslated(expected, language);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('get enumeration 3 in spanish when no translation', getTranslatedEnumerationFn(3, 'es', true));

    _.range(8).forEach(index => {
        it(`add translated (es) enumeration ${index}`, translateEnumerationFn(index, 'es'));
        it(`get and verify tanslated enumeration ${index}`, getTranslatedEnumerationFn(index, 'es'));
    });

    _.forEach([1, 4, 6], index => {
        it(`delete enumeration ${index}`, tests.deleteEnumerationFn(index));
    });

    it('list all enumerations', tests.listEnumerationsFn());

    const deleteFirstEnumeralFn = function (index) {
        return function () {
            const server = hxEnumeration.server(index);
            const enumeralId = server.enumerals[0].id;
            const client = hxEnumeration.client(index);
            client.enumerals.shift(0);
            return models.enumeral.deleteEnumeral(enumeralId);
        };
    };

    _.forEach([0, 2, 3], index => {
        it(`delete first enumeral of enumeration ${index}`, deleteFirstEnumeralFn(index));
        it(`get enumeration ${index}`, tests.getEnumerationFn(index));
    });
});
