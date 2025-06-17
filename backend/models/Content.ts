import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

class Content extends Model {
  public id!: number;
  public filename!: string;
  public url!: string;
  public uploadedBy!: string;
  public uploadedAt!: Date;
}

Content.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  sequelize,
  tableName: 'contents',
  timestamps: false,
});

export default Content;
