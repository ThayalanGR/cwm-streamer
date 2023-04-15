import { useLayoutEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./CourseContentOrchestrator.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import mime from "mime-types";
import { useRef } from "react";
import { TEST_VIDEO_ID, VideoPlayer } from "../VideoPlayer/VideoPlayer";

type CourseContentOrchestratorProps = {
  course: string;
  section: string;
  content: string;
};

export default function CourseContentOrchestrator(
  props: CourseContentOrchestratorProps
) {
  // props
  const { course, section, content } = props;

  // refs
  const videoRef = useRef<HTMLVideoElement>(null);

  // hooks
  const masterCourseService = useMemo(MasterCourseService.getInstance, []);
  const courseContent = useMemo(
    () => masterCourseService.getContent({ course, section, content }),
    [course, section, content]
  );

  // effects
  useLayoutEffect(() => {
    videoRef?.current?.load();
    videoRef?.current?.play();
  }, [courseContent]);

  // paint
  const getContentRenderer = () => {
    if (!courseContent) return null;

    const { assetData, originUrl: originUrl } = courseContent;
    const { browser_download_url: assetUrl, content_type: contentType } =
      assetData;
    const type = mime.extension(contentType);
    switch (type) {
      case "mp4":
        return <VideoPlayer videoId={TEST_VIDEO_ID} />;
      case "pdf":
      case "zip":
      default:
        return (
          <div>
            No Specific Renderer found for this file type, kindly download
            manually! <br />
          </div>
        );
    }
  };

  if (!courseContent) return <div>Loading Content...</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.descriptionWrapper}>
        <div className={styles.contenTitle}>
          {masterCourseService.getAssetDisplayName(courseContent?.name)}
        </div>
        {courseContent?.assetData?.browser_download_url && (
          <Link
            target="_blank"
            className={styles.downloadLink}
            to={courseContent?.assetData?.browser_download_url}
          >
            Download ({courseContent.assetData.content_type})
          </Link>
        )}
      </div>
      <div className={styles.contentWrapper}>{getContentRenderer()}</div>
    </div>
  );
}
