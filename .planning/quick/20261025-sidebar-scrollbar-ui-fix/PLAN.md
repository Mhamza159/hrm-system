# Quick Task: Fix UI Scrollbar in Sidebar Navigation

## Goal
Replace the default wide, light-themed Windows scrollbar in the left navigation sidebar with a sleek, minimalist, theme-matched scrollbar that integrates seamlessly into the dark forest `#061A14` background. Also provide consistent custom scrollbar utilities for the application.

## User Requirements
1. **Sidebar Scrollbar Polish**:
   - Eliminate the default browser scrollbar (wide 17px light-grey track, native buttons) in `<aside>` / `<nav>`.
   - Apply a modern, slim (4–5px), rounded scrollbar thumb.
   - Transparent track so `#061A14` sidebar background is uninterrupted.
   - Subtle translucent thumb (`rgba(255, 255, 255, 0.12)`) that responds to hover and turns Emerald (`#00C471`).
   - Cross-browser support (`scrollbar-width: thin; scrollbar-color: ...` for Firefox/Modern Chromium + `::-webkit-scrollbar` for WebKit/Blink).
2. **Global Utilities**:
   - Provide `.sidebar-scrollbar` in `frontend/src/index.css`.
   - Provide `.custom-scrollbar` and `.scrollbar-none` in `frontend/src/index.css` to fix existing usages across drawers and tabs.
3. **Sidebar Component**:
   - Apply `.sidebar-scrollbar` to the `<nav>` element in `frontend/src/components/layout/Sidebar.jsx`.

## Implementation Slices
1. **STYLE-1**: Add `.sidebar-scrollbar`, `.custom-scrollbar`, and `.scrollbar-none` utilities to `frontend/src/index.css`.
2. **FE-1**: Update `Sidebar.jsx` nav container with `sidebar-scrollbar` class and optimize spacing.
3. **VERIFY**: Run Vite build test to ensure zero CSS/JS syntax errors.
