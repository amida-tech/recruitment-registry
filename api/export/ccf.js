'use strict';

const json2csv = require('json2csv');

const cId = 'number';
const cHash = 'objectId (Hash Tag Used for Questions)';
const cConditional = 'conditional (Answer Hash Tag used with skipCount to skip next question if certain answer is picked)';
const cAnswerHash = 'hash (Hash Tag Used for Answers)';
const cSkipCount = 'skipCount (Number of Questions Skipped if Contitional answer is picked)';

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
    },
    questions: {
        fields: [{
            label: cId,
            value: cId
        }, {
            label: cHash,
            value: cHash
        }, {
            label: 'question',
            value: 'question'
        }, {
            label: 'instruction',
            value: 'instruction'
        }, {
            label: cSkipCount,
            value: 'skipCount'
        }, {
            label: 'answerType',
            value: 'answerType'
        }, {
            label: cConditional,
            value: cConditional
        }, {
            label: 'answer',
            value: 'answer'
        }, {
            label: cAnswerHash,
            value: 'answerKey'
        }, {
            label: 'tag',
            value: 'tag'
        }, {
            label: 'toggle',
            value: 'toggle'
        }]
    }
};

const convertQuestions = function (pillars, questions, choices, answers) {
    const questionMap = new Map(questions.map(qx => [qx.id, qx]));
    const choiceMap = new Map(choices.map(choice => [choice.id, choice]));
    const answerMap = new Map(answers.map(answer => {
        let key = answer.questionId;
        if (answer.choice) {
            key = key += ':' + answer.choice;
        }
        return [key, answer];
    }));
    const result = [];
    let questionIndex = 1;
    pillars.forEach(pillar => {
        result.push({});
        result.push({
            [cId]: pillar.title
        });
        pillar.questions.forEach(({ questionId }) => {
            const question = questionMap.get(questionId);
            result.push({});
            let current = {
                [cId]: questionIndex,
                [cHash]: question.key,
                question: question.text,
                answerType: question.type
            };
            if (question.instruction) {
                current.instruction = question.instruction;
            }
            if (question.choices) {
                question.choices.forEach(choiceId => {
                    const choice = choiceMap.get(choiceId);
                    const key = question.id + ':' + choice.id;
                    const answer = answerMap.get(key);
                    current.answer = choice.value;
                    if (answer) {
                        current.tag = answer.tag;
                        current.answerKey = answer.key;
                        if (answer.toggle) {
                            current.toggle = answer.toggle;
                        }
                    }
                    result.push(current);
                    current = {};
                });
            } else {
                const answer = answerMap.get(question.id);
                if (answer) {
                    current.tag = answer.tag;
                    current.answerKey = answer.key;
                    if (answer.toggle) {
                        current.toggle = answer.toggle;
                    }
                }
                result.push(current);
            }
            ++questionIndex;
        });
    });
    return result;
};

const answerKey = function (answer) {
    return answer.user_id + ':' + answer.pillar_hash;
};

const answersJson = function (jsonDB) {
    const result = [];
    const assessments = jsonDB.assessments.map((assessment, index, all) => {
        const deletedAt = all[index + 1] ? all[index + 1].updated_at : null;
        return Object.assign({ deleted_at: deletedAt }, assessment);
    });

    assessments.forEach(assessment => {
        const answersActiveIndex = {};
        let activeIndex = 0;
        const answers = jsonDB.answers.reduce((r, answer) => {
            if (! assessment.deleted_at || (assessment.deleted_at > answer.updated_at)) {
                r.push(answer);
                answersActiveIndex[answerKey(answer)] = activeIndex;
                ++activeIndex;
            }
            return r;
        }, []);
        answers.forEach((answer, index) => {
            if (index !== answersActiveIndex[answerKey(answer)]) {
                return;
            }
            const common = {
                pillar_hash: answer.pillar_hash,
                hb_user_id: answer.user_id,
                updated_at: answer.updated_at,
                hb_assessment_id: assessment.id
            };
            answer.answers.forEach(a => {
                const r = Object.assign({
                    answer_hash: a.answer_hash,
                    boolean_value: (a.boolean_value === undefined ? 'null' : a.boolean_value),
                    string_value: (a.string_value === undefined ? 'null' : a.string_value)
                }, common);
                result.push(r);
            });
        });
    });
    return result;
};

const convertJsonDB = function convertJsonDB(jsonDB) {
    const pillarsFile = json2csv({
        data: jsonDB.pillars,
        fields: options.pillars.fields,
        quotes: ''
    });
    const questions = convertQuestions(jsonDB.pillars, jsonDB.questions, jsonDB.choices, jsonDB.qanswers);
    const questionsFile = json2csv({
        data: questions,
        fields: options.questions.fields,
        quotes: ''
    });
    return {
        pillars: pillarsFile,
        questions: questionsFile,
        answers: answersJson(jsonDB)
    };
};

module.exports = {
    convertJsonDB
};
