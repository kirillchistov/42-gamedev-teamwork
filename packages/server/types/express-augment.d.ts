import 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    /** Заполняется после успешного GET /auth/user у Практикума. */
    praktikumUser?: {
      id: number
      displayLabel: string
    }
  }
}

export {}
