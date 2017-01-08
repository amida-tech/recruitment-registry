'use strict';

const problemQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        oneOfChoices: ['not experienced at all', 'no more of a problem', 'a mild problem', 'a moderate problem', 'a severe problem']
    };
};

const commonText = 'After a head injury or accident some people experience symptoms that can cause worry or nuisance. We would like to know if you now suffer any of the symptoms given below. Because many of these symptoms occur normally, we would like you to compare yourself now with before your head injury/injuries. For each symptom listed below please select the choice that most closely represents your answer. Compared with before the accident, do you now (i.e., over the past week) suffer from:';

module.exports = {
    name: 'Rivermead',
    questions: [{
        text: 'Whether or not questions were asked based on TBI History',
        required: false,
        type: 'boolean',
        answerIdentifier: 'Applicable'
    },
        problemQuestion('Headaches', commonText + 'Headaches'),
        problemQuestion('Dizziness', commonText + 'Feelings of dizziness'),
        problemQuestion('Nausea', commonText + 'Nausea and/or vomiting'),
        problemQuestion('NoiseSensitivity', commonText + 'Noise Sensitivity (easily upset by loud noise)'),
        problemQuestion('SleepDisturbance', commonText + 'Sleep disturbance'),
        problemQuestion('Fatigue', commonText + 'Fatigue, tiring more easily'),
        problemQuestion('Irritability', commonText + 'Being irritable, easily angered'),
        problemQuestion('Depression', commonText + 'Feeling depressed or tearful'),
        problemQuestion('Frustration', commonText + 'Feeling frustrated or impatient'),
        problemQuestion('Forgetfulness', commonText + 'Forgetfulness, poor memory'),
        problemQuestion('PoorConcentration', commonText + 'Poor Concentration'),
        problemQuestion('TakingLonger', commonText + 'Taking longer to think'),
        problemQuestion('BlurredVision', commonText + 'Blurred vision'),
        problemQuestion('LightSensitivity', commonText + 'Light sensitivity (easily upset by bright light)'),
        problemQuestion('DoubleVision', commonText + 'Double vision'),
        problemQuestion('Restlessness', commonText + 'Restlessness'),
        problemQuestion('Other1', commonText + 'Any other difficulties?'),
        problemQuestion('Other2', commonText + 'Any other difficulties?'),
    ]
};
