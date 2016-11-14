import React, { Component } from 'react';
import Nav from '../nav/index';
import { connect } from 'react-redux';

class Layout extends Component {
  componentWillReceiveProps(nextProps){
    this.vocab = nextProps.vocab;
  }

  render() {
    const altClass = this.props.data.get("loggedIn") ? '' : 'alt-nav';
    return (
      <div className={altClass}>
        <Nav />
        <main id="content" className="">{this.props.children}</main>
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

export default connect(mapStateToProps)(Layout);
