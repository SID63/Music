declare module 'html2canvas' {
  export interface Html2CanvasOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    scale?: number;
    backgroundColor?: string | null;
    useCORS?: boolean;
    allowTaint?: boolean;
    logging?: boolean;
    onclone?: (doc: Document) => void;
    windowWidth?: number;
    windowHeight?: number;
  }

  export default function html2canvas(
    element: HTMLElement,
    options?: Partial<Html2CanvasOptions>
  ): Promise<HTMLCanvasElement>;
}
