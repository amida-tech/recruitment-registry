'use strict';

const _ = require('lodash');

const History = require('./entity-history');
const Generator = require('./entity-generator');
const jsutil = require('../../lib/jsutil');

class AnswerHistory {
    constructor(testQuestions) {
        this.testQuestions = testQuestions;
        this.hxAnswers = {};
        this.hxUser = new History();
        this.hxQuestion = new History();
        this.hxSurvey = new History();
        this.generator = new Generator();
    }

    _generateQxAnswer(questionIndex) {
        if (questionIndex < 0) {
            const question = this.hxQuestion.server(-questionIndex);
            return {
                questionId: question.id
            };
        } else {
            const question = this.hxQuestion.server(questionIndex);
            return this.generator.answerQuestion(question);
        }
    }

    _updateHxAnswers(key, qxIndices, answers) {
        const hx = this.hxAnswers[key] || (this.hxAnswers[key] = []);
        const qxAnswers = answers.reduce((r, answer, index) => {
            const qxIndex = qxIndices[index];
            if (qxIndex >= 0) {
                r[qxIndex] = answer;
            }
            return r;
        }, {});
        hx.push({ qxIndices, qxAnswers });
    }

    _pullExpectedAnswers(key) {
        const answersSpec = this.hxAnswers[key];
        const standing = jsutil.findStanding(_.map(answersSpec, 'qxIndices'));
        return standing.reduce((r, answerIndices, index) => {
            answerIndices.forEach((answerIndex) => {
                const answer = answersSpec[index].qxAnswers[answerIndex];
                r.push(answer);
            });
            return r;
        }, []);
    }

    static prepareClientAnswers(clientAnswers) {
        const result = _.cloneDeep(clientAnswers);
        result.forEach(({ answer }) => {
            if (answer.choices) {
                answer.choices.forEach((choice) => {
                    if (!(choice.hasOwnProperty('textValue') || choice.hasOwnProperty('boolValue'))) {
                        choice.boolValue = true;
                    }
                });
            }
        });
        return result;
    }

    _key(userIndex, surveyIndex, seqIndex) {
        return `${userIndex}_${surveyIndex}_${seqIndex}`;
    }

    generateAnswers(userIndex, surveyIndex, seqIndex, stepIndex) {
        const key = this._key(userIndex, surveyIndex, seqIndex);
        const qxIndices = this.testQuestions[surveyIndex].answerSequences[seqIndex][stepIndex];
        const answers = qxIndices.map(qxIndex => this._generateQxAnswer(qxIndex));
        this._updateHxAnswers(key, qxIndices, answers);
        return answers;
    }

    expectedAnswers(userIndex, surveyIndex, seqIndex) {
        const key = this._key(userIndex, surveyIndex, seqIndex);
        const expectedAnswers = this._pullExpectedAnswers(key);
        const modifiedAnswers = AnswerHistory.prepareClientAnswers(expectedAnswers);
        return _.sortBy(modifiedAnswers, 'questionId');
    }

    expectedRemovedAnswers(userIndex, surveyIndex, seqIndex) {
        const key = this._key(userIndex, surveyIndex, seqIndex);
        const answersSpec = this.hxAnswers[key];
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
}

module.exports = AnswerHistory;
