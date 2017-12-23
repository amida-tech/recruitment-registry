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
//}, { // ^8, v 9
//    surveyIndex: 6,
//    mods: [{
//        purpose: 'patchSurvey',
//        patch: { forceQuestions: true },
//    }, {
//        purpose: 'addChoices',
//        questionIndex: 3,
//        newChoiceCount: 4,
//    }, {
//        questionIndex: 5,
//        purpose: 'enableWhenRaw',
//        logic: 'equals',
//        relativeIndex: 2,
//        choiceIndex: 6,
//    }],
}];
