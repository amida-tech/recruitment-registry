'use strict';

const ccf = require('../import/ccf');

const filepaths = {
    answer: '/Work/CCF/ExampleData/public_hb_answer.csv'
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
