'use strict';

/* eslint func-names: 0, no-console: 0, no-param-reassign: 0, max-len: 0 */

module.exports = function (locals) {
    console.log(`------ start ${module.filename}`);

    const profileSurvey = {
        name: 'Alzheimer',
        questions: [{
            text: 'Gender',
            required: true,
            type: 'choice',
            oneOfChoices: ['male', 'female', 'other'],
        }, {
            text: 'Zip code',
            required: false,
            type: 'text',
        }, {
            text: 'Family history of memory disorders/AD/dementia?',
            required: true,
            type: 'bool',
        }, {
            text: 'How did you hear about us?',
            required: false,
            type: 'choices',
            choices: [
                { text: 'TV' },
                { text: 'Radio' },
                { text: 'Newspaper' },
                { text: 'Facebook/Google Ad/OtherInternet ad' },
                { text: 'Physician/nurse/healthcare professional' },
                { text: 'Caregiver' },
                { text: 'Friend/Family member' },
                { text: 'Other source', type: 'text' },
            ],
        }],
    };

    return locals.agent
        .post('http://localhost:9005/api/v1.0/profile-survey')
        .send(profileSurvey)
        .then((res) => {
            console.log(res.status); // 201
            console.log(res.body.id); // id of the profile survey
        })
        .then(() => {
            console.log(`------ end ${module.filename}`);
            return locals;
        });
};
