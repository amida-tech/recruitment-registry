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
        const match = name.match(/^.+integration\.js$/);
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
    if (lines[index].trim() !== 'store.server') {
        return null;
    }
    let subIndex = index + 1;
    let found = null;
    const result = { lines: [] };
    while (subIndex < lines.length) {
        if (lines[subIndex].trim() === '.end(done);') {
            found = true;
            result.lines.push(lines[subIndex]);
            result.nextIndex = subIndex + 1;
            break;
        }
        if (lines[subIndex].trim().startsWith('.end(')) {
            found = true;
            result.lines.push(lines[subIndex]);
            result.nextIndex = subIndex + 1;
            break;
        }
        if (lines[subIndex].trim() === '};') {
            break;
        }
        const line = lines[subIndex];
        ++subIndex;
        let matches;
        matches = line.match(/^\s*\.get\(\`\/api\/v1\.0([^\`]+)\`\)$/);
        if (matches) {
            result.operation = 'get';
            result.endpoint = matches[1];
            result.delimiter = '`';
            continue;
        }
        matches = line.match(/^\s*\.get\(\'\/api\/v1\.0([^\']+)\'\)$/);
        if (matches) {
            result.operation = 'get';
            result.endpoint = matches[1];
            result.delimiter = '\'';
            continue;
        }
        matches = line.match(/^\s*\.post\(\`\/api\/v1\.0([^\`]+)\`\)$/);
        if (matches) {
            result.operation = 'post';
            result.endpoint = matches[1];
            result.delimiter = '`';
            continue;
        }
        matches = line.match(/^\s*\.post\(\'\/api\/v1\.0([^\']+)\'\)$/);
        if (matches) {
            result.operation = 'post';
            result.endpoint = matches[1];
            result.delimiter = '\'';
            continue;
        }
        matches = line.match(/^\s*\.patch\(\`\/api\/v1\.0([^\`]+)\`\)$/);
        if (matches) {
            result.operation = 'patch';
            result.endpoint = matches[1];
            result.delimiter = '`';
            continue;
        }
        matches = line.match(/^\s*\.patch\(\'\/api\/v1\.0([^\']+)\'\)$/);
        if (matches) {
            result.operation = 'patch';
            result.endpoint = matches[1];
            result.delimiter = '\'';
            continue;
        }
        matches = line.match(/^\s*\.delete\(\`\/api\/v1\.0([^\`]+)\`\)$/);
        if (matches) {
            result.operation = 'delete';
            result.endpoint = matches[1];
            result.delimiter = '`';
            continue;
        }
        matches = line.match(/^\s*\.delete\(\'\/api\/v1\.0([^\']+)\'\)$/);
        if (matches) {
            result.operation = 'delete';
            result.endpoint = matches[1];
            result.delimiter = '\'';
            continue;
        }
        if (!result.endpoint) {
            console.log(line);
        }
        matches = line.match(/^\s*\.expect\((\d+)\)$/);
        if (matches) {
            result.status = matches[1];
            continue;
        }
        matches = line.match(/^\s*\.query\(([^\)]+)\)$/);
        if (matches) {
            result.query = matches[1];
            continue;
        }
        if (line.trim().startsWith('.set(\'Cookie')) {
            result.auth = true;
            continue;
        }
        matches = line.match(/^\s*\.send\(([^\)]+)\)$/);
        if (matches) {
            result.send = matches[1];
            continue;
        }
        result.lines.push(line);
    }
    if (found) {
        return result;
    }
    return null;
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
            const spaces = lines[index].split('store.server')[0];
            let cmd = spaces + 'store.' + res.operation + '(';
            let innerFound = false;
            //console.log(res);
            if (!res.endpoint) {
                console.log(res);
            }
            if (res.endpoint.indexOf('$') >= 0) {
                cmd += '`' + res.endpoint + '`';
            } else {
                cmd += '\'' + res.endpoint + '\'';
            }

            if (res.operation === 'get') {
                cmd += ', ' + (res.auth ? 'true' : 'false') + ', ' + res.status;
                if (res.query) {
                    cmd += ', ' + res.query;
                }
                cmd += ')';
                newLines.push(cmd);
                res.lines.forEach(fn);
                index = res.nextIndex;
                innerFound = true;
            }
            if (!innerFound) {
                newLines.push(lines[index]);
                ++index;
            } else {
                found = true;
            }
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
