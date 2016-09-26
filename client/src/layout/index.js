import React, { Component } from 'react';
import Nav from '../nav/index';
import { connect } from 'react-redux';

class Layout extends Component {
  render() {
    return (
      <div>
        <Nav />
        <main id="content" className="container">{this.props.children}</main>
      </div>
    );
  }
}

Layout.displayName = 'Layout';

function mapStateToProps(state) {
  return {
    data: state
  };
}

export default connect(mapStateToProps)(Layout);