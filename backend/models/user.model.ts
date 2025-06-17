import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';

interface UserAttributes {
  user_id: string;
  name: string;
  birth: Date;
  password: string;
  email?: string | null; 
  nickname?: string;
  provider?: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver';
  provider_id?: string;
  profile_image?: string | null;
  language?: string;
  trial_start_at?: Date;
  is_admin?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | 'email'
    | 'nickname'
    | 'provider'
    | 'provider_id'
    | 'profile_image'
    | 'language'
    | 'trial_start_at'
    | 'is_admin'
    | 'created_at'
    | 'updated_at'
  > {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public user_id!: string;
  public name!: string;
  public birth!: Date;
  public password!: string;
  public email?: string;
  public nickname?: string;
  public provider?: 'google' | 'kakao' | 'facebook' | 'local' | 'yahoo' | 'naver';
  public provider_id?: string;
  public profile_image?: string;
  public language?: string;
  public trial_start_at?: Date;
  public is_admin?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
}

User.init(
  {
    user_id: {
      type: DataTypes.STRING(30),
      allowNull: false,
      primaryKey: true, // ✅ 핵심 수정
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    birth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
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
        notEmpty: false // 빈 문자열 허용
      },
      defaultValue: null // 기본값을 null로 설정
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    provider: {
      type: DataTypes.ENUM('google', 'kakao', 'facebook', 'local', 'yahoo', 'naver'),
      allowNull: true,
      defaultValue: 'local',
    },
    provider_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  }
);

export default User;
