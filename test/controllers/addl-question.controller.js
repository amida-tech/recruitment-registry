'use strict';

const shared = require('../../controllers/shared.js');

const query = 'SELECT COUNT(*) as count FROM question WHERE multiple = TRUE';

exports.getMultiCount = function (req, res) {
    req.models.question.selectQuery(query)
        .then(([result]) => res.status(200).json(result))
        .catch(shared.handleError(res));
};
