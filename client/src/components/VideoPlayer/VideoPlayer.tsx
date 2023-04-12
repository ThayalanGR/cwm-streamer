import React from "react";
import styles from "./VideoPlayer.module.css";

function VideoPlayer({ src }: { src: string }) {
  return (
    <div className={styles.videoPlayerContainer}>
      <video controls>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

export default VideoPlayer;
