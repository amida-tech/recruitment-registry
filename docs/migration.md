## Database Migration

### Introduction

Database migrations refer to the incremental changes to Recruitment Registry's database model without impacting any existing data in the database. This project uses [sequelize-cli](https://github.com/sequelize/cli) for database change management. Sequelize migration document is located [here](http://docs.sequelizejs.com/manual/tutorial/migrations.html). All migration related artifacts are located [here](../migration).

### Bootstrap Model

Migrations are applied to an initial model. This bootstrap model is located [here](../migration/models) and corresponds to the state of the database at the time of the previous release. Bootstrap model must not be changed during development cycle (develop branch). Instead it is updated only during releases. This facilitates database change management when a customer moves from an earlier release to a newer one. This project updates master branch only during a release during which time [bootstrap model](../migration/models) in develop branch is updated with the new released [model](../models).

### Migration Scripts

Each database structure change such as adding new columns, changing indexes, etc. during development cycle must be captured as a script. These scripts are located [here](../migration/migrations) and can be created by
```bash
sequelize migration:create --name <migration-name>
```
This command must be run from [migration directory](../migration). Each script filename starts with the creation instant so that `sequelize` can run them in order.

Each script exports an `up` and `down` method to update and revert database respectively. Sequelize provides a [`queryInterface`](http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html) argument that provides various methods to help write common migration tasks like adding a table or a column. In addition raw queries are available through `queryInterface.sequelize` object.

### Running Migrations

All migrations can be run using [sequelize-cli](https://github.com/sequelize/cli) in [migration directory](../migrations)
```bash
sequelize db:migrate
```
Migrations script use the `.env` file in the root directory.  Each run creates/updates a file named `sequelize-meta.json` in the migration directory.  This file must be preserved in this directory to avoid running the same migrations again.

It is possible to store the list of executed migrations in the database. The configuration file needs to be changed for the purpose. Details of the configuration table can be found [here](http://docs.sequelizejs.com/manual/tutorial/migrations.html).

### Testing

This project provides a [`mocha` test](../test/migration.spec.js) in the testing suite to verify correctness of migrations. This test loads [bootstrap model](../migration/models) apply [migrations](../migration/migrations) programmatically and compares resulting model with the [current model](../models/db).
