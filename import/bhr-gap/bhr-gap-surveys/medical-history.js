'use strict';

const extendedYesNoQuestion = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-medical-history-column', value: identifier },
        choiceSetReference: 'extended-yes-no',
    };
};

const yesNoQuestion = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-medical-history-column', value: identifier },
        choiceSetReference: 'yes-no-1-2',
    };
};

module.exports = {
    name: 'MedicalHistory',
    identifier: {
        type: 'bhr-gap',
        value: 'medical-history',
    },
    sections: [{
        name: 'Please indicate whether you currently have or have had any of the following conditions in the past.',
        questions: [{
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_1' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Parkinson\'s disease',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_2' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Movement disorder',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_3' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Stroke',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_4' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Motor neuron disease',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_5' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Dementia',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_6' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Heart disease',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_7' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'High blood pressure',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_8' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'High cholesterol',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_9' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Diabetes',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_10' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Cancer',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_12' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Alzheimer\'s Disease',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_13' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Mild Cognitive Impairment',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_14' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Traumatic Brain Injury',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_15' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Lung Disease',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_16' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Asthma',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_17' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Arthritis',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_18' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Concussion',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_19' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Epilepsy or Seizures',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_20' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Hearing Loss',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_21' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Multiple Sclerosis (MS)',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_22' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Frontotemporal Dementia (FTD)',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_23' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Lewy Body Disease (LBD)',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_24' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Essential Tremor',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_25' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Huntington\'s disease',
        }, {
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID1_26' },
            type: 'choice-ref',
            choiceSetReference: 'yes-no-1-2',
            required: false,
            text: 'Amyotrophic lateral sclerosis (ALS)',
        }],
    }, {
        questions: [{
            text: 'Have you been diagnosed with human immunodeficiency virus (HIV)?',
            type: 'choice-ref',
            required: false,
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID33' },
            choiceSetReference: 'yes-no-decline',
        }, {
            text: 'Please indicate whether you currently have or had experienced alcohol abuse in the past.',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID9' },
            choiceSetReference: 'yes-no-1-2',
                //skip: {
                //    count: 3,
                //    rule: {
                //        logic: 'not-equals',
                //        answer: { code: '1' }
                //    }
                //}
        }, {
            text: 'How long did you experience the drug abuse in years?',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID13' },
        }, {
            text: 'How long has it been in years since your stopped your alcohol abuse? If you still abuse alcohol please write 0.',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID15' },
        }, {
            text: 'Please write the average number of drinks you would have on a typical day during the period when you abused alcohol',
            instruction: '(1 drink would equal either 4 oz of wine, 12 ounces beer or 1 oz of liquor) Please only write the number of drinks',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID16' },
        }, {
            text: 'Please indicate whether you currently have or had experienced drug abuse in the past',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID17' },
            choiceSetReference: 'yes-no-1-2',
                //skip: {
                //    count: 2,
                //    rule: {
                //        logic: 'not-equals',
                //        answer: { code: '1' }
                //    }
                //}
        }, {
            text: 'Please indicate whether you currently have or had experienced drug abuse in the past',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID18' },
        }, {
            text: 'How long did you experience the drug abuse in years?',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID19' },
        }, {
            text: 'Please indicate whether you currently smoke tobacco or have smoked tobacco in the past',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID20' },
            choiceSetReference: 'yes-no-1-2',
                //skip: {
                //    count: 2,
                //    rule: {
                //        logic: 'not-equals',
                //        answer: { code: '1' }
                //    }
                //}
        }, {
            text: 'How long did you smoke tobacco, in years?',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID21' },
        }, {
            text: 'How long has it been in years since you stopped smoking tobacco? If you still smoke please write 0?',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID22' },
        }, {
            text: 'Please write the average number of cigarettes you would have on a typical day during the period when you smoked?',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID23' },
        }, {
            text: 'Is chronic pain a problem for you?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID2' },
            choiceSetReference: 'yes-no-1-2',
                //skip: {
                //    count: 2,
                //    rule: {
                //        logic: 'not-equals',
                //        answer: { code: '1' }
                //    }
                //}
        }, {
            text: 'Please indicate how severe your pain is from 1-10 (10 is the most severe) Severity of Pain?',
            required: false,
            type: 'text',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID3_1' },
        }, {
            text: 'Have you ever been diagnosed with sleep apnea?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID4' },
            choiceSetReference: 'yes-no-1-2',
        }, {
            text: 'Do you have allergies?',
            required: false,
            type: 'choice-ref',
            answerIdentifier: { type: 'bhr-gap-medical-history-column', value: 'QID6' },
            choiceSetReference: 'yes-no-1-2',
                //skip: {
                //    count: 1,
                //    rule: {
                //        logic: 'not-equals',
                //        answer: { code: '1' }
                //    }
                //}
        }, {
            text: 'If Yes, what kind of allergies did/do you have? (what food,  medicine or substance are you allergic to?) We have provided a number of fields so that you can list your allergies',
            instruction: 'Food, medicine or substance',
            required: true,
            type: 'text',
            multiple: true,
            maxCount: 5,
            answerIdentifiers: { type: 'bhr-gap-medical-history-column', values: ['QID7_1_TEXT', 'QID7_2_TEXT', 'QID7_3_TEXT', 'QID7_4_TEXT', 'QID7_5_TEXT'] },
        },
            yesNoQuestion('QID28#1_1', 'Current Major Depressive Disorder'),
            yesNoQuestion('QID28#1_3', 'Current Specific Phobia / Social Phobia'),
            yesNoQuestion('QID28#1_4', 'Current Obsessive Compulsive Disorder'),
            yesNoQuestion('QID28#1_5', 'Current Hoarding Disorder'),
            yesNoQuestion('QID28#1_6', 'Current Attention-Deficit / Hyperactivity Disorder'),
            yesNoQuestion('QID28#1_8', 'Current Post-Traumatic Stress Disorder'),
            yesNoQuestion('QID28#1_9', 'Current Generalized Anxiety Disorder'),
            yesNoQuestion('QID28#1_10', 'Current Panic Disorder'),
            yesNoQuestion('QID28#1_11', 'Current Bipolar Disorder'),
            yesNoQuestion('QID28#1_12', 'Current Autism'),
            yesNoQuestion('QID28#1_13', 'Current Schizophrenia'),
            yesNoQuestion('QID28#1_14', 'Current Eating Disorder'),
            yesNoQuestion('QID28#1_15', 'Current Psychosis'),
            yesNoQuestion('QID28#2_1', 'Past History Major Depressive Disorder'),
            yesNoQuestion('QID28#2_3', 'Past History Specific Phobia / Social Phobia'),
            yesNoQuestion('QID28#2_4', 'Past History Obsessive Compulsive Disorder'),
            yesNoQuestion('QID28#2_5', 'Past History Hoarding Disorder'),
            yesNoQuestion('QID28#2_6', 'Past History Attention-Deficit / Hyperactivity Disorder'),
            yesNoQuestion('QID28#2_8', 'Past History Post-Traumatic Stress Disorder'),
            yesNoQuestion('QID28#2_9', 'Past History Generalized Anxiety Disorder'),
            yesNoQuestion('QID28#2_10', 'Past History Panic Disorder'),
            yesNoQuestion('QID28#2_11', 'Past History Bipolar Disorder'),
            yesNoQuestion('QID28#2_12', 'Past History Autism'),
            yesNoQuestion('QID28#2_13', 'Past History Schizophrenia'),
            yesNoQuestion('QID28#2_14', 'Past History Eating Disorder'),
            yesNoQuestion('QID28#2_15', 'Past History Psychosis'),
            extendedYesNoQuestion('Q24_1', 'Do you currently have... A cardiac pacemaker/defibrillator?'),
            extendedYesNoQuestion('Q24_2', 'Do you currently have... Any surgical metal or any foreign objects in your body?'),
            extendedYesNoQuestion('Q24_3', 'Do you currently have... Any stents, filter, or intravascular coils?'),
            extendedYesNoQuestion('Q24_4', 'Do you currently have... Internal pacing wires?'),
            extendedYesNoQuestion('Q24_5', 'Do you currently have... Sternum wires?'),
            extendedYesNoQuestion('Q24_6', 'Do you currently have... Claustrophobia?'),
            yesNoQuestion('QID31', 'Have you worked extensively with metal (grinding, welding, etc.)?'),
            yesNoQuestion('QID32', 'Have you had a previous MRI scan?'),
        ],
    }],
};
