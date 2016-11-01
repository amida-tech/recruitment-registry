import React, { Component} from 'react';

export class SurveyNavigator extends Component {
  render() {
    return(
        <div id={this.props.id}>
          {this.props.surveyField}
          <div className="form__footer">
            <button
            onClick={this.props.previous} type="button">
              {this.props.vocab.get('BACK')}
            </button>
            <button
              onClick={this.props.next}
              className="buttonPrimary pull-right"
              type="button"
              value={this.props.location}>
              {this.props.location != this.props.final ?
              (this.props.vocab.get('CONTINUE')) :
              (this.props.vocab.get('REGISTER'))}
            </button>
          </div>
        </div>
      )
  }
}
