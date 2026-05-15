import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize'
import { sequelize } from '../sequelize'
import { FORUM_EMOJI_WHITELIST } from '../constants/forumEmojis'

export class CommentReaction extends Model<
  InferAttributes<CommentReaction>,
  InferCreationAttributes<CommentReaction>
> {
  declare id: CreationOptional<number>
  declare commentId: number
  declare authorPraktikumId: number
  declare emoji: string
  declare readonly createdAt: CreationOptional<Date>
}

CommentReaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    commentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    emoji: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: {
        isIn: [[...FORUM_EMOJI_WHITELIST]],
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'comment_reactions',
    modelName: 'CommentReaction',
    updatedAt: false,
  }
)
