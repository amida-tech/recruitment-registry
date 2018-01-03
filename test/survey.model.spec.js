/* global describe,before,it */

'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

process.env.NODE_ENV = 'test';

const chai = require('chai');
const _ = require('lodash');

const models = require('../models');

const Generator = require('./util/generator');
const MultiQuestionSurveyGenerator = require('./util/generator/multi-question-survey-generator');
const ChoiceSetQuestionGenerator = require('./util/generator/choice-set-question-generator');
const History = require('./util/history');
const SurveyHistory = require('./util/survey-history');
const SharedSpec = require('./util/shared-spec');
const comparator = require('./util/comparator');
const translator = require('./util/translator');
const surveyCommon = require('./util/survey-common');
const choiceSetCommon = require('./util/choice-set-common');

const expect = chai.expect;
const generator = new Generator();
const shared = new SharedSpec(generator);

describe('survey unit', function surveyUnit() {
    before(shared.setUpFn());

    const userCount = 1;
    let surveyCount = 8;

    const hxSurvey = new SurveyHistory();
    const hxChoiceSet = new History();
    const hxUser = new History();
    const tests = new surveyCommon.SpecTests(generator, hxSurvey);
    const choceSetTests = new choiceSetCommon.SpecTests(generator, hxChoiceSet);
    let surveyTemp = null;

    it('verify no surveys', function verifyNoSurveys() {
        return models.survey.listSurveys()
            .then((surveys) => {
                expect(surveys).to.have.length(0);
            });
    });

    const patchSurveyMetaFn = function (index) {
        return function patchSurveyMeta() {
            const surveyId = hxSurvey.id(index);
            const survey = hxSurvey.server(index);
            const update = { meta: { anyProperty: 2 } };
            Object.assign(survey, update);
            return models.survey.patchSurvey(surveyId, update);
        };
    };

    const revertPatchedSurveyMetaFn = function (index) {
        return function revertPatchedSurveyMeta() {
            const surveyId = hxSurvey.id(index);
            const survey = hxSurvey.server(index);
            let { meta } = hxSurvey.client(index);
            if (!meta) {
                delete survey.meta;
                meta = {};
            } else {
                Object.assign(survey, { meta });
            }
            return models.survey.patchSurvey(surveyId, { meta });
        };
    };

    const patchSurveyTextFn = function (index) {
        return function patchSurveyText() {
            const id = hxSurvey.id(index);
            const survey = hxSurvey.server(index);
            survey.name += 'xyz';
            const surveyPatch = { name: survey.name };
            if (survey.description) {
                const newDescription = `${survey.description}zyx`;
                survey.description = newDescription;
                surveyPatch.description = newDescription;
            }
            return models.survey.patchSurvey(id, surveyPatch);
        };
    };

    const revertPatchedSurveyTextFn = function (index) {
        return function revertPatchedSurveyText() {
            const id = hxSurvey.id(index);
            const survey = hxSurvey.server(index);
            const { name, description } = hxSurvey.client(index);
            survey.name = name;
            if (description) {
                survey.description = description;
            }
            return models.survey.patchSurvey(id, { name, description });
        };
    };

    const patchSurveyQuestionsSectionsFn = function (index, sourceIndex) {
        return function patchSurveyQuestionsSections() {
            const survey = hxSurvey.server(index);
            const sourceSurvey = hxSurvey.server(sourceIndex);
            surveyTemp = _.cloneDeep(survey);
            const surveyPatch = surveyCommon.formQuestionsSectionsSurveyPatch(survey, sourceSurvey);
            return models.survey.patchSurvey(survey.id, surveyPatch);
        };
    };

    const revertPatchedSurveyQuestionSectionsFn = function (index) {
        return function revertPatchedSurveyQuestionSections() {
            const survey = hxSurvey.server(index);
            const sourceSurvey = surveyTemp;
            const surveyPatch = surveyCommon.formQuestionsSectionsSurveyPatch(survey, sourceSurvey);
            return models.survey.patchSurvey(survey.id, surveyPatch);
        };
    };

    it('error: create survey without questions', () => models.survey.createSurvey({ name: 'name' })
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNeitherQuestionsSectionsSpecified')));

    _.range(surveyCount).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
        it(`patch survey ${index} (meta)`, patchSurveyMetaFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        it(`revert patched survey back ${index} (meta)`, revertPatchedSurveyMetaFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        it(`patch survey ${index} (text)`, patchSurveyTextFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        it(`revert patched survey text back ${index} (text)`, revertPatchedSurveyTextFn(index));
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
        if (index > 0) {
            it(`patch survey ${index} from survey ${index - 1} (questions/sections)`, patchSurveyQuestionsSectionsFn(index, index - 1));
            it(`verify survey ${index}`, tests.verifySurveyFn(index, { noSectionId: true }));
            it(`revert patched survey ${index} back (question/sections)`, revertPatchedSurveyQuestionSectionsFn(index));
            it(`get survey ${index}`, tests.getSurveyFn(index));
        }
        it('list surveys', tests.listSurveysFn());
    });
    _.range(9).forEach((index) => {
        const status = ['draft', 'published', 'retired'][parseInt(index / 3, 10)];
        it(`create survey ${surveyCount + index}`, tests.createSurveyFn({ status }));
        it(`get survey ${surveyCount + index}`, tests.getSurveyFn(surveyCount + index));
    });

    surveyCount += 9;

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 3));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 3));

    it('error: change published survey to draft status',
        tests.errorStatusChangeFn(surveyCount - 4, 'draft', { errorKey: 'surveyPublishedToDraftUpdate' }));

    it('error: retire draft survey',
        tests.errorStatusChangeFn(surveyCount - 7, 'retired', { errorKey: 'surveyDraftToRetiredUpdate' }));

    it('error: patch retired survey',
        tests.errorStatusChangeFn(surveyCount - 2, 'retired', { errorKey: 'surveyRetiredStatusUpdate' }));

    it(`publish draft survey ${surveyCount - 9}`,
        tests.patchSurveyFn(surveyCount - 9, { status: 'published' }));

    it(`retire published survey ${surveyCount - 6}`,
        tests.patchSurveyFn(surveyCount - 6, { status: 'retired' }));

    [surveyCount - 6].forEach((index) => {
        it(`verify survey ${index}`, tests.verifySurveyFn(index, { noSectionId: true }));
    });

    [surveyCount - 9, surveyCount - 8, surveyCount - 5].forEach((index) => {
        it(`verify survey ${index}`, tests.verifySurveyFn(index));
    });

    it('list surveys', tests.listSurveysFn(undefined, surveyCount - 6));
    it('list surveys (published)', tests.listSurveysFn({ status: 'published' }, surveyCount - 6));
    it('list surveys (all)', tests.listSurveysFn({ status: 'all' }, surveyCount));
    it('list surveys (retired)', tests.listSurveysFn({ status: 'retired' }, 4));
    it('list surveys (draft)', tests.listSurveysFn({ status: 'draft' }, 2));

    it('error: show a non-existent survey', () => models.survey.getSurvey(999)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound')));

    it('error: replace with a survey with no questions', () => {
        const survey = hxSurvey.server(1);
        const replacementSurvey = generator.newSurvey();
        delete replacementSurvey.questions;
        delete replacementSurvey.sections;
        return models.survey.replaceSurvey(survey.id, replacementSurvey)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNeitherQuestionsSectionsSpecified'));
    });

    it('error: replace a non-existent survey', () => {
        const replacementSurvey = generator.newSurvey();
        return models.survey.replaceSurvey(999, replacementSurvey)
            .then(shared.throwingHandler, shared.expectedErrorHandler('surveyNotFound'));
    });

    it('get survey 3 in spanish when no name translation', () => {
        const survey = hxSurvey.server(3);
        return models.survey.getSurvey(survey.id, { language: 'es' })
            .then((result) => {
                expect(result).to.deep.equal(survey);
            });
    });

    it('list surveys in spanish when no translation', () => models.survey.listSurveys({ language: 'es' })
            .then((result) => {
                const list = hxSurvey.listServers();
                expect(result).to.deep.equal(list);
            }));

    const translateTextFn = function (index, language) {
        return function translateText() {
            const survey = hxSurvey.server(index);
            const translation = translator.translateSurvey(survey, language);
            return models.survey.patchSurveyText(translation, language)
                .then(() => {
                    hxSurvey.translate(index, language, translation);
                });
        };
    };

    const getTranslatedFn = function (index, language) {
        return function getTranslated() {
            const id = hxSurvey.id(index);
            return models.survey.getSurvey(id, { language })
                .then((result) => {
                    translator.isSurveyTranslated(result, language);
                    const expected = hxSurvey.translatedServer(index, language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    const listTranslatedFn = function (language) {
        return function listTranslated() {
            return models.survey.listSurveys({ language })
                .then((result) => {
                    const expected = hxSurvey.listTranslatedServers(language);
                    expect(result).to.deep.equal(expected);
                });
        };
    };

    _.range(0, surveyCount, 2).forEach((index) => {
        it(`add translated name to survey ${index}`, translateTextFn(index, 'es'));
        it(`get and verify translated survey ${index}`, getTranslatedFn(index, 'es'));
    });

    it('list and verify translated surveys', listTranslatedFn('es'));

    it('list surveys in english (original)', () => models.survey.listSurveys({ language: 'en' })
            .then((result) => {
                const list = hxSurvey.listServers();
                expect(result).to.deep.equal(list);
            }));

    const replaceSurveyFn = function (index) {
        return function replaceSurvey() {
            const id = hxSurvey.id(index);
            const clientSurvey = generator.newSurvey();
            return models.survey.replaceSurvey(id, clientSurvey)
                .then(newId => models.survey.getSurvey(newId))
                .then((serverSurvey) => {
                    comparator.survey(clientSurvey, serverSurvey);
                    hxSurvey.replace(index, clientSurvey, serverSurvey);
                })
                .then(() => models.survey.listSurveys())
                .then((surveys) => {
                    const expected = hxSurvey.listServers();
                    expect(surveys).to.deep.equal(expected);
                });
        };
    };

    const dbVersionCompareFn = function (index, count) {
        return function dbVersionCompare() {
            const id = hxSurvey.id(index);
            return models.survey.getSurvey(id, { override: { attributes: ['id', 'version', 'groupId'] } })
                .then(surveyWithGroupId => models.survey.listSurveys({
                    scope: 'version-only',
                    history: true,
                    order: ['version'],
                    groupId: surveyWithGroupId.groupId,
                })
                        .then(actual => actual.map(({ version, groupId }) => ({ version, groupId })))
                        .then((actual) => {
                            const groupId = surveyWithGroupId.groupId;
                            const expected = _.range(1, count + 1).map(version => ({ version, groupId }));
                            expect(actual).to.deep.equal(expected);
                        }));
        };
    };

    [3, 0, surveyCount + 1].forEach((index) => {
        it(`replace survey ${index} with survey ${surveyCount + index}`, replaceSurveyFn(index));
    });

    it(`survey ${surveyCount} is version 2`, dbVersionCompareFn(surveyCount, 2));
    it(`survey ${surveyCount + 2} is version 3`, dbVersionCompareFn(surveyCount + 2, 3));

    const dbVersionParentlessCompareFn = function (index, replaced) {
        return function dbVersionParentlessCompare() {
            const id = hxSurvey.id(index);
            return models.survey.getSurvey(id, { override: { attributes: ['id', 'version', 'groupId'], paranoid: false } })
                .then((survey) => {
                    if (replaced) {
                        const { version, groupId } = survey;
                        expect({ id, version, groupId }).to.deep.equal({ id, version: 1, groupId: id });
                    } else {
                        const { version, groupId } = survey;
                        expect({ id, version, groupId }).to.deep.equal({ id, version: null, groupId: null });
                    }
                });
        };
    };

    it('survey 1 is version null', dbVersionParentlessCompareFn(1, false));
    it('survey 3 is version 1', dbVersionParentlessCompareFn(3, true));

    const listSurveyScopeVersionFn = function (index) {
        return function listSurveyScopeVersion() {
            return models.survey.listSurveys({ scope: 'version', version: 3, history: true })
                .then((list) => {
                    expect(list).to.have.length(1);
                    const { name, version } = list[0];
                    expect(version).to.equal(3);
                    const expected = hxSurvey.server(index).name;
                    expect(name).to.equal(expected);
                });
        };
    };

    it('listSurvey override where', listSurveyScopeVersionFn(surveyCount + 2));

    surveyCount += 3;

    it('delete survey 5', tests.deleteSurveyFn(5));

    it('list surveys', tests.listSurveysFn());

    it('extract existing questions/sections', () => {
        const surveys = hxSurvey.listServers(['status', 'questions', 'sections']);
        const p = surveys.reduce((r, survey) => {
            const { questions, sections } = models.survey.flattenHierarchy(survey);
            r.questions.push(...questions);
            if (sections && sections.length) {
                r.sections.push(...sections);
            }
            return r;
        }, { questions: [], sections: [] });

        hxSurvey.questions = p.questions;
        hxSurvey.sections = p.sections;
    });

    it('create survey by existing questions only', () => {
        const survey = generator.surveyGenerator.newBody();
        const questions = hxSurvey.questions.slice(0, 10);
        survey.questions = questions.map(({ id, required }) => ({ id, required }));
        return models.survey.createSurvey(survey)
            .then(id => models.survey.getSurvey(id))
            .then((serverSurvey) => {
                survey.questions = questions;
                comparator.survey(survey, serverSurvey);
                hxSurvey.push(survey, serverSurvey);
            });
    });

    surveyCount += 1;

    // it('create survey by existing sections/questions only (0)', function () {
    //    const survey = generator.surveyGenerator.newBody();
    //    const questions = hxSurvey.questions.slice(0, 9);
    //    const sections = hxSurvey.sections.slice(0, 3);
    //    const surveyQuestions = questions.map(({ id, required }) => ({ id, required }));
    //    const surveySections = sections.map(({ id }) => ({ id }));
    //    survey.sections = surveySections.map((surveySection, index) => {
    //        surveySection.questions = surveyQuestions.slice(index * 3, (index + 1) * 3);
    //        return surveySection;
    //    });
    //    const expectedSections = sections.map((section, index) => {
    //        const result = Object.assign({}, section);
    //        result.questions = surveyQuestions.slice(index * 3, (index + 1) * 3);
    //        return result;
    //    });

    //    return models.survey.createSurvey(survey)
    //        .then(id => models.survey.getSurvey(id))
    //        .then(serverSurvey => {
    //            survey.sections = expectedSections;
    //            comparator.survey(survey, serverSurvey);
    //            hxSurvey.push(survey, serverSurvey);
    //        });
    // });

    // surveyCount += 1;

    it('create survey by existing/new questions', () => {
        const survey = generator.newSurvey({ noSection: true });
        const fn = index => ({ id: hxSurvey.questions[index].id, required: hxSurvey.questions[index].required });
        const additionalIds = [10, 11].map(fn);
        survey.questions.splice(1, 0, ...additionalIds);
        return models.survey.createSurvey(survey)
            .then(id => models.survey.getSurvey(id))
            .then((serverSurvey) => {
                survey.questions[1] = hxSurvey.questions[10];
                survey.questions[2] = hxSurvey.questions[11];
                hxSurvey.push(survey, serverSurvey);
                comparator.survey(survey, serverSurvey);
            });
    });

    surveyCount += 1;

    it('update survey generator for multi questions', () => {
        generator.updateSurveyGenerator(MultiQuestionSurveyGenerator);
    });

    _.range(surveyCount, surveyCount + 7).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    surveyCount += 7;

    _.range(8).forEach((index) => {
        it(`create choice set ${index}`, choceSetTests.createChoiceSetFn());
        it(`get choice set ${index}`, choceSetTests.getChoiceSetFn(index));
    });

    it('replace generator to choice set question generator', () => {
        const choiceSets = _.range(8).map(index => hxChoiceSet.server(index));
        const choiceSetGenerator = new ChoiceSetQuestionGenerator(generator.questionGenerator, choiceSets);
        generator.questionGenerator = choiceSetGenerator;
        generator.surveyGenerator.questionGenerator = choiceSetGenerator;
        comparator.updateChoiceSetMap(choiceSets);
    });

    _.range(surveyCount, surveyCount + 3).forEach((index) => {
        it(`create survey ${index}`, tests.createSurveyFn());
        it(`get survey ${index}`, tests.getSurveyFn(index));
    });

    surveyCount += 3;

    _.range(userCount).forEach((i) => {
        it(`create user ${i}`, shared.createUserFn(hxUser));
    });

    const auxAnswerVerifySurvey = function (survey, input) {
        return models.answer.createAnswers(input)
            .then(() => models.survey.getAnsweredSurvey(input.userId, input.surveyId)
                    .then((answeredSurvey) => {
                        comparator.answeredSurvey(survey, input.answers, answeredSurvey);
                    }));
    };

    const answerVerifySurveyFn = function (surveyIndex) {
        return function answerVerifySurvey() {
            const survey = hxSurvey.server(surveyIndex);
            const answers = generator.answerSurvey(survey);
            const input = {
                userId: hxUser.id(0),
                surveyId: survey.id,
                answers,
            };
            return auxAnswerVerifySurvey(survey, input);
        };
    };

    [1, 2, 7, 10, 11, 12].forEach((index) => {
        it(`answer survey ${index} and get/verify answered`, answerVerifySurveyFn(index));
    });

    it('error: answer without required questions', () => {
        const survey = hxSurvey.server(4);
        const qxs = models.survey.getQuestions(survey);
        const answers = generator.answerQuestions(qxs);
        const input = {
            userId: hxUser.id(0),
            surveyId: survey.id,
            answers,
        };
        const requiredIndices = _.range(qxs.length).filter(index => qxs[index].required);
        expect(requiredIndices).to.have.length.above(0);
        const removedAnswers = _.pullAt(answers, requiredIndices);
        let px = models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        _.range(1, removedAnswers.length).forEach((index) => {
            px = px
                .then(() => answers.push(removedAnswers[index]))
                .then(() => models.answer.createAnswers(input))
                .then(shared.throwingHandler, shared.expectedErrorHandler('answerRequiredMissing'));
        });
        px = px.then(() => {
            answers.push(removedAnswers[0]);
            return auxAnswerVerifySurvey(survey, input);
        });
        return px;
    });

    it('reanswer without all required questions', () => {
        const survey = hxSurvey.server(4);
        const userId = hxUser.id(0);
        return models.survey.getAnsweredSurvey(userId, survey.id)
            .then((answeredSurvey) => {
                const qxs = models.survey.getQuestions(survey);
                const answers = generator.answerQuestions(qxs);
                const input = {
                    userId: hxUser.id(0),
                    surveyId: survey.id,
                    answers,
                };
                const requiredIndices = _.range(qxs.length).filter(index => qxs[index].required);
                expect(requiredIndices).to.have.length.above(1);
                _.pullAt(answers, requiredIndices[0]);
                return models.answer.createAnswers(input)
                    .then(() => {
                        const removedQxId = qxs[requiredIndices[0]].id;
                        const answeredSurveyQuestions = models.survey.getQuestions(answeredSurvey);
                        const removedAnswer = answeredSurveyQuestions.find(qx => (qx.id === removedQxId)).answer;
                        answers.push({ questionId: removedQxId, answer: removedAnswer });
                        return models.survey.getAnsweredSurvey(input.userId, input.surveyId)
                            .then((r) => {
                                comparator.answeredSurvey(survey, answers, r);
                            });
                    });
            });
    });

    it('error: answer with invalid question id', () => {
        const survey = hxSurvey.server(6);
        const answers = generator.answerSurvey(survey);
        const input = {
            userId: hxUser.id(0),
            surveyId: survey.id,
            answers,
        };
        answers[0].questionId = 999;
        return models.answer.createAnswers(input)
            .then(shared.throwingHandler, shared.expectedErrorHandler('answerQxNotInSurvey'));
    });

    it('survey count sanity check', () => {
        expect(hxSurvey.length()).to.equal(surveyCount);
    });
});
