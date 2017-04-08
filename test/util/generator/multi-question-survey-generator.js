'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const SurveyGenerator = require('./survey-generator');

const patterns = [
    'MSSS', 'SMSMS', 'MSSSMMM', 'SSSM', 'MMSSS', 'MSMSM', 'SMMSSS',
];

module.exports = class MultiQuestionSurveyGenerator extends SurveyGenerator {
    constructor(questionGenerator, predecessor) {
        super(questionGenerator, predecessor);
        this.patternIndex = 0;
    }

    newSurvey() {
        const result = this.newBody();
        this.patternIndex += 1;
        const pattern = patterns[this.patternIndex % patterns.length];
        result.questions = pattern.split('').map((code, index) => {
            let question;
            if (code === 'M') {
                question = this.questionGenerator.newMultiQuestion();
            }
            if (code === 'S') {
                question = this.questionGenerator.newQuestion();
            }
            return this.newSurveyQuestion(index, question);
        });
        return result;
    }
};
