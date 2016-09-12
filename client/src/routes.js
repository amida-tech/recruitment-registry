import Home from './home/index';
import About from './about/index';
import Login from './login/components/index';
import Register from './register/components/index';
import ProfileContainer from './profile/index';

export default [
  { path: '/', title: 'Home', component: Home },
  { path: '/about', title: 'About', component: About },
  { path: '/login', title: 'Login', component: Login },
  { path: '/register', title: 'Register', component: Register},
  { path: '/profile', title: 'Profile', component: ProfileContainer}
];
