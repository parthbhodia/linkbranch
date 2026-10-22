import "./index.css";
import { Composition } from "remotion";
import { CuefulReel } from "./CuefulReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CuefulReel"
        component={CuefulReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
