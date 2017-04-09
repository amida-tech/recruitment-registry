'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const travelSurvey = {
    name: 'Canada Travel Survey',
    sections: [{
        questions: [{ // 0
            text: 'Did you travel to Canada before?',
            required: true,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
        }, { // 1
            text: 'Would you like to travel to Canada in the future?',
            required: true,
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            enableWhen: [{
                questionIndex: 0,
                logic: 'equals',
                answer: {
                    code: '2',
                },
            }],
        }],
    }, {
        name: 'Canadian Experience',
        enableWhen: [{
            questionIndex: 0,
            logic: 'equals',
            answer: {
                code: '1',
            },
        }],
        questions: [{ // 2
            text: 'How do you rate your experience?',
            required: true,
            type: 'choice-ref',
            choiceSetReference: 'rating',
            sections: [{
                questions: [{ // 3
                    text: 'Please describe the best experiences during your visit.',
                    type: 'text',
                    required: true,
                    enableWhen: [{
                        questionIndex: 2,
                        logic: 'equals',
                        answer: {
                            code: '1',
                        },
                    }, {
                        questionIndex: 2,
                        logic: 'equals',
                        answer: {
                            code: '2',
                        },
                    }],
                }],
            }, {
                questions: [{ // 4
                    text: 'Please describe how could your experience be better?',
                    type: 'text',
                    required: true,
                    enableWhen: [{
                        questionIndex: 2,
                        logic: 'equals',
                        answer: {
                            code: '3',
                        },
                    }, {
                        questionIndex: 2,
                        logic: 'equals',
                        answer: {
                            code: '4',
                        },
                    }],
                }],
            }],
        }],
    }, {
        name: 'Canadian Offerings',
        enableWhen: [{
            questionIndex: 0,
            logic: 'equals',
            answer: {
                code: '2',
            },
        }, {
            questionIndex: 1,
            logic: 'equals',
            answer: {
                code: '1',
            },
        }],
        questions: [{ // 5
            text: 'What experience are you looking for?',
            required: true,
            type: 'choice',
            choices: [{
                text: 'Food',
            }, {
                text: 'Architecture',
            }, {
                text: 'Hiking',
            }, {
                text: 'Water Sports',
            }],
            sections: [{
                questions: [{ // 6
                    text: 'Select on of the following cities.',
                    type: 'choice',
                    required: true,
                    enableWhen: [{
                        questionIndex: 5,
                        logic: 'equals',
                        answer: {
                            choiceText: 'Food',
                        },
                    }, {
                        questionIndex: 5,
                        logic: 'equals',
                        answer: {
                            choiceText: 'Architecture',
                        },
                    }],
                    oneOfChoices: ['Vancouver', 'Toronto', 'Montreal'],
                }],
            }, {
                questions: [{ // 7
                    text: 'Select on the following cities?',
                    type: 'choice',
                    required: true,
                    enableWhen: [{
                        questionIndex: 5,
                        logic: 'equals',
                        answer: {
                            choiceText: 'Hiking',
                        },
                    }, {
                        questionIndex: 5,
                        logic: 'equals',
                        answer: {
                            choiceText: 'Water Sports',
                        },
                    }],
                    oneOfChoices: ['Edmonton', 'Calgary', 'Saskatoon'],
                }],
            }],
        }],
    }],
};

module.exports = {
    travelSurvey,
};
