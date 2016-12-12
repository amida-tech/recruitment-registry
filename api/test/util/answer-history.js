'use strict';

const _ = require('lodash');

const History = require('./history');
const Generator = require('./generator');
const jsutil = require('./test-jsutil');

class AnswerHistory {
    constructor() {
        this.hxAnswers = {};
        this.hxUser = new History();
        this.hxQuestion = new History();
        this.hxSurvey = new History();
        this.generator = new Generator();
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

    _updateHxAnswers(key, qxIndices, answers, language) {
        const hx = this.hxAnswers[key] || (this.hxAnswers[key] = []);
        const qxAnswers = answers.reduce((r, answer, index) => {
            const qxIndex = qxIndices[index];
            if (qxIndex >= 0) {
                const result = _.cloneDeep(answer);
                result.language = language || 'en';
                r[qxIndex] = result;
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
                    const numValues = ['textValue', 'monthValue', 'yearValue', 'dayValue', 'integerValue', 'boolValue'].reduce((r, p) => {
                        if (choice.hasOwnProperty(p)) {
                            ++r;
                        }
                        return r;
                    }, 0);
                    if (!numValues) {
                        choice.boolValue = true;
                    }
                });
            }
        });
        return result;
    }

    _key(userIndex, surveyIndex) {
        return `${userIndex}_${surveyIndex}`;
    }

    generateAnswers(userIndex, surveyIndex, qxIndices) {
        const key = this._key(userIndex, surveyIndex);
        const answers = qxIndices.map(qxIndex => this.generateAnswer(qxIndex));
        const language = this.generator.nextLanguage();
        this._updateHxAnswers(key, qxIndices, answers, language);
        return { answers, language };
    }

    expectedAnswers(userIndex, surveyIndex) {
        const key = this._key(userIndex, surveyIndex);
        const expectedAnswers = this._pullExpectedAnswers(key);
        const modifiedAnswers = AnswerHistory.prepareClientAnswers(expectedAnswers);
        return _.sortBy(modifiedAnswers, 'questionId');
    }

    expectedRemovedAnswers(userIndex, surveyIndex) {
        const key = this._key(userIndex, surveyIndex);
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
