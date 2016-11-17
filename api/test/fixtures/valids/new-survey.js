'use strict';

module.exports = [{
    name: 'name',
    questions: [{ id: 1, required: false }, { id: 2, required: true }, { id: 3, required: false }]
}, {
    name: 'name',
    questions: [{
        text: 'What is it?',
        required: true,
        type: 'text'
    }, {
        text: 'What is it?',
        required: false,
        type: 'text'
    }, {
        text: 'What is date?',
        required: false,
        type: 'date'
    }]
}, {
    name: 'name',
    questions: [{
        id: 1,
        required: false
    }, {
        text: 'What is it?',
        required: true,
        type: 'text'
    }, {
        id: 2,
        required: false
    }]
}];
