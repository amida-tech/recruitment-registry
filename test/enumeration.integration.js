/* global describe,before,it*/
'use strict';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const config = require('../config');

const SharedIntegration = require('./util/shared-integration');
const RRSuperTest = require('./util/rr-super-test');
const Generator = require('./util/generator');
const History = require('./util/history');
const translator = require('./util/translator');
const enumerationCommon = require('./util/enumeration-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('enumeration integration', function () {
    const rrSuperTest = new RRSuperTest();
    const hxChoiceSet = new History();
    const tests = new enumerationCommon.IntegrationTests(rrSuperTest, generator, hxChoiceSet);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(8).forEach(index => {
        it(`create enumeration ${index}`, tests.createChoiceSetFn());
        it(`get enumeration ${index}`, tests.getChoiceSetFn(index));
    });

    it('list all enumerations', tests.listChoiceSetsFn());

    const translateEnumerationFn = function (index, language) {
        return function (done) {
            const server = hxChoiceSet.server(index);
            const translation = translator.translateEnumeration(server, language);
            rrSuperTest.patch(`/question-choices/multi-text/${language}`, translation.choices, 204)
                .expect(function () {
                    hxChoiceSet.translate(index, language, translation);
                })
                .end(done);
        };
    };

    const getTranslatedEnumerationFn = function (index, language, notTranslated) {
        return function (done) {
            const id = hxChoiceSet.id(index);
            rrSuperTest.get(`/choice-sets/${id}`, true, 200, { language })
                .expect(function (res) {
                    const expected = hxChoiceSet.translatedServer(index, language);
                    if (!notTranslated) {
                        translator.isEnumerationTranslated(expected, language);
                    }
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
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
        return function (done) {
            const server = hxChoiceSet.server(index);
            const choiceId = server.choices[0].id;
            const client = hxChoiceSet.client(index);
            client.choices.shift(0);
            rrSuperTest.delete(`/question-choices/${choiceId}`, 204).end(done);
        };
    };

    _.forEach([0, 2, 3], index => {
        it(`delete first choice of enumeration ${index}`, deleteFirstChoiceFn(index));
        it(`get enumeration ${index}`, tests.getChoiceSetFn(index));
    });
});
