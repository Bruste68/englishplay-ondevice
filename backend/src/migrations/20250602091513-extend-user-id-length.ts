import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('users', 'user_id', {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('users', 'user_id', {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    });
  },
};
