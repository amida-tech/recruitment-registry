'use strict';

module.exports = [{
    surveyIndex: 0,
    mods: [{
        questionIndex: 5,
        purpose: 'enableWhenRaw',
        logic: 'equals',
        relativeIndex: 1,
    }],
}, { // ^ 0, v 1
    surveyIndex: 0,
    mods: [{
        questionIndex: 5,
        purpose: 'enableWhen',
        logic: 'equals',
        relativeIndex: 1,
    }],
}, { // ^ 1, v 2
    surveyIndex: 1,
    mods: [{
        questionIndex: 3,
        purpose: 'deleteEnableWhenElement',
        index: 0,
    }, {
        questionIndex: 5,
        purpose: 'deleteEnableWhen',
    }],
}, { // ^ 2, v 3
    surveyIndex: 1,
    mods: [{
        purpose: 'surveyEnableWhen',
        logic: 'exists',
        answerSurveyIndex: 0,
        answerQuestionIndex: 0,
    }],
}, { // ^ 3, v 4
    surveyIndex: 2,
    mods: [{
        purpose: 'deleteSurveyEnableWhen',
    }],
}, { // ^ 4, v 5
    surveyIndex: 3,
    mods: [{
        purpose: 'surveyEnableWhen',
        logic: 'equals',
        answerSurveyIndex: 1,
        answerQuestionIndex: 2,
    }],
}, { // ^ 5, v 6
    surveyIndex: 4,
    mods: [{
        purpose: 'deleteSurveyEnableWhenElement',
        index: 1,
    }],
}, { // ^ 6, v 7
    surveyIndex: 5,
    mods: [{
        purpose: 'patchSurvey',
        patch: { forceQuestions: true },
    }, {
        purpose: 'patchQuestion',
        questionIndex: 1,
        patch: { text: 'other', meta: { property: 15 } },
    }, {
        purpose: 'patchQuestionChoice',
        questionIndex: 3,
        questionChoiceIndex: 2,
        patch: { text: 'patched text', code: 'recods' },
    }],
}, { // ^7, v 8
    surveyIndex: 5,
    mods: [{
        purpose: 'patchSurvey',
        patch: { forceQuestions: true },
    }, {
        purpose: 'arrange',
        arrangement: [2, 3, 4, 'n', 6, 1, 0, 'n'],
    }],
}, { // ^8, v 9
    surveyIndex: 6,
    mods: [{
        purpose: 'patchSurvey',
        patch: { forceQuestions: true },
    }, {
        purpose: 'addChoices',
        questionIndex: 3,
        newChoiceCount: 4,
    }, {
        questionIndex: 5,
        purpose: 'enableWhenRaw',
        logic: 'equals',
        relativeIndex: 2,
        choiceIndex: 6,
    }, {
        questionIndex: 4,
        purpose: 'patchQuestion',
        patch: {
            text: 'patch_4_6',
            instruction: 'instruction_4, 6',
        },
    }, {
        questionIndex: 0,
        purpose: 'patchQuestion',
        patch: {
            text: 'patch_0_6',
            instruction: null,
        },
    }],
}, { // ^9, v 10
    surveyIndex: 6,
    mods: [{
        questionIndex: 4,
        purpose: 'patchQuestion',
        patch: {
            scaleLimits: {
                min: 0,
                max: 10,
            },
        },
    }, {
        questionIndex: 5,
        purpose: 'patchQuestion',
        patch: {
            scaleLimits: {
                min: -9,
                max: 0,
            },
        },
    }],
}, { // ^10, v 11
    surveyIndex: 9,
    mods: [{
        purpose: 'addChoices',
        questionIndex: 2,
        newChoiceCount: 4,
    }, {
        purpose: 'addChoices',
        questionIndex: 5,
        newChoiceCount: 4,
    }],
}];
