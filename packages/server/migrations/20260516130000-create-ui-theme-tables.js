'use strict'

// Темизация: гостевые сессии и выбор темы.

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'anonymous_sessions',
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'gen_random_uuid()'
          ),
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
      }
    )

    await queryInterface.addIndex(
      'anonymous_sessions',
      ['updated_at'],
      { name: 'anonymous_sessions_updated_at_idx' }
    )

    await queryInterface.createTable(
      'user_ui_themes',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        theme: {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        praktikum_user_id: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        anonymous_session_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'anonymous_sessions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'CURRENT_TIMESTAMP'
          ),
        },
      }
    )

    await queryInterface.sequelize.query(`
      ALTER TABLE user_ui_themes
      ADD CONSTRAINT user_ui_themes_theme_check
      CHECK (theme IN ('light-flat', 'light-3d', 'dark-neon'));
    `)

    await queryInterface.sequelize.query(`
      ALTER TABLE user_ui_themes
      ADD CONSTRAINT user_ui_themes_subject_check
      CHECK (
        (CASE WHEN praktikum_user_id IS NOT NULL THEN 1 ELSE 0 END)
        + (CASE WHEN anonymous_session_id IS NOT NULL THEN 1 ELSE 0 END)
        = 1
      );
    `)

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX user_ui_themes_praktikum_user_id_uq
      ON user_ui_themes (praktikum_user_id)
      WHERE praktikum_user_id IS NOT NULL;
    `)

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX user_ui_themes_anonymous_session_id_uq
      ON user_ui_themes (anonymous_session_id)
      WHERE anonymous_session_id IS NOT NULL;
    `)
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_ui_themes')
    await queryInterface.dropTable('anonymous_sessions')
  },
}
