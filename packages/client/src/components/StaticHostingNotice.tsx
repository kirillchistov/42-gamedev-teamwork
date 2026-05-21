import React from 'react'

type StaticHostingNoticeProps = {
  title: string
  children: React.ReactNode
}

export const StaticHostingNotice: React.FC<
  StaticHostingNoticeProps
> = ({ title, children }) => (
  <div
    className="static-hosting-notice"
    role="status">
    <strong className="static-hosting-notice__title">
      {title}
    </strong>
    <div className="static-hosting-notice__body">
      {children}
    </div>
  </div>
)

export const StaticHostingForumNotice: React.FC =
  () => (
    <StaticHostingNotice title="Форум недоступен на GitHub Pages">
      <p>
        Список тем, комментарии и реакции работают
        только с нашим Node API (локально{' '}
        <code>yarn dev</code> или Docker). На
        статическом деплое доступны игра, вход по
        логину/паролю и лидерборд.
      </p>
    </StaticHostingNotice>
  )
