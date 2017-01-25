'use strict';

module.exports = {
    name: 'FamilyTree',
    identifier: {
        type: 'bhr-gap',
        value: 'family-tree'
    },
    questions: [{
        text: 'Please indicate which family member(s) have or had memory problems (including Alzheimer\'s and any other form of dementia) by clicking on the person/people below.',
        required: false,
        type: 'choices',
        enumeration: 'no-yes-1-2',
        choices: [{
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_4' },
            text: 'Me',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_5' },
            text: 'Mother',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_6' },
            text: 'Father',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_7' },
            text: 'M-Grandmother',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_8' },
            text: 'F-Grandmother',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_9' },
            text: 'M-Grandfather',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_10' },
            text: 'F-Grandfather',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_11' },
            text: 'Brother1',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_12' },
            text: 'Brother2',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_13' },
            text: 'Sister1',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_14' },
            text: 'Sister2',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_15' },
            text: 'M-Aunt1',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_16' },
            text: 'M-Aunt2',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_17' },
            text: 'M-Uncle1',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_18' },
            text: 'M-Uncle2',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_19' },
            text: 'F-Aunt1',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_20' },
            text: 'F-Aunt2',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_21' },
            text: 'F-Uncle1',
            type: 'enumeration'
        }, {
            answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID47_22' },
            text: 'F-Uncle2',
            type: 'enumeration'
        }]
    }, {
        answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID197' },
        text: 'Are you known to carry a genetic mutation (PS1/PS2 or APP) that causes early onset Alzheimer\'s disease?',
        required: false,
        type: 'enumeration',
        enumeration: 'extended-yes-no'
    }, {
        answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID198' },
        text: 'Do you have a family member (parent, grandparent, sibling, or child) who is known to carry a genetic mutation (PS1/PS2 or APP) that causes early onset Alzheimer\'s disease?',
        required: false,
        type: 'enumeration',
        enumeration: 'extended-yes-no'
    }, {
        answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID199' },
        text: 'Did you begin to experience symptoms of Alzheimer\'s disease before age 60?',
        required: false,
        type: 'enumeration',
        enumeration: 'extended-yes-no'
    }, {
        answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID200' },
        text: 'Do you have a family member (parent, grandparent, sibling, or child) who began to experience symptoms of Alzheimer\'s disease before age 60?',
        required: false,
        type: 'enumeration',
        enumeration: 'extended-yes-no'
    }, {
        answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID201' },
        text: 'Are you known to be a carrier of an e4 allele of the apolipoprotein E (APOE) gene, which increases an individual\'s risk for developing late-onset Alzheimer disease?',
        required: false,
        type: 'enumeration',
        enumeration: 'extended-yes-no'
    }, {
        answerIdentifier: { type: 'bhr-gap-family-tree-column', value: 'QID202' },
        text: 'Do you have a family member (parent, grandparent, sibling, or child) who is known to be a carrier of an e4 allele of the apolipoprotein E (APOE) gene, which increases an individual\'s risk for developing late-onset Alzheimer disease?',
        required: false,
        type: 'enumeration',
        enumeration: 'extended-yes-no'
    }]
};
