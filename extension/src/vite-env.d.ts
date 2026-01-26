// In src/vite-env.d.ts or src/custom.d.ts

declare module '*.svg' {
    const content: string;
    export default content;
}
