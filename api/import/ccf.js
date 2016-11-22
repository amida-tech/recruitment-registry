'use strict';

const _ = require('lodash');

const SPromise = require('../lib/promise');

const CSVConverter = require('./csv-converter');

const options = {
	questions: {
		ignoreEmpty: true,
		headers: [
			'id', 'key', 'text', 'instruction', 'skipCount', 'type',
			'condition', 'choice', 'answerKey', 'tag', 'toggle'
		]
	},
};

const questionsPost = function(result, key, lines) {
	if (! (result.pillars && result.pillarsTitleIndex)) {
		throw new Error('Pillar records have to be read before questions.');
	}
	let activePillar = null;
	let activeQuestion = null;
	const questions = [];
	lines.forEach(line => {
		const objKeys = Object.keys(line);
		if ((objKeys.length === 1) && (objKeys[0] === 'id')) {
			const title = line.id;
			activePillar = result.pillarsTitleIndex[title];
			if (! activePillar) {
				throw new Error(`Unknown pillar: ${title}`);
			}
			activePillar.questions = [];
			return;
		}
		if (! activePillar) {
			throw new Error('Unexpected line.  Pillar title expected');
		}
		if (line.key) {
			activeQuestion = {
				id: line.key,
				text: line.text,
				instruction: line.instruction,
				type: line.type
			};
			const pillarQuestion = {
				questionId: activeQuestion.id,
			};
			if (line.condition) {
				pillarQuestion.condition = line.condition;
				pillarQuestion.skipCount = line.skipCount;
			}
			activePillar.questions.push(pillarQuestion);
			questions.push(activeQuestion);
		}
	});
	result[key] = questions;
};


const transform = {
	questions(input) {
		return input;
	},
};

const postAction = {
	pillars(result, key, json) {
		result[key] = json;
		result[`${key}IdIndex`] = _.keyBy(json, 'id');
		result[`${key}TitleIndex`] = _.keyBy(json, 'title');
	},
	questions: questionsPost
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
