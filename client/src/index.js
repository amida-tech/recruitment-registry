import App from './app';
import routes from './routes';
import Layout from './layout/index';
import login from './login';
import register from './register';

/*const assign = Object.assign || require('object.assign');*/

export const initialState = {
  title: "Recruitment Registry",
  login: {
    formState: {
      username: '',
      password: ''
    },
    user: localStorage.user ? JSON.parse(localStorage.user) : {
      username: "",
      role: "",
      id: ""
    }
  },
  register: {
    formState: {
      username: '',
      password: ''
    }
  },
  loggedIn: localStorage.token ? localStorage.token : false
};

export const reducers = {
  [login.constants.NAME]: login.reducer,
  [register.constants.NAME]: register.reducer,
  loggedIn: (state = initialState, action) => {
    switch (action.type) {
      case "LOGIN_SUCCESS":
        localStorage.token = JSON.stringify(action.data)
        return action.data;
      case "LOGIN_ERROR":
        return false;
      case "LOGOUT":
        return false;
      default:
        return state;
    }
  },
  title: (state = initialState) => state
};



import './styles/main.scss';

App({ reducers, initialState, Layout, routes }).render();
