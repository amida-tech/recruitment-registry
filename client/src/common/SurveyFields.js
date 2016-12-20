import React, { Component } from 'react';

export class Bool extends Component {
  render(){
    return(
        <div id={this.props.id+'bool'}>
          <p className='question'>{this.props.text}</p>

          <div className='bool'>
              <button
                className='btn buttonPrimary lightGreen'
                name={this.props.id}
                id={this.props.id+'t'}
                required={this.props.required}
                onChange={ this.props.changeForm }
                value={true}
                text={this.props.vocab.get('YES')}
                data-itype='bool'
              >
                  {this.props.vocab.get('YES')}
              </button>

              <button
                className="btn buttonPrimary red pull-right"
                name={this.props.id}
                id={this.props.id+'f'}
                type='radio'
                onChange={this.props.changeForm}
                value={false}
                data-itype='bool'>
                  {this.props.vocab.get('NO')}
              </button>


          </div>
      </div>
    )
  }
}

export class Choice extends Component {
  render(){
    return(
      <div key={this.props.id}>
        <p className='question'>{this.props.text}</p>
        <div className='radioGroup'>
        {this.props.choices.map(choice => {
          return ([
            <input type='radio'
              name={this.props.id}
              id={this.props.id +'.'+choice.id}
              value={choice.id}
              data-itype='choice'
              required={this.props.required}
              onChange={this.props.changeForm}/>,
            <label htmlFor={this.props.id +'.'+choice.id}>
              {choice.text}
            </label>
          ])}
        )}
        </div>
      </div>
    )
  }
}

export class Input extends Component {
  render(){
    return(
      <div key={this.props.id} >
        <p className='question' htmlFor={this.props.id}>{this.props.text}</p>
        <input
          name={this.props.id}
          id={this.props.id}
          type={this.props.type}
          required={this.props.required}
          onChange={ this.props.changeForm }
          autoComplete='off'
          data-itype='text' />
      </div>
    )
  }
}

export class Choices extends Component {
  constructor(props){
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleChangeText = this.handleChangeText.bind(this);
  }

  componentWillMount(){
    this._textTriggered = false;
    this._textId;
  }

  handleChange(event) { //For Surveyz
    if (event.target.getAttribute('data-itype') == 'choices.text'){
      this._textId = event.target.value;
      this._textTriggered = !this._textTriggered;
      this.forceUpdate();
    } else {
      this.props.changeFormChoices(event.target.getAttribute('data-itype'),
      this.props.id, event.target.value, event.target.checked);
    }
  }

  handleChangeText(event) {
    this.props.changeFormChoices(event.target.getAttribute('data-itype'),
    this.props.id, this._textId, event.target.value);
  }

  render(){
    return (
      <div className='' key={this.props.id} >
        <p className='question'>{this.props.text}</p>
        <div className='checkboxes'>
          {this.props.choices.map(choice => {
            return ([
              <input type='checkbox'
                name={this.props.id}
                id={choice.id}
                value={choice.id}
                data-itype={'choices.'+choice.type}
                onChange={this.handleChange}/>,
              <label htmlFor={choice.id}>
                {choice.text}
              </label>
            ])}
          )}
        </div>
        {this._textTriggered &&
        (<div id={this.props.id+'.textInput'}>
          <label>{this.props.vocab.get('PLEASE_ENTER_DATA')}</label>
          <input name={this.props.id+'.text'}
            onChange={this.handleChangeText}
            autoComplete='off'
            data-itype='choices.text'/>
        </div>)}
      </div>
    )
  }
}
