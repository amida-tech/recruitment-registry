import Home from './home/index';
import Login from './login/components/index';
import Register from './register/components/index';
import ProfileContainer from './profile/components/index';
import SurveyBuilderContainer from './surveyBuilder/components/index'
import SurveysContainer from './surveys/components/index'

export default [
  { path: '/', title: 'Home', component: Home, requiresAuth: false },
  { path: '/login', title: 'Login', component: Login, requiresAuth: false, newUsers: true },
  { path: '/register', title: 'Register', component: Register, requiresAuth: false, newUsers: true },
  { path: '/profile', title: 'Profile', component: ProfileContainer, requiresAuth: true, newUsers: false },
  { path: '/survey-builder(/:id)', title: 'Survey Builder', component: SurveyBuilderContainer, requiresAuth: true, newUsers: false, isSuper: true },
  { path: '/surveys', title: 'Surveys', component: SurveysContainer, requiresAuth: true, newUsers: false, isSuper: true }
];
