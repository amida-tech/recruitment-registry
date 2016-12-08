var fs = require('fs');
var dotenv = require('dotenv');

dotenv.config();

fs.writeFile(
    'src/config/production.js',
    "export default { NODE_ENV: 'production', API_HTTP_URL:'" + process.env.PROD_API_HTTP_URL + "', API_HTTPS_URL:'" + process.env.PROD_API_HTTPS_URL + "'}",
    function(response) {
     console.log("production config created");
    });
