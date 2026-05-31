import { Topic } from './Topic'
import { Comment } from './Comment'
import { CommentReaction } from './CommentReaction'
import { AnonymousSession } from './AnonymousSession'
import { UserUiTheme } from './UserUiTheme'
import { UserFriend } from './UserFriend'

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

AnonymousSession.hasOne(UserUiTheme, {
  foreignKey: 'anonymousSessionId',
  as: 'uiTheme',
  onDelete: 'CASCADE',
})

UserUiTheme.belongsTo(AnonymousSession, {
  foreignKey: 'anonymousSessionId',
  as: 'anonymousSession',
})

export {
  AnonymousSession,
  Comment,
  CommentReaction,
  Topic,
  UserFriend,
  UserUiTheme,
}
