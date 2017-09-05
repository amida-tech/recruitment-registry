'use strict';

/* eslint no-param-reassign: 0, max-len: 0 */

const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');

const expect = chai.expect;

module.exports = {
    fileToLines(filepath) {
        const file = fs.readFileSync(filepath).toString();
        const lines = file.split('\n');
        expect(lines, `no lines in ${filepath}`).to.have.length.above(0);
        const header = lines[0];
        const names = header.split(',');
        const numFields = names.reduce((r, name, index) => (name ? index : r), 0) + 1;
        return lines.reduce((r, line) => {
            const fields = line.split(',').slice(0, numFields);
            const hasField = fields.some(field => field);
            if (hasField) {
                r.push(fields);
            }
            return r;
        }, []);
    },
    contentToLines(content) {
        const lines = content.split('\n');
        return lines.map(line => line.split(','));
    },
    contentToFile(content, filepath) {
        const expectedLines = this.fileToLines(filepath);
        const contentLines = this.contentToLines(content);
        expect(contentLines, `no content to compare for ${filepath}`).to.have.length.above(0);
        const numLines = Math.min(expectedLines.length, contentLines.length);
        _.range(numLines).forEach((index) => {
            expect(contentLines[index], `line ${contentLines[0][0]} equals ${contentLines[index][0]}`).to.deep.equal(expectedLines[index]);
        });
        expect(contentLines.length, `lines mismatch for ${filepath}`).to.equal(expectedLines.length);
    },
};
