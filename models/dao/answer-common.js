'use strict';

const _ = require('lodash');

const RRError = require('../../lib/rr-error');

const getValueAnswerGenerator = (function getValueAnswerGeneratorGen() {
    const fns = {
        text(value) { return { textValue: value }; },
        zip(value, meta) {
            if (meta) {
                return {
                    textValue: value,
                    meta,
                };
            }

            return {
                textValue: value,
            };
        },
        year(value) {
            if (value.indexOf(':') < 0) {
                return { yearValue: value };
            }
            const [min, max] = value.split(':');
            const yearRange = {};
            if (max) {
                yearRange.max = max;
            }
            if (min) {
                yearRange.min = min;
            }
            return { yearRange };
        },
        month(value) { return { monthValue: value }; },
        day(value) { return { dayValue: value }; },
        bool(value) { return { boolValue: value === 'true' }; },
        pounds(value) { return { numberValue: parseInt(value, 10) }; },
        integer(value) {
            if (value.indexOf(':') < 0) {
                return { integerValue: parseInt(value, 10) };
            }
            const [min, max] = value.split(':');
            const integerRange = {};
            if (max) {
                integerRange.max = parseInt(max, 10);
            }
            if (min) {
                integerRange.min = parseInt(min, 10);
            }
            return { integerRange };
        },
        date(value) {
            if (value.indexOf(':') < 0) {
                return { dateValue: value };
            }
            const [min, max] = value.split(':');
            const dateRange = {};
            if (max) {
                dateRange.max = max;
            }
            if (min) {
                dateRange.min = min;
            }
            return { dateRange };
        },
        float(value) { return { floatValue: parseFloat(value) }; },
        scale(value) {
            return { numberValue: parseFloat(value) };
        },
        bloodPressure(value) {
            const pieces = value.split('-');
            return {
                bloodPressureValue: {
                    systolic: parseInt(pieces[0], 10),
                    diastolic: parseInt(pieces[1], 10),
                },
            };
        },
        feetInches(value) {
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
            } else if (type === 'file') {
                Object.assign(answer, {
                    fileValue: {
                        name: entry.value,
                        id: entry.fileId,
                    },
                });
            } else {
                Object.assign(answer, fn(entry.value, entry.meta));
            }
            return answer;
        });
        return _.sortBy(result, 'multipleIndex');
    }
    if (type === 'file') {
        const entry = entries[0];
        return {
            fileValue: {
                name: entry.value,
                id: entry.fileId,
            },
        };
    }
    const fnChoices = getChoiceAnswerGenerator(type);
    if (fnChoices) {
        return fnChoices(entries);
    }
    const fn = getValueAnswerGenerator(type);
    return fn(entries[0].value, entries[0].meta);
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
            const choiceType = answer.choiceType || 'bool';
            let value = answer.value;
            if ((value === null) && (choiceType === 'bool')) {
                value = 'true';
            }
            const fn = getValueAnswerGenerator(choiceType);
            Object.assign(result, fn(value));
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
        return { value: `${value}` };
    },
    integerValue(value) {
        return { value: `${value}` };
    },
    floatValue(value) {
        return { value: `${value}` };
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
    integerRange(value) {
        const max = (value.max === 0) ? '0' : (value.max || '');
        const min = (value.min === 0) ? '0' : (value.min || '');
        return { value: `${min}:${max}` };
    },
    yearRange(value) {
        const max = value.max || '';
        const min = value.min || '';
        return { value: `${min}:${max}` };
    },
    dateRange(value) {
        const max = (value.max || '');
        const min = (value.min || '');
        return { value: `${min}:${max}` };
    },
    filename(value) {
        return { value };
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
    const keys = Object.keys(_.omit(answer, 'meta'));
    const numKeys = keys.length;
    if (numKeys > 1) {
        keys.sort();
        throw new RRError('answerMultipleTypeAnswers', keys.join(', '));
    }
    const key = keys[0];
    if (key === 'fileValue') {
        const answerValue = answer[key];
        return [{
            fileId: answerValue.id,
            value: answerValue.name,
        }];
    }
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
    const attributes = ['questionId', 'questionChoiceId', 'value', 'exclude'];
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
                    if (record.exclude !== null) {
                        questionInfo.exclude = record.exclude;
                    }
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
            groupedRecords.forEach(({ type, exclude, rows }, id) => {
                const question = { id };
                if (exclude !== undefined) {
                    question.exclude = exclude;
                }
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
