import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import routes from '../routes';
import { logout } from '../login/actions';
import { changeLanguage } from '../profile/actions';

class Nav extends Component {
  render() {
    const loggedIn = this.props.data.get('loggedIn');
      return (
        <nav className="dd">
          <Link className="logo" to="/">{ this.props.data.get('title') } Net</Link>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            { loggedIn &&
              <li><Link to="/">Dashboard</Link></li>
            }
            { loggedIn &&
              <li><button id="nav--userSettings" onClick={::this._logout}>{this.props.data.getIn(['login', 'user', 'email'])}</button></li>
            }
            { !loggedIn &&
              <li><Link id="nav--login" to="/login">Log In</Link></li>
            }
            { !loggedIn &&
              <li><Link id="nav--register" to="/register">Register</Link></li>
            }
          </ul>
        </nav>
      );
  }

  _logout() {
    this.props.dispatch(logout());
  }

  _changeLanguage() {
    this.props.dispatch(changeLanguage());
  }

  componentWillMount() {
    this.props.dispatch({
      type: 'GET_USER'
    });
  }
}

function mapStateToProps(state, ownProps) {
  return {
    data: state,
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    user: state.getIn(['login', 'user']),
    ...ownProps
  };
}

Nav.displayName = 'Nav';

export default connect(mapStateToProps)(Nav);
