// The pinned vendored runtime has no installed @types/three package.
// Only this third-party boundary is untyped; World, props and frame controls remain typed.
declare const THREE: Record<string, any>;
export default THREE;
