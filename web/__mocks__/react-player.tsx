import React from "react";

type MockReactPlayerProps = {
  src?: string;
  playing?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  playsInline?: boolean;
};

const ReactPlayer = React.forwardRef<HTMLVideoElement, MockReactPlayerProps>(
  function MockReactPlayer(props, ref) {
    React.useImperativeHandle(ref, () => ({ currentTime: 0 }) as HTMLVideoElement);
    return React.createElement("div", {
      "data-testid": "react-player",
      "data-src": props.src,
      "data-playing": String(props.playing),
      "data-muted": String(props.muted),
      className: props.className,
      id: props.id,
      style: props.style
    });
  }
);

export default ReactPlayer;
