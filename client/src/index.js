import App from './app';
import routes from './routes';
import Layout from './layout/index';
import auth from './utils/auth';

export const reducers = {
  title: state => state
};

export const initialState = {
  title: 'Recruitment Registry',
  formState: {
    username: '',
    password: ''
  },
  currentlySending: false,
  loggedIn: auth.loggedIn()
};

import './styles/main.scss';

App({ reducers, initialState, Layout, routes }).render();
