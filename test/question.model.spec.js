/* global describe,before,it*/

'use strict';

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');
const db = require('../models/db');

const SharedSpec = require('./util/shared-spec.js');
const Generator = require('./util/generator');
const MultiQuestionGenerator = require('./util/generator/multi-question-generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const comparator = require('./util/comparator');
const History = require('./util/history');
const translator = require('./util/translator');
const questionCommon = require('./util/question-common');
const choiceSetCommon = require('./util/choice-set-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

const Question = db.Question;

describe('question unit', () => {
    before(shared.setUpFn());

    const hxQuestion = new History();
    const hxChoiceSet = new History();
    const hxSurvey = new History();
    const tests = new questionCommon.SpecTests(generator, hxQuestion);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);

    it('list all questions when none', () => models.question.listQuestions()
            .then((questions) => {
                expect(questions).to.have.length(0);
            }));

    const verifyQuestionFn = function (index) {
        return function () {
            const question = hxQuestion.server(index);
            return models.question.getQuestion(question.id)
                .then((result) => {
                    expect(result).to.deep.equal(question);
                });
        };
    };

    const updateQuestionTextFn = function (index) {
        return function () {
            const clientQuestion = hxQuestion.client(index);
            const question = hxQuestion.server(index);
            const text = `Updated ${clientQuestion.text}`;
            const instruction = clientQuestion.instruction;
            const update = { id: question.id, text };
            question.text = text;
            if (instruction) {
                update.instruction = `Updated ${instruction}`;
                question.instruction = `Updated ${instruction}`;
            }
            return models.question.updateQuestionText(update);
        };
    };

    const revertUpdateQuestionTextFn = function (index) {
        return function () {
            const clientQuestion = hxQuestion.client(index);
            const question = hxQuestion.server(index);
            const text = clientQuestion.text;
            question.text = text;
            const update = { id: question.id, text };
            const instruction = clientQuestion.instruction;
            if (instruction) {
                update.instruction = instruction;
                question.instruction = instruction;
            }
            return models.question.updateQuestionText(update);
        };
    };

    for (let i = 0; i < 10; ++i) {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
        it(`update question ${i}`, updateQuestionTextFn(i));
        it(`verify question ${i}`, verifyQuestionFn(i));
        it(`revert update question ${i}`, revertUpdateQuestionTextFn(i));
        it(`verify question ${i}`, verifyQuestionFn(i));
    }

    it('error: get with non-existent id', () => models.question.getQuestion(99999)
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound')));

    it('list questions 2, 4, 7', () => {
        const indices = [2, 4, 7];
        const ids = indices.map(i => hxQuestion.id(i));
        return models.question.listQuestions({ scope: 'complete', ids })
            .then((questions) => {
                const expected = hxQuestion.listServers(null, indices);
                expect(questions).to.deep.equal(expected);
            });
    });

    it('list all questions (complete)', tests.listQuestionsFn('complete'));

    it('list all questions (summary)', tests.listQuestionsFn('summary'));

    it('list all questions (default - summary)', tests.listQuestionsFn());

    it('error: get multiple with non-existent id', () => models.question.listQuestions({ ids: [1, 99999] })
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound')));

    const translateQuestionFn = function (index, language) {
        return function () {
            const server = hxQuestion.server(index);
            const translation = translator.translateQuestion(server, language);
            if (translation.choices && index < 4) {
                delete translation.text; // partial translation
            }
            return models.question.updateQuestionText(translation, language)
                .then(() => {
                    hxQuestion.translate(index, language, translation);
                });
        };
    };

    const getTranslatedQuestionFn = function (index, language, notTranslated) {
        return function () {
            const id = hxQuestion.id(index);
            return models.question.getQuestion(id, { language })
                .then((result) => {
                    const expected = hxQuestion.translatedServer(index, language);
                    if (!notTranslated) {
                        translator.isQuestionTranslated(expected, language);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const listTranslatedQuestionsFn = function (language, notTranslated) {
        return function () {
            return models.question.listQuestions({ scope: 'complete', language })
                .then((result) => {
                    const expected = hxQuestion.listTranslatedServers(language);
                    if (!notTranslated) {
                        translator.isQuestionListTranslated(expected, language);
                    }
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    it('get question 3 in spanish when no name translation', getTranslatedQuestionFn(3, 'es', true));

    it('list questions in spanish when no translation', listTranslatedQuestionsFn('es', true));

    for (let i = 0; i < 10; ++i) {
        it(`add translated (es) question ${i}`, translateQuestionFn(i, 'es'));
        it(`get and verify tanslated question ${i}`, getTranslatedQuestionFn(i, 'es'));
    }

    it('list and verify translated (es) questions', listTranslatedQuestionsFn('es'));

    for (let i = 0; i < 10; i += 2) {
        it(`add translated (fr) question ${i}`, translateQuestionFn(i, 'fr'));
        it(`get and verify tanslated (fr) question ${i}`, getTranslatedQuestionFn(i, 'fr'));
    }

    it('list and verify translated (fr) questions', listTranslatedQuestionsFn('fr', true));

    it('list questions in english (original)', listTranslatedQuestionsFn('en', true));

    _.forEach([1, 4, 6], (index) => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('list all questions (complete)', tests.listQuestionsFn('complete'));

    it('list all questions (summary)', tests.listQuestionsFn('summary'));

    for (let i = 10; i < 20; ++i) {
        it(`create question ${i}`, tests.createQuestionFn());
        it(`get question ${i}`, tests.getQuestionFn(i));
        it(`update question ${i}`, updateQuestionTextFn(i));
        it(`verify question ${i}`, verifyQuestionFn(i));
        it(`revert update question ${i}`, revertUpdateQuestionTextFn(i));
        it(`verify question ${i}`, verifyQuestionFn(i));
    }

    const createSurveyFn = function (questionIndices) {
        return function () {
            const questionIds = questionIndices.map(index => hxQuestion.id(index));
            const clientSurvey = generator.newSurveyQuestionIds(questionIds);
            return models.survey.createSurvey(clientSurvey)
                .then(id => hxSurvey.push(clientSurvey, { id }));
        };
    };

    [
        [2, 7, 9],
        [7, 11, 13],
        [5, 8, 11, 14, 15],
    ].forEach((questionIndices, index) => {
        it(`create survey ${index} from questions ${questionIndices}`, createSurveyFn(questionIndices));
    });

    _.forEach([2, 7, 11, 13, 14], (questionIndex) => {
        it(`error: delete question ${questionIndex} on an active survey`, () => models.question.deleteQuestion(hxQuestion.id(questionIndex))
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys')));
    });

    it('delete survey 1', () => models.survey.deleteSurvey(hxSurvey.id(1))
            .then(() => hxSurvey.remove(1)));

    _.forEach([2, 7, 11, 14], (questionIndex) => {
        it(`error: delete question ${questionIndex} on an active survey`, () => models.question.deleteQuestion(hxQuestion.id(questionIndex))
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys')));
    });

    it('delete survey 2', () => models.survey.deleteSurvey(hxSurvey.id(2))
            .then(() => hxSurvey.remove(2)));

    _.forEach([2, 7], (questionIndex) => {
        it(`error: delete question ${questionIndex} on an active survey`, () => models.question.deleteQuestion(hxQuestion.id(questionIndex))
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys')));
    });

    _.forEach([5, 11, 15], (index) => {
        it(`delete question ${index}`, tests.deleteQuestionFn(index));
    });

    it('error: replace a non-existent question', () => {
        const replacement = generator.newQuestion();
        return models.question.replaceQuestion(999, replacement)
            .then(shared.throwingHandler, shared.expectedErrorHandler('qxNotFound'));
    });

    [
        [7, 10, 17],
        [3, 8, 9],
    ].forEach((questionIndices, index) => {
        it(`create survey ${index + 3} from questions ${questionIndices}`, createSurveyFn(questionIndices));
    });

    _.forEach([2, 7, 9], (questionIndex) => {
        it(`error: replace question ${questionIndex} on an active survey`, () => {
            const replacement = generator.newQuestion();
            return models.question.replaceQuestion(hxQuestion.id(questionIndex), replacement)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey 0', () => models.survey.deleteSurvey(hxSurvey.id(0))
            .then(() => hxSurvey.remove(0)));

    _.forEach([7, 9], (questionIndex) => {
        it(`error: replace question ${questionIndex} on an active survey`, () => {
            const replacement = generator.newQuestion();
            return models.question.replaceQuestion(hxQuestion.id(questionIndex), replacement)
                .then(shared.throwingHandler, shared.expectedErrorHandler('qxReplaceWhenActiveSurveys'));
        });
    });

    it('delete survey 3', () => models.survey.deleteSurvey(hxSurvey.id(3))
            .then(() => hxSurvey.remove(3)));

    [7, 10, 14, 21, 22, 24].forEach((questionIndex, index) => {
        it(`replace question ${questionIndex} with question ${20 + index}`, () => {
            const replacement = generator.newQuestion();
            return models.question.replaceQuestion(hxQuestion.id(questionIndex), replacement)
                .then(({ id }) => models.question.getQuestion(id))
                .then((question) => {
                    comparator.question(replacement, question);
                    hxQuestion.replace(questionIndex, replacement, question);
                    return question;
                });
        });
    });

    it('list all questions (complete)', tests.listQuestionsFn('complete'));

    const verifyVersioningFn = function (index, expectedVersion) {
        return function () {
            const id = hxQuestion.id(index);
            return Question.findById(id, { attributes: ['groupId', 'version'], raw: true })
                .then((versionInfo) => {
                    expect(versionInfo.version).to.equal(expectedVersion);
                    return versionInfo;
                })
                .then((versionInfo) => {
                    if (versionInfo.version === null) {
                        expect(versionInfo.groupId).to.equal(null);
                    } else {
                        return Question.count({ where: { groupId: versionInfo.groupId }, paranoid: false })
                            .then(count => expect(count).to.equal(versionInfo.version));
                    }
                });
        };
    };

    const verifyDeletedVersioningFn = function (index, expectedVersion) {
        return function () {
            const id = hxQuestion.id(index);
            return Question.findById(id, { attributes: ['groupId', 'version'], raw: true, paranoid: false })
                .then((versionInfo) => {
                    expect(versionInfo.version).to.equal(expectedVersion);
                    expect(versionInfo.groupId).to.equal(expectedVersion ? id : null);
                });
        };
    };

    it('verify versioning for question 25', verifyVersioningFn(25, 4));
    it('verify versioning for question 23', verifyVersioningFn(23, 3));
    it('verify versioning for question 20', verifyVersioningFn(20, 2));
    it('verify versioning for question 3', verifyVersioningFn(3, null));

    it('verify versioning for question 6', verifyDeletedVersioningFn(6, null));
    it('verify versioning for question 14', verifyDeletedVersioningFn(14, 1));

    it('create question 26 (choices of all types)', () => {
        const question = generator.questionGenerator.allChoices();
        return tests.createQuestionFn(question)();
    });
    it('get question 26', tests.getQuestionFn());

    it('create question 27 (choices with bool-sole)', () => {
        const question = generator.questionGenerator.boolSoleChoices();
        return tests.createQuestionFn(question)();
    });
    it('get question 27', tests.getQuestionFn());

    it('replace generator to multiple question generator', () => {
        const multiGenerator = new MultiQuestionGenerator(generator.questionGenerator);
        generator.questionGenerator = multiGenerator;
    });

    _.range(28, 40).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(40, 50).forEach((index) => {
        it(`create question ${index}`, tests.createQuestionFn());
        it(`get question ${index}`, tests.getQuestionFn(index));
    });
});
