'use strict';

const _ = require('lodash');

module.exports = class SurveyGenerator {
    constructor(questionGenerator) {
        this.questionGenerator = questionGenerator;
        this.surveyIndex = -1;
    }

    currentIndex() {
        return this.surveyIndex;
    }

    sectionType() {
        return this.surveyIndex % 3;
    }

    count() {
        const sectionType = this.sectionType();
        return sectionType ? 9 + sectionType - 1 : this.questionGenerator.types.length + 1;
    }

    newSurveyQuestion(index) {
        const question = this.questionGenerator.newQuestion();
        question.required = Boolean(index % 2);
        return question;
    }

    newSurvey() {
        const surveyIndex = ++this.surveyIndex;
        const name = `name_${surveyIndex}`;
        const result = { name };
        if (surveyIndex % 2 === 0) {
            result.description = `description_${surveyIndex}`;
        }
        const metaIndex = surveyIndex % 3;
        if (metaIndex > 0) {
            result.meta = {
                displayAsWizard: metaIndex === 1,
                saveProgress: metaIndex === 2
            };
        }
        const sectionType = this.surveyIndex % 3;
        const count = this.count();
        result.questions = _.range(count).map(index => this.newSurveyQuestion(index));
        if (sectionType) {
            const sections = Array(3);
            sections[0] = { name: 'section_0', indices: _.range(0, 6, 2) };
            sections[1] = { name: 'section_1', indices: _.range(1, 6, 2) };
            sections[2] = { name: 'section_2', indices: _.rangeRight(count - 3, count) };
            result.sections = sections;
        }
        return result;
    }

    newSurveyQuestionIds(questionIds) {
        const surveyIndex = ++this.surveyIndex;
        const name = `name_${surveyIndex}`;
        const result = { name };
        result.questions = questionIds.map(id => ({ id, required: Boolean(surveyIndex % 2) }));
        return result;
    }
};
