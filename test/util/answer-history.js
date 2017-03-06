'use strict';

const _ = require('lodash');

const toAnswerRecord = function (answers, language) {
    const remaining = answers.reduce((r, answer, index) => {
        if (answer.answer || answer.answers) {
            r[answer.questionId] = index;
        }
        return r;
    }, {});
    language = language || 'en';
    answers = answers.map((answer) => {
        const r = Object.assign({ language }, answer);
        return r;
    });
    return { remaining, answers, removed: {} };
};

module.exports = class AnswerHistory {
    constructor() {
        this.historyIndexMap = new Map();
        this.store = [];
    }

    static key(userIndex, surveyIndex) {
        return `${userIndex}-${surveyIndex}`;
    }

    updateRecords(userIndex, surveyIndex, answers) {
        const records = this.getAll(userIndex, surveyIndex);
        const timeIndex = records.length;
        records.forEach((record) => {
            const remaining = record.remaining;
            const removed = record.removed;
            answers.forEach(({ questionId }) => {
                if (Object.prototype.hasOwnProperty.call(remaining, questionId)) {
                    delete remaining[questionId];
                    removed[questionId] = timeIndex;
                }
            });
        });
    }

    push(userIndex, surveyIndex, answers, language) {
        this.updateRecords(userIndex, surveyIndex, answers);
        const key = AnswerHistory.key(userIndex, surveyIndex);
        let indexHistory = this.historyIndexMap.get(key);
        if (indexHistory === undefined) {
            indexHistory = [];
            this.historyIndexMap.set(key, indexHistory);
        }
        const index = this.store.length;
        const record = toAnswerRecord(answers, language);
        const value = Object.assign({ userIndex, surveyIndex }, record);
        this.store.push(value);
        indexHistory.push(index);
    }

    getLast(userIndex, surveyIndex) {
        const all = this.getAll(userIndex, surveyIndex);
        const length = all.length;
        return all[length - 1];
    }

    getAll(userIndex, surveyIndex) {
        const key = AnswerHistory.key(userIndex, surveyIndex);
        const keyIndices = this.historyIndexMap.get(key);
        if (!keyIndices) {
            return [];
        }
        return _.at(this.store, keyIndices);
    }

    listFlatForUser(userIndex) {
        return this.store.reduce((r, record) => {
            if (record.userIndex === userIndex) {
                const { surveyIndex, answers, remaining } = record;
                const remainingAnswers = answers.filter(({ questionId }) => Object.prototype.hasOwnProperty.call(remaining, questionId));
                if (remainingAnswers.length) {
                    r.push({ surveyIndex, answers: remainingAnswers });
                }
            }
            return r;
        }, []);
    }

    expectedAnswers(userIndex, surveyIndex) {
        const records = this.getAll(userIndex, surveyIndex);
        const result = records.reduce((r, { remaining, answers }) => {
            if (!remaining) {
                r.push(...answers);
                return r;
            }
            answers.forEach((answer) => {
                const questionId = answer.questionId;
                if (Object.prototype.hasOwnProperty.call(remaining, questionId)) {
                    r.push(answer);
                }
            });
            return r;
        }, []);
        return result;
    }

    expectedRemovedAnswers(userIndex, surveyIndex) {
        const records = this.getAll(userIndex, surveyIndex);
        const result = records.reduce((r, { removed, answers }) => {
            answers.forEach((answer) => {
                const questionId = answer.questionId;
                const timeIndex = removed[questionId];
                if (timeIndex !== undefined) {
                    if (r[timeIndex] === undefined) {
                        r[timeIndex] = [];
                    }
                    r[timeIndex].push(answer);
                }
            });
            return r;
        }, {});
        return result;
    }
};
