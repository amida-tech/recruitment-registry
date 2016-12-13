'use strict';

const _ = require('lodash');

const jsutil = require('./test-jsutil');
const MultiIndexStore = require('./multi-index-store');

module.exports = class AnswerHistory {
    constructor(generator, hxUser, hxSurvey, hxQuestion) {
        this.generator = generator;
        this.hxUser = hxUser;
        this.hxSurvey = hxSurvey;
        this.hxQuestion = hxQuestion;
        this.hxAnswers = new MultiIndexStore();
    }

    generateAnswer(questionIndex) {
        if (questionIndex < 0) {
            const questionId = this.hxQuestion.id(-questionIndex);
            return { questionId };
        } else {
            const question = this.hxQuestion.server(questionIndex);
            return this.generator.answerQuestion(question);
        }
    }

    updateHxAnswers(userIndex, surveyIndex, qxIndices, answers, language) {
        const qxAnswers = answers.reduce((r, answer, index) => {
            const qxIndex = qxIndices[index];
            if (qxIndex >= 0) {
                const result = _.cloneDeep(answer);
                result.language = language || 'en';
                r[qxIndex] = result;
            }
            return r;
        }, {});
        this.hxAnswers.push(userIndex, surveyIndex, { qxIndices, qxAnswers });
    }

    generateAnswers(userIndex, surveyIndex, qxIndices) {
        const answers = qxIndices.map(qxIndex => this.generateAnswer(qxIndex));
        const language = this.generator.nextLanguage();
        this.updateHxAnswers(userIndex, surveyIndex, qxIndices, answers, language);
        return { answers, language };
    }

    expectedAnswers(userIndex, surveyIndex) {
        const answersSpec = this.hxAnswers.getAll(userIndex, surveyIndex);
        const standing = jsutil.findStanding(_.map(answersSpec, 'qxIndices'));
        return standing.reduce((r, answerIndices, index) => {
            answerIndices.forEach((answerIndex) => {
                const answer = answersSpec[index].qxAnswers[answerIndex];
                r.push(answer);
            });
            return r;
        }, []);
    }

    expectedRemovedAnswers(userIndex, surveyIndex) {
        const answersSpec = this.hxAnswers.getAll(userIndex, surveyIndex);
        const removed = jsutil.findRemoved(_.map(answersSpec, 'qxIndices'));
        const result = removed.reduce((r, answerIndices, index) => {
            answerIndices.forEach((answerIndex) => {
                if (answerIndex.removed.length) {
                    const timeIndex = answerIndex.timeIndex;
                    const arr = r[timeIndex] || (r[timeIndex] = []);
                    const answers = answerIndex.removed.map(r => answersSpec[index].qxAnswers[r]);
                    arr.push(...answers);
                    arr.sort((a, b) => a.questionId - b.questionId);
                }
            });
            return r;
        }, {});
        return result;
    }
};
