import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize'
import type { LandingThemeId } from '../constants/landingThemes'
import { sequelize } from '../sequelize'

export class UserUiTheme extends Model<
  InferAttributes<UserUiTheme>,
  InferCreationAttributes<UserUiTheme>
> {
  declare id: CreationOptional<number>
  declare theme: LandingThemeId
  declare praktikumUserId: string | null
  declare anonymousSessionId: string | null
  declare readonly updatedAt: CreationOptional<Date>
}

UserUiTheme.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    theme: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    praktikumUserId: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'praktikum_user_id',
    },
    anonymousSessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'anonymous_session_id',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_ui_themes',
    modelName: 'UserUiTheme',
    timestamps: true,
    createdAt: false,
    updatedAt: true,
  }
)
