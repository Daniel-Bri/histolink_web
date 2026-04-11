import { useCallback, useMemo, useState } from 'react'

type Errors<T extends string> = Partial<Record<T, string>>

/**
 * Formulario controlado con errores por campo, toque (blur) e intento de envío.
 */
export function useForm<T extends Record<string, string>>(options: {
  initialValues: T
  validateField: (field: keyof T, values: T) => string | undefined
  validateAll: (values: T) => Errors<Extract<keyof T, string>>
}) {
  const { initialValues, validateField, validateAll } = options

  const [values, setValuesState] = useState<T>(() => ({ ...initialValues }))
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [clientErrors, setClientErrors] = useState<Errors<Extract<keyof T, string>>>({})
  const [serverErrors, setServerErrors] = useState<Errors<Extract<keyof T, string>>>({})
  const [nonFieldErrors, setNonFieldErrors] = useState<string[]>([])
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const mergedErrors = useMemo(
    () => ({ ...clientErrors, ...serverErrors }),
    [clientErrors, serverErrors],
  )

  const isValid = useMemo(
    () => Object.keys(validateAll(values)).length === 0,
    [values, validateAll],
  )

  const setValue = useCallback((name: keyof T, value: string) => {
    setValuesState((prev) => ({ ...prev, [name]: value }))
    setServerErrors((prev) => {
      const next = { ...prev }
      delete next[name as Extract<keyof T, string>]
      return next
    })
    setNonFieldErrors([])
  }, [])

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((t) => ({ ...t, [name]: true }))
      const err = validateField(name, values)
      setClientErrors((prev) => {
        const next = { ...prev }
        if (err) next[name as Extract<keyof T, string>] = err
        else delete next[name as Extract<keyof T, string>]
        return next
      })
    },
    [validateField, values],
  )

  const shouldShowError = useCallback(
    (name: keyof T) => Boolean(touched[name] || attemptedSubmit),
    [touched, attemptedSubmit],
  )

  /** Errores del servidor se muestran siempre; los de cliente solo tras blur o envío. */
  const showFieldError = useCallback(
    (name: keyof T) => {
      const key = name as Extract<keyof T, string>
      const msg = mergedErrors[key]
      if (!msg) return false
      if (serverErrors[key]) return true
      return Boolean(touched[name] || attemptedSubmit)
    },
    [mergedErrors, serverErrors, touched, attemptedSubmit],
  )

  const runSubmitValidation = useCallback(() => {
    setAttemptedSubmit(true)
    setServerErrors({})
    setNonFieldErrors([])
    const all = validateAll(values)
    setClientErrors(all)
    return Object.keys(all).length === 0
  }, [validateAll, values])

  const setServerFieldErrors = useCallback((errs: Errors<Extract<keyof T, string>>) => {
    setServerErrors(errs)
  }, [])

  const setGeneralErrors = useCallback((msgs: string[]) => {
    setNonFieldErrors(msgs)
  }, [])

  const reset = useCallback(() => {
    setValuesState({ ...initialValues })
    setTouched({})
    setClientErrors({})
    setServerErrors({})
    setNonFieldErrors([])
    setAttemptedSubmit(false)
  }, [initialValues])

  return {
    values,
    setValue,
    mergedErrors,
    clientErrors,
    serverErrors,
    nonFieldErrors,
    touched,
    attemptedSubmit,
    isValid,
    handleBlur,
    shouldShowError,
    showFieldError,
    runSubmitValidation,
    setServerFieldErrors,
    setGeneralErrors,
    reset,
  }
}
