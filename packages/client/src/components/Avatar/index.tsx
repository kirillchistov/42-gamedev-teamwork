/** Изменения и починка Sprint6 Chores
 * Avatar — вместо проверки только по размеру используем validateAvatarFile,
 * сообщения совпадают с профилем;
 **/

import React, { useState } from 'react'
import './Avatar.pcss'
import {
  Button,
  FieldError,
} from '../../shared/ui'
import {
  imageTypes,
  validateAvatarFile,
} from '../../shared/validation/authValidation'

interface AvatarProps {
  url: string | null
  handleAvatarChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => Promise<void>
  handleAvatarDelete: () => void
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  handleAvatarChange,
  handleAvatarDelete,
}) => {
  const [error, setError] = useState<string>('')

  const handlechange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError('')
    const file = e.target.files?.[0]
    if (file) {
      const err = validateAvatarFile(file)
      if (err) {
        setError(err)
        e.target.value = ''
        return
      }
    }
    void handleAvatarChange(e)
  }

  return (
    <div className="avatar-container">
      <div className="avatar-container__image-circle">
        {url ? (
          <img src={url} alt="" />
        ) : (
          <div>👤</div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
        <Button
          type="button"
          variant="flat"
          onClick={handleAvatarDelete}>
          Удалить аватар
        </Button>

        <input
          type="file"
          id="avatar-upload"
          accept={imageTypes.join(', ')}
          className="hidden"
          onChange={handlechange}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            document
              .getElementById('avatar-upload')
              ?.click()
          }>
          Сменить аватар
        </Button>

        <FieldError
          message={error ? error : ''}
        />
      </div>
    </div>
  )
}

export default Avatar
