import React, { Component } from 'react';

export class SurveyInputField extends Component {
  render(){
    return(
      <div key={this.props.id} >
        <div className="rr-question" >
          <label htmlFor={this.props.id}>{this.props.text}</label>
          <input autoComplete="off" required className="rr-blankline rr-field"
            id={this.props.id} type={this.props.type} />
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
            {this.props.choices.map(choice => <option key={choice.id}
              value={choice.text}>{choice.text}</option>)}
          </select>
        </div>
      </div>
    )
  }
}

export class SurveyChoicesField extends Component {
  render(){
    var anyTexts = [];
    return (
      <div key={this.props.id} className="rr-question">
        <label key={this.props.id} >{this.props.text}</label>
        <form id={this.props.id} className="radio">
          {this.props.choices.map(choice =>
              <label key={choice.id} htmlFor={choice.id}><input key={choice.id} name={this.props.id}
                type="radio" value="false"/>{choice.text}</label>
          )}
        </form>
      </div>
    )
  }
}

// {if(choice.type == "text") {
//   <div>
//     <label htmlFor={this.props.id+'text'}>{this.props.vocab.get('PLEASE_ENTER_DATA')}</label>
//     <input name={this.props.id+'text'} autoComplete="off" required className="rr-blankline rr-field"/>
//   </div>
// }}


const mapStateToProps = function(state) {

  return {
    vocab: state.getIn(['settings', 'language', 'vocabulary'])
  };
}

SurveyInputField.propTypes = {
}

//export SurveyInputField, SurveyChoiceField;
