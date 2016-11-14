import React, { Component } from 'react';
import Nav from '../nav';
import { connect } from 'react-redux';

class Layout extends Component {
  componentWillReceiveProps(nextProps){
    this.vocab = nextProps.vocab;
  }

  render() {
    const displayClass = displayAltClass(this.props.location.pathname);
    const altClass = displayClass ? 'alt-nav' : '';
    console.log(this.props.location.pathname);
    return (
      <div className={altClass}>
        <Nav />
        <main id="content">{this.props.children}</main>
      </div>
    );
  }
}

Layout.displayName = 'Layout';

function mapStateToProps(state, ownProps) {
  return {
    data: state,
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    ...ownProps
  };
}

function displayAltClass(pathName) {
  const paths = ['/login', '/register', '/dashboard'];
  if (paths.indexOf(pathName) >= 0) {
    return true;
  } else {
    return false;
  }
}

export default connect(mapStateToProps)(Layout);
