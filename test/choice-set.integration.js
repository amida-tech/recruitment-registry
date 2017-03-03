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
const choiceSetCommon = require('./util/choice-set-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedIntegration(generator);

describe('choice set integration', function () {
    const rrSuperTest = new RRSuperTest();
    const hxChoiceSet = new History();
    const tests = new choiceSetCommon.IntegrationTests(rrSuperTest, generator, hxChoiceSet);

    before(shared.setUpFn(rrSuperTest));

    it('login as super', shared.loginFn(rrSuperTest, config.superUser));

    _.range(8).forEach(index => {
        it(`create choice set ${index}`, tests.createChoiceSetFn());
        it(`get choice set ${index}`, tests.getChoiceSetFn(index));
    });

    it('list all choice sets', tests.listChoiceSetsFn());

    const translateChoiceSetFn = function (index, language) {
        return function (done) {
            const server = hxChoiceSet.server(index);
            const translation = translator.translateChoiceSet(server, language);
            rrSuperTest.patch(`/question-choices/multi-text/${language}`, translation.choices, 204)
                .expect(function () {
                    hxChoiceSet.translate(index, language, translation);
                })
                .end(done);
        };
    };

    const getTranslatedChoiceSetFn = function (index, language, notTranslated) {
        return function (done) {
            const id = hxChoiceSet.id(index);
            rrSuperTest.get(`/choice-sets/${id}`, true, 200, { language })
                .expect(function (res) {
                    const expected = hxChoiceSet.translatedServer(index, language);
                    if (!notTranslated) {
                        translator.isChoiceSetTranslated(expected, language);
                    }
                    expect(res.body).to.deep.equal(expected);
                })
                .end(done);
        };
    };

    it('get choice set 3 in spanish when no translation', getTranslatedChoiceSetFn(3, 'es', true));

    _.range(8).forEach(index => {
        it(`add translated (es) choice set ${index}`, translateChoiceSetFn(index, 'es'));
        it(`get and verify tanslated choice set ${index}`, getTranslatedChoiceSetFn(index, 'es'));
    });

    _.forEach([1, 4, 6], index => {
        it(`delete choice set ${index}`, tests.deleteChoiceSetFn(index));
    });

    it('list all choice sets', tests.listChoiceSetsFn());

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
        it(`delete first choice of choice set ${index}`, deleteFirstChoiceFn(index));
        it(`get choice set ${index}`, tests.getChoiceSetFn(index));
    });

    shared.verifyUserAudit(rrSuperTest);
});