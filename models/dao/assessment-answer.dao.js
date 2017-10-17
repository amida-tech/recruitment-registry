'use strict';

const Base = require('./base');

module.exports = class AnswerAssessmentDAO extends Base {
    constructor(db, dependencies) {
        super(db);
        Object.assign(this, dependencies);
    }

    createAssessmentAnswers(input) {
        return this.answer.createAnswers(input);
    }

    copyAssessmentAnswers(input) {
        return this.answer.copyAnswers(input);
    }

    getAssessmentAnswers(masterIndex) {
        return this.answer.getAnswers(masterIndex);
    }
};
