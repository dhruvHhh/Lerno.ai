// Visible faces of the isometric L mark (hidden parts already clipped away), in a 256×256 box.
export const LOGO_FACES = [
  { tone: "side", points: "230.5,166.0 184.4,192.7 184.4,246.0 230.5,219.3" },
  { tone: "top", points: "230.5,166.0 117.8,101.0 117.8,154.3 184.4,192.7" },
  { tone: "front", points: "184.4,246.0 184.4,192.7 117.8,154.3 117.8,193.5 105.6,200.5" },
  { tone: "side", points: "117.8,36.7 71.6,63.3 71.6,220.1 117.8,193.5" },
  { tone: "top", points: "117.8,36.7 71.6,10.0 25.5,36.7 71.6,63.3" },
  { tone: "front", points: "25.5,193.5 71.6,220.1 71.6,63.3 25.5,36.7" },
] as const;
