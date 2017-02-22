'use strict';

const fs = require('fs');
const path = require('path');

const byline = require('byline');

exports.replaceParameters = function (rawQuery, parameters) {
    return rawQuery.replace(/\:([\w\d]+)/g, function (match, p1) {
        const replacement = parameters[p1];
        if (replacement) {
            return replacement;
        } else {
            return match;
        }
    });
};

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

exports.readStream = function (stream, callback) {
    const accumulator = queryAccumulator.instance();

    const lineStream = byline.createStream(stream);

    lineStream.on('data', function (data) {
        const line = data.toString();
        accumulator.addLine(line);
    });

    lineStream.on('error', function (err) {
        return callback(err);
    });

    lineStream.on('end', function () {
        if (accumulator.isIncomplete()) {
            return callback(new Error('SQL command ends without \';\'.'));
        }
        callback(null, accumulator.getQueries());
    });
};

exports.readFileSync = function (filepath) {
    const content = fs.readFileSync(filepath).toString();
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
    scriptPath = path.join(__dirname, '../sql-scripts', scriptPath);
    const queries = exports.readFileSync(scriptPath);
    return queries && queries[queries.length - 1];
};

exports.addSubqueries = function (query, sqTemplate, separator, sqReplacements) {
    const replacements = {};
    const subqueries = sqReplacements.map((replacementMap, sqIdx) => {
        let subquery = sqTemplate;
        Object.entries(replacementMap).forEach(([replacementKey, replacement]) => {
            const sqReplacementKey = replacementKey + "_idx_" + sqIdx;
            subquery = subquery.split(':' + replacementKey).join(':' + sqReplacementKey); // replace all
            replacements[sqReplacementKey] = replacement;
        });
        return subquery;
    });

    query = query.split(':subqueries').join(subqueries.join(separator));

    return { query, replacements };
}
