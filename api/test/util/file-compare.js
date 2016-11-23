'use strict';

const fs = require('fs');
const chai = require('chai');
const _ = require('lodash');

const expect = chai.expect;

module.exports = {
	contentToFile(content, filepath) {
        const expected = fs.readFileSync(filepath).toString();
        const expectedLines = expected.split('\n');
        const contentLines = content.split('\n');
        expect(contentLines, `no content to compare for ${filepath}`).to.have.length.above(0);
        expect(expectedLines, `no lines in ${filepath}`).to.have.length.above(0);
        const numLines = Math.min(expectedLines.length, contentLines.length);
        _.range(numLines).forEach(index => {
            expect(contentLines[index], `${filepath} line ${index}`).to.equal(expectedLines[index]);
        });
        expect(contentLines.length, `lines mismatch for ${filepath}`).to.equal(expectedLines.length);
	}
};
