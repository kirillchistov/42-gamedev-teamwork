/** Изменения и починка Sprint6 Chores
 * Ошибки полей + doValidate(values, onValid).
 * Валидация по ключам из `values` и validationRules
 * Убрал устаревшее замыкание на первый render.
 * Поля смены пароля в профиле валидируются отдельно от других:
 * Убран стартовый doValidate для паролей из useEffect.
 *
 * syncValidationFromValues — полная проверка без режима submit (для данных с сервера и live-сводки).
 * Ошибки полей показываются только после blur поля или после submit (getFieldError).
 **/
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  SignupFormValues,
  validationRules,
} from '../shared/validation/authValidation'

function testPattern(
  pattern: unknown,
  value: string
): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(value)
  }
  return new RegExp(String(pattern ?? '')).test(
    value
  )
}

export const useValidate = () => {
  const [errors, setErrors] = useState<
    Partial<SignupFormValues>
  >({})
  const [touched, setTouched] = useState<
    Partial<
      Record<keyof SignupFormValues, boolean>
    >
  >({})
  const [isSubmitted, setIsSubmitted] =
    useState(false)
  const [isValidateError, setIsValidateError] =
    useState(false)

  const validate = useCallback(
    (values: SignupFormValues) => {
      const checkErrors: Partial<SignupFormValues> =
        {}

      for (const field of Object.keys(
        values
      ) as (keyof SignupFormValues)[]) {
        const rules =
          validationRules[field as string]
        if (!rules) continue

        const raw: unknown = values[field]
        if (raw instanceof File) continue

        const validatedValue =
          typeof raw === 'string'
            ? raw
            : raw != null
            ? String(raw)
            : ''

        if (
          rules.notEmpty &&
          !validatedValue.trim()
        ) {
          checkErrors[field] =
            'Поле не может быть пустым'
          continue
        }

        if (
          rules.patterns?.length &&
          validatedValue
        ) {
          const trimmed = validatedValue.trim()
          for (
            let i = 0;
            i < rules.patterns.length;
            i += 1
          ) {
            const pat = rules.patterns[i]
            if (!testPattern(pat, trimmed)) {
              const msg = rules.messages?.[i]
              checkErrors[field] =
                msg ?? 'Некорректное значение'
              break
            }
          }
        }
      }

      return checkErrors
    },
    []
  )

  useEffect(() => {
    setIsValidateError(
      (
        Object.keys(
          errors
        ) as (keyof SignupFormValues)[]
      ).some(k => Boolean(errors[k]))
    )
  }, [errors])

  const syncValidationFromValues = useCallback(
    (values: SignupFormValues) => {
      const validationErrors = validate(values)
      setErrors({ ...validationErrors })
      setIsSubmitted(false)
    },
    [validate]
  )

  const doValidate = useCallback(
    (
      values: SignupFormValues,
      callback?: () => void
    ) => {
      setIsSubmitted(true)
      const validationErrors = validate(values)
      setErrors({ ...validationErrors })
      if (
        Object.keys(validationErrors).length === 0
      ) {
        callback?.()
      }
    },
    [validate]
  )

  const validateField = useCallback(
    (
      field: keyof SignupFormValues,
      value: unknown
    ) => {
      const fieldErrors = validate({
        [field]:
          typeof value === 'string'
            ? value
            : value != null
            ? String(value)
            : '',
      })

      setErrors(prev => {
        const next: Partial<SignupFormValues> = {
          ...prev,
        }
        const msg = fieldErrors[field]
        if (msg) {
          next[field] = msg
        } else {
          delete next[field]
        }
        return next
      })

      return fieldErrors[field]
    },
    [validate]
  )

  const handleFieldFocus = useCallback(
    (_field: keyof SignupFormValues) => {
      /* Валидация по ТЗ: blur + submit; focus не помечает поле как «тронутое». */
    },
    []
  )

  const handleFieldBlur = useCallback(
    (
      field: keyof SignupFormValues,
      value: unknown
    ) => {
      setTouched(prev => ({
        ...prev,
        [field]: true,
      }))
      validateField(field, value)
    },
    [validateField]
  )

  const getFieldError = useCallback(
    (field: keyof SignupFormValues) => {
      if (!touched[field] && !isSubmitted) {
        return undefined
      }
      return errors[field]
    },
    [errors, touched, isSubmitted]
  )

  const resetValidation = useCallback(() => {
    setErrors({})
    setTouched({})
    setIsSubmitted(false)
  }, [])

  return {
    errors,
    doValidate,
    syncValidationFromValues,
    validateField,
    handleFieldFocus,
    handleFieldBlur,
    getFieldError,
    isValidateError,
    resetValidation,
  }
}
