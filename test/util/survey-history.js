'use strict';

const _ = require('lodash');

const History = require('./history');

module.exports = class SurveyHistory extends History {
    constructor() {
        super(['id', 'name', 'description', 'status']);
    }

    filterListServersByStatus(result, status = 'published') {
        if (status === 'all') {
            return result;
        }
        const filteredResult = result.reduce((r, survey) => {
            if (survey.status !== status) {
                return r;
            }
            const surveyCopy = _.cloneDeep(survey);
            delete surveyCopy.status;
            r.push(surveyCopy);
            return r;
        }, []);
        return filteredResult;
    }

    listServers(fields, indices, status) {
        const result = super.listServers(fields, indices);
        return this.filterListServersByStatus(result, status);
    }

    listTranslatedServers(language, status) {
        const result = super.listTranslatedServers(language);
        return this.filterListServersByStatus(result, status);
    }

    listServersByScope(options = {}) {
        const scope = options.scope || 'summary';
        if (scope === 'summary') {
            return this.listServers(undefined, undefined, options.status);
        }
        if (scope === 'export') {
            const result = this.listServers(['id', 'name', 'description', 'questions', 'status']);
            result.forEach(survey => {
                survey.questions = survey.questions.map(question => ({ id: question.id, required: question.required }));
            });
            return result;
        }
        throw new Error('survey scope not implemented.');
    }
};
