'use strict'

/** Список друзей пользователя (для фильтра лидерборда). */

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_friends', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      owner_praktikum_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      friend_nickname: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      friend_praktikum_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      friend_display_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
      },
      friend_avatar: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    await queryInterface.addIndex('user_friends', ['owner_praktikum_id'], {
      name: 'user_friends_owner_praktikum_id_idx',
    })

    await queryInterface.addConstraint('user_friends', {
      fields: ['owner_praktikum_id', 'friend_nickname'],
      type: 'unique',
      name: 'user_friends_owner_nickname_uq',
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_friends')
  },
}
