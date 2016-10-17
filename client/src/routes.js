import Home from './home/index';
import Login from './login/components/index';
import Register from './register/components/index';
import ProfileContainer from './profile/components/index';
import SurveyBuilderContainer from './surveyBuilder/components/index'
import SurveysContainer from './surveys/components/index'

export default [
  { path: '/', title: 'Home', transTerm: 'HOME', component: Home, requiresAuth: false },
  { path: '/login', title: 'Login', transTerm: 'LOGIN', component: Login, requiresAuth: false, newUsers: true },
  { path: '/register', title: 'Register', transTerm: 'REGISTER', component: Register, requiresAuth: false, newUsers: true },
  { path: '/profile', title: 'Profile', transTerm: 'PROFILE', component: ProfileContainer, requiresAuth: true, newUsers: false },
  { path: '/survey-builder(/:id)', title: 'Survey Builder', transTerm: 'SURVEY_BUILDER', component: SurveyBuilderContainer, requiresAuth: true, newUsers: false, isSuper: true },
  { path: '/surveys', title: 'Surveys', transTerm: 'SURVEYS', component: SurveysContainer, requiresAuth: true, newUsers: false },
  { path: '/survey/:id', title: 'Survey', transTerm: 'SURVEY', component: SurveysContainer, requiresAuth: true, newUsers: false }
];
