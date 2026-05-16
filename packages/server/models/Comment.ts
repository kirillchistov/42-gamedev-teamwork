import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize'
import { sequelize } from '../sequelize'

function normalizeContent(value: string): string {
  return value.trim()
}

export class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  declare id: CreationOptional<number>
  declare topicId: number
  declare parentId: CreationOptional<
    number | null
  >
  declare authorPraktikumId: number
  declare authorDisplay: string
  declare content: string
  declare readonly createdAt: CreationOptional<Date>
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'topics',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100_000],
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
    modelName: 'Comment',
    updatedAt: false,
    hooks: {
      beforeValidate(instance) {
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
