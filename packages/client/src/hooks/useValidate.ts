/**
 * Предоставляет:
 * объект errors {имя поля: текст ошибки}
 * флаг isValidateError (boolean)
 * функцию doValidate(values, callback), которую надо вызвать по любому событию
 *
 *
 * Все поля, указанные в конфиге провалидируются,
 * в errors вернутся ошибки, которые можно показать,
 * флаг можно использовать, например, для установки свойства didsbled
 *
 * Если все в порядке, запустится callback
 */
import { useState, useCallback } from 'react'
import {
  SignupFormValues,
  validationRules,
} from '../shared/validation/authValidation'

export const useValidate = <T extends Record<string, string>>(
  state: SignupFormValues
) => {
  // const [values] = useState({ ...state })
  const [errors, setErrors] = useState({ ...state })
  const [isValidateError, setIsValidateError] = useState(true)

  const doValidate = useCallback(
    (values: SignupFormValues, callback?: unknown) => {
      setIsValidateError(true)
      const validationErrors: object = validate(values)
      setErrors({ ...validationErrors })
      if (Object.keys(validationErrors).length === 0) {
        setIsValidateError(false)
        if (typeof callback === 'function') callback()
      }
    },
    []
  )

  const validate = (values: SignupFormValues) => {
    const checkErrors: SignupFormValues = {}

    Object.keys(state).forEach(field => {
      const rules = validationRules[field as keyof SignupFormValues]
      const validatedValue = values[field as keyof SignupFormValues]

      if (rules && Object.keys(rules).length) {
        /* Проверка на пустоту поля, если это необходимо */
        if (rules.notEmpty && !validatedValue) {
          checkErrors[field as keyof SignupFormValues] =
            'Поле не может быть пустым'
        } else if (rules.patterns?.length) {
          /* Последовательная роверка каждого регекспа из конфига для данного поля */
          for (let i = 0; i < rules.patterns?.length; i++) {
            const regExp = new RegExp((rules.patterns[i] as string) || '')
            if (validatedValue && !regExp.test(validatedValue.trim())) {
              const message = rules.messages
              checkErrors[field as keyof SignupFormValues] =
                message && message[i] ? message[i] : ''
              /* Если есть ошибка, не надо дальше проверять */
              break
            }
          }
        }
      }
    })
    return checkErrors
  }

  return { errors, doValidate, isValidateError }
}
