import React, { Component } from 'react';

export class SurveyInputField extends Component {
  render(){
    return(
      <div key={this.props.id} className="rr rr-question" >
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <input id={this.props.id} type={this.props.type} required={this.props.required}
          className="rr-blankline rr-field" onChange={ this.props.changeForm }
          autoComplete="off" data-index={this.props.index} />
      </div>
    )
  }
}

//Truth be told, we could probably have a decision made within SurveyChoicesField
//instead of having bool be its own Component. That's a performance question.
export class SurveyBoolField extends Component {
  render(){
    return(
        <div id={this.props.id} className="rr">
          <label>{this.props.text}</label>
          <br />
          <label htmlFor={this.props.id}><input name={this.props.id} id={this.props.id}
            type="radio" required={this.props.required} onChange={ this.props.changeForm }
            value="true" data-index={this.props.index}/> {this.props.vocab.get('YES')}</label>
          <br />
          <label htmlFor={this.props.id}><input name={this.props.id} id={this.props.id}
            type="radio" onChange={this.props.changeForm} value="false"
            data-index={this.props.index}/>{this.props.vocab.get('NO')}</label>
        </div>
    )
  }
}

export class SurveyChoiceField extends Component {
  render(){
    return(
      <div key={this.props.id} className="rr rr-question" >
        <label htmlFor={this.props.id}>{this.props.text}</label>
        <select id={this.props.id} required={this.props.required} className="rr-blankline rr-field"
          onChange={this.props.changeForm} data-index={this.props.index}>
          <option key={this.props.id+'x'} defaultValue="" selected disabled="disabled">
            {this.props.vocab.get('PLEASE_SELECT')}</option>
          {this.props.choices.map((choice, index) => <option key={choice.id}
            value={index}>{choice.text}</option>)}
        </select>
      </div>
    )
  }
}

export class SurveyChoicesField extends Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  //This will have to be handled differently.
  handleChange(event) {
    this.props.changeForm(event);
    event.target.options[event.target.selectedIndex].getAttribute('type') == 'text' ?
      document.getElementById(this.props.id+'textInput').className="" :
      document.getElementById(this.props.id+'textInput').className="invisible";
  }

  render(){
    return (
      <div key={this.props.id} className="rr">
        <label key={this.props.id} >{this.props.text}</label>
          <select id={this.props.id} data-index={this.props.index} onChange={this.handleChange}
            className="rr-blankline rr-field" required={this.props.required}>
            {this.props.choices.map((choice, index) => <option key={choice.id}
              value={index} type={choice.type}>{choice.text}</option>)}
          </select>
          <div id={this.props.id+'textInput'} className="invisible">
            <label htmlFor={this.props.id+'.text'}>{this.props.vocab.get('PLEASE_ENTER_DATA')}</label>
            <input name={this.props.id+'.text'} onChange={this.props.changeForm} autoComplete="off"
              className="rr-blankline rr-field" data-index={this.props.index}/>
          </div>
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
  changeForm: React.PropTypes.func.isRequired
}
