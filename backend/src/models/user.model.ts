// ✅ 수정된 User Model (user.model.ts)

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface UserAttributes {
  id?: number;
  userId: string;
  name: string;
  birth: Date;
  password: string;
  email?: string | null;
  nickname?: string;
  provider?: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver' | 'line';
  provider_id?: string;
  profile_image?: string | null;
  language?: string;
  trial_start_at?: Date;
  is_admin?: boolean;
  userKey?: string;
  premium_expires_at?: Date;
  first_login_at?: Date;
  app_installed_at?: Date;
  whisper_downloaded_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes,
  | 'email' | 'nickname' | 'provider' | 'provider_id'
  | 'profile_image' | 'language' | 'trial_start_at'
  | 'is_admin' | 'userKey' | 'premium_expires_at'
  | 'first_login_at' | 'app_installed_at' | 'whisper_downloaded_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public userId!: string;
  public name!: string;
  public birth!: Date;
  public password!: string;
  public email?: string;
  public nickname?: string;
  public provider?: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver' | 'line';
  public provider_id?: string;
  public profile_image?: string;
  public language?: string;
  public trial_start_at?: Date;
  public is_admin?: boolean;
  public userKey?: string;
  public premium_expires_at?: Date;
  public first_login_at?: Date;
  public app_installed_at?: Date;
  public whisper_downloaded_at?: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'user_id',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: {
        msg: '유효한 이메일 주소를 입력해주세요',
      },
    },
    defaultValue: null,
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  provider: {
    type: DataTypes.ENUM('google', 'kakao', 'facebook', 'local', 'yahoo', 'naver', 'line'),
    allowNull: true,
    defaultValue: 'local',
    field: 'provider',
  },
  provider_id: {
    type: DataTypes.STRING(128),
    allowNull: true,
    unique: true,
    field: 'provider_id',
  },
  profile_image: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'ko',
  },
  trial_start_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  userKey: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    field: 'user_key',
  },
  premium_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'premium_expires_at',
  },
  first_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'first_login_at',
  },
  app_installed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'app_installed_at',
  },
  whisper_downloaded_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'whisper_downloaded_at',
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  underscored: true,
  freezeTableName: true,
});

console.log('✅ [User Model] User.init() 완료됨');

export default User;