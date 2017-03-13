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

    makeSectionExportReady({ id, questions, sections }) {
        const result = { id };
        if (questions) {
            result.questions = questions.map(({ id, required, sections: questionSections }) => {
                const q = { id, required };
                if (questionSections) {
                    q.sections = questionSections.map(section => this.makeSectionExportReady(section));
                }
                return q;
            });
            return result;
        }
        result.sections = sections.map(section => this.makeSectionExportReady(section));
        return result;
    }

    listServersByScope(options = {}) {
        const scope = options.scope || 'summary';
        if (scope === 'summary') {
            return this.listServers(undefined, undefined, options.status);
        }
        if (scope === 'export') {
            const result = this.listServers(['id', 'name', 'description', 'questions', 'sections', 'status']);
            result.forEach((survey) => {
                if (!survey.sections) {
                    const questions = survey.questions.map(({ id, required, sections: questionSections }) => {
                        const q = { id, required };
                        if (questionSections) {
                            q.sections = questionSections.map(section => this.makeSectionExportReady(section));
                        }
                        return q;
                    });
                    Object.assign(survey, { questions });
                    return;
                }
                const sections = survey.sections.map(section => this.makeSectionExportReady(section));
                Object.assign(survey, { sections });
            });
            return result;
        }
        throw new Error('survey scope not implemented.');
    }
};
