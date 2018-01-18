'use strict';

const shared = require('./shared.js');

exports.listDemographics = function listDemographics(req, res) {
    const language = 'en';//_.get(req, 'swagger.params.language.value');
    const role = 'participant';//_.get(req, 'swagger.params.role.value');
    const options = { language, role };
    req.models.demographics.listDemographics(options)
        .then(result => {
            return res.status(200).json(result)
        })
        .catch(shared.handleError(res));
};
