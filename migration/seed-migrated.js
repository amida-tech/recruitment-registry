'use strict';

const surveys = [{
    status: 'published'
}, {
    status: 'published'
}];

module.exports = function (queryInterface) {
    return queryInterface.bulkInsert('survey', surveys);
};
