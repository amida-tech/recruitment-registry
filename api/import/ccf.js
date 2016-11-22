'use strict';

const _ = require('lodash');

const SPromise = require('../lib/promise');

const CSVConverter = require('./csv-converter');

const options = {
	questions: {
		ignoreEmpty: true,
		headers: [
			'id', 'key', 'text', 'instruction', 'skipCount', 'type',
			'conditionalKey', 'choice', 'answerKey', 'tag', 'toggle'
		]
	},
};

const transform = {
	questions(input) {
		return input;
	},
};

const postAction = {
	pillars(result, key, json) {
		result[key] = json;
		result[`${key}_id_index`] = _.keyBy(json, 'id');
		result[`${key}_title_index`] = _.keyBy(json, 'title');
	}
};

const importFile = function (filepaths, result, key) {
    const filepath = filepaths[key];
    const keyOptions = options[key] || {};
    const converter = new CSVConverter(keyOptions);
    return converter.fileToRecords(filepath)
        .then(json => {
        	const fn = transform[key];
        	if (fn) {
        		return fn(json);
        	}
        	return json;
        })
        .then(json => {
        	const fn = postAction[key];
        	if (fn) {
        		return fn(result, key, json);
        	}
        	result[key] = json;
        });
};

const importFiles = function (filepaths) {
    const result = {};
    const pxs = Object.keys(filepaths).map(key => importFile(filepaths, result, key));
    return SPromise.all(pxs).then(() => result);
};

module.exports = {
    importFiles
};
