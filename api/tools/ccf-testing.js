'use strict';

const _ = require('lodash');

const ccf = require('../import/ccf');

const filepaths = {
    pillars: '/Work/CCF/Pillars.csv',
    questions: '/Work/CCF/Questions.csv',
    //hb_answer: '/Work/CCF/ExampleData/public_hb_answer.csv',
    //hb_assessment: '/Work/CCF/ExampleData/public_hb_assessment.csv',
    //hb_score: '/Work/CCF/ExampleData/public_hb_score.csv',
    //hb_score_history: '/Work/CCF/ExampleData/public_hb_score_history.csv',
    //hb_user: '/Work/CCF/ExampleData/public_hb_user.csv',
    //hb_wearable: '/Work/CCF/ExampleData/public_hb_wearable.csv',
    //id_profile: '/Work/CCF/ExampleData/public_id_profile.csv',
    //id_user: '/Work/CCF/ExampleData/public_id_user.csv'
};

ccf.importFiles(filepaths)
    .then(result => {
        console.log('Succcess:');
        console.log('========');
        console.log(JSON.stringify(result.pillars, undefined, 4));

        //const answersByAssessment = _.groupBy(result.hb_answer, 'hb_assessment_id');
        //const assessments = Object.keys(answersByAssessment);
        //assessments.forEach(assessment => {
        //    const current = answersByAssessment[assessment];
        //    answersByAssessment[assessment] = _.groupBy(current, 'pillar_hash');
        //});
        //console.log(JSON.stringify(answersByAssessment, undefined, 4));
        process.exit(0);
    })
    .catch(err => {
        console.log('Failure:');
        console.log('========');
        console.log(err);
        process.exit(1);
    });
