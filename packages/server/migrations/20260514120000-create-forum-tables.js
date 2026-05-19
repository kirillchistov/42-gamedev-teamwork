'use strict'

/**
 * Таблицы форума по спецификации forum-api-spec.md п3:
 * topics, comments (дерево через parent_id), comment_reactions.
 */

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('topics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      author_praktikum_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      author_display: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP'
        ),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP'
        ),
      },
    })

    await queryInterface.createTable('comments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      topic_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'topics', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      author_praktikum_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      author_display: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP'
        ),
      },
    })

    await queryInterface.addConstraint('comments', {
      fields: ['parent_id'],
      type: 'foreign key',
      name: 'comments_parent_id_fkey',
      references: {
        table: 'comments',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    })

    await queryInterface.addIndex('comments', ['topic_id'], {
      name: 'comments_topic_id_idx',
    })
    await queryInterface.addIndex('comments', ['parent_id'], {
      name: 'comments_parent_id_idx',
    })

    await queryInterface.createTable('comment_reactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      comment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'comments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      author_praktikum_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      emoji: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          'CURRENT_TIMESTAMP'
        ),
      },
    })

    await queryInterface.addIndex('comment_reactions', ['comment_id'], {
      name: 'comment_reactions_comment_id_idx',
    })

    await queryInterface.addConstraint('comment_reactions', {
      fields: [
        'comment_id',
        'author_praktikum_id',
        'emoji',
      ],
      type: 'unique',
      name: 'comment_reactions_comment_author_emoji_unique',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('comment_reactions')
    await queryInterface.removeConstraint(
      'comments',
      'comments_parent_id_fkey'
    )
    await queryInterface.dropTable('comments')
    await queryInterface.dropTable('topics')
  },
}
