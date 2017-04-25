'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment');

const config = require('../../config');
const SPromise = require('../../lib/promise');
const RRError = require('../../lib/rr-error');

module.exports = function User(sequelize, DataTypes) {
    const bccompare = SPromise.promisify(bcrypt.compare, {
        context: bcrypt,
    });
    const bchash = SPromise.promisify(bcrypt.hash, {
        context: bcrypt,
    });
    const randomBytes = SPromise.promisify(crypto.randomBytes, {
        context: crypto,
    });

    const Table = sequelize.define('registry_user', {
        username: {
            type: DataTypes.TEXT,
            unique: true,
            validate: {
                notEmpty: true,
            },
            allowNull: false,
        },
        email: {
            type: DataTypes.TEXT,
            validate: {
                isEmail: true,
            },
            allowNull: false,
        },
        password: {
            type: DataTypes.TEXT,
            validate: {
                notEmpty: true,
            },
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('admin', 'participant', 'clinician', 'import'),
            allowNull: false,
        },
        originalUsername: {
            type: DataTypes.TEXT,
            field: 'original_username',
            allowNull: true,
        },
        resetPasswordToken: {
            unique: true,
            type: DataTypes.STRING,
            field: 'reset_password_token',
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            field: 'reset_password_expires',
        },
        createdAt: {
            type: DataTypes.DATE,
            field: 'created_at',
            defaultValue: sequelize.literal('NOW()'),
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at',
        },
        deletedAt: {
            type: DataTypes.DATE,
            field: 'deleted_at',
        },
    }, {
        freezeTableName: true,
        schema: sequelize.options.schema,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        deletedAt: 'deletedAt',
        paranoid: true,
        indexes: [{
            name: 'registry_user_lower_email_key',
            unique: true,
            fields: [sequelize.fn('lower', sequelize.col('email'))],
        }],
        hooks: {
            afterSync(options) {
                if (options.force) {
                    const role = 'admin';
                    const user = Object.assign({ role }, config.superUser);
                    return this.create(user);
                }
                return null;
            },
            beforeCreate(user) {
                return user.updatePassword();
            },
            beforeUpdate(user) {
                if (user.changed('password')) {
                    return user.updatePassword();
                }
                return null;
            },
        },
    });

    Table.prototype.authenticate = function authenticate(password) {
        return bccompare(password, this.password)
            .then((result) => {
                if (!result) {
                    throw new RRError('authenticationError');
                }
            });
    };


    Table.prototype.updatePassword = function updatePassword() {
        return bchash(this.password, config.crypt.hashrounds)
            .then((hash) => {
                this.password = hash;
            });
    };

    Table.prototype.updateResetPWToken = function updateResetPWToken() {
        return randomBytes(config.crypt.resetTokenLength)
            .then(buf => buf.toString('hex'))
            .then(token => randomBytes(config.crypt.resetPasswordLength)
                    .then(passwordBuf => ({
                        token,
                        password: passwordBuf.toString('hex'),
                    })))
            .then((result) => {
                this.resetPasswordToken = result.token;
                this.password = result.password;
                const m = moment.utc();
                m.add(config.crypt.resetExpires, config.crypt.resetExpiresUnit);
                this.resetPasswordExpires = m.toISOString();
                return this.save()
                    .then(() => result.token);
            });
    };


    return Table;
};
