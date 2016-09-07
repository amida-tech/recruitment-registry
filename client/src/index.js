import App from './app';
import routes from './routes';
import Layout from './layout/index';
import auth from './utils/auth';
import login from './login';
import register from './register';
import * as t from './login/actionTypes';

const assign = Object.assign || require('object.assign');

export const initialState = {
  login: {
    formState: {
      username: '',
      password: ''
    },
    currentlySending: false
  },
  register: {
    formState: {
      username: '',
      password: ''
    },
    currentlySending: false
  },
  loggedIn: auth.loggedIn()
};

export const reducers = {
  [login.constants.NAME]: login.reducer,
  [register.constants.NAME]: register.reducer,
  loggedIn: (state = initialState, action) => {
    switch (action.type) {
      case t.SET_AUTH:
        return assign({}, state, {
          loggedIn: action.newState
        });
      default:
        return state;
    }
  }
};



import './styles/main.scss';

App({ reducers, initialState, Layout, routes }).render();
