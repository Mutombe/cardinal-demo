/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ERP_URL?: string
  readonly VITE_ERP_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
