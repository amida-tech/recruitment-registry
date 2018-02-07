'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const _ = require('lodash');

const QuestionGenerator = require('./question-generator');
const constNames = require('../../../models/const-names');

const questionTypes = QuestionGenerator.questionTypes();

const sectionGenerators = {
    oneLevel(surveyQuestions) {
        const count = surveyQuestions.length;
        if (count < 8) {
            throw new Error('Not enough questions for sections.');
        }
        const sections = Array(3);
        sections[0] = { name: 'section_0', questions: _.range(0, 6, 2).map(index => surveyQuestions[index]) };
        sections[1] = { name: 'section_1', questions: _.range(1, 6, 2).map(index => surveyQuestions[index]) };
        sections[2] = { name: 'section_2', questions: _.rangeRight(count - 3, count).map(index => surveyQuestions[index]) };
        return sections;
    },
    oneLevelMissingName(surveyQuestions) {
        const sections = sectionGenerators.oneLevel(surveyQuestions);
        delete sections[0].name;
        delete sections[sections.length - 1].name;
        return sections;
    },
    twoLevel(surveyQuestions) {
        const sections = sectionGenerators.oneLevel(surveyQuestions);
        const lastIndex = sections.length - 1;
        sections[lastIndex].name = 'parent_1';
        return [
            { name: 'parent_0', sections: sections.slice(0, lastIndex) },
            sections[2],
        ];
    },
};

module.exports = class SurveyGenerator {
    constructor(questionGenerator, predecessor) {
        this.questionGenerator = questionGenerator || new QuestionGenerator();
        if (predecessor) {
            this.surveyIndex = predecessor.surveyIndex;
        } else {
            this.surveyIndex = -1;
        }
        this.sectionGenerators = ['twoLevel', 'oneLevelMissingName', 'oneLevel'].map(key => sectionGenerators[key]);
    }

    newSurveyGenerator(SurveyGeneratorClass) {
        return new SurveyGeneratorClass(this.questionGenerator, this);
    }

    currentIndex() {
        return this.surveyIndex;
    }

    incrementIndex() {
        this.surveyIndex += 1;
    }

    sectionType() {
        return this.surveyIndex % 4;
    }

    count() { // eslint-disable-line class-methods-use-this
        return null;
    }

    newSurveyQuestion(index, question) {
        if (!question) {
            question = this.questionGenerator.newQuestion();
        }
        question.isIdentifying = false;
        question.required = Boolean(index % 2);
        return question;
    }

    newBody() {
        this.surveyIndex += 1;
        const surveyIndex = this.surveyIndex;
        const name = `name_${surveyIndex}`;
        const result = { name };
        if (surveyIndex % 2 === 0) {
            result.description = `description_${surveyIndex}`;
        }
        const metaIndex = surveyIndex % 3;
        if (metaIndex > 0) {
            result.meta = {
                displayAsWizard: metaIndex === 1,
                saveProgress: metaIndex === 2,
            };
        }
        if (surveyIndex % 4 !== 1) {
            result.type = constNames.defaultSurveyType;
        }
        return result;
    }

    newSurvey(options = {}) {
        const result = this.newBody();
        if (options.status) {
            result.status = options.status;
        }
        if (options.type) {
            result.type = options.type;
        }
        const sectionType = options.noSection ? 0 : this.sectionType();
        let count = this.count();
        if (!count) {
            count = sectionType ? 10 : questionTypes.length + 1;
        }
        const surveyQuestions = _.range(count).map(index => this.newSurveyQuestion(index));
        const sectionGroup = this.surveyIndex % 8 >= 4;
        if (!options.noSection && !options.noQuestionGroup && sectionGroup) {
            const questionGroupIndex = (this.surveyIndex % 3) + 2;
            const sectionCount = 3 - (this.surveyIndex % 3);
            const sectionSurveyQuestions = _.range(sectionCount).map(index => this.newSurveyQuestion(index));
            surveyQuestions[questionGroupIndex].sections = [{ questions: [...sectionSurveyQuestions] }];
            if (this.surveyIndex % 2) {
                const r = _.range(sectionCount).map(index => this.newSurveyQuestion(index));
                surveyQuestions[questionGroupIndex].sections.push({ name: 'addl_section_name', questions: [...r] });
            }
        }
        if (!sectionType) {
            result.questions = surveyQuestions;
            return result;
        }
        result.sections = this.sectionGenerators[sectionType - 1](surveyQuestions);
        return result;
    }

    newSurveyQuestionIds(questionIds, options = {}) {
        this.surveyIndex += 1;
        const surveyIndex = this.surveyIndex;
        const name = `name_${surveyIndex}`;
        const result = { name };
        if (options.status) {
            result.status = options.status;
        }

        result.questions = questionIds.map((id) => {
            let required = Boolean(surveyIndex % 2);
            if (options.noneRequired) {
                required = false;
            }
            return { id, required, isIdentifying: false };
        });
        return result;
    }
};
