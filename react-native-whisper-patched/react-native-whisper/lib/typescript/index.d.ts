declare const simpleJsiModule: {
    helloWorld(): string;
    multiplyWithCallback(x: number, y: number, callback: (z: number) => void): void;
    multiply(x: number, y: number): number;
    getDeviceName(): string;
    setItem(key: string, value: string): boolean;
    getItem(key: string): string;
    foo(callback: (error: string | undefined, value: string | undefined) => void): void;
};
export declare function isLoaded(): boolean;
export default simpleJsiModule;
//# sourceMappingURL=index.d.ts.map