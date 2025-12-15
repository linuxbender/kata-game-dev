declare module 'react' {
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export function useRef<T>(initial?: T | null): { current: T | null }
  export function useState<S>(initial: S | (() => S)): [S, (v: S | ((prev: S) => S)) => void]
  export const StrictMode: any
  const React: any
  export default React
}

declare module 'react-dom/client' {
  export function createRoot(el: any): { render(node: any): void }
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props?: any, key?: any): any
  export function jsxs(type: any, props?: any, key?: any): any
  export function jsxDEV(type: any, props?: any, key?: any): any
}

// Minimal JSX namespace so TS understands JSX in this environment
declare namespace JSX {
  interface IntrinsicElements {
    // add common html elements used in the project
    canvas: any
    div: any
    span: any
    // fallback
    [elemName: string]: any
  }
  interface Element { }
}
