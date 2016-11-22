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

const answerUpdateSingle = function (id, line, question) {
	return {
		id: id,
		key: line.answerKey,
		questionId: question.id,
		tag: line.tag
	};
};

const answerUpdateMultiple = function (id, line, question) {
	return {
		id: id,
		choice: line.choice,
		key: line.answerKey,
		questionId: question.id,
		tag: line.tag
	};
};

const answerUpdateChoice = function(id, line, question, choices) {
	if (! question.choices) {
		question.choices = [];
	}
	const choice = {
		id: choices.length + 1,
		value: line.choice
	};
	question.choices.push(choice.id);
	choices.push(choice);
	return {
		id: id,
		choice: choice.id,
		key: line.answerKey,
		questionId: question.id,
		tag: line.tag
	};
};

const answerUpdate = {
	1: answerUpdateChoice,
	2: answerUpdateChoice,
	3: answerUpdateChoice,
	4: answerUpdateChoice,
	5: answerUpdateSingle,
	7: answerUpdateChoice,
	8: answerUpdateSingle,
	9: answerUpdateMultiple,
	10: answerUpdateMultiple
};

const questionsPost = function(result, key, lines) {
	if (! (result.pillars && result.pillarsTitleIndex)) {
		throw new Error('Pillar records have to be read before questions.');
	}
	let activePillar = null;
	let activeQuestion = null;
	const questions = [];
	const answers = [];
	const choices = [];
	const answersKeyIndex = {};
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
				id: questions.length + 1,
				key: line.key,
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
		if (! activeQuestion) {
			throw new Error('Unexpected line. Question key expected');
		}
		const fnAnswer = answerUpdate[activeQuestion.type];
		if (fnAnswer) {
			const answer = fnAnswer(answers.length+1, line, activeQuestion, choices);
			answers.push(answer);
			answersKeyIndex[answer.key] = answer;
			return;
		}
		throw new Error(`Unexpected line.  Unsupported type: ${activeQuestion.type}`);
	});
	result[key] = questions;
	result.answers = answers;
	result.choices = choices;
	result.answersKeyIndex = answersKeyIndex;
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
