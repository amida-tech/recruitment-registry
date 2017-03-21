'use strict';

const shared = require('../../controllers/shared.js');

const query = 'SELECT COUNT(*) as count FROM question WHERE multiple = TRUE';

exports.getMultiCount = function (req, res) {
    const sequelize = req.models.sequelize;
    sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
        .then(([result]) => res.status(200).json(result))
        .catch(shared.handleError(res));
};
