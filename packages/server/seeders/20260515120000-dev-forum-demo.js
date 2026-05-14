'use strict'

/**
 * Опциональные демо-данные для локальной разработки.
 * Идемпотентно: повторный запуск не дублирует (по маркеру в title).
 *
 * Запуск: `yarn workspace server db:seed` (после миграций).
 */

const SEED_TOPIC_TITLE =
  '[dev-seed] Добро пожаловать на форум'

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface
    const found = await sequelize.query(
      `SELECT id FROM topics WHERE title = :title LIMIT 1`,
      {
        replacements: { title: SEED_TOPIC_TITLE },
        type: Sequelize.QueryTypes.SELECT,
      }
    )
    if (
      Array.isArray(found) &&
      found.length > 0
    ) {
      return
    }

    const now = new Date()

    await queryInterface.bulkInsert('topics', [
      {
        title: SEED_TOPIC_TITLE,
        content:
          'Эта тема создана сидом для локальной разработки. Можно удалить через db:seed:undo.',
        author_praktikum_id: 0,
        author_display: 'dev-seed',
        created_at: now,
        updated_at: now,
      },
    ])

    const rows = await sequelize.query(
      `SELECT id FROM topics WHERE title = :title ORDER BY id DESC LIMIT 1`,
      {
        replacements: { title: SEED_TOPIC_TITLE },
        type: Sequelize.QueryTypes.SELECT,
      }
    )
    const topicId =
      rows &&
      rows[0] &&
      typeof rows[0] === 'object' &&
      rows[0] !== null &&
      'id' in rows[0]
        ? Number(
            /** @type {{ id: number }} */ (rows[0]).id
          )
        : null
    if (topicId == null || Number.isNaN(topicId)) {
      throw new Error(
        'dev-forum-demo seeder: could not resolve topic id'
      )
    }

    await queryInterface.bulkInsert('comments', [
      {
        topic_id: topicId,
        parent_id: null,
        author_praktikum_id: 0,
        author_display: 'dev-seed',
        content:
          'Первый комментарий в демо-теме. Ответ ниже — вложенный.',
        created_at: now,
      },
    ])

    const commentRows = await sequelize.query(
      `SELECT id FROM comments WHERE topic_id = :topicId ORDER BY id ASC LIMIT 1`,
      {
        replacements: { topicId },
        type: Sequelize.QueryTypes.SELECT,
      }
    )
    const parentCommentId =
      commentRows &&
      commentRows[0] &&
      typeof commentRows[0] === 'object' &&
      commentRows[0] !== null &&
      'id' in commentRows[0]
        ? Number(
            /** @type {{ id: number }} */ (commentRows[0])
              .id
          )
        : null

    if (parentCommentId != null) {
      await queryInterface.bulkInsert('comments', [
        {
          topic_id: topicId,
          parent_id: parentCommentId,
          author_praktikum_id: 0,
          author_display: 'dev-seed',
          content: 'Вложенный ответ к первому комментарию.',
          created_at: now,
        },
      ])
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('comment_reactions', {
      author_praktikum_id: 0,
      author_display: 'dev-seed',
    })
    await queryInterface.bulkDelete('comments', {
      author_praktikum_id: 0,
      author_display: 'dev-seed',
    })
    await queryInterface.bulkDelete('topics', {
      title: SEED_TOPIC_TITLE,
    })
  },
}
