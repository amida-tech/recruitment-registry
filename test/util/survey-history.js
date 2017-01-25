'use strict';

const History = require('./history');

module.exports = class SurveyHistory extends History {
    constructor() {
        super(['id', 'name', 'description']);
    }

    listServersByScope(scope) {
        scope = scope || 'summary';
        if (scope === 'summary') {
            return this.listServers();
        }
        if (scope === 'export') {
            const result = this.listServers(['id', 'name', 'description', 'questions']);
            result.forEach(survey => {
                survey.questions = survey.questions.map(question => ({ id: question.id, required: question.required }));
            });
            return result;
        }
        throw new Error('survey scope not implemented.');
    }
};
