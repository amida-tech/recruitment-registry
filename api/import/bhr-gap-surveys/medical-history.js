'use strict';

const yesNoQuestion = function (answerIdentifier, text) {
	return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes' },
            { text: 'No' }
        ]
    };
};

const declineYesNoQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'choice',
        answerIdentifier,
        choices: [
            { text: 'Yes' },
            { text: 'No' },
            { text: 'Decline to answer' }
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

const integerQuestion = function (answerIdentifier, text) {
    return {
        text,
        required: false,
        type: 'integer',
        answerIdentifier
    };
};

const commonText = 'Please indicate whether you currently have or have had any of the following conditions in the past. ';

module.exports = {
    name: 'MedicalHistory',
    questions: [
        yesNoQuestion('QID1_1', commonText + 'Parkinson\'s disease'),
        yesNoQuestion('QID1_2', commonText + 'Movement disorder'),
        yesNoQuestion('QID1_3', commonText + 'Stroke'),
    	yesNoQuestion('QID1_4', commonText + 'Motor neuron disease'),
    	yesNoQuestion('QID1_5', commonText + 'Dementia'),
    	yesNoQuestion('QID1_6', commonText + 'Heart disease'),
    	yesNoQuestion('QID1_7', commonText + 'High blood pressure'),
    	yesNoQuestion('QID1_8', commonText + 'High cholesterol'),
    	yesNoQuestion('QID1_9', commonText + 'Diabetes'),
    	yesNoQuestion('QID1_10', commonText + 'Cancer'),
    	yesNoQuestion('QID1_12', commonText + 'Alzheimer\'s Disease'),
        yesNoQuestion('QID1_13', commonText + 'Mild Cognitive Impairment'),
        yesNoQuestion('QID1_14', commonText + 'Traumatic Brain Injury'),
        yesNoQuestion('QID1_15', commonText + 'Lung Disease'),
        yesNoQuestion('QID1_16', commonText + 'Asthma'),
        yesNoQuestion('QID1_17', commonText + 'Arthritis'),
        yesNoQuestion('QID1_18', commonText + 'Concussion'),
        yesNoQuestion('QID1_19', commonText + 'Epilepsy or Seizures'),
        yesNoQuestion('QID1_20', commonText + 'Hearing Loss'),
        yesNoQuestion('QID1_21', commonText + 'Multiple Sclerosis (MS)'),
        yesNoQuestion('QID1_22', commonText + 'Frontotemporal Dementia (FTD)'),
        yesNoQuestion('QID1_23', commonText + 'Lewy Body Disease (LBD)'),
        yesNoQuestion('QID1_24', commonText + 'Essential Tremor'),
        yesNoQuestion('QID1_25', commonText + 'Huntington\'s disease'),
        yesNoQuestion('QID1_26', commonText + 'Amyotrophic lateral sclerosis (ALS)'),
        declineYesNoQuestion('QID33', 'Have you been diagnosed with human immunodeficiency virus (HIV)?'),
        integerQuestion('QID13', 'How long did you experience the alcohol abuse in years?'),
        integerQuestion('QID15', 'How long has it been in years since you stopped the alcohol abuse? If you still abuse alcohol please write 0'),
        integerQuestion('QID16', 'Please write the average number of drinks you would have on a typical day during the period when you abused alcohol (1 drink would equal either 4 oz of wine, 12 ounces beer or 1 oz of liquor) Please only write the number of drinks'),
        yesNoQuestion('QID17', 'Please indicate whether you currently have or had experienced drug abuse in the past'),
        integerQuestion('QID18', 'How long did you experience the drug abuse in years?'),
        integerQuestion('QID19', 'How long has it been in years since you stopped the drug abuse? If you still abuse drugs please write 0'),
        yesNoQuestion('QID20', 'Please indicate whether you currently smoke tobacco or have smoked tobacco in the past'),
        integerQuestion('QID21', 'How long did you smoke tobacco, in years?'),
        integerQuestion('QID22', 'How long has it been in years since you stopped smoking tobacco? If you still smoke please write 0'),
        integerQuestion('QID23', 'Please write the average number of cigarettes you would have on a typical day during the period when you smoked'),
        yesNoQuestion('QID2', 'Is chronic pain a problem for you?'),
        integerQuestion('QID3_1', 'Please indicate how severe your pain is from 1-10 (10 is the most severe) Severity of Pain'),
        yesNoQuestion('QID4', 'Have you ever been diagnosed with sleep apnea?'),
        yesNoQuestion('QID6', 'Do you have allergies?'), {
            text: 'If Yes, what kind of allergies did/do you have? (what food,  medicine or substance are you allergic to?) We have provided a number of fields so that you can list your allergies',
            instruction: 'Food, medicine or substance',
            required: true,
            type: 'text',
            multiple: true,
            maxCount: 5,
            answerIdentifiers: ['QID7_1_TEXT', 'QID7_2_TEXT', 'QID7_3_TEXT', 'QID7_4_TEXT', 'QID7_5_TEXT']
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
        extendedYesNoQuestion('QID24_1', 'Do you currently have... A cardiac pacemaker/defibrillator?'),
        extendedYesNoQuestion('QID24_2', 'Do you currently have... Any surgical metal or any foreign objects in your body?'),
        extendedYesNoQuestion('QID24_3', 'Do you currently have... Any stents, filter, or intravascular coils?'),
        extendedYesNoQuestion('QID24_4', 'Do you currently have... Internal pacing wires?'),
        extendedYesNoQuestion('QID24_5', 'Do you currently have... Sternum wires?'),
        extendedYesNoQuestion('QID24_6', 'Do you currently have... Claustrophobia?'),
        yesNoQuestion('QID31', 'Have you worked extensively with metal (grinding, welding, etc.)?'),
        yesNoQuestion('QID32', 'Have you had a previous MRI scan?'),
    ]
};
