import React, { Component} from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
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

  onDeleteQuestion = () => {
    this.setState({confirmDelete: true});
  }

  deleteQuestion = () => {
    this.setState({confirmDelete: false});
    this.props.handleChange(false);
  }

  cancelDelete = () => {
    this.setState({confirmDelete: false});
  }
  
  isStringAcceptable = (string) => {
    return (string.length >= 1);  // Minimum 4 letters long
  }

  addNewData = () => {
    var questionData = this.state.questionData;
    questionData.push(
      {
          label: "Sample Label" + questionData.length,
          data: "Data Value"
      });
    this.setState({questionData: questionData});
  }

  removeQuestion = (index) => {
    var questionData = this.state.questionData;
    questionData.splice(index, 1);
    this.setState({questionData: questionData});
  }

  moveQuestion = (index, direction) => {
    var questionData = this.state.questionData;
    var indexB;
    if (direction === -1) {
      indexB = Math.max(0, index - 1);
    }
    else {
      indexB = Math.min(questionData.length, index + 1);
    }
    const temp = questionData[index];
    questionData[index] = questionData[indexB];
    questionData[indexB] = temp;
    this.setState({questionData: questionData});
  }

  makeQuestionData = (question, index) => {
    return (
        <tr>
          <td>{question.label}</td>
          <td>{question.data}</td>
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

  renderInput = (question, type) => {
    switch(type) {
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

  render() {
    const {modalStatus, handleChange, currentQuestion, questionType} = this.props;
    var questionData = [];
    const renderedInput = ::this.renderInput(currentQuestion, questionType);
    if(this.state.questionData){
      questionData = this.state.questionData.map(::this.makeQuestionData);
    }
    return (
      <Modal
        isOpen={modalStatus}
        shouldCloseOnOverlayClick={true}>
          <Modal
            isOpen={this.state.confirmDelete}>
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
            <div className="box">
              <article className="media">
                <div className="media-content">
                  <div className="content">
                    <h6 className="questionHead is-marginless gapMediumGray">Question <span>{currentQuestion.id || '1'}</span></h6>
                    <br />
                    <div className="questionTitle">
                      <RIEInput
                        value={currentQuestion.text}
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
              <button className="buttonPrimary confirm is-pulled-right" onClick={()=>handleChange(false)}>Done Editing</button>
            </div>
          </div>
      </Modal>
  )}
}

const mapStateToProps = function(state, ownProps) {
  return {
    vocab: state.getIn(['settings', 'language', 'vocabulary']),
    ...ownProps
  };
}

AdminAddQuestionModal.propTypes = {
  modalStatus: React.PropTypes.bool.isRequired,
  currentQuestion: React.PropTypes.object.isRequired,
  handleChange: React.PropTypes.func.isRequired,
  questionType: React.PropTypes.string.isRequired
}

export default connect(mapStateToProps)(AdminAddQuestionModal);