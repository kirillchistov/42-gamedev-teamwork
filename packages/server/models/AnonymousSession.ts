import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize'
import { sequelize } from '../sequelize'

export class AnonymousSession extends Model<
  InferAttributes<AnonymousSession>,
  InferCreationAttributes<AnonymousSession>
> {
  declare id: CreationOptional<string>
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

AnonymousSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'anonymous_sessions',
    modelName: 'AnonymousSession',
    updatedAt: true,
    createdAt: true,
  }
)
