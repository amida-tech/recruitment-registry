import React, { Component} from 'react';

export class SurveyNavigator extends Component {
  render() {
    var temp ="btn rr-button m-r-2";
    return(
        <div id={this.props.id} className="rr-height rr">
          {this.props.location == 8 ? (
            <div className="rr-wrapper m-b-2">
              <h1 className="rr no-transform">{this.props.vocab.get('LETS_CREATE')}</h1>
            </div>
          ) : (<div></div>)}
          {this.props.surveyField}
          <div className="rr-controls">
            <button className= {this.props.location == 1 ? "invisible " + temp : temp}
            onClick={this.props.previous} type="button">
              {this.props.vocab.get('BACK')}
            </button>
            {this.props.location != 8 ?
              (<button className={temp} onClick={this.props.next} type="button">
              {this.props.vocab.get('NEXT')}</button>) :
              (<button className={temp} onClick={this.props.next} type="button">
              {this.props.vocab.get('REGISTER')}</button>)}
          </div>
        </div>
      )
  }
}
