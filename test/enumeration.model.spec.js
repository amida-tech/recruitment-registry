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

    const hxChoiceSet = new History();
    const tests = new enumerationCommon.SpecTests(generator, hxChoiceSet);

    it('list all enums when none', function () {
        return models.choiceSet.listChoiceSets()
            .then(enumerations => {
                expect(enumerations).to.have.length(0);
            });
    });

    _.range(8).forEach(index => {
        it(`create enumeration ${index}`, tests.createChoiceSetFn());
        it(`get enumeration ${index}`, tests.getChoiceSetFn(index));
    });

    it('list all enumerations', tests.listChoiceSetsFn());

    const translateEnumerationFn = function (index, language) {
        return function () {
            const server = hxChoiceSet.server(index);
            const translation = translator.translateEnumeration(server, language);
            return models.questionChoice.updateMultipleChoiceTexts(translation.choices, language)
                .then(() => {
                    hxChoiceSet.translate(index, language, translation);
                });
        };
    };

    const getTranslatedEnumerationFn = function (index, language, notTranslated) {
        return function () {
            const id = hxChoiceSet.id(index);
            return models.choiceSet.getChoiceSet(id, language)
                .then(result => {
                    const expected = hxChoiceSet.translatedServer(index, language);
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
        it(`delete enumeration ${index}`, tests.deleteChoiceSetFn(index));
    });

    it('list all enumerations', tests.listChoiceSetsFn());

    const deleteFirstChoiceFn = function (index) {
        return function () {
            const server = hxChoiceSet.server(index);
            const choiceId = server.choices[0].id;
            const client = hxChoiceSet.client(index);
            client.choices.shift(0);
            return models.questionChoice.deleteQuestionChoice(choiceId);
        };
    };

    _.forEach([0, 2, 3], index => {
        it(`delete first choice of enumeration ${index}`, deleteFirstChoiceFn(index));
        it(`get enumeration ${index}`, tests.getChoiceSetFn(index));
    });
});
