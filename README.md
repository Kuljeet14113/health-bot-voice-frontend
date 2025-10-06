# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Environment Variables & API

- The frontend expects the backend API to be running at `http://localhost:3000` by default.
- If you need to change the API URL, update the `API_URL` in `src/api/auth.jsx`.
- JWT tokens are stored in `localStorage` as `authToken` after login.
- User info is stored in `localStorage` as `userData`.

## Error Handling
- All authentication errors are shown as alerts on the relevant forms.
- OTP and login errors are handled and displayed to the user.
- If the JWT expires or is invalid, the user will be redirected to the login page.

## Security
- Never commit sensitive information or secrets to version control.
- Always use HTTPS and secure cookies in production.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
