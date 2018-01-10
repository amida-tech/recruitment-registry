'use strict';

const shared = require('./shared.js');

exports.listDemographics = function listDemographics(req, res) {
    req.models.demographics.listDemographics()
        .then(result => {
            console.log('>>>>> CONTROLLER > listDemographics > result: ', result);
            return res.status(200).json(result)
        })
        .catch(shared.handleError(res));
};
