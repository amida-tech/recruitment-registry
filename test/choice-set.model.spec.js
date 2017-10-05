/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const History = require('./util/history');
const translator = require('./util/translator');
const choiceSetCommon = require('./util/choice-set-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('choice set unit', () => {
    before(shared.setUpFn());

    const hxChoiceSet = new History();
    const tests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    it('list all choice sets when none', () => models.choiceSet.listChoiceSets()
            .then((choiceSets) => {
                expect(choiceSets).to.have.length(0);
            }));

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, tests.createChoiceSetFn());
        it(`get choice set ${index}`, tests.getChoiceSetFn(index));
    });

    it('list all choice sets', tests.listChoiceSetsFn());

    const translateChoiceSetFn = function (index, language) {
        return function translateChoiceSet() {
            const server = hxChoiceSet.server(index);
            const translation = translator.translateChoiceSet(server, language);
            return models.questionChoice.updateMultipleChoiceTexts(translation.choices, language)
                .then(() => {
                    hxChoiceSet.translate(index, language, translation);
                });
        };
    };

    const getTranslatedChoiceSetFn = function (index, language, notTranslated) {
        return function getTranslatedChoiceSet() {
            const id = hxChoiceSet.id(index);
            return models.choiceSet.getChoiceSet(id, language)
                .then((result) => {
                    const expected = hxChoiceSet.translatedServer(index, language);
                    if (!notTranslated) {
                        translator.isChoiceSetTranslated(expected, language);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('get choice set 3 in spanish when no translation', getTranslatedChoiceSetFn(3, 'es', true));

    _.range(8).forEach((index) => {
        it(`add translated (es) choice set ${index}`, translateChoiceSetFn(index, 'es'));
        it(`get and verify tanslated choice set ${index}`, getTranslatedChoiceSetFn(index, 'es'));
    });

    _.forEach([1, 4, 6], (index) => {
        it(`delete choice set ${index}`, tests.deleteChoiceSetFn(index));
    });

    it('list all choice sets', tests.listChoiceSetsFn());

    const deleteFirstChoiceFn = function (index) {
        return function deleteFirstChoice() {
            const server = hxChoiceSet.server(index);
            const choiceId = server.choices[0].id;
            const client = hxChoiceSet.client(index);
            client.choices.shift(0);
            return models.questionChoice.deleteQuestionChoice(choiceId);
        };
    };

    _.forEach([0, 2, 3], (index) => {
        it(`delete first choice of choice set ${index}`, deleteFirstChoiceFn(index));
        it(`get choice set ${index}`, tests.getChoiceSetFn(index));
    });
});
