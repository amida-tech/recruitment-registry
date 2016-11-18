'use strict';

const ccf = require('../import/ccf');

const filepaths = {
    hb_answer: '/Work/CCF/ExampleData/public_hb_answer.csv',
    hb_assessment: '/Work/CCF/ExampleData/public_hb_assessment.csv',
    hb_score: '/Work/CCF/ExampleData/public_hb_score.csv',
    hb_score_history: '/Work/CCF/ExampleData/public_hb_score_history.csv',
    hb_user: '/Work/CCF/ExampleData/public_hb_user.csv',
    hb_wearable: '/Work/CCF/ExampleData/public_hb_wearable.csv',
    id_profile: '/Work/CCF/ExampleData/public_id_profile.csv',
    id_user: '/Work/CCF/ExampleData/public_id_user.csv'
};

ccf.importFiles(filepaths)
    .then(result => {
        console.log('Succcess:');
        console.log('========');
        console.log(JSON.stringify(result, undefined, 4));
        process.exit(0);
    })
    .catch(err => {
        console.log('Failure:');
        console.log('========');
        console.log(err);
        process.exit(1);
    });
