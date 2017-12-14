'use strict';

const _ = require('lodash');
const chai = require('chai');

const comparator = require('../comparator');

const expect = chai.expect;

const specHandler = {
    enableWhenRaw(patch, generator, spec) {
        const { questionIndex, relativeIndex, logic } = spec;
        const ruleQuestionIndex = questionIndex - relativeIndex;
        const rule = { questionIndex: ruleQuestionIndex, logic };
        const enableWhen = [rule];
        const question = patch.questions[questionIndex];
        question.enableWhen = enableWhen;
        if (logic === 'equals' || logic === 'not-equals') {
            const ruleQuestion = patch.questions[ruleQuestionIndex];
            rule.answer = generator.answerer.answerRawQuestion(ruleQuestion);
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
        const enableWhenNoId = enableWhen.map(rule => _.omit(rule, 'id'));
        const patchedQuestion = patchedSurvey.questions[questionIndex];
        const patchedEnableWhen = patchedQuestion.enableWhen;
        const patchedEnableWhenNoId = patchedEnableWhen.map(rule => _.omit(rule, 'id'));
        expect(enableWhenNoId).to.deep.equal(patchedEnableWhenNoId);
        patchedEnableWhen.forEach((rule, ruleIndex) => {
            enableWhen[ruleIndex].id = rule.id;
        });
    },
    deleteEnableWhen(spec, survey) {
        const { questionIndex } = spec;
        const question = survey.questions[questionIndex];
        delete question.enableWhen;
    },
};

module.exports = class SurveyPatchGenerator {
    constructor({ hxSurvey, answerer }) {
        this.hxSurvey = hxSurvey;
        this.answerer = answerer;
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
