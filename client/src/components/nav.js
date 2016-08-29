import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import routes from '../routes';
import { logout } from '../actions/appActions';

class Nav extends Component {
  render() {
    const {loggedIn, title} = this.props.data;

    return (
      <nav className="navbar navbar-full navbar-dark bg-inverse">
        <a className="navbar-brand" href="/">{ title }</a>
        <div className="nav navbar-nav">
          {routes.map(r => <Link className="nav-item nav-link" key={r.path} to={r.path}>{r.title}</Link>)}
        </div>
        <div>
          { loggedIn ? (
            <div>
              <button type="button" className="pull-right nav-item nav-link btn btn-primary" onClick={::this._logout}>Logout</button>
            </div>
          ) : (<div></div>)}
        </div>
      </nav>
    );
  }

  _logout() {
    this.props.dispatch(logout());
  }
}

function select(state) {
  return {
    data: state
  };
}

Nav.displayName = 'Nav';

export default connect(select)(Nav);