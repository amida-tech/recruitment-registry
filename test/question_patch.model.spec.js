/* global describe,before,it */

'use strict';

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const chai = require('chai');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const SurveyHistory = require('./util/survey-history');
const History = require('./util/history');
const questionCommon = require('./util/question-common');
const surveyCommon = require('./util/survey-common');
const answerCommon = require('./util/answer-common');

describe('question patch unit', function questionPatchUnit() {
    const generator = new Generator();
    const shared = new SharedSpec(generator);
    const expect = chai.expect;

    before(shared.setUpFn());

    const hxQuestion = new History();
    const hxSurvey = new SurveyHistory();
    const hxUser = new History();
    const tests = new questionCommon.SpecTests({ generator, hxQuestion });
    const surveyTests = new surveyCommon.SpecTests(generator, hxSurvey, hxQuestion);
    const answerTests = new answerCommon.SpecTests({ generator, hxUser, hxSurvey, hxQuestion });

    _.range(2).forEach((index) => {
        it(`create question ${index} (choice)`, tests.createQuestionFn({ type: 'choice' }));
    });
    _.range(2).forEach((index) => {
        it(`create question ${index} (choices)`, tests.createQuestionFn({ type: 'choices' }));
    });
    _.range(6).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
    });
    _.range(2).forEach((index) => {
        it(`create question ${index} (scale)`, tests.createQuestionFn({
            type: 'scale',
            scaleLimits: { min: 22, max: 42 },
        }));
    });

    _.range(12).forEach((index) => {
        it(`get question ${index}`, tests.getQuestionFn(index));
    });

    [
        { scaleLimits: { min: 0, max: 10 } },
        { scaleLimits: { min: 9 } },
        { scaleLimits: { max: 11 } },
    ].forEach((patch, index) => {
        it(`patch question 10 scaleLimits (${index})`, tests.patchQuestionFn(10, patch));
        it(`verify question 10 scaleLimits (${index})`, tests.verifyQuestionFn(10));
    });
    [
        { scaleLimits: { min: 10, max: 0 } },
        { scaleLimits: { min: 5, max: 0 } },
        { scaleLimits: { min: 1, max: 0 } },
    ].forEach((patch, index) => {
        const options = {
            error: 'questionScaleMinGTMax',
        };
        it(`error: patch invalid scaleLimits (${index})`, tests.errorPatchQuestionFn(11, patch, options));
    });


    [
        { text: 'patch_1', instruction: 'instruction_1' },
        { text: 'patch_2', instruction: null },
        { text: 'patch_3', instruction: 'instruction_2' },
        { meta: { prop: 'prop' } },
        { meta: null },
        { meta: { prop2: 'prop2' } },
        { common: true },
        { common: false },
        { common: null },
    ].forEach((patch, index) => {
        it(`patch question 5 text fields (${index})`, tests.patchQuestionFn(5, patch));
        it(`verify question 5 text fields (${index})`, tests.verifyQuestionFn(5));
    });

    [
        { type: 'text' },
        { multiple: true },
        { choiceSetId: 88 },
        { maxCount: 88 },
    ].forEach((patch, index) => {
        const options = {
            error: 'qxPatchTypeFields',
            errorParam: 'type, multiple, maxCount, choiceSetId',
        };
        it(`error: patch type related fields (${index})`, tests.errorPatchQuestionFn(0, patch, options));
    });

    [0, 2].forEach((index) => {
        it('error: add choices with id', function errorAddChoicesWithId() {
            const choices = hxQuestion.server(index + 1).choices;
            const id = choices[0].id;
            const options = {
                error: 'qxChoicePatchInvalidId',
                errorParam: id,
            };
            return tests.errorPatchQuestionFn(index, { choices }, options)();
        });

        it(`add choices to question ${index}`, function addChoices() {
            const existingChoices = hxQuestion.server(index).choices;
            const newChoices = hxQuestion.server(index + 1).choices.map(p => _.omit(p, ['id']));
            const choices = [...existingChoices, ...newChoices];
            return tests.patchQuestionFn(index, { choices })();
        });

        it(`verify question ${index}`, tests.verifyQuestionFn(index, { updateMissingChoiceIds: true }));

        [
            { meta: { prop45: 'prop45' } },
            { meta: null, code: '65' },
            { meta: { prop46: 'prop46', code: null } },
            { text: 'other text' },
            { text: 'revert text', code: 'tr' },
        ].forEach((choicePatch, pindex) => {
            it(`change question ${index} base fields ${pindex}`, function changeBaseChoiceFields() {
                const question = _.cloneDeep(hxQuestion.server(index));
                const choices = question.choices;
                Object.assign(choices[1], choicePatch);
                choices[1] = _.omitBy(choices[1], _.isNil);
                if (pindex % 2 === 1) {
                    Object.assign(choices[3], choicePatch);
                    choices[3] = _.omitBy(choices[3], _.isNil);
                }
                return tests.patchQuestionFn(index, { choices })();
            });

            it(`verify question ${index}`, tests.verifyQuestionFn(index));
        });
    });

    [0, 1, 2, 3].forEach((index) => {
        it(`change order of question ${index} choices`, function changeOrderOfQuestionChoices() {
            const question = _.cloneDeep(hxQuestion.server(index));
            const choices = _.shuffle(question.choices);
            return tests.patchQuestionFn(index, { choices })()
                .then(() => {
                    const updatedQuestion = hxQuestion.server(index);
                    expect(question.choices).not.deep.equal(updatedQuestion.choices);
                });
        });
    });

    [0, 2].forEach((index) => {
        it(`delete question ${index} choices`, function deleteChoices() {
            const choices = _.cloneDeep(hxQuestion.server(index).choices.slice());
            choices.splice(1, 1);
            choices.splice(3, 1);
            return tests.patchQuestionFn(index, { choices })();
        });

        it(`verify question ${index}`, tests.verifyQuestionFn(index));
    });

    it('create survey 0', surveyTests.createSurveyQxHxFn([0, 2, 4]));
    it('get survey 0', surveyTests.getSurveyFn(0));

    it('create survey 1', surveyTests.createSurveyQxHxFn([1, 3, 5]));
    it('get survey 1', surveyTests.getSurveyFn(1));

    it('create user 0', shared.createUserFn(hxUser));

    let deleteChoice0 = null;
    it('answer survey 0', function answerSurvey0() {
        const indices = [0, 2, 4];
        return answerTests.answerSurveyFn(0, 0, indices)()
            .then((answers) => {
                const questionId = hxQuestion.server(0).id;
                answers.forEach(({ questionId: id, answer: { choice } }) => {
                    if (questionId === id) {
                        deleteChoice0 = choice;
                    }
                });
            });
    });

    it('error: delete answered question 0 choice', function deleteChoice() {
        const choices = _.cloneDeep(hxQuestion.server(0).choices.slice());
        const index = choices.findIndex(choice => choice.id === deleteChoice0);
        expect(index).to.be.above(-1);
        choices.splice(index, 1);
        return tests.errorPatchQuestionFn(0, { choices }, { error: 'qxChoiceNoDeleteAnswered' })();
    });

    it('force delete answered question 0 choice', function deleteChoice() {
        const choices = _.cloneDeep(hxQuestion.server(0).choices.slice());
        const index = choices.findIndex(choice => choice.id === deleteChoice0);
        expect(index).to.be.above(-1);
        choices.splice(index, 1);
        return tests.patchQuestionFn(index, { choices }, { force: true })();
    });

    it('verify question 0', tests.verifyQuestionFn(0));
});
