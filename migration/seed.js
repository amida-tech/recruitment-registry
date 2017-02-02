'use strict';

const surveys = [{
    version: 0
}, {
    version: 1
}];

module.exports = function (queryInterface) {
    return queryInterface.bulkInsert('survey', surveys);
};
