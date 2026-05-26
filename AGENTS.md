<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Frontend Development Guidelines

## 1. 优先使用 UI 组件库

- 如果 `package.json` 中有使用 UI 组件库（如 Ant Design, Material-UI, 或类似的框架），请尽量优先使用这些库提供的组件。
- 使用 UI 组件库的组件可以帮助减少手动写基础标签（如 `li`, `div`, `h1` 等），从而使代码更简洁，结构更清晰。

## 2. 组件复用

- 无论是基础 HTML 标签还是 UI 组件，都要考虑到复用性。每当有相似的结构或功能时，封装成可复用的组件。
- 组件化不仅能减少重复代码量，还能提高代码的可维护性和可扩展性。

## 3. 样式使用 TailwindCSS

- 在项目中，如果 `package.json` 中已经配置了 TailwindCSS，请优先使用它来编写样式。
- TailwindCSS 提供了快速开发、可配置的原子化 CSS 类，可以帮助我们避免重复编写样式规则。
- 在使用 TailwindCSS 时，要注意：
  - 通过简洁的类名控制布局和样式。
  - 尽量避免过多的动态效果（如动画和过度的过渡），因为这些效果可能导致页面卡顿，影响性能。
  - 关注实用性，保持页面的响应速度和流畅度。

## 4. 避免过多的基础标签

- 基础标签（如 `div`, `span`, `ul`, `li` 等）应尽量避免直接使用，除非确实没有合适的 UI 组件。
- 尽量使用更具语义的标签和封装好的 UI 组件，这不仅使页面更美观，也能增强可访问性（ SEO 和无障碍）。

## 5. 确保标签闭合与语法正确

- 确保所有 HTML 标签都正确闭合，避免遗漏闭合标签导致的页面渲染问题。
- 始终保持正确的基础语法，避免产生 HTML、 JSX 或 Vue 模板语法错误。
- 可以使用 ESLint 等静态代码分析工具来检测潜在的语法问题，并确保代码符合最佳实践。

## 6. 美观和简洁的设计

- UI 设计要遵循一致性原则，保持色调和布局的一致性，避免过于繁杂的元素。
- 使用组件库时，优先考虑其设计规范，避免自定义过多样式，保持一致性。

## 总结

目标是通过合理的组件化、复用和 TailwindCSS，减少代码量，提高代码质量，同时确保页面简洁、美观和高效。每次开发时，都要优先考虑组件的复用性和 UI 库的使用，而非从头开始编写基础标签和样式。保持语法规范并使用工具（如 ESLint）来帮助检测代码质量，是确保代码健康的有效手段。

<!-- END:nextjs-agent-rules -->
