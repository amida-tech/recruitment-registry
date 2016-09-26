import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import routes from '../routes';
import { logout } from '../login/actions';

class Nav extends Component {
  render() {
    const title = this.props.data.get('title');
    const loggedIn = this.props.data.get('loggedIn');

    var nav;

    if (loggedIn) {
      var routesAuthed = routes.filter(r => r.requiresAuth || !r.newUsers)
      nav = routesAuthed.map(r => <Link className="nav-item nav-link" key={r.path} to={r.path}>{r.title}</Link>)
    } else {
      var routesNewUsers = routes.filter(r => !r.requiresAuth || r.newUsers)
      nav = routesNewUsers.map(r => <Link className="nav-item nav-link" key={r.path} to={r.path}>{r.title}</Link>)
    }

    return (
      <nav className="navbar navbar-full navbar-dark bg-inverse">
        <a className="navbar-brand" href="/">{ title }</a>
        <div className="nav navbar-nav">{nav}</div>
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