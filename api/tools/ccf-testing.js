'use strict';

const _ = require('lodash');

//const ccf = require('../import/ccf');

//const filepaths = {
//    pillars: '/Work/CCF/Pillars.csv',
//    questions: '/Work/CCF/Questions.csv',
//    //hb_answer: '/Work/CCF/ExampleData/public_hb_answer.csv',
//    //hb_assessment: '/Work/CCF/ExampleData/public_hb_assessment.csv',
//    //hb_score: '/Work/CCF/ExampleData/public_hb_score.csv',
//    //hb_score_history: '/Work/CCF/ExampleData/public_hb_score_history.csv',
//    //hb_user: '/Work/CCF/ExampleData/public_hb_user.csv',
//    //hb_wearable: '/Work/CCF/ExampleData/public_hb_wearable.csv',
//    //id_profile: '/Work/CCF/ExampleData/public_id_profile.csv',
//    //id_user: '/Work/CCF/ExampleData/public_id_user.csv'
//};
//
//ccf.importFiles(filepaths)
//    .then(result => {
//        console.log('Succcess:');
//        console.log('========');
//        console.log(JSON.stringify(result.questions, undefined, 4));
//        console.log(JSON.stringify(result.answers, undefined, 4));
//
//        //const answersByAssessment = _.groupBy(result.hb_answer, 'hb_assessment_id');
//        //const assessments = Object.keys(answersByAssessment);
//        //assessments.forEach(assessment => {
//        //    const current = answersByAssessment[assessment];
//        //    answersByAssessment[assessment] = _.groupBy(current, 'pillar_hash');
//        //});
//        //console.log(JSON.stringify(answersByAssessment, undefined, 4));
//        process.exit(0);
//    })
//    .catch(err => {
//        console.log('Failure:');
//        console.log('========');
//        console.log(err);
//        process.exit(1);
//    });

const xlsx = require('xlsx');
const workbook = xlsx.readFile('/Work/CCF/ExampleData/public_hb_answer.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(worksheet, { raw: true, date_format:'dd/mm/yyyy' });

json.forEach(r => {
    if (r.string_value === 'null') {
        delete r.string_value;
    }
    if (r.boolean_value === 'null') {
        delete r.boolean_value;
    }
});

const answers = [];
const indexAnswers = {};
const jsonByAssessment = _.groupBy(json, 'hb_assessment_id');
const assessments = Object.keys(jsonByAssessment);
assessments.forEach(assessment => {
    const current = jsonByAssessment[assessment];
    jsonByAssessment[assessment] = current.reduce((r, p) => {
        delete p.hb_assessment_id;
        const index = `${p.pillar_hash}\t${p.hb_user_id}\t${p.updated_at}`;
        let record = indexAnswers[index];
        if (! record) {
            record = {
                user_id: p.hb_user_id,
                pillar_hash: p.pillar_hash,
                updated_at: p.updated_at,
                answers: []
            };
            answers.push(record);
            indexAnswers[index] = record;
            r.push(p.updated_at);
        }
        const answer = {answer_hash: p.answer_hash};
        if (p.hasOwnProperty('string_value')) {
            answer.string_value =  p.string_value;
        } else if (p.hasOwnProperty('boolean_value')) {
            answer.boolean_value = p.boolean_value;
        }
        record.answers.push(answer);
        return r;
    }, []);
    //jsonByAssessment[assessment] = _.groupBy(current, 'pillar_hash');
    //_.forOwn(jsonByAssessment[assessment], values => values.forEach(v => delete v.pillar_hash));
    //throw new Error('XXXXX');
});
console.log(JSON.stringify(jsonByAssessment, undefined, 4));
console.log(JSON.stringify(answers, undefined, 4));



//console.log(json);