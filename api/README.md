# Recruitment Registry API

Recruitment Registry API

## Features

- Node.js v6
- Express
- Sequelize (Postgres)
- Mocha + Chai + SuperTest
- Grunt

## Installation

1. Install Node.js v6 - previous node versions may require Babel
2. Install Postgres v9.4 or better (see Postgres dependencies to switch to another Sequelize compatible relational database)
3. Create a database `recreg`
4. Install Grunt
5. Install dependencies: `npm install`
6. Create a `.env` file in this directory

## Windows Caveat

Due to variances between Windows and Linux and Mac OSes, Windows users will have to add a few steps for
installing the needed components for node-gyp. And all users will probably have to install Python 2.7 as well.

1. Download & install Python 2.7.
2. Set the Environmental Variables for the Python install, including the variable 'PYTHON.'
3. Download & install Visual C++ Build Tools. (http://landinghub.visualstudio.com/visual-cpp-build-tools)
4. Run 'npm config set msvs_version 2015 --global'
5. If errors continue to occur, update to the latest version of npm with 'npm install npm -g'

## Configuration

1. Use `export NODE_ENV='development` (or `production` or `test`) to set node environment
2. A minimal sample `.env` file is below.  Change according to your database
```
RECREG_DB_DATABASE=recreg
RECREG_DB_USER=foouser
RECREG_DB_PW=TDP#2016!
RECREG_DB_HOST=localhost
RECREG_DB_PORT=5432
RECREG_DB_DIALECT=postgres
```
## Commands

`npm start`

> Run server (default port is 9005)

`grunt`

> First beautifies and lints all files and then runs all the tests.

`npm test`

> Runs all the tests.

`npm run-script coverage`

> Runs all the tests and displays coverage metrics.

## Tests

This project primarily uses [Mocha](http://mochajs.org/), [Chai](http://chaijs.com/) and Super Test for automated testing.  Sinon is also used in a couple of tests when it is absolutely necessary to use stubs.  Stubbing in general however is avoided.

All tests are located in `test` directory in a mostly flat directory structure.  All API entries both get a HTTP integration test and an equivalent model test.  Unit tests for other utility modules are also included in the root directory.  In addition `test/use-cases` directory includes informative tests designed to instruct how to use the API from a client.

Individual test suites can be run using mocha

```
$ mocha test/survey.model.spec.js --bail
```

Each test in a file may depend on some of the previous tests so using flag `bail` is recommended.

## Postgres specific functionality

Although this project uses Sequelize it does not support other Sequelize compatible relational databases such as MySql and MSSql out of the box.  The following are the Postgres only functionalities that need to be replaced to be able to use other databases.

* `smtp` table includes a JSON type column named `other_options`.  This column can be replaced with a string type and string to/from JSON conversion can be done manually done in the code.
* `rr_section`table includes an integer array type column named `indices`.  A seperate table can be used instead.  Code need to be updated acccordingly.
* `answer` data access object (answer.dao.js) uses Postgres `to_char` function in one of the queries.  This function needs to be replaced by equivalent.

## Resources

Primary resources are questions, answers, surveys and consent documents.  All the other resources are axulliary in nature to support the primary resources.

#### Question

This is a question centric design where all participant information (except login) is obtained from answers to some question.  Questions are stand alone and can be shared between surveys.  Currently four types of questions are supported

- 'text': These are free text questions.
- 'bool': These are yes/no questions
- 'choice': These are multiple choice questions from which a single selection needs to be made.
- 'choices': These are multi answer questions where participants can make multiple selections from multiple choices.  Additional free text components can be also specified for this type to collect additional information from participants that is not covered by the choices.

#### Answers

## API

File [swagger.json](./swagger.json) describes the API.  There are various [swagger](http://swagger.io/) tools such as [swagger-codegen](https://github.com/swagger-api/swagger-codegen) that can be used view or generate reports based on this file.  In addition when the recruitment-registry api server is running `/doc` path serves as the API user interface (`localhost:9005/docs` for default settings).

Another detailed description of the API with working examples is provided in the [integration document](./docs/api.md).

## Database Design

All table and column names are in snake case to follow Postgres convention and for ability to write Postgres queries easily.  All tables have `created_at` columns.  All tables for which records can be updated have an `updated_at` column.  All tables for which records can be soft deleted have a `deleted_at` column.  No record on any table is ever hard deleted.  Currently only a handful of uniqueness contraints are enforced on the database level.  No indexes have been created yet.

### Tables

- `question`: This table stores all questions that are being or can be used in surveys.  Questions can be stand alone, can belong to a survey or can belong to multiple surveys.  Link to surveys (table `survey`) is achieved through `survey_question` table.  Questions can be updated and soft deleted.  Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first question in the group.  Actual data fields are text of the question (column `text`) and type (column `question_type_name`).

- `question_type`: This table stores available question types. Current supported types are `text`, `bool`, `choice`, and `choices` that respectively correspond to free text questions, yes/no questions, multiple choice questions and composite questions with multiply selectable choices and free text fields.

- `question_action`: This table stores display texts (colum `text`) and actions (column `type`) of buttons that are shown to the user when interacting with the question on the client.

- `question_choice`: This table stores text (column `text`) of choice in multiple choice question.  Question id is a foreign key (column `question_id`).  To support composite questions that can have multiply selectable choices together with free text fields (ex: a list of check boxes with a free text other field), this table also stores type of choice (column `type`) with currently supported types of `bool` and `text`.  Order of choices for a particular question is preserved using a line item (column `line`).

- `survey`: This table stores all the surveys in the system.  Surveys can be updated and soft deleted. Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first survey in the group.  Questions in surveys are represented using another table `survey_question`.  Only actual data field is the name (column `name`).

- `survey_question`: This table stores questions in particular surveys.  Each record represents a question (column `question_id`) in a survey (column `survey_id`).  Question order is preserved using field line (column `line`).  Questions can also be marked required (column `required`).

- `answer`: This table stores all the answers to questions.  Each record represents an answer to a question (column `question_id`) in a survey (`column survey_id`) by a user (column `user_id`).  Actual answer data can be a choice from question multiple choices (column `question_choice_id`) and/or a free value field (column `value`) whose type is also stored (column `type`).  Current supported types are `text and `bool`.

- `registry_user`: This table store patient demographics (name, email), role, and login information (username, password, password reset through email token and its expiration date).

- `consent_type`: It stores all the consent types.  Actual data are name (column `name`) for programmatic purposes and description (column `description`) for user interface purposes.

- `consent-document`: Currently the only actual data is consent section text content (column `content`).  Each record is of some consent section section type (column `type_id`).  This table is designed to have at most one active record for each type at any point in time.  All other records of the same types will be in soft deleted state.

- `consent_signature`: This table stores each instance (column `created_at`) of a user (column `user_id`) signing a consent section (column `consent_document_id`).

- `survey_consent_type`: Each record represents a consent section (column `consent_type_id`) that needs to signed by a user before a survey (column `survey_id`) can be read, submitted or edited (column `action`).

- `registry`: This table stores registry level settings and includes only one record.  Currenly only data is the survey that is being used in user registration (column `profile_survey_id`).

In very near future there will be one or two tables to store consent documents (composite of consent sections).  Also there will be additional tables to support internationalization.

## References

- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [Grunt](http://gruntjs.com/)
- [Sequelize](http://docs.sequelizejs.com/en/v3/)
- [Postgres](https://www.postgresql.org/)
- [Mocha](http://mochajs.org/)
- [Chai](http://chaijs.com/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Babel](http://babeljs.io/)
- [Swagger](http://swagger.io/)
