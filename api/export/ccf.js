'use strict';

const json2csv = require('json2csv');

const options = {
    pillars: {
        fields: [{
            label: 'id',
            value: 'id'
        }, {
            label: 'isBHI',
            value: 'isBHI'
        }, {
            label: 'maxScore',
            value: 'maxScore'
        }, {
            label: 'title',
            value: 'title'
        }]
    }
};

const convertJsonDB = function convertJsonDB(jsonDB) {
    const pillarsFile = json2csv({
        data: jsonDB.pillars,
        fields: options.pillars.fields,
        quotes: ''
    });
    return {
        pillars: pillarsFile
    };
};

module.exports = {
    convertJsonDB
};
