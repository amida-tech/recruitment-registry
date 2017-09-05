'use strict';

const fs = require('fs');
const path = require('path');

exports.replaceParameters = function replaceParameters(rawQuery, parameters) {
    return rawQuery.replace(/:([\w\d]+)/g, function repl(match, p1) {
        const replacement = parameters[p1];
        if (replacement) {
            return replacement;
        }
        return match;
    });
};

const queryAccumulator = {
    addLine(line) {
        const commentlessLine = line.split('--')[0];
        const sqlLine = commentlessLine.trim();
        const n = sqlLine.length;
        if (n > 0) {
            const sqlQueries = sqlLine.split(';').map(r => r.trim());
            if (this.currentQuery) {
                sqlQueries[0] = `${this.currentQuery} ${sqlQueries[0]}`;
                this.currentQuery = '';
            }
            this.currentQuery = sqlQueries.pop();
            if (sqlQueries.length) {
                Array.prototype.push.apply(this.queries, sqlQueries);
            }
        }
    },
    isIncomplete() {
        return this.currentQuery;
    },
    getQueries() {
        return this.queries;
    },
    instance() {
        const result = Object(queryAccumulator);
        result.queries = [];
        result.currentQuery = '';
        return result;
    },

};

exports.readFileSync = function readFileSync(scriptPath) {
    const fullPath = path.join(__dirname, '../sql-scripts', scriptPath);
    const content = fs.readFileSync(fullPath).toString();
    const lines = content.split('\n');
    const accumulator = queryAccumulator.instance();
    lines.forEach((line) => {
        accumulator.addLine(line);
    });
    if (accumulator.isIncomplete()) {
        throw new Error('SQL command ends without \';\'.');
    }
    return accumulator.getQueries();
};

exports.readQuerySync = function readQuerySync(scriptPath) {
    const queries = exports.readFileSync(scriptPath);
    return queries && queries[queries.length - 1];
};
