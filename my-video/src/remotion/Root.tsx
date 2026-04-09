import React from "react";
import { Composition } from "remotion";
import { DynamicComp } from "./DynamicComp";
import { UzozaLaunch, UZOZA_DURATION } from "./uzoza/UzozaLaunch";

const defaultCode = `import { AbsoluteFill } from "remotion";
export const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;`;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicComp"
        component={DynamicComp}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ code: defaultCode }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.durationInFrames as number,
          fps: props.fps as number,
        })}
      />
      <Composition
        id="UzozaLaunch"
        component={UzozaLaunch}
        durationInFrames={UZOZA_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
