/// <reference types="vite/client" />

declare const __ACCESS_PASSWORD_HASH__: string;
declare const __ACCESS_SESSION_HOURS__: number;

declare module 'epubjs' {
  export interface NavItem { label: string; href: string; subitems?: NavItem[] }
  export interface Rendition {
    display(target?: string): Promise<void>;
    next(): Promise<void>;
    prev(): Promise<void>;
    on(event: string, callback: (location: unknown) => void): void;
    themes: { register(name: string, styles: Record<string, Record<string, string>>): void; select(name: string): void; fontSize(size: string): void };
    destroy(): void;
  }
  export interface Book {
    renderTo(element: Element, options: Record<string, unknown>): Rendition;
    ready: Promise<void>;
    navigation: { toc: NavItem[] };
    locations: { generate(chars?: number): Promise<string[]>; length(): number; percentageFromCfi(cfi: string): number };
    destroy(): void;
  }
  export default function ePub(input: string | ArrayBuffer): Book;
}
