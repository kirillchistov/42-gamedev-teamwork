/** Изменения и починка Sprint6 Chores
 * Сообщение об ошибке или null, если файл не подходит
 * Поправил путаницу в сообщениях об ошибках
 **/
export interface SignupFormValues {
  first_name?: string
  second_name?: string
  login?: string
  email?: string
  phone?: string
  password?: string
  display_name?: string
  oldPassword?: string
  newPassword?: string
}

export interface LoginFormValues {
  login: string
  password: string
}
export interface ProfileFormValues
  extends SignupFormValues {
  display_name?: string
  avatarFile?: File | null
}

export interface ContactFormValues {
  name: string
  email: string
  message: string
}

export type ValidationErrors<T> = Partial<
  Record<keyof T, string>
>

// avatar (клиентская проверка до upload)
export const imageTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const
export const maxAvatarSize = 5 * 1024 * 1024 // 5 МБ

// Сообщение об ошибке или null, если файл не подходит
export function validateAvatarFile(
  file: File
): string | null {
  if (
    !imageTypes.includes(
      file.type as typeof imageTypes[number]
    )
  ) {
    return 'Аватар: только PNG, JPEG или WebP'
  }
  if (file.size > maxAvatarSize) {
    return `Аватар: не больше ${
      maxAvatarSize / (1024 * 1024)
    } МБ`
  }
  return null
}

export interface validationRulesValues {
  patterns?: unknown[]
  messages?: string[]
  notEmpty: boolean
}

export const validationRules: Record<
  string,
  validationRulesValues
> = {
  email: {
    patterns: [
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]*[A-Za-z]\.[A-Za-z]{2,}$/,
    ],
    notEmpty: true,
    messages: ['Неверный формат почты'],
  },
  password: {
    patterns: [/^.{8,40}$/, /[A-ZА-ЯЁ]/, /\d/],
    notEmpty: true,
    messages: [
      'Пароль: от 8 до 40 символов',
      'Пароль должен содержать заглавную букву',
      'Пароль должен содержать цифру',
    ],
  },
  login: {
    patterns: [
      /^(?=.*[A-Za-z])[A-Za-z0-9_-]{3,20}$/,
    ],
    notEmpty: true,
    messages: [
      'Логин: 3–20 символов, латиница, можно цифры, - и _, но не только цифры',
    ],
  },
  first_name: {
    patterns: [/^[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]*$/],
    notEmpty: true,
    messages: [
      'Имя: первая буква заглавная, без пробелов и цифр, допустим дефис',
    ],
  },
  second_name: {
    patterns: [/^[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]*$/],
    notEmpty: true,
    messages: [
      'Фамилия: первая буква заглавная, без пробелов и цифр, допустим дефис',
    ],
  },
  phone: {
    patterns: [/^\+?\d{10,15}$/],
    notEmpty: true,
    messages: [
      'Телефон: от 10 до 15 цифр, может начинаться с +',
    ],
  },
  display_name: {
    patterns: [/^.{0,32}$/],
    notEmpty: false,
    messages: ['Никнейм не длиннее 32 символов'],
  },
  avatarFile: {
    notEmpty: false,
    messages: [
      'Некорректный файл аватара (формат или размер)',
    ],
  },
  newPassword: {
    patterns: [/^.{8,40}$/, /[A-ZА-ЯЁ]/, /\d/],
    notEmpty: true,
    messages: [
      'Пароль: от 8 до 40 символов',
      'Пароль должен содержать заглавную букву',
      'Пароль должен содержать цифру',
    ],
  },
  oldPassword: {
    patterns: [/^.{8,40}$/, /[A-ZА-ЯЁ]/, /\d/],
    notEmpty: true,
    messages: [
      'Пароль: от 8 до 40 символов',
      'Пароль должен содержать заглавную букву',
      'Пароль должен содержать цифру',
    ],
  },
}
