export const TEST_VIDEO_ID = "P_ntoTdjNz0";

interface IVideoPlayerProps {
  videoId: string;
}

export function VideoPlayer({ videoId }: IVideoPlayerProps) {
  return (
    <iframe
      src="https://www.youtube.com/embed/P_ntoTdjNz0"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
