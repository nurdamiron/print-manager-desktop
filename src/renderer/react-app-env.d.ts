/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
    const classes: { [key: string]: string };
    export default classes;
  }
  
  declare module '*.svg' {
    import * as React from 'react';
  
    export const ReactComponent: React.FunctionComponent<
      React.SVGProps<SVGSVGElement> & { title?: string }
    >;
  
    const src: string;
    export default src;
  }
  
  declare module '*.png' {
    const src: string;
    export default src;
  }
  
  declare module '*.jpg' {
    const src: string;
    export default src;
  }