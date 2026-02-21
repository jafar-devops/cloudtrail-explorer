/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CLOUDTRAIL_LOG_PATH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
