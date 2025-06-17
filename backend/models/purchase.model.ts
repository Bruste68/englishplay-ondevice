import { DataTypes } from 'sequelize';
import sequelize from '../db';

const Purchase = sequelize.define('purchase', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  receipt: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purchaseTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

export default Purchase;
