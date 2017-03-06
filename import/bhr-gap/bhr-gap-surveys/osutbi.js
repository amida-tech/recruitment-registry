'use strict';

const yesNoQuestion = function (identifier, text) {
    return {
        text,
        required: false,
        type: 'choice-ref',
        answerIdentifier: { type: 'bhr-gap-osutbi-column', value: identifier },
        choiceSetReference: 'yes-no-1-2',
    };
};

module.exports = {
    name: 'OSUTBI',
    identifier: {
        type: 'bhr-gap',
        value: 'osutbi',
    },
    questions: [
        yesNoQuestion('InjuryHospitalized', 'In your lifetime, have you ever been hospitalized or treated in an emergency room following an injury to your head or neck? Think about any childhood injuries you remember or were told about.'),
        yesNoQuestion('InjuryVehicular', 'n your lifetime, have you ever injured your head or neck in a car accident or from crashing some other moving vehicle like a bicycle, motorcycle or ATV?'),
        yesNoQuestion('InjuryAccident', 'In your lifetime, have you ever injured your head or neck in a fall or from being hit by something (for example, falling from a bike or horse, rollerblading, falling on ice, being hit by a rock)? Have you ever injured your head or neck playing sports or on the playground?'),
        yesNoQuestion('InjuryViolence', 'In your lifetime, have you ever injured your head or neck in a fight, from being hit by someone, or from being shaken violently? Have you ever been shot in the head?'),
        yesNoQuestion('InjuryExplosion', 'In your lifetime, have you ever been nearby when an explosion or a blast occurred? If you served in the military, think about any combat- or training-related incidents.'),
        yesNoQuestion('RepeatedImpacts', 'Have you ever had a period of time in which you experienced multiple, repeated impacts to your head (e.g. history of abuse, contact sports, military duty)?'),
    ],
};
