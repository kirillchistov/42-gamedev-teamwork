import { Topic } from './Topic'
import { Comment } from './Comment'
import { CommentReaction } from './CommentReaction'

Topic.hasMany(Comment, {
  foreignKey: 'topicId',
  as: 'comments',
  onDelete: 'CASCADE',
})

Comment.belongsTo(Topic, {
  foreignKey: 'topicId',
  as: 'topic',
})

Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent',
})

Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
})

Comment.hasMany(CommentReaction, {
  foreignKey: 'commentId',
  as: 'reactions',
  onDelete: 'CASCADE',
})

CommentReaction.belongsTo(Comment, {
  foreignKey: 'commentId',
  as: 'comment',
})

export { Comment, CommentReaction, Topic }
