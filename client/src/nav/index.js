import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import routes from '../routes';
import { logout } from '../login/actions';
import { changeLanguage } from '../profile/actions';

class Nav extends Component {
  render() {
    const title = this.props.data.get('title');
    const loggedIn = this.props.data.get('loggedIn');
    const role = this.props.user.get('role');
    var nav;

    for(var i = 0; i< routes.length; i++){
      routes[i].title = this.props.vocab.get(routes[i].transTerm);
    }

    if (loggedIn) {
      var routesAuthed = routes.filter(r => r.requiresAuth || !r.newUsers)
      nav = routesAuthed.map(r => {
        var path = r.path;
        if (r.path.indexOf('survey-builder') > -1) { path = '/survey-builder' }
        if (r.path.indexOf('survey/:id') > -1) { return }
        if (r.isSuper && role !== 'admin') {
            return <div className="nav-item invisible" key={r.path}></div>
        }
        return <Link className="nav-item nav-link" key={r.path} to={path}>{r.title}</Link>
      })
    } else {
      var routesNewUsers = routes.filter(r => !r.requiresAuth || r.newUsers)
      nav = routesNewUsers.map(r => {
        return <Link className="nav-item nav-link" key={r.path} to={r.path}>{r.title}</Link>
        })
    }

    return (
      <nav className="navbar navbar-full navbar-dark bg-inverse">
        <a className="navbar-brand" href="/">{ title }</a>
        <div className="nav navbar-nav">{nav}
          { loggedIn ? (<a className="nav-item nav-link m-l-1" onClick={::this._logout}>{this.props.vocab.get('LOGOUT')}</a>
        ) : ""}
          <a className="nav-item nav-link" onClick={::this._changeLanguage}>{this.props.vocab.get('LANGUAGE')}</a>
        </div>
      </nav>
    );
  }

  _logout() {
    this.props.dispatch(logout());
  }

  _changeLanguage() {
    this.props.dispatch(changeLanguage());
  }
}

function select(state) {
  return {
    data: state,
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    user: state.getIn(['login', 'user'])
  };
}

Nav.displayName = 'Nav';

export default connect(select)(Nav);
