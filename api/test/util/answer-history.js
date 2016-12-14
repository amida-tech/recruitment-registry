'use strict';

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

    updateHxAnswers(userIndex, surveyIndex, answers, language) {
        const remaining = answers.reduce((r, answer, index) => {
            if (answer.answer) {
                r[answer.questionId] = index;
            }
            return r;
        }, {});
        language = language || 'en';
        answers = answers.map(answer => {
            const r = Object.assign({ language }, answer);
            return r;
        });
        this.hxAnswers.push(userIndex, surveyIndex, { remaining, answers, removed: {} });
    }

    generateAnswers(userIndex, surveyIndex, qxIndices) {
        const answers = qxIndices.map(qxIndex => this.generateAnswer(qxIndex));
        const answersSpecs = this.hxAnswers.getAll(userIndex, surveyIndex);
        const timeIndex = answersSpecs.length;
        answersSpecs.forEach(answersSpec => {
            const remaining = answersSpec.remaining;
            const removed = answersSpec.removed;
            answers.forEach(({ questionId }) => {
                if (remaining.hasOwnProperty(questionId)) {
                    delete remaining[questionId];
                    removed[questionId] = timeIndex;
                }
            });
        });
        const language = this.generator.nextLanguage();
        this.updateHxAnswers(userIndex, surveyIndex, answers, language);
        return { answers, language };
    }

    expectedAnswers(userIndex, surveyIndex) {
        const answersSpec = this.hxAnswers.getAll(userIndex, surveyIndex);
        const result = answersSpec.reduce((r, { remaining, answers }) => {
            if (!remaining) {
                r.push(...answers);
                return r;
            }
            answers.forEach(answer => {
                const questionId = answer.questionId;
                if (remaining.hasOwnProperty(questionId)) {
                    r.push(answer);
                }
            });
            return r;
        }, []);
        return result;
    }

    expectedRemovedAnswers(userIndex, surveyIndex) {
        const answersSpec = this.hxAnswers.getAll(userIndex, surveyIndex);
        const result = answersSpec.reduce((r, { removed, answers }) => {
            answers.forEach(answer => {
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
