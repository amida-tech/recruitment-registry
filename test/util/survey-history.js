'use strict';

const _ = require('lodash');

const History = require('./history');
const models = require('../../models');

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
            const result = this.listServers(['id', 'name', 'description', 'questions', 'sections', 'status']);
            result.forEach((survey) => {
                const { questions, sections } = models.survey.flattenHierarchy(survey);
                const surveyUpdate = {};
                surveyUpdate.questions = questions.map(({ id, required }) => ({ id, required }));
                if (sections) {
                    surveyUpdate.sections = sections.map((section) => {
                        const r = _.pick(section, ['id', 'parentIndex', 'questionIndex']);
                        if (section.indices) {
                            r.indices = section.indices.join('~');
                        }
                        r.sectionId = r.id;
                        delete r.id;
                        return _.omitBy(r, _.isNil);
                    });
                }
                Object.assign(survey, surveyUpdate);
            });
            return result;
        }
        throw new Error('survey scope not implemented.');
    }
};
