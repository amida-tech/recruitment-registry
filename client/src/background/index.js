import React, { Component } from 'react';
import { connect } from 'react-redux';


class Background extends Component {
  componentWillReceiveProps(nextProps){
    this.vocab = nextProps.vocab;
  }

  render() {
    console.log("rendered");
    document.getElementsByTagName('body')[0].className+=' alt-nav'
    // document.getElementsByTagName('nav')[0].class+=' alt-nav';
    return (
      <div id="utility--background" className="blue">
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