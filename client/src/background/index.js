import React, { Component } from 'react';
import { connect } from 'react-redux';


class Background extends Component {
  componentWillReceiveProps(nextProps){
    this.vocab = nextProps.vocab;
  }

  render() {
    //TODO: Move this to a React methodology. For now, this solves a spamming issue.
    if(document.getElementsByTagName('body')[0].className.indexOf('alt-nav') <0){
      document.getElementsByTagName('body')[0].className+=' alt-nav';
    }
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
