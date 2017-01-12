'use strict';

const yesNoQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'No' },
            { text: 'Yes' }
        ]
    };
};

const extendedYesNoQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes' },
            { text: 'No' },
            { text: 'I don\'t know' },
            { text: 'Decline to answer' }
        ]
    };
};

const commonText = 'Please indicate which family member(s) have or had memory problems (including Alzheimer\'s and any other form of dementia) by clicking on the person/people below. ';

module.exports = {
    name: 'Early History',
    questions: [
        yesNoQuestion('QID47_4', commonText + 'Me'),
        yesNoQuestion('QID47_5', commonText + 'Mother'),
        yesNoQuestion('QID47_6', commonText + 'Father'),
        yesNoQuestion('QID47_7', commonText + 'M-Grandmother'),
        yesNoQuestion('QID47_8', commonText + 'F-Grandmother'),
        yesNoQuestion('QID47_9', commonText + 'M-Grandfather'),
        yesNoQuestion('QID47_10', commonText + 'F-Grandfather'),
        yesNoQuestion('QID47_11', commonText + 'Brother1'),
        yesNoQuestion('QID47_12', commonText + 'Brother2'),
        yesNoQuestion('QID47_13', commonText + 'Sister1'),
        yesNoQuestion('QID47_14', commonText + 'Sister2'),
        yesNoQuestion('QID47_15', commonText + 'M-Aunt1'),
        yesNoQuestion('QID47_16', commonText + 'M-Aunt2'),
        yesNoQuestion('QID47_17', commonText + 'M-Uncle1'),
        yesNoQuestion('QID47_18', commonText + 'M-Uncle2'),
        yesNoQuestion('QID47_19', commonText + 'F-Aunt1'),
        yesNoQuestion('QID47_20', commonText + 'F-Aunt2'),
        yesNoQuestion('QID47_21', commonText + 'F-Uncle1'),
        yesNoQuestion('QID47_22', commonText + 'F-Uncle2'),
        extendedYesNoQuestion('QID197', 'Are you known to carry a genetic mutation (PS1/PS2 or APP) that causes early onset Alzheimer\'s disease?'),
        extendedYesNoQuestion('QID198', 'Do you have a family member (parent, grandparent, sibling, or child) who is known to carry a genetic mutation (PS1/PS2 or APP) that causes early onset Alzheimer\'s disease?'),
        extendedYesNoQuestion('QID199', 'Did you begin to experience symptoms of Alzheimer\'s disease before age 60?'),
        extendedYesNoQuestion('QID200', 'Do you have a family member (parent, grandparent, sibling, or child) who began to experience symptoms of Alzheimer\'s disease before age 60?'),
        extendedYesNoQuestion('QID201', 'Are you known to be a carrier of an e4 allele of the apolipoprotein E (APOE) gene, which increases an individual\'s risk for developing late-onset Alzheimer disease?'),
        extendedYesNoQuestion('QID202', 'Do you have a family member (parent, grandparent, sibling, or child) who is known to be a carrier of an e4 allele of the apolipoprotein E (APOE) gene, which increases an individual\'s risk for developing late-onset Alzheimer disease?'),
    ]
};
