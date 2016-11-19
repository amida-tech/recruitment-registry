'use strict';

const path = require('path');
const fs = require('fs');

const walk = require('walk');

const main = function (root, onFile, onError, onEnd) {
    const walker = walk.walk(root);
    walker.on('file', onFile);
    walker.on('errors', onError);
    walker.on('end', onEnd);
};

const onFile = function (accumulator) {
    return function (root, fileStats, next) {
        accumulator.add(root, fileStats.name);
        next();
    };
};

const onErrors = function (accumulator) {
    return function (root, nodeStatsArray, next) {
        accumulator.addError(root, nodeStatsArray);
        next();
    };
};

const Accumulator = class Accumulator {
    constructor() {
        this.results = [];
    }

    add(root, name) {
        const match = name.match(/^.+\.integration\.js$/);
        if (match) {
            this.results.push({ root, name });
        }
    }

    addError() {
        console.log('error');
    }
};

const classifyFiles = function (baseDirectory, callback) {
    const accumulator = new Accumulator();

    main(baseDirectory, onFile(accumulator), onErrors(accumulator), function () {
        callback(null, accumulator.results);
    });
};

const baseDirectory = path.join(__dirname, '../test');

const findRes = function (lines, index) {
    if (lines[index].trim() !== '.end(function (err) {') {
        return null;
    }
    if (lines[index + 1].trim() !== 'if (err) {') {
        console.log('break 1');
        return null;
    }
    if (lines[index + 2].trim() !== 'return done(err);') {
        console.log('break 2');
        return null;
    }
    if (lines[index + 3].trim() !== '}') {
        console.log('break 3');
        return null;
    }
    let subIndex = index + 4;
    let found = false;
    const spaces = lines[index + 1].split('if')[0];
    while (subIndex < lines.length) {
        if (lines[subIndex] === spaces + 'done();') {
            found = true;
            break;
        }
        if (lines[subIndex].trim() === '});') {
            found = false;
            break;
        }
        ++subIndex;
    }
    if (!found) {
        console.log('break 4');
        return null;
    }
    const newLines = lines.slice(index + 4, subIndex);
    const nextIndex = subIndex + 2;
    return { newLines, nextIndex };
};

const transformFile = function ({ root, name }) {
    const filepath = path.join(root, name);
    const content = fs.readFileSync(filepath).toString();
    const lines = content.split('\n');
    const newLines = [];
    let index = 0;
    let found = false;
    const fn = line => newLines.push(line);
    while (index < lines.length) {
        const res = findRes(lines, index);
        if (res === null) {
            newLines.push(lines[index]);
            ++index;
        } else {
            console.log('INSERT');
            const spaces = lines[index].split('.end')[0];
            newLines.push(spaces + '.expect(function () {');
            res.newLines.forEach(fn);
            newLines.push(spaces + '})');
            newLines.push(spaces + '.end(done);');
            index = res.nextIndex;
            found = true;
        }
    }
    if (found) {
        console.log(found);
        fs.writeFileSync(filepath, newLines.join('\n'));
    }
};

classifyFiles(baseDirectory, function (err, results) {
    results.forEach(r => {
        transformFile(r);
    });
});

//transformFile({ root: '/Work/git/recruitment-registry/api/test', name: 'question.integration.js' });
