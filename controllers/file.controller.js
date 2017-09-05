'use strict';

const _ = require('lodash');

const shared = require('./shared.js');

exports.createFile = function createFile(req, res) {
    const userId = req.user.id;
    const content = _.get(req, 'swagger.params.file.value');
    const name = _.get(req, 'swagger.params.filename.value');
    req.models.file.createFile(userId, { name, content: content.buffer })
        .then(result => res.status(201).json(result))
        .catch(shared.handleError(res));
};

exports.getFile = function getFile(req, res) {
    const userId = req.user.id;
    const id = _.get(req, 'swagger.params.id.value');
    req.models.file.getFile(userId, id)
        .then(({ name, content }) => {
            res.header('Content-disposition', `attachment; filename=${name}`);
            res.type('application/octet-stream');
            res.status(200).end(content, 'binary');
        })
        .catch(shared.handleError(res));
};

exports.listFiles = function listFiles(req, res) {
    const userId = req.user.id;
    req.models.file.listFiles(userId)
        .then(result => res.status(200).json(result))
        .catch(shared.handleError(res));
};
