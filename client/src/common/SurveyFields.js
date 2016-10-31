import React, { Component } from 'react';

export class Bool extends Component {
  render(){
    return(
        <div id={this.props.id+'bool'}>
          <label>{this.props.text}</label>
          <br />
          <label htmlFor={this.props.id}>
            <input name={this.props.id}
              id={this.props.id}
              type="radio"
              required={this.props.required}
              onChange={ this.props.changeForm }
              value="true"
              data-itype="bool" />
            {this.props.vocab.get('YES')}
          </label>
          <br />
          <label htmlFor={this.props.id}>
            <input name={this.props.id}
              id={this.props.id}
              type="radio"
              onChange={this.props.changeForm}
              value="false"
              data-itype="bool"/>
            {this.props.vocab.get('NO')}
          </label>
        </div>
    )
  }
}

export class Choice extends Component {
  render(){
    return(
      <div key={this.props.id}>
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <select
          id={this.props.id}
          required={this.props.required}
          onChange={this.props.changeForm}
          data-itype="choice"
          defaultValue='x'>
          <option
            key={this.props.id+'x'}
            value='x'
            disabled={true}>
            {this.props.vocab.get('PLEASE_SELECT')}
          </option>
          {this.props.choices.map((choice, index) =>
            <option
              key={choice.id}
              value={choice.id}>
              {choice.text}
            </option>
          )}
        </select>
      </div>
    )
  }
}

export class Input extends Component {
  render(){
    return(
      <div key={this.props.id} >
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <input
          id={this.props.id}
          type={this.props.type}
          required={this.props.required}
          onChange={ this.props.changeForm }
          autoComplete="off"
          data-itype="text" />
      </div>
    )
  }
}

export class Choices extends Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  //This will have to be handled differently.
  handleChange(event) {
    this.props.changeForm(event);
    if (event.target.options[event.target.selectedIndex].getAttribute('type') == 'text'){
      document.getElementById(this.props.id+'.textInput').className="";
      document.getElementsByName(this.props.id+'.text')[0].setAttribute('id',event.target.value);
    } else {
      document.getElementById(this.props.id+'.textInput').className="invisible";
    }
  }

  render(){
    return (
      <div key={this.props.id} >
        <label key={this.props.id} >{this.props.text}</label>
          <select
            id={this.props.id}
            onChange={this.handleChange}
            required={this.props.required}
            data-itype="choices.bool"
            defaultValue={this.props.vocab.get('PLEASE_SELECT')}>
            <option
              key={this.props.id+'x'}
              disabled={true}>
              {this.props.vocab.get('PLEASE_SELECT')}
            </option>
            {this.props.choices.map((choice, index) =>
              <option key={choice.id}
              value={choice.id}
              type={choice.type}>
              {choice.text}</option>)}
          </select>
          <div id={this.props.id+'.textInput'} className="invisible">
            <label htmlFor={this.props.id+'.text'}>
              {this.props.vocab.get('PLEASE_ENTER_DATA')}
            </label>
            <input name={this.props.id+'.text'}
              onChange={this.props.changeForm}
              autoComplete="off"
              data-itype="choices.text"/>
          </div>
      </div>
    )
  }
}

//Saved from Almir for study later.
// const renderCheckbox = (surveyId, questionId, choiceId, label) => (
//   <div className="checkbox" key={surveyId + '.' + questionId + '.' + choiceId}>
//     <label><input type="checkbox"
//                   name={surveyId + '.' + questionId + '.' + choiceId}
//                   id={surveyId + '.' + questionId + '.' + choiceId}
//                   onChange={this.props.changeChoice}
//                   value={surveyId + '.' + questionId + '.' + choiceId}/> {label}</label>
//   </div>
// )
//
// const renderChoices = (question) => {
//   var checkboxes = question.choices.map(choice => {
//     return renderCheckbox(this.props.survey.id, question.id, choice.id, choice.text);
//   })
