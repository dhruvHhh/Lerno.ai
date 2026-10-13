// The hairline-create skill's engine, copied unchanged; only what the app calls is typed.
export interface HairlineFigure {
  name: string;
  means: string;
  range: [number, number, number];
  tour: ([number, number] | null)[] | null;
  mount: (
    parts: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } },
    value: number,
  ) => { set: (value: number) => void; destroy: () => void };
}

declare const HL: {
  inject: (root: Document) => void;
  mk: (tag: "svg", attrs: Record<string, string>, parent: HTMLElement) => SVGSVGElement;
  reducedMotion: () => boolean;
  tour: (stage: HTMLElement, stops: HairlineFigure["tour"], onStop: (index: number) => void) => { stop: () => void };
  LAP: HairlineFigure["tour"];
};

export default HL;
