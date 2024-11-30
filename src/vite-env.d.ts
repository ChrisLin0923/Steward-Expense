/// <reference types="vite/client" />
//This file enables modules.css
/**
 * By adding /// <reference types="vite/client" />, you inform TypeScript about the types
 *  used in a Vite environment. This includes declarations for various Vite-specific features
 * and file types. CSS Module Types: Vite supports CSS Modules out of the box, but TypeScript
 * needs to know how to interpret these files. If you didn’t have the proper type definitions,
 * TypeScript may not recognize imports from .module.css files, leading to errors.
 */

declare module "*.svg" {
	const content: string;
	export default content;
}

declare module "*.png" {
	const content: string;
	export default content;
}

declare module "*.jpg" {
	const content: string;
	export default content;
}

declare module "*.jpeg" {
	const content: string;
	export default content;
}
