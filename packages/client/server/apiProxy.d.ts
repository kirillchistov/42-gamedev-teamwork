/**
 * Same-origin прокси: браузер шлёт Cookie сессии Практикума на origin клиента,
 * SSR-сервер пробрасывает их в ya-praktikum.tech и packages/server.
 */
import type { Express } from 'express'
export declare function registerApiProxy(app: Express): void
