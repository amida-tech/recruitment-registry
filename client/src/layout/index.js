import React, { Component } from 'react';
import Nav from '../nav/index';
import { connect } from 'react-redux';

class Layout extends Component {
  componentWillReceiveProps(nextProps){
    this.vocab = nextProps.vocab;
  }

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
    data: state,
    vocab: state.getIn(['settings', 'language', 'vocabulary'])
  };
}

export default connect(mapStateToProps)(Layout);
