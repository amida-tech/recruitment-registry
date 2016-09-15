import App from './app';
import routes from './routes';
import Layout from './layout/index';
import login from './login';
import register from './register';
import {browserHistory} from 'react-router';

/*const assign = Object.assign || require('object.assign');*/

export const initialState = {
  title: "Recruitment Registry",
  login: {
    formState: {
      hasErrors: false,
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
      password: '',
      ethnicity: 'Caucasion',
      gender: 'male'
    },
    availableEthnicities: [
      "Caucasion",
      "Hispanic",
      "African",
      "Asian"
    ],
    availableGenders: [
      "male",
      "female",
      "other"
    ],
    survey: {
      questions: []
    },
    surveyResults: {
      answers: []
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
        localStorage.setItem("token", action.data.token)
        return action.data.token;
      case "LOGOUT":
        browserHistory.push('/login');
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
      default:
        return state;
    }
  },
  title: (state = initialState) => state,
  profile: (state = initialState, action) => {
    switch (action.type) {
      case 'GET_PROFILE_SUCCESS':
        // console.log(action.payload);
        return action.payload
      default:
        return state;
    }
  }
};



import './styles/main.scss';

App({ reducers, initialState, Layout, routes }).render();
