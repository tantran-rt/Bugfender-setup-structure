import { useEffect } from "react";

type UseStepMediaPlaybackOptions = {
  activeStep: number;
  videoPath?: string | null;
  onPlay: () => void;
  onEnd: () => void;
};

export function useStepMediaPlayback({
  activeStep,
  videoPath,
  onPlay,
  onEnd
}: UseStepMediaPlaybackOptions) {
  useEffect(() => {
    const audio = document.getElementById("test-audio") as HTMLAudioElement;
    audio?.addEventListener("playing", onPlay);
    audio?.addEventListener("ended", onEnd);
    return () => {
      audio?.removeEventListener("playing", onPlay);
      audio?.removeEventListener("ended", onEnd);
    };
    // onPlay/onEnd are intentionally omitted — same as page.tsx before extraction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  useEffect(() => {
    if (!videoPath) {
      return;
    }

    const video = document.getElementById(
      "step-video-player"
    ) as HTMLVideoElement | null;

    if (!video) {
      return;
    }

    video.addEventListener("playing", onPlay);
    video.addEventListener("ended", onEnd);

    if (!video.paused) {
      onPlay();
    }

    return () => {
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("ended", onEnd);
    };
    // onPlay/onEnd are intentionally omitted — same as page.tsx before extraction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, videoPath]);
}
