import React, { Component } from 'react';

export class SurveyInputField extends Component {
  render(){
    return(
      <div key={this.props.id} >
        <div className="rr-question" >
          <label htmlFor={this.props.id}>{this.props.text}</label>
          <input autoComplete="off" required className="rr-blankline rr-field" id={this.props.id} type={this.props.type} />
        </div>
      </div>
    )
  }
}

//Truth be told, we could probably have a decision made within SurveyChoicesField
//instead of having bool be its own Component. That's a performance question.
export class SurveyBoolField extends Component {
  render(){
    return(
      <div key={this.props.id} >
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <form id={this.props.id}>
          <label htmlFor={this.props.id+'.true'}>{this.props.vocab.get('YES')}</label>
          <input name={this.props.id+'.true'} type="radio" value="true"/>
          <label htmlFor={this.props.id+'.false'}>{this.props.vocab.get('NO')}</label>
          <input name={this.props.id+'.false'} type="radio" value="false"/>
        </form>
      </div>
    )
  }
}

export class SurveyChoiceField extends Component {
  render(){
    return(
      <div key={this.props.id} >
        <div className="rr-question" >
          <label htmlFor={this.props.id}>{this.props.text}</label>
          <select required className="rr-blankline rr-field" id={this.props.id}>
            {this.props.choices.map(choice => <option key={choice.id} value={choice.text}>{choice.text}</option>)}
          </select>
        </div>
      </div>
    )
  }
}

export class SurveyChoicesField extends Component {
  render(){
    console.log("SurveyChoicesField: ");
    console.log(this.props);
    return (
      <div key={this.props.id} >
          {this.props.choices.map(choice =>
            <div className="rr-question">
              {console.log('JAMES')}
              {console.log(choice)}
              <label htmlFor={choice.id}>{choice.text}</label>
              <form id={choice.id}>
                <label htmlFor={choice.id+'.true'}>{this.props.vocab.get('YES')}</label>
                <input name={choice.id+'.true'} type="radio" value="true"/>
                <label htmlFor={choice.id+'.false'}>{this.props.vocab.get('NO')}</label>
                <input name={choice.id+'.false'} type="radio" value="false"/>
              </form>
            </div>
          )}
      </div>
    )
  }
}


const mapStateToProps = function(state) {

  return {
    vocab: state.getIn(['settings', 'language', 'vocabulary'])
  };
}

SurveyInputField.propTypes = {
}

//export SurveyInputField, SurveyChoiceField;
