'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createFile = function createFile(req, res) {
    const content = _.get(req, 'swagger.params.file.value');
    const name = _.get(req, 'swagger.params.filename.value');
    req.models.file.createFile({ name, content: content.buffer })
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getFile = function getFile(req, res) {
    const id = _.get(req, 'swagger.params.id.value');
    req.models.file.getFile(id)
        .then(({ name, content }) => {
            res.header('Content-disposition', `attachment; filename=${name}`);
            res.type('application/octet-stream');
            res.status(200).end(content, 'binary');
        })
        .catch(shared.handleError(res));
};
