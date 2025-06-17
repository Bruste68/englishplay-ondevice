'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      birth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      nickname: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      provider: {
        type: Sequelize.ENUM('google', 'kakao', 'facebook', 'local', 'yahoo', 'naver', 'line'),
        allowNull: true,
        defaultValue: 'local',
      },
      provider_id: {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true,
      },
      profile_image: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      language: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: 'ko',
      },
      trial_start_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('users');
  },
};
