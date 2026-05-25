"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMonorepoEnv = loadMonorepoEnv;
exports.loadMonorepoEnvFromDir = loadMonorepoEnvFromDir;
exports.resetEnvLoadForTests = resetEnvLoadForTests;
// Единая загрузка .env для SSR-сервера и Vite (корень монорепо)
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const repoRootEnv = path_1.default.resolve(__dirname, '../../../.env');
let loaded = false;
// Идемпотентный корневой .env, затем локальный (packages/client/.env)
function loadMonorepoEnv() {
    if (loaded)
        return;
    dotenv_1.default.config({ path: repoRootEnv });
    dotenv_1.default.config();
    loaded = true;
}
// Для vite.config (тот же корень от packages/client)
function loadMonorepoEnvFromDir(moduleDirname) {
    if (loaded)
        return;
    const root = path_1.default.resolve(moduleDirname, '../../.env');
    dotenv_1.default.config({ path: root });
    dotenv_1.default.config();
    loaded = true;
}
// Сброс только для тестов
function resetEnvLoadForTests() {
    loaded = false;
}
