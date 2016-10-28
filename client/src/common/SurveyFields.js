import React, { Component } from 'react';

export class Bool extends Component {
  render(){
    return(
        <div id={this.props.id} className="rr">
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
      <div key={this.props.id} className="rr rr-question" >
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <select
          id={this.props.id}
          required={this.props.required}
          className="rr-blankline rr-field"
          onChange={this.props.changeForm}
          data-itype="choice">
          <option
            key={this.props.id+'x'}
            defaultValue
            disabled="disabled">
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
      <div key={this.props.id} className="rr rr-question" >
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <input
          id={this.props.id}
          type={this.props.type}
          required={this.props.required}
          className="rr-blankline rr-field"
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
      <div key={this.props.id} className="rr">
        <label key={this.props.id} >{this.props.text}</label>
          <select
            id={this.props.id}
            onChange={this.handleChange}
            className="rr-blankline rr-field"
            required={this.props.required}
            data-itype="choices.bool">
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
              className="rr-blankline rr-field"
              data-itype="choices.text"/>
          </div>
      </div>
    )
  }
}
