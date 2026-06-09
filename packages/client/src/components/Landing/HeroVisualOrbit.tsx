import React from 'react'

import { publicAssetUrl } from '../../utils/publicAssetUrl'
import { HERO_TECH_ICON_FILES, TEAM_MEMBERS } from './teamData'

const TEAM_ORBIT_RADIUS_OUT = 148
const TEAM_ORBIT_RADIUS_IN = 58
const TECH_ORBIT_RADIUS_OUT = 108
const TECH_ORBIT_RADIUS_IN = 42

type Props = {
  children: React.ReactNode
}

export function HeroVisualOrbit({ children }: Props) {
  const teamCount = TEAM_MEMBERS.length
  const techCount = HERO_TECH_ICON_FILES.length

  return (
    <div className="hero-visual-orbit">
      <div
        className="hero-visual-orbit__ring hero-visual-orbit__ring--outer"
        aria-hidden
      />
      <div
        className="hero-visual-orbit__ring hero-visual-orbit__ring--inner"
        aria-hidden
      />

      {TEAM_MEMBERS.map((member, i) => {
        const angle = (360 / teamCount) * i - 90
        return (
          <div
            key={member.name}
            className="hero-visual-orbit__avatar-wrap"
            style={
              {
                '--orbit-r-out': `${TEAM_ORBIT_RADIUS_OUT}px`,
                '--orbit-r-in': `${TEAM_ORBIT_RADIUS_IN}px`,
                '--orbit-a': `${angle}deg`,
                '--orbit-delay': `${i * 0.08}s`,
              } as React.CSSProperties
            }>
            <div
              className="team-card__avatar hero-visual-orbit__avatar"
              style={
                member.avatarUrl
                  ? {
                      backgroundImage: `url(${member.avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
              title={member.name}
            />
          </div>
        )
      })}

      {HERO_TECH_ICON_FILES.map((file, i) => {
        const angle = (360 / techCount) * i - 90
        return (
          <div
            key={file}
            className="hero-visual-orbit__tech-wrap"
            style={
              {
                '--orbit-r-out': `${TECH_ORBIT_RADIUS_OUT}px`,
                '--orbit-r-in': `${TECH_ORBIT_RADIUS_IN}px`,
                '--orbit-a': `${angle}deg`,
                '--orbit-delay': `${i * 0.06}s`,
              } as React.CSSProperties
            }>
            <img
              src={publicAssetUrl(`icons/${file}`)}
              alt=""
              className="hero-visual-orbit__tech"
              width={32}
              height={32}
            />
          </div>
        )
      })}

      <div className="hero-visual-orbit__center">{children}</div>
    </div>
  )
}
