import React, { Component} from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import * as actions from '../actions';
import './index.scss';
import * as SurveyFields from '../../../common/SurveyFields';
import {RIEInput} from 'riek';

export class AdminAddQuestionModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      highlight: false,
      simulateXHR: false,
      confirmDelete: false,
      questionData: [
        {
          label: "Sample Label",
          data: "Data Value"
        }
      ]
    }
  }

  virtualServerCallback = (newState) => {
    if (this.state.simulateXHR) {
    window.setTimeout(function() {
      this.changeState(newState);
    }.bind(this), this.state.XHRDelay);
    } else {
    this.changeState(newState);
    }
  };

  changeState = (newState) => {
    this.setState(newState);
  }

  onSaveQuestion = () => {
    this.props.dispatch(actions.saveEditing({}));
  }

  onDeleteQuestion = () => {
    this.props.dispatch(actions.showDelete(true));
  }

  deleteQuestion = () => {
    this.props.dispatch(actions.saveEditing({}));
  }

  cancelDelete = () => {
    this.props.dispatch(actions.showDelete(false));
  }
  
  isStringAcceptable = (string) => {
    return (string.length >= 1);  // Minimum 4 letters long
  }

  addNewData = () => {
    let {curQuestion} = this.props.modalData.toJS();
    let questionData = curQuestion.choices;
    questionData.push(
      {
          text: "Sample Label" + questionData.length
      });
    this.props.dispatch(actions.updateQuestion(curQuestion));
  }

  removeQuestion = (index) => {
    let {curQuestion} = this.props.modalData.toJS();
    curQuestion.choices.splice(index, 1);
    this.props.dispatch(actions.updateQuestion(curQuestion));
  }

  moveQuestion = (index, direction) => {
    let {curQuestion} = this.props.modalData.toJS();
    let questionData = curQuestion.choices;
    let indexB;
    if (direction === -1) {
      indexB = Math.max(0, index - 1);
    }
    else {
      indexB = Math.min(questionData.length, index + 1);
    }
    const temp = questionData[index];
    questionData[index] = questionData[indexB];
    questionData[indexB] = temp;
    this.props.dispatch(actions.updateQuestion(curQuestion));
  }

  makeQuestionData = (question, index) => {
    return (
        <tr>
          <td>{question.text}</td>
          <td>{question.text}</td>
          <td className="has-text-right">
            <a onClick={() => {this.moveQuestion(index, -1)}}>
              <span className="icon is-medium">
                <i className="fa fa-caret-up" />
              </span>
            </a>
            <a onClick={() => {this.moveQuestion(index, 1)}}>
              <span className="icon is-medium">
                <i className="fa fa-caret-down" />
              </span>
            </a>
            <a onClick={() => {this.removeQuestion(index)}}>
              <span className="icon is-medium">
                <i className="fa fa-trash" />
              </span>
            </a>
          </td>
        </tr>
      );
  }

  renderInput = (question) => {
    switch(question.type) {
      case "text":
        return (
          <SurveyFields.Input/>
        );
      case "bool":
        return (
            <SurveyFields.Bool
              vocab={this.props.vocab}/>
        );
      case "choice":
        return (
            <SurveyFields.Choice
              choices={question.choices}
              vocab={this.props.vocab}/>
        );
      case "choices":
        return (
            <SurveyFields.Choices
              choices={question.choices}
              vocab={this.props.vocab}/>
        );
    }
  }

  renderOption = (question) => {
    console.log(question);
    let questionData = [];
    switch(question.type) {
      case "choice":
        if(question.choices){
          questionData = question.choices.map(::this.makeQuestionData);
        }
        return (
          <table className="table">
            <thead>
              <tr>
                <th>OPTION LABEL</th>
                <th>DATA VALUE</th>
                <th>DATA VALUES</th>
              </tr>
            </thead>
            <tbody>
              {questionData}
              <tr>
                <td className="has-text-right" colSpan="3">
                  <button className="buttonPrimary confirm" onClick={this.addNewData}>Add New Value</button>
                </td>
              </tr>
            </tbody>
          </table>
        );
      case "choices":
        if(question.choices){
          questionData = question.choices.map(::this.makeQuestionData);
        }
        return (
          <table className="table">
            <thead>
              <tr>
                <th>OPTION LABEL</th>
                <th>DATA VALUE</th>
                <th>DATA VALUES</th>
              </tr>
            </thead>
            <tbody>
              {questionData}
              <tr>
                <td className="has-text-right" colSpan="3">
                  <button className="buttonPrimary confirm" onClick={this.addNewData}>Add New Value</button>
                </td>
              </tr>
            </tbody>
          </table>
        );
    }
    return "";
  }

  render() {
    const {isEditing, curQuestion, isDeleting} = this.props.modalData.toJS();
    const renderedInput = ::this.renderInput(curQuestion);
    const renderedOption = ::this.renderOption(curQuestion);
    return (
      <Modal
        isOpen={isEditing}
        shouldCloseOnOverlayClick={true}>
          <Modal
            isOpen={isDeleting}>
            <div className="section">
              <h4 className="title is-4 is-marginless">Do you really want to delete the question?</h4>
              <div className="is-pulled-right control is-grouped">
                <p className="control">
                  <button onClick={this.deleteQuestion} className="buttonPrimary confirm">
                    Delete
                  </button>
                </p>
                <p className="control">
                  <button onClick={this.cancelDelete} className="buttonSecondary">
                    Cancel
                  </button>
                </p>
              </div>
            </div>
          </Modal>
          <div className="questionContent">
            <div>
              <select className="form--select light">
                <option>Dropdown / Select (Single Choice)</option>
              </select>
              <button className="loadButton buttonSecondary light">Load Template</button>
              <div className="changeQuestion">
                <a><i className="fa fa-caret-up" /></a>
                <a><i className="fa fa-caret-down" /></a>
              </div>
            </div>
            <div className="control is-grouped">
              <div className="control">
                <a className="button is-primary is-inverted">
                  <span className="icon">
                    <i className="fa fa-check" />
                  </span>
                  <span>Required</span>
                </a>
              </div>
              <div className="control">
                <a className="button is-white is-outlined">
                  <span className="icon is-small">
                    <i className="fa fa-circle" />
                  </span>
                  <span>Beginning of Section</span>
                </a>
              </div>
            </div>
            { renderedOption }
            <div className="box">
              <article className="media">
                <div className="media-content">
                  <div className="content">
                    <h6 className="questionHead is-marginless gapMediumGray">Question <span>{curQuestion.id || '1'}</span></h6>
                    <br />
                    <div className="questionTitle">
                      <RIEInput
                        value={curQuestion.text}
                        change={this.virtualServerCallback}
                        propName="questionTitle"
                        className={this.state.highlight ? "editable" : ""}
                        validate={this.isStringAcceptable}
                        classLoading="loading"
                        classInvalid="invalid" />
                    </div>
                    {renderedInput}
                  </div>
                </div>
              </article>
            </div>
            <div>
              <button className="loadButton buttonSecondary light" onClick={this.onDeleteQuestion}>Delete Question</button>
              <button className="buttonPrimary confirm is-pulled-right" onClick={this.onSaveQuestion}>Done Editing</button>
            </div>
          </div>
      </Modal>
  )}
}

const mapStateToProps = function(state, ownProps) {
  return {
    modalData: state.getIn(['adminSurvey', 'editingData']),
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    ...ownProps
  };
}

export default connect(mapStateToProps)(AdminAddQuestionModal);