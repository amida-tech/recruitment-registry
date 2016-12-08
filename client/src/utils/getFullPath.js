import config from '../config';

const rootURI = config.API_HTTP_URL;

const getFullPath = path => {
  return rootURI + path;
}

export default getFullPath; 
