const rootURI = 'http://localhost:9005/api/v1.0';

const getFullPath = path => {
  return rootURI + path;
}

export default getFullPath; 
