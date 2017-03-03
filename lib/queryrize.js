'use strict';

const fs = require('fs');
const path = require('path');

const queryAccumulator = {
    addLine: function (line) {
        const commentlessLine = line.split('--')[0];
        const sqlLine = commentlessLine.trim();
        const n = sqlLine.length;
        if (n > 0) {
            const sqlQueries = sqlLine.split(';').map(function (r) {
                return r.trim();
            });
            if (this.currentQuery) {
                sqlQueries[0] = this.currentQuery + ' ' + sqlQueries[0];
                this.currentQuery = '';
            }
            this.currentQuery = sqlQueries.pop();
            if (sqlQueries.length) {
                Array.prototype.push.apply(this.queries, sqlQueries);
            }

        }
    },
    isIncomplete: function () {
        return this.currentQuery;
    },
    getQueries: function () {
        return this.queries;
    },
    instance: function () {
        const result = Object(queryAccumulator);
        result.queries = [];
        result.currentQuery = '';
        return result;
    }

};

exports.readFileSync = function (scriptPath) {
    scriptPath = path.join(__dirname, '../sql-scripts', scriptPath);
    const content = fs.readFileSync(scriptPath).toString();
    const lines = content.split('\n');
    const accumulator = queryAccumulator.instance();
    lines.forEach(function (line) {
        accumulator.addLine(line);
    });
    if (accumulator.isIncomplete()) {
        throw new Error('SQL command ends without \';\'.');
    }
    return accumulator.getQueries();
};

exports.readQuerySync = function (scriptPath) {
    const queries = exports.readFileSync(scriptPath);
    return queries && queries[queries.length - 1];
};
