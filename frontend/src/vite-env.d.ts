/* eslint-disable no-unused-vars */
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_AUTH_URL: string;
    readonly VITE_CLIENT_ID: string;
    readonly VITE_CALLBACK_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
