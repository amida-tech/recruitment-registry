'use strict';

const _ = require('lodash');

const SPromise = require('../lib/promise');

const CSVConverter = require('./csv-converter');
const XLSXConverter = require('./xlsx-converter');

const converters = {
    questions() {
        const options = {
            ignoreEmpty: true,
            headers: [
                'id', 'key', 'text', 'instruction', 'skipCount', 'type',
                'condition', 'choice', 'answerKey', 'tag', 'toggle'
            ]
        };
        return new CSVConverter(options);
    },
    pillars() {
        return new CSVConverter({});
    },
    answers() {
        return new XLSXConverter({
            dateTimes: ['updated_at']
        });
    },
    assessments() {
        return new XLSXConverter({
            dateTimes: ['updated_at']
        });
    }
};

const answerUpdateSingle = function (id, line, question) {
    return {
        id: id,
        key: line.answerKey,
        questionId: question.id,
        tag: line.tag
    };
};

const answerUpdateChoice = function (id, line, question, choices) {
    if (!question.choices) {
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
    8: answerUpdateChoice,
    9: answerUpdateChoice,
    10: answerUpdateChoice
};

const questionsPost = function (result, key, lines) {
    if (!(result.pillars && result.pillarsTitleIndex)) {
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
            if (!activePillar) {
                throw new Error(`Unknown pillar: ${title}`);
            }
            activePillar.questions = [];
            return;
        }
        if (!activePillar) {
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
        if (!activeQuestion) {
            throw new Error('Unexpected line. Question key expected');
        }
        const fnAnswer = answerUpdate[activeQuestion.type];
        if (fnAnswer) {
            const answer = fnAnswer(answers.length + 1, line, activeQuestion, choices);
            if (line.toggle) {
                answer.toggle = line.toggle;
            }
            answers.push(answer);
            answersKeyIndex[answer.key] = answer;
            return;
        }
        throw new Error(`Unexpected line.  Unsupported type: ${activeQuestion.type}`);
    });
    result[key] = questions;
    result.qanswers = answers;
    result.choices = choices;
    result.answersKeyIndex = answersKeyIndex;
};

const answersPost = function (result, key, lines) {
    lines.forEach(r => {
        if (r.string_value === 'null') {
            delete r.string_value;
        }
        if (r.boolean_value === 'null') {
            delete r.boolean_value;
        }
    });

    const answers = [];
    const indexAnswers = {};
    const jsonByAssessment = _.groupBy(lines, 'hb_assessment_id');
    const assessments = Object.keys(jsonByAssessment);
    assessments.forEach(assessment => {
        const current = jsonByAssessment[assessment];
        jsonByAssessment[assessment] = current.reduce((r, p) => {
            delete p.hb_assessment_id;
            const index = `${p.pillar_hash}\t${p.hb_user_id}\t${p.updated_at}`;
            let record = indexAnswers[index];
            if (!record) {
                record = {
                    user_id: p.hb_user_id,
                    pillar_hash: p.pillar_hash,
                    updated_at: p.updated_at,
                    answers: []
                };
                answers.push(record);
                indexAnswers[index] = record;
                r.push(p.updated_at);
                //console.log(p.pillar_hash + ' ' + p.updated_at);
            }
            const answer = { answer_hash: p.answer_hash };
            if (p.hasOwnProperty('string_value')) {
                answer.string_value = p.string_value;
            } else if (p.hasOwnProperty('boolean_value')) {
                answer.boolean_value = p.boolean_value;
            }
            record.answers.push(answer);
            return r;
        }, []);
    });
    result.answers = answers;
    result.assesmentAnswers = jsonByAssessment;
};

const postAction = {
    pillars(result, key, json) {
        result[key] = json;
        result[`${key}IdIndex`] = _.keyBy(json, 'id');
        result[`${key}TitleIndex`] = _.keyBy(json, 'title');
    },
    questions: questionsPost,
    answers: answersPost
};

const importFile = function (filepaths, result, key) {
    const filepath = filepaths[key];
    const converter = converters[key]();
    return converter.fileToRecords(filepath)
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
