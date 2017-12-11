'use strict';

const example = {
    name: 'Example',
    description: 'This is an example',
    questions: [{
        text: 'Which sports do you like?',
        required: false,
        isIdentifying: false,
        type: 'choices',
        choices: [
            { text: 'Football' },
            { text: 'Basketball' },
            { text: 'Soccer' },
            { text: 'Tennis' },
        ],
    }, {
        text: 'What is your hair color?',
        required: true,
        isIdentifying: false,
        type: 'choice',
        choices: [
            { text: 'Black' },
            { text: 'Brown' },
            { text: 'Blonde' },
            { text: 'Other' },
        ],
    }, {
        text: 'Where were you born?',
        required: true,
        isIdentifying: false,
        type: 'text',
    }, {
        text: 'Are you injured?',
        required: false,
        isIdentifying: false,
        type: 'bool',
    }, {
        text: 'Do you have a cat?',
        required: true,
        isIdentifying: false,
        type: 'bool',
    }],
};

const exampleAnswer = [{
    choices: [{ index: 1 }, { index: 2 }],
}, {
    choice: 0,
}, {
    textValue: 'Washington, DC',
}, {
    boolValue: true,
}, {
    boolValue: false,
}];

const exampleReanswer = [{
    choices: [{ index: 2 }, { index: 3 }],
}, {
    choice: 2,
}, {
    textValue: 'Boston, MA',
}, {
    boolValue: false,
}, {
    boolValue: true,
}];

const exampleTranslation = {
    name: 'Ejemplo',
    description: 'Esto es un ejemplo',
};

const exampleQxTranslation = [{
    text: 'Que deportes te gustan?',
    choices: [
        { text: 'Fútbol Americano' },
        { text: 'Baloncesto' },
        { text: 'Fútbol' },
        { text: 'Tenis' },
    ],
}, {
    text: 'Cual es tu color de cabello?',
    choices: [
        { text: 'Negro' },
        { text: 'Marrón' },
        { text: 'Rubia' },
        { text: 'Otro' },
    ],
}, {
    text: 'Donde naciste?',
}, {
    text: 'Estás lastimado?',
}, {
    text: 'Tienes un gato?',
}];

const alzheimer = {
    name: 'Alzheimer',
    questions: [{
        text: 'Ethnicity',
        required: true,
        isIdentifying: false,
        type: 'choice',
        oneOfChoices: [
            'Caucasian',
            'Hispanic',
            'African',
            'Asian',
        ],
    }, {
        text: 'Gender',
        required: true,
        isIdentifying: false,
        type: 'choice',
        oneOfChoices: ['male', 'female', 'other'],
    }, {
        text: 'Zip code',
        required: false,
        isIdentifying: false,
        type: 'text',
    }, {
        text: 'Family history of memory disorders/AD/dementia?',
        required: true,
        isIdentifying: false,
        type: 'bool',
    }, {
        text: 'How did you hear about us?',
        required: false,
        isIdentifying: false,
        type: 'choices',
        choices: [
            { text: 'TV' },
            { text: 'Radio' },
            { text: 'Newspaper' },
            { text: 'Facebook/Google Ad/OtherInternet ad' },
            { text: 'Physician/nurse/healthcare professional' },
            { text: 'Caregiver' },
            { text: 'Friend/Family member' },
            { text: 'Community Event' },
            { text: 'Other source', type: 'text' },
        ],
    }, {
        text: 'Are you interested in receiving email updates on any of the following?',
        required: true,
        isIdentifying: false,
        type: 'choices',
        choices: [
            { text: 'Brain Health' },
            { text: 'Clinical Trials on Brain Health' },
        ],
    }, {
        text: 'Are you interested in participating in clinical trials?',
        required: false,
        isIdentifying: false,
        type: 'bool',
    }],
};

const alzheimerAnswer = [{
    choice: 1,
}, {
    choice: 1,
}, {
    textValue: '20850',
}, {
    boolValue: true,
}, {
    choices: [{ index: 0 }, { index: 5 }, { index: 8, textValue: 'Internet' }],
}, {
    choices: [{ index: 1 }],
}, {
    boolValue: true,
}];

const alzheimerReanswer = [{
    choice: 0,
}, {
    choice: 0,
}, {
    textValue: '20855',
}, {
    boolValue: true,
}, {
    choices: [{ index: 2 }, { index: 3 }, { index: 8, textValue: 'Metro Ad' }],
}, {
    choices: [{ index: 0 }, { index: 1 }],
}, {
    boolValue: false,
}];

const textOnlySurvey = {
    name: 'textOnlySurvey',
    questions: [{
        text: 'Text One',
        required: false,
        type: 'text',
    }],
};

module.exports = {
    example,
    exampleAnswer,
    exampleReanswer,
    exampleTranslation,
    exampleQxTranslation,
    alzheimer,
    alzheimerAnswer,
    alzheimerReanswer,
    textOnlySurvey,
};
