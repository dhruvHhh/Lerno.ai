import { Composition } from "remotion";

import { Film, FILM_FRAMES } from "./film/Film";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LernoFilm"
      component={Film}
      durationInFrames={FILM_FRAMES}
      width={1920}
      height={1080}
      fps={60}
    />
  );
};
