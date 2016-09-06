import Home from './home/index';
import About from './about/index';
import Login from './login/components/index';
import Register from './register/components/index';

export default [
  { path: '/', title: 'Home', component: Home },
  { path: '/about', title: 'About', component: About },
  { path: '/login', title: 'LoginContainer', component: Login },
  { path: '/register', title: 'Register', component: Register}
];
