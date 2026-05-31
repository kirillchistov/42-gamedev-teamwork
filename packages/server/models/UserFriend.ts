import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize'
import { sequelize } from '../sequelize'

function normalizeNickname(value: string): string {
  return value.trim()
}

export class UserFriend extends Model<
  InferAttributes<UserFriend>,
  InferCreationAttributes<UserFriend>
> {
  declare id: CreationOptional<number>
  declare ownerPraktikumId: number
  declare friendNickname: string
  declare friendPraktikumId: number | null
  declare friendDisplayName: string
  declare friendAvatar: string | null
  declare readonly createdAt: CreationOptional<Date>
}

UserFriend.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ownerPraktikumId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_praktikum_id',
    },
    friendNickname: {
      type: DataTypes.STRING(128),
      allowNull: false,
      field: 'friend_nickname',
      validate: {
        notEmpty: true,
        len: [1, 128],
      },
    },
    friendPraktikumId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'friend_praktikum_id',
    },
    friendDisplayName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'friend_display_name',
      defaultValue: '',
    },
    friendAvatar: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'friend_avatar',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'user_friends',
    modelName: 'UserFriend',
    updatedAt: false,
    hooks: {
      beforeValidate(instance) {
        if (typeof instance.friendNickname === 'string') {
          instance.friendNickname = normalizeNickname(instance.friendNickname)
        }
      },
    },
  }
)
