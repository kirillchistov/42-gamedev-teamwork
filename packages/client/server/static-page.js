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
        }, children: [(0, jsx_runtime_1.jsx)("h1", { children: "SSR static page is working" }), (0, jsx_runtime_1.jsx)("p", { children: "This route is rendered on the server with ReactDOMServer.renderToString()." }), (0, jsx_runtime_1.jsx)("p", { children: "It is intentionally independent from Redux and app router to satisfy the formal task requirement." })] }));
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
