import devConfig from './development';
import prodConfig from './production';

let config;

if (process.env.NODE_ENV === 'development') {
    config = devConfig;
} else {
    config = prodConfig;
}

export default config;
