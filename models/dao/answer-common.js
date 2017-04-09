'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');

const getValueAnswerGenerator = (function getValueAnswerGeneratorGen() {
    const fns = {
        text(value) { return { textValue: value }; },
        zip(value) { return { textValue: value }; },
        date(value) { return { dateValue: value }; },
        year(value) { return { yearValue: value }; },
        month(value) { return { monthValue: value }; },
        day(value) { return { dayValue: value }; },
        bool(value) { return { boolValue: value === 'true' }; },
        pounds(value) { return { numberValue: parseInt(value, 10) }; },
        integer(value) { return { integerValue: parseInt(value, 10) }; },
        float(value) { return { integerValue: parseFloat(value) }; },
        bloodPressure(value) {
            const pieces = value.split('-');
            return {
                bloodPressureValue: {
                    systolic: parseInt(pieces[0], 10),
                    diastolic: parseInt(pieces[1], 10),
                },
            };
        },
        feetInches: (value) => {
            const pieces = value.split('-');
            return {
                feetInchesValue: {
                    feet: parseInt(pieces[0], 10),
                    inches: parseInt(pieces[1], 10),
                },
            };
        },
    };

    return function fnGetValueAnswerGenerator(type) {
        const typeCamelCase = _.camelCase(type);
        return fns[typeCamelCase];
    };
}());

const getChoiceAnswerGenerator = (function getChoiceAnswerGeneratorGen() {
    const fns = {
        choice(entries) { return { choice: entries[0].questionChoiceId }; },
        openChoice(entries) {
            const choice = entries[0].questionChoiceId;
            if (choice) {
                return { choice };
            }
            return { textValue: entries[0].value };
        },
        choiceRef(entries) { return { choice: entries[0].questionChoiceId }; },
        choices(entries) {
            let choices = entries.map((r) => {
                const answer = { id: r.questionChoiceId };
                const fn = getValueAnswerGenerator(r.choiceType || 'bool');
                return Object.assign(answer, fn(r.value));
            });
            choices = _.sortBy(choices, 'id');
            return { choices };
        },
    };

    return function fnGetChoiceAnswerGenerator(type) {
        const typeCamelCase = _.camelCase(type);
        return fns[typeCamelCase];
    };
}());

const generateAnswer = function (type, entries, multiple) {
    if (multiple) {
        const fn = getValueAnswerGenerator(type);
        const result = entries.map((entry) => {
            const answer = { multipleIndex: entry.multipleIndex };
            if (type === 'choice' || type === 'open-choice') {
                const fnChoice = getChoiceAnswerGenerator(type);
                Object.assign(answer, fnChoice([entry]));
            } else {
                Object.assign(answer, fn(entry.value));
            }
            return answer;
        });
        return _.sortBy(result, 'multipleIndex');
    }
    const fnChoices = getChoiceAnswerGenerator(type);
    if (fnChoices) {
        return fnChoices(entries);
    }
    const fn = getValueAnswerGenerator(type);
    return fn(entries[0].value);
};

const getFilterAnswerGenerator = (function getFilterAnswerGeneratorGen() {
    const fns = {
        choice(answer) { return { choice: answer.questionChoiceId }; },
        openChoice(answer) {
            const choice = answer.questionChoiceId;
            if (choice) {
                return { choice };
            }
            return { textValue: answer.value };
        },
        choiceRef(answer) { return { choice: answer.questionChoiceId }; },
        choices(answer) {
            const result = { choice: answer.questionChoiceId };
            const choiceType = answer.choiceType;
            if (choiceType && choiceType !== 'bool') {
                const fn = getValueAnswerGenerator(choiceType);
                Object.assign(result, fn(answer.value));
            }
            return result;
        },
    };

    const fnValue = function (type) {
        const fn = getValueAnswerGenerator(type);
        return function fn2(answer) {
            return fn(answer.value);
        };
    };

    return function fnGetFilterAnswerGenerator(type) {
        const typeCamelCase = _.camelCase(type);
        const fn = fns[typeCamelCase];
        if (fn) {
            return fn;
        }
        return fnValue(type);
    };
}());

const generateFilterAnswers = function (type, answers) {
    const fn = getFilterAnswerGenerator(type);
    return answers.map(answer => fn(answer));
};

const answerValueToDBFormat = {
    boolValue(value) {
        return { value: value ? 'true' : 'false' };
    },
    dateValue(value) {
        return { value };
    },
    yearValue(value) {
        return { value };
    },
    monthValue(value) {
        return { value };
    },
    dayValue(value) {
        return { value };
    },
    textValue(value) {
        return { value };
    },
    numberValue(value) {
        return { value };
    },
    integerValue(value) {
        return { value };
    },
    floatValue(value) {
        return { value };
    },
    feetInchesValue(value) {
        const feet = value.feet || 0;
        const inches = value.inches || 0;
        return { value: `${feet}-${inches}` };
    },
    bloodPressureValue(value) {
        const systolic = value.systolic || 0;
        const diastolic = value.diastolic || 0;
        return { value: `${systolic}-${diastolic}` };
    },
};

const choiceValueToDBFormat = {
    choices(value) {
        return value.map((r) => {
            const questionChoiceId = r.id;
            delete r.id;
            const keys = Object.keys(r);
            const numKeys = keys.length;
            if (numKeys > 1) {
                keys.sort();
                throw new RRError('answerMultipleTypeChoice', keys.join(', '));
            }
            if (numKeys === 0) {
                return { questionChoiceId, value: 'true' };
            }
            const key = keys[0];
            const fn = answerValueToDBFormat[key];
            if (!fn) {
                throw new RRError('answerAnswerNotUnderstood', key);
            }
            return Object.assign({ questionChoiceId }, fn(r[key]));
        });
    },
    choice(value) {
        return [{ questionChoiceId: value }];
    },
};

const prepareAnswerForDB = function (answer) {
    if (Array.isArray(answer)) {
        return answer.map((singleAnswer) => {
            const multipleIndex = singleAnswer.multipleIndex;
            if (multipleIndex === undefined) {
                throw new RRError('answerNoMultiQuestionIndex');
            }
            const valuePiece = _.omit(singleAnswer, 'multipleIndex');
            const dbObject = prepareAnswerForDB(valuePiece)[0];
            dbObject.multipleIndex = multipleIndex;
            return dbObject;
        });
    }
    const keys = Object.keys(answer);
    const numKeys = keys.length;
    if (numKeys > 1) {
        keys.sort();
        throw new RRError('answerMultipleTypeAnswers', keys.join(', '));
    }
    const key = keys[0];
    let fn = choiceValueToDBFormat[key];
    if (fn) {
        return fn(answer[key]);
    }
    fn = answerValueToDBFormat[key];
    if (!fn) {
        throw new RRError('answerAnswerNotUnderstood', key);
    }
    return [fn(answer[key])];
};

const prepareFilterAnswerForDB = function (answer) {
    const dbAnswer = {};
    if (answer.choice) {
        dbAnswer.questionChoiceId = answer.choice;
    }
    const value = _.omit(answer, 'choice');
    const keys = Object.keys(value);
    if (keys.length > 0) {
        const key = keys[0];
        const fn = answerValueToDBFormat[key];
        Object.assign(dbAnswer, fn(value[key]));
    }
    return dbAnswer;
};

const prepareFilterAnswersForDB = function (answers) {
    return answers.map(answer => prepareFilterAnswerForDB(answer));
};

const getFilterAnswers = function (dao, Table, { where, order }) {
    const attributes = ['questionId', 'questionChoiceId', 'value'];
    const include = [
        { model: dao.db.Question, as: 'question', attributes: ['type'] },
        { model: dao.db.QuestionChoice, as: 'questionChoice', attributes: ['type'] },
    ];
    const findOptions = { raw: true, where, attributes, include, order };
    return Table.findAll(findOptions)
        .then((records) => {
            const groupedRecords = records.reduce((r, record) => {
                const questionId = record.questionId;
                let questionInfo = r.get(questionId);
                if (!questionInfo) {
                    const type = record['question.type'];
                    questionInfo = { type, rows: [] };
                    r.set(questionId, questionInfo);
                }
                const { questionChoiceId, value } = record;
                const row = { questionChoiceId, value };
                if (questionInfo.type === 'choices') {
                    row.choiceType = record['questionChoice.type'];
                }
                questionInfo.rows.push(row);
                return r;
            }, new Map());
            const questions = [];
            groupedRecords.forEach(({ type, rows }, id) => {
                const question = { id };
                question.answers = generateFilterAnswers(type, rows);
                questions.push(question);
            });
            return questions;
        });
};

module.exports = {
    generateAnswer,
    generateFilterAnswers,
    prepareAnswerForDB,
    prepareFilterAnswersForDB,
    getFilterAnswers,
};
