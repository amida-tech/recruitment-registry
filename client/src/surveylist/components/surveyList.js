import React, {Component} from 'react';
import Immutable from 'immutable';
import {groupBy} from 'lodash';

import SurveyListSection from './SurveySection';


export class SurveyList extends Component {

    constructor() {
        super();
    }


    render() {



        // function sortSurveys(surveys) {
        //     const sorted = {
        //         new: [],
        //         surveysToUpdate: [],
        //         completed: []
        //     };
        //
        //     surveys.forEach((survey) => {
        //         sorted[survey.status].push(survey);
        //     });
        //
        //     return sorted;
        // }
        //
        // const surveys = sortSurveys(this.props.surveys);



        // console.log(this.props.surveys.size);
        // // const surveys = groupBy(this.props.surveys, 'status');
        // console.log("SURVAYS ");
        // console.log(surveys);


        const surveys = this.props.surveys;
        const total = surveys.length;
        // TODO: Implement completed
        const completed = 2;




        return (
            <div className="row" id="surveyList">
                <div className="col-md-4 col-xs-12" id="sidebar">
                    <h1>Questionnaire</h1>
                    <h2>{completed}/{total} Completed</h2>
                </div>
                <div className="col-md-7 col-xs-12">
                    <ul>
                        <SurveyListSection
                            title="TO BE COMPLETED"
                            surveys={surveys}
                            cssId="surveysToComplete"
                        />
                        <SurveyListSection
                            title="UPDATE NEEDED"
                            surveys={surveys}
                            cssId="surveysToUpdate"
                        />
                        <SurveyListSection
                            title="COMPLETED"
                            surveys={surveys}
                            cssId="surveysCompleted"
                        />
                    </ul>
                </div>
            </div>
        )
    }

}

SurveyList.propTypes =  {
    surveys: React.PropTypes.arrayOf(Immutable.List).isRequired
};

export default SurveyList;