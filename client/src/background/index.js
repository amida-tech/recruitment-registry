import React, { Component } from 'react';
import { connect } from 'react-redux';

class Background extends Component {
  componentWillReceiveProps(nextProps){
    this.vocab = nextProps.vocab;
  }

  render() {
    console.log("rendered");
    return (
      <div>
        fuck this
      </div>
    );
  }
}

Background.displayName = 'Background';

function mapStateToProps(state) {
  return {
    data: state,
  };
}

export default connect(mapStateToProps)(Background);


    // vocab: state.getIn(['settings', 'language', 'vocabulary'])