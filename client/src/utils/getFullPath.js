// const rootURI = 'http://localhost:9005/api/v1.0';

import config from '../config';

const rootURI = config.API_HTTP_URL;

const getFullPath = path => {
  return rootURI + path;
}

export default getFullPath; 
