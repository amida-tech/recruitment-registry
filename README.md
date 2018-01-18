# Recruitment Registry API

Recruitment Registry API

## Features

- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/)
- [Postgres](https://www.postgresql.org/)
- [Sequelize](http://docs.sequelizejs.com/en/v3/)
- [Mocha + Chai + SuperTest](http://engineering.invisionapp.com/post/express-integration-testing-supertest/)
- [Grunt](https://gruntjs.com/)

## Installation

1. Install all dependencies:
	* Node.js v6 (previous node versions may require Babel)
	* Postgres (v9.5 or greater)
	> Note: Default installations of Postgres on macOS (such as through homebrew or DMG install) may not grant proper permission to your postgres user role. macOS users may need to alter their Postgres user role with [role attribute](https://www.postgresql.org/docs/9.5/static/role-attributes.html) `LOGIN`. See [ALTER ROLE – (postgres.org)](https://www.postgresql.org/docs/9.5/static/sql-alterrole.html) in the Postgres Documentation for more.

	> Note: Windows users may be required to install Python 2.7 and Visual C++ Build Tools. Please follow [Installing Python and Visual C++ Build Tools (Windows)](#installing-python-and-visual-c-build-tools-windows) prior to continuing installation.
2. Create database recreg:
`createdb recreg`
3. Install Grunt:
`npm install -g grunt`
4. Install npm dependencies:
`npm install`
5. Create a `.env` file in root.
> Note: See [Configuration](#Configuration) for more about configuring your `.env` file.
6. Populate your database:
`node seed.js`
7. Run:
`npm start`

### Creating and resending cohorts in development
Storing and emailing links to cohorts requires an Amazon S3 service and a valid smtp mail server. To enable uploading a cohort file, set the AWS_ACCESS_KEY_ID and AWS_SECRET variables in your `.env` file, which are read by the aws SDK.

The `create-smtp.js` script can assist in adding an smtp record for testing email.

### Installing Python and Visual C++ Build Tools (Windows)

Due to variances between Windows, Linux, and macOS, Windows users will have to add a few steps for
installing the needed components for node-gyp. And all users will probably have to install Python 2.7 as well.

1. Download & install Python 2.7.
2. Set the Environmental Variables for the Python install, including the variable 'PYTHON.'
3. Download & install [Visual C++ Build Tools](http://landinghub.visualstudio.com/visual-cpp-build-tools).
4. Run 'npm config set msvs_version 2015 --global'
5. If errors continue to occur, update to the latest version of npm with 'npm install npm -g'


## Configuration

Use `export NODE_ENV=development` (or `production` or `test`) to set node environment in Bash compatible shells or equivalent in others.

Add to `PATH` `export PATH=$PATH:/Applications/Postgres.app/Contents/Versions/latest/bin`. Note: You'll have to preform this operation for each new shell session, or add the Postgres `bin` file to your `$PATH` variable.

A minimal development sample `.env` file is below.  Change according to your database
```
RECREG_DB_NAME=recreg
RECREG_DB_USER=postgres
RECREG_DB_PASS=postgres
RECREG_DB_HOST=localhost
RECREG_DB_PORT=5432
RECREG_DB_DIALECT=postgres
RECREG_DB_POOL_MAX=5
RECREG_DB_POOL_MIN=0
RECREG_DB_POOL_IDLE=10000
RECREG_LOGGING_LEVEL=emerg
RECREG_CLIENT_BASE_URL="http://localhost:4000/reset-tokens/"
RECREG_CORS_ORIGIN=http://localhost:4000
RECREG_ZIP_BASE_URL="http://www.zipcodeapi.com/rest/"
RECREG_ZIP_API_KEY=xxx
RECREG_ZIP_DISTANCE=50
RECREG_ZIP_UNITS=mile
RECREG_TOKEN_EXPIRATION_MINTUES=43200
FILE_SERVICE_BASE_URL=http://localhost:8080
```

A list of full environment variable settings is below.  They can be either manually set in the shell or can be included in the `.env` file.  Defaults indicated in paranthesis.

- RECREG_CLIENT_SECRET: Secret for JWT encryption ('this is a secret' for development and test).
- RECREG_PORT: Port for the API server (9005).
- RECREG_DB_NAME: Database name (recreg for development and production, recregtest for test).
- RECREG_DB_USER: Database user (no default).
- RECREG_DB_PASS: Database password (no default).
- RECREG_DB_HOST: Database host ip (localhost).
- RECREG_DB_PORT: Database host port (5432).
- RECREG_DB_SCHEMA: Database schema in postgres sense.  This can be either a single schema name or '~' delimited string of multi tenant schema names.
- RECREG_DB_DIALECT: Database dialect (postgres only, see [here](#postgredepend)).
- RECREG_DB_POOL_MAX: Maximum number of connections in pool.
- RECREG_DB_POOL_MIN: Minimum number of connections in pool.
- RECREG_DB_POOL_IDLE: The maximum time, in milliseconds, that a connection can be idle before being released.
- RECREG_DB_SSL: Use secure connections with SSL.
- RECREG_SUPER_USER_USERNAME: Super user username (super).
- RECREG_SUPER_USER_PASSWORD: Super user password (Am!d@2017PW).
- RECREG_SUPER_USER_EMAIL: Super user email (rr_demo@amida.com).
- RECREG_LOGGING_LEVEL: Logging level (info).
- RECREG_CRYPT_HASHROUNDS: Number of rounds for hashing user passwords (10).
- RECREG_CRYPT_RESET_TOKEN_LENGTH: Length for reset password token (20).
- RECREG_CRYPT_RESET_PASSWORD_LENGTH: Length for temporary random password during reset (10).
- RECREG_CRYPT_RESET_EXPIRES: Reset password expires value in seconds (3600).
- RECREG_CLIENT_BASE_URL: Base client url for password reset (no default).
- RECREG_CORS_ORIGIN: Client URIs that the API CORS setup will accept. Delimited by spaces for multiple URIs e.g. "http://localhost:4000 https://www.example.com"
- RECREG_CONSTANT_CONSTANT_TOKEN: Access token for Constant Contact API.
- RECREG_CONSTANT_CONTACT_KEY: API key for Constant Contact API.
- RECREG_CONSTANT_CONTACT_LIST_ID: Unique identifier for Constant Contact list
- RECREG_ZIP_BASE_URL: Base API URL for Zipwise zip code API. Set to `https://www.zipwise.com/webservices/radius.php`.
- RECREG_ZIP_API_KEY: API key for Zipwise.
- RECREG_ZIP_DISTANCE: Distance to query when finding zip code vicinities (`50`).
- RECREG_JWT_<registry name>: JWT for remote registries for federated search.
- RECREG_TOKEN_EXPIRATION_MINTUES: how long until JWT tokens expire, leave blank for no expiration
- RECREG_JWT_<registry name>: JWT for remote registries for federated search.
- FILE_SERVICE_BASE_URL: The url to the file service instance handling cohort zip files and s3 uploads.
- AWS_ACCESS_KEY_ID: Amazon Web Services access key ID.
- AWS_SECRET: Amazon Web Service secret access key.

## Commands

`npm start`

> Run server (default port is 9005)

`grunt`

> First beautifies and lints all files and then runs all the tests.

`npm test`

> Runs all the tests.

`npm run-script coverage`

> Runs all the tests and displays coverage metrics.

## Multitenant Support

Multitenancy is supported through postgres schemas.  Multiple schemas are specified using RECREG_DB_SCHEMA as a '~' delimited string of schema names.  This project assumes that each schema has the same table structure during database synchronization.  Schema names are appended to the base url for each API end point so that each tenant can be accessed using a different path.

## Tests

This project primarily uses [Mocha](http://mochajs.org/), [Chai](http://chaijs.com/) and [Super Test](https://github.com/visionmedia/supertest) for automated testing.  [Sinon](http://sinonjs.org/) is also used in a couple of tests when it is absolutely necessary to use stubs.  Stubbing in general however is avoided.

All tests are located in `test` directory in a mostly flat directory structure.  All API entries both get a HTTP integration test and an equivalent model test.  Unit tests for other utility modules are also included in the root directory.  In addition `test/use-cases` directory includes informative tests designed to instruct how to use the API from a client.

Individual test suites can be run using mocha. In order to run the tests, make sure you first run `createdb recregtest`.

```
$ mocha test/survey.model.spec.js --bail
```

Each test in a file may depend on some of the previous tests so using flag `bail` is recommended.

Most API resources are documented in snippets in the [integration document](./docs/api.md).  A [top level script](./docs/scripts/run-all.js) that exercises snippets is also included.

## API

File [swagger.json](./swagger.json) describes the API.  There are various [swagger](http://swagger.io/) tools such as [swagger-codegen](https://github.com/swagger-api/swagger-codegen) that can be used view or generate reports based on this file.

When the recruitment-registry api server is running `/docs` resource serves Swagger-UI as the API user interface (`localhost:9005/docs` for default settings).  However due to current limited support for JWT, Swagger-UI mostly works as documentation and resources that require authorization can not be run.

Detailed description of the API with working examples is provided in the [integration document](./docs/api.md).

## Database Design

### General

All table and column names are in snake case to follow Postgres convention and for ability to write Postgres queries easily.  All tables have `created_at` columns.  All tables for which records can be updated have an `updated_at` column.  All tables for which records can be soft deleted have a `deleted_at` column.  If there is a timestamp value at the `deleted_at` column, the record is soft deleted.  No record on any table is ever hard deleted.  If exists column `line` is used to order records for client presentation.

### Multi Lingual Support

This is a English first design where all logical records are assumed to be in English when first created.  Once a record is created any user facing text column (those users see in the user interface) can be translated to any language.  For each table English and translated versions of user facing text colums are stored in an axuilliary table whose name is the name of the actual table postfixed with `_text` (Ex: `question` and `question_text`).

### Tables

- `answer`: This table stores all the answers to questions.  Each record represents an answer to a question (column `question_id`) in a survey (column `survey_id`) by a user (column `user_id`).  Actual answer data can be a choice from question multiple choices (column `question_choice_id`), a free value field (column `value`) or a file (column `file_id`).

- `answer_identifier`: This table stores client specific (column `type`) identifiers (colum `identifier`) for possible answers to questions (columns `question_id`, `question_choice_id`, `multiple_index`).

- `answer_rule`: This table stores conditions (column `logic`) for survey (column `survey_id`) questions (column `question_id`) or sections (column `section_id`) to be enabled or disabled. Conditions are based on answers to other questions (column `answer_question_id`).  Conditon answers themselves are defined in table `answer_rule_value`.

- `answer_rule_logic`: This table defines possible condition types (column `name`, exs: equals, exists) that can be used in `answer_rule` table.

- `answer_rule_value`: This table stores answers (columns `question_choice_id` and `value`) that are used in rules (column `answer_rule_id`) in conditional questions.

- `answer_type`: This table stores available answer types. Current supported types are `text`, `bool` and `choice`.

- `assessment`: This table defines assesments (column `name`) together with table `assesment_survey`.  Assessment are set of surveys whose answers are tracked over time.

- `assessment_survey`: This table stores the surveys (column `survey_id`) that forms an assessment (column `assessment_id`).

- `choice_set`: This table defines a choice set (column `reference`) that can be used to for shared choices that can be used in questions.

- `cohort`: This table stores a named shaped cohort (column `name`) that used the filter (colum `filter_id`) and with a possible limited number of participants (column `count`).

- `cohort_answer`: This table stores the filter specifics (columns `question_id`, `exclude`, `question_choice_id`, `value`) for cohort (column `cohort_id`) at the time of creation.  Copied from `filter_answer` at the time of creation.

- `consent`: Each record in this table represents a collection of consent documents.  Column `name` is used to identify the collection in API but otherwise this table does not have a data column.

- `consent_document`: Each record in this table represents a consent document of a certain type (column `type_id`).  This table is designed to have at most one active record for each consent type at any point in time.  All other records of the same types will be in soft deleted state.  Actual content of the consent documents are stored in `consent_document_text`.

- `consent_document_text`: This table stores translatable columns `content` and `update_comment` of consent documents.  `language` is also a column and each record has values for `content` and `update_comment` in that language.  `consent_document_id` column links each record to `consent_document` table.

- `consent_section`: Each record in this table represents a section of consent type (column `consent_type_id`) in consent (column `consent_id`).

- `consent_signature`: This table stores each instance (column `created_at`) of a user (column `user_id`) signing a consent document (column `consent_document_id`).  This table also stores ip (column `ip`) and browser information (column `user_agent`) during the signing of the document.

- `consent_type`: Each record in this table represent a consent document type.  Column `name` is used in API to refer to the consent type and column `type` is client only field that identify how consent documents of this type are presented on the user interface. Title for the consent type is stored in table `consent_type_text`.

- `consent_type_text`: This table stores translatable column `title` which stores consent type title. `language` is also a column and each record has a value for `title` in that language.  `consent_type_id` column links each record to `consent_type` table.

- `file`: This table stores users' (column `user_id`) answers that are files (columns `name` and `content`).

- `filter`: This table stores filter that can be used in cohort shaping.

- `filter_answer`: This table stores filter specifics (columns `question_id`, `exclude`, `question_choice_id`, `value`) for filter (column `filter_id`).

- `language`: Each record in this table represents a supported language.  `code` column is used as the primary key and designed to store two or three character ISO codes.  Columns `name` and `native_name` can be used for language selection on the client.

- `profile_survey`: This table stores the profile survey (column `survey_id`) that is to be used during registration.

- `question`: Each record in this table represents a question that is being or can be used in surveys .  Questions can be stand alone, can belong to a survey or can belong to multiple surveys.  Link to surveys (table `survey`) is achieved through `survey_question` table.  Question records can be soft deleted but when no other active record in any other table does not reference it.  Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first question in the group.  A set of types are supported (column `type`).

- `question_choice`: Each record in this table represents a choice in multiple choice question of types choice, choiceref, choices or open choice.  Each record can belong to a specific question (column `question_id`) or to a choice set that can be shared by multiple questions (column `choice_set_id`).  To support composite questions that can have multiply selectable choices together with free text fields (ex: a list of check boxes with a free text other field), this table also stores type of choice (column `type`) with currently supported types of `bool` and `text`.  Actual text of choice is stored in `question_choice_text`.

- `question_choice_text`: This table stores translatable column `text` which stores question choice texts. `language` is also column and each record has a value for `text` in that language. `question_choice_id` column links each record to `question_choice` table.

- `question_identifier`: This table stores client specific (column `type`) identifiers (colum `identifier`) for questions (columns `question_id`).

- `question_text`: This table stores translatable logical question field `text` in the column with the same name.  `language` is also a column and each record has a value for `text` in that language.  `question_id` column links each record to `question` table.

- `question_type`: This table stores available question types.

- `registry`: This table stores all other registries that this registry should be aware of.  These registries can be in other servers (column `url`) or share the same database (column `schema`) for multi tenant setup.

- `registry_user`: This table stores patient first name, last name, email, role, and login information (username, password, password reset through email token and its expiration date).

- `research_site`: This stores the research centers for the registry.

- `research_site_vicinity`: This stores closest research sites (column `research_site_id`) for a zip code (column `zip`).

- `section`: This stores sections that can be used in surveys to group questions.

- `section_text`: This table stores translatable logical section fields `text` and `description` in the column with the same name.  `language` is also a column and each record has a value for `text` in that language.  `ection_id` column links each record to `question` table.

- `smtp`: This table stores email service specifics that can be used for various services (column `type`) that require outgoing email such as password reset functionality. The subject and content of password reset emails are stored in `smtp_text`.

- `smtp_text`: This table stores translatable columns `content` and `subject` for outgoing email for various services (column `type`).

- `smtp_type`: This table defines types of services that require outgoing emails.

- `staging_bhr_gap`: This table is used during importing of data.

- `survey`: Each record in this table represents a survey.  Surveys can be deleted. Versioning is supported using columns `version` and `group_id`.  Version is a number and `group_id` is the `id` of the first survey in the group.  Questions in surveys are represented using another table `survey_question`.  Only actual data column is `meta` which is designed to store client settings.

- `survey_consent`: This table stores consents (either column `consent_id` or `consent_type_id`) that assigned to surveys (column `survey_id`).

- `survey_identifier`: This table stores client specific (column `type`) identifiers (colum `identifier`) for surveys (columns `survey_id`).

- `survey_question`: This table stores questions in particular surveys.  Each record represents a question (column `question_id`) in a survey (column `survey_id`).  Question order is preserved using field line (column `line`).  Questions can also be marked required (column `required`).

- `survey_section_question`: This table stores sections in particular surveys.  Each record represents a section (column `section_id`) in a survey (column `survey_id`).  Section can be under a question (column `parent_question_id`) or another section (column `section_id`).

- `survey_section_question`:   This table stores questions in survey sections. Each record represents a question (column `question_id`) in a section (column `surveys_section_id`).

- `survey_status`: This defines statuses during answering of surveys,

- `survey_text`: This table stores translatable columns `name` and `description`. `language` is also a column and each record has a value for `name` in that language. `survey_id` column links each record to `survey` table.


- `rr_section`: Each record in this tables represents a section in a survey. Content of sections are represented as local indices of questions in column `indices`.  The name of the section is stored in `section_text` table.

- `section_text`: This table stores translatable column `name` which stores section name. `language` is also a column and each record has a value for `name` in that language.  `section_id` column links each record to `rr_sectionnc` table.

- `survey_section`: This table links surveys (column `survey_id`) to sections (column `section_id`).  Order of sections preserved using column `line`.

- `user_assessment`: This stores an instance of an assessment (column `assessment_id`) for a paricular participant (column `user_id`).

- `user_assessment_answer`: This stores user answers (column `answer_id`) for a particular assessment (coilumn `user_assessment_id).

- `user_audit`: This is an audit table for endpoints (column `endpoint`) that users (column ``user_id`) accessed.

- `user_survey`: This table stores status of a survey for a participant.  The status can be `in-progress` or `completed`.

### Record Updates

Except account columns `email` and `password` in users table, none of the user facing columns ever overwrite a previous value and a history is always available.  There are a few overwriting columns such as `meta` in `survey` table.  These are mainly used for client level settings and do not contribute to any business logic.

## Migration

This project uses [sequelize-cli](https://github.com/sequelize/cli) for migrations.  The bootstrap model is located [here](./migration/models) and corresponds to the state of the database during first go-live.

All migrations can be run using sequelize-cli](https://github.com/sequelize/cli) in migration directory
```bash
cd migration
sequelize
```

Migration uses the `.env` file in the root directory.  Each run creates/updates a file named `sequelize-meta.json` in the migration directory.  This file must be preserved in this directory to avoid running the same migrations again.

## Code Analysis
A shell script is used to generate files that show static analysis and complexity metrics.
- Run `$ ./analysis.sh` from the project directory
- Files are written to the `artifacts` directory

## References

- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [Grunt](http://gruntjs.com/)
- [Sequelize](http://docs.sequelizejs.com/en/v3/)
- [Sequelize-Cli](https://github.com/sequelize/cli)
- [Postgres](https://www.postgresql.org/)
- [Sinon](http://sinonjs.org/)
- [Mocha](http://mochajs.org/)
- [Chai](http://chaijs.com/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Babel](http://babeljs.io/)
- [Swagger](http://swagger.io/)
