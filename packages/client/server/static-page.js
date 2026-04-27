"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderStaticPageHtml = renderStaticPageHtml;
const jsx_runtime_1 = require("react/jsx-runtime");
const server_1 = __importDefault(require("react-dom/server"));
function StaticPage() {
    return ((0, jsx_runtime_1.jsxs)("main", { style: {
            maxWidth: 720,
            margin: '3rem auto',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.5,
        }, children: [(0, jsx_runtime_1.jsxs)("h1", { children: ["\u0421\u0442\u0430\u0442\u0438\u0447\u043D\u0430\u044F SSR-\u0441\u0442\u0440\u0430\u043D\u0438\u0447\u043A\u0430 \u043F\u043E\u044F\u0432\u0438\u043B\u0430\u0441\u044C \u0432 \u0433\u0430\u043B\u043B\u0430\u043A\u0442\u0438\u043A\u0435", ' '] }), (0, jsx_runtime_1.jsx)("p", { children: "\u042D\u0442\u043E\u0442 \u043F\u0443\u0442\u044C \u0430\u0441\u0442\u0440\u043E\u043D\u0430\u0432\u0442\u044B \u043F\u0440\u043E\u0445\u043E\u0434\u044F\u0442 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0441\u0435\u0440\u0432\u0435\u0440\u043D\u043E\u0433\u043E \u0440\u0435\u043D\u0434\u0435\u0440\u0430. \u0414\u0430 \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u0432\u0430\u043C ReactDOMServer.renderToString()!" }), (0, jsx_runtime_1.jsx)("p", { children: "\u042D\u0442\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0447\u043A\u0430 \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 Redux, \u0438\u0431\u043E \u0442\u0430\u043A \u043F\u0440\u0435\u0434\u043F\u0438\u0441\u0430\u043D\u043E \u0432 \u0437\u0432\u0435\u0437\u0434\u043D\u043E\u043C \u0417\u0430\u0432\u0435\u0442\u0435." })] }));
}
function renderStaticPageHtml() {
    const body = server_1.default.renderToString((0, jsx_runtime_1.jsx)(StaticPage, {}));
    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="utf-8" />',
        '<meta name="viewport" content="width=device-width, initial-scale=1" />',
        '<title>SSR static demo</title>',
        '</head>',
        `<body>${body}</body>`,
        '</html>',
    ].join('');
}
