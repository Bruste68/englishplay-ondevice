import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

class Log extends Model {
  public id!: number;
  public message!: string;
  public createdAt!: Date;
}

Log.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'logs',
  timestamps: false,
});

export default Log;
