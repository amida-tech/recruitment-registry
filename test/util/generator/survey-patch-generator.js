'use strict';

const _ = require('lodash');
const chai = require('chai');

const comparator = require('../comparator');

const expect = chai.expect;

const specHandler = {
    enableWhenRaw(patch, generator, spec) {
        const { questionIndex, relativeIndex, logic, choiceIndex } = spec;
        const ruleQuestionIndex = questionIndex - relativeIndex;
        const rule = { questionIndex: ruleQuestionIndex, logic };
        const enableWhen = [rule];
        const question = patch.questions[questionIndex];
        question.enableWhen = enableWhen;
        if (logic === 'equals' || logic === 'not-equals') {
            const ruleQuestion = patch.questions[ruleQuestionIndex];
            const options = { choiceIndex };
            rule.answer = generator.answerer.answerRawQuestion(ruleQuestion, options);
        }
    },
    enableWhen(patch, generator, spec) {
        const { questionIndex, relativeIndex, logic } = spec;
        const question = patch.questions[questionIndex];
        const rule = { logic };
        const enableWhen = [rule];
        question.enableWhen = enableWhen;
        if (logic === 'equals' || logic === 'not-equals') {
            const ruleQuestionIndex = questionIndex - relativeIndex;
            const ruleQuestion = patch.questions[ruleQuestionIndex];
            Object.assign(rule, generator.answerer.answerQuestion(ruleQuestion));
        }
    },
    deleteEnableWhenElement(patch, generator, spec) {
        const { questionIndex, index } = spec;
        const question = patch.questions[questionIndex];
        question.enableWhen.splice(index, 1);
    },
    deleteEnableWhen(patch, generator, spec) {
        const { questionIndex } = spec;
        const question = patch.questions[questionIndex];
        delete question.enableWhen;
    },
    surveyEnableWhen(patch, generator, spec) {
        const { hxSurvey, answerer } = generator;
        const { answerSurveyIndex, answerQuestionIndex, logic } = spec;
        const { id: surveyId, questions } = hxSurvey.server(answerSurveyIndex);
        const question = questions[answerQuestionIndex];
        let rule;
        if (logic === 'equals' || logic === 'not-equals') {
            rule = answerer.answerQuestion(question);
        } else {
            rule = { questionId: question.id };
        }
        Object.assign(rule, { surveyId, logic });
        Object.assign(patch, { enableWhen: [rule] });
    },
    deleteSurveyEnableWhenElement(patch, generator, spec) {
        const { index } = spec;
        patch.enableWhen.splice(index, 1);
    },
    deleteSurveyEnableWhen(patch) {
        delete patch.enableWhen; // eslint-disable-line no-param-reassign
    },
    patchSurvey(patch, generator, spec) {
        Object.assign(patch, spec.patch);
    },
    patchQuestion(patch, generator, spec) {
        const question = patch.questions[spec.questionIndex];
        Object.assign(question, spec.patch);
        Object.keys(spec.patch).forEach((key) => {
            if (spec.patch[key] === null) {
                delete question[key];
            }
        });
    },
    patchQuestionChoice(patch, generator, spec) {
        const question = patch.questions[spec.questionIndex];
        const choice = question.choices[spec.questionChoiceIndex];
        Object.assign(choice, spec.patch);
    },
    arrange(patch, generator, spec) {
        const questions = patch.questions;
        const newQuestions = spec.arrangement.map((index) => {
            if (index === 'n') {
                const question = generator.generator.newQuestion();
                question.required = false;
                return question;
            }
            return questions[index];
        });
        Object.assign(patch, { questions: newQuestions });
    },
    addChoices(patch, generator, spec) {
        const { questionIndex, newChoiceCount } = spec;
        const questionGenerator = generator.generator.questionGenerator;
        const newChoices = questionGenerator.newChoices(newChoiceCount);
        const newQxChoices = newChoices.map(ch => ({ text: ch }));
        const { choices } = patch.questions[questionIndex];
        if (choices) {
            choices.push(...newQxChoices);
        } else {
            Object.assign(patch.questions[questionIndex], { choices: newQxChoices });
        }
    },
};

const checkAndCopyEnableWhenId = function (enableWhen, patchedEnableWhen) {
    const enableWhenNoId = enableWhen.map(rule => _.omit(rule, 'id'));
    const patchedEnableWhenNoId = patchedEnableWhen.map(rule => _.omit(rule, 'id'));
    expect(enableWhenNoId).to.deep.equal(patchedEnableWhenNoId);
    patchedEnableWhen.forEach((rule, ruleIndex) => {
        Object.assign(enableWhen[ruleIndex], { id: rule.id });
    });
};

const patchComparators = {
    enableWhenCommon(spec, survey, surveyPatch, patchedSurvey) {
        const { questionIndex } = spec;
        const questionPatch = surveyPatch.questions[questionIndex];
        const patchedQuestion = patchedSurvey.questions[questionIndex];
        const serverQuestionMap = survey.questions.reduce((r, question) => {
            r[question.id] = question;
            return r;
        }, {});
        comparator.enableWhen(questionPatch, patchedQuestion, { serverQuestionMap });
        const question = survey.questions[questionIndex];
        question.enableWhen = patchedQuestion.enableWhen;
    },
    enableWhenRaw(spec, survey, surveyPatch, patchedSurvey) {
        patchComparators.enableWhenCommon(spec, survey, surveyPatch, patchedSurvey);
    },
    enableWhen(spec, survey, surveyPatch, patchedSurvey) {
        patchComparators.enableWhenCommon(spec, survey, surveyPatch, patchedSurvey);
    },
    deleteEnableWhenElement(spec, survey, surveyPatch, patchedSurvey) {
        const { questionIndex, index } = spec;
        const question = survey.questions[questionIndex];
        const enableWhen = question.enableWhen;
        enableWhen.splice(index, 1);
        checkAndCopyEnableWhenId(enableWhen, patchedSurvey.questions[questionIndex].enableWhen);
    },
    deleteEnableWhen(spec, survey) {
        const { questionIndex } = spec;
        const question = survey.questions[questionIndex];
        delete question.enableWhen;
    },
    surveyEnableWhen(spec, survey, surveyPatch, patchedSurvey) {
        comparator.enableWhen(surveyPatch, patchedSurvey);
        expect(survey.enableWhen).not.deep.equal(patchedSurvey.enableWhen);
        Object.assign(survey, { enableWhen: patchedSurvey.enableWhen });
    },
    deleteSurveyEnableWhenElement(spec, survey, surveyPatch, patchedSurvey) {
        const { index } = spec;
        const enableWhen = survey.enableWhen;
        enableWhen.splice(index, 1);
        checkAndCopyEnableWhenId(enableWhen, patchedSurvey.enableWhen);
    },
    deleteSurveyEnableWhen(spec, survey) {
        delete survey.enableWhen; // eslint-disable-line no-param-reassign
    },
    patchSurvey(spec, survey) {
        const actualPatch = _.omit(spec.patch, 'forceQuestions');
        Object.assign(survey, actualPatch);
    },
    patchQuestion(spec, survey, surveyPatch, patchedSurvey) {
        const question = survey.questions[spec.questionIndex];
        const keys = Object.keys(spec.patch);
        const questionFields = _.pick(question, keys);
        const patchedQuestionFields = _.pick(patchedSurvey.questions[spec.questionIndex], keys);
        expect(questionFields).not.deep.equal(patchedQuestionFields);
        Object.assign(question, spec.patch);
        keys.forEach((key) => {
            if (spec.patch[key] === null) {
                delete question[key];
            }
        });
    },
    patchQuestionChoice(spec, survey, surveyPatch, patchedSurvey) {
        const question = survey.questions[spec.questionIndex];
        const choice = question.choices[spec.questionChoiceIndex];
        const patchedQuestion = patchedSurvey.questions[spec.questionIndex];
        const patchedChoice = patchedQuestion.choices[spec.questionChoiceIndex];
        expect(choice).not.deep.equal(patchedChoice);
        Object.assign(choice, spec.patch);
    },
    arrange(spec, survey, surveyPatch, patchedSurvey) {
        const questions = survey.questions;
        const patchedQuestions = patchedSurvey.questions;
        const questionsPatch = surveyPatch.questions;
        spec.arrangement.forEach((index, newIndex) => {
            if (index === 'n') {
                const patchedQuestion = patchedQuestions[newIndex];
                comparator.question(questionsPatch[newIndex], patchedQuestion);
                return;
            }
            expect(questions[index]).to.deep.equal(patchedQuestions[newIndex]);
        });
        Object.assign(survey, { questions: patchedQuestions });
    },
    addChoices(spec, survey, surveyPatch, patchedSurvey) {
        const { questionIndex, newChoiceCount } = spec;
        const question = survey.questions[questionIndex];
        const choices = question.choices;
        const patchedQuestion = patchedSurvey.questions[questionIndex];
        const patchedChoices = patchedQuestion.choices;
        const choiceCount = (choices && choices.length) || 0;
        const patchedCount = (patchedChoices && patchedChoices.length) || 0;
        expect(choiceCount + newChoiceCount).to.equal(patchedCount);
        const questionPatch = surveyPatch.questions[questionIndex];
        comparator.question(questionPatch, patchedQuestion);
        if (choices) {
            choices.length = 0;
            choices.push(...patchedChoices);
        } else {
            question.choices = patchedChoices;
        }
    },
};

module.exports = class SurveyPatchGenerator {
    constructor({ hxSurvey, answerer, generator }) {
        this.hxSurvey = hxSurvey;
        this.answerer = answerer;
        this.generator = generator;
    }

    generateSurveyPatch(spec) {
        const { surveyIndex, mods } = spec;
        const survey = this.hxSurvey.server(surveyIndex);
        const surveyPatch = _.cloneDeep(survey);
        mods.forEach((mod) => {
            const handler = specHandler[mod.purpose];
            handler(surveyPatch, this, mod);
        });
        this.hxSurvey.patches[surveyIndex] = surveyPatch;
        return surveyPatch;
    }

    compareAndReplace(spec, patchedSurvey) {
        const { surveyIndex, mods } = spec;
        const survey = this.hxSurvey.server(surveyIndex);
        const surveyPatch = this.hxSurvey.patches[surveyIndex];
        mods.forEach((mod) => {
            const patchComparator = patchComparators[mod.purpose];
            patchComparator(mod, survey, surveyPatch, patchedSurvey);
        });
        expect(survey).to.deep.equal(patchedSurvey);
    }
};
