import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize'
import { sequelize } from '../sequelize'

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeContent(value: string): string {
  return value.trim()
}

export class Topic extends Model<
  InferAttributes<Topic>,
  InferCreationAttributes<Topic>
> {
  declare id: CreationOptional<number>
  declare title: string
  declare content: string
  declare authorPraktikumId: number
  declare authorDisplay: string
  declare readonly createdAt: CreationOptional<Date>
  declare readonly updatedAt: CreationOptional<Date>
}

Topic.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100_000],
      },
    },
    authorPraktikumId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    authorDisplay: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true, len: [1, 255] },
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
    tableName: 'topics',
    modelName: 'Topic',
    hooks: {
      beforeValidate(instance) {
        if (typeof instance.title === 'string') {
          instance.title = normalizeTitle(
            instance.title
          )
        }
        if (
          typeof instance.content === 'string'
        ) {
          instance.content = normalizeContent(
            instance.content
          )
        }
      },
    },
  }
)
