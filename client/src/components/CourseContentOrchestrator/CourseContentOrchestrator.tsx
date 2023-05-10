import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CourseContentOrchestrator.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import mime from "mime-types";
import { useRef } from "react";
import cn from "classnames";
import { NavigationButton } from "./NavigationButton";
import { useAppStore } from "../App/App";

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
  const navigate = useNavigate();
  const masterCourseService = useMemo(MasterCourseService.getInstance, []);
  const isAutoPlayEnabled = useAppStore((state) => state.isAutoPlayEnabled);
  const {
    courseIndex,
    sectionIndex,
    assetIndex,
    asset: courseContent,
  } = useMemo(
    () => masterCourseService.getContent({ course, section, content }),
    [course, section, content]
  );
  const navigationLinks = useMemo(
    () =>
      masterCourseService.getAssetNavigationLinks({
        courseIndex,
        sectionIndex,
        assetIndex,
        options: { allowOnlyVideos: true },
      }),
    [courseIndex, sectionIndex, assetIndex]
  );

  // actions
  const getCourseContentIndex = () => {
    return `${sectionIndex + 1}.${assetIndex + 1} - `;
  };

  // effects
  useEffect(() => {
    videoRef?.current?.load();
  }, [courseContent]);

  useLayoutEffect(() => {
    const onVideoEnded = () => {
      if (isAutoPlayEnabled && navigationLinks?.next !== undefined) {
        navigate(navigationLinks.next);
      }
    };

    if (isAutoPlayEnabled) {
      // videoRef?.current?.play();
    }

    videoRef?.current?.addEventListener("ended", onVideoEnded);

    return () => {
      videoRef?.current?.removeEventListener("ended", onVideoEnded);
    };
  }, [courseContent, isAutoPlayEnabled]);

  // paint
  const getContentRenderer = useCallback(() => {
    if (!courseContent) return null;

    const { assetData, compressedAssetData, originUrl } = courseContent;
    const requiredAssetData = compressedAssetData ?? assetData;
    const { browser_download_url: assetUrl, content_type: contentType } =
      requiredAssetData;
    const type = mime.extension(contentType);

    switch (type) {
      case "mp4":
      case "qt":
      case "mov":
        const requiredUrl =
          masterCourseService.getCachedContentBlobUrl(assetUrl);
        return (
          <video ref={videoRef} autoPlay={isAutoPlayEnabled} controls>
            <source src={requiredUrl} type={"video/mp4"} />
            <source
              src={masterCourseService.getRequiredUrl(assetUrl)}
              type={"video/mp4"}
            />
            <source
              src={masterCourseService.getRequiredUrl(originUrl)}
              type={"video/mp4"}
            />
          </video>
        );
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
  }, [courseContent]);

  const getDownloadLink = () => {
    const requiredContent =
      masterCourseService.getRequiredAssetData(courseContent);
    const isVideoContent = requiredContent?.content_type?.includes("video");

    if (isVideoContent) {
      return (
        <div>
          Download&nbsp;
          {courseContent?.assetData?.browser_download_url && (
            <Link
              target="_blank"
              className={styles.downloadLink}
              to={courseContent?.assetData?.browser_download_url}
            >
              HD ({courseContent.assetData.content_type})
            </Link>
          )}
          {courseContent?.compressedAssetData?.browser_download_url && (
            <>
              {" "}
              |{" "}
              <Link
                target="_blank"
                className={styles.downloadLink}
                to={courseContent?.compressedAssetData?.browser_download_url}
              >
                SD ({courseContent.compressedAssetData.content_type})
              </Link>
            </>
          )}
        </div>
      );
    }

    if (requiredContent?.browser_download_url) {
      return (
        <Link
          target="_blank"
          className={styles.downloadLink}
          to={requiredContent?.browser_download_url}
        >
          Download HD ({requiredContent.content_type})
        </Link>
      );
    }

    return null;
  };

  if (!courseContent) return <div>Loading Content...</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.descriptionWrapper}>
        <div className={styles.contenTitleWrapper}>
          <NavigationButton
            courseIndex={courseIndex}
            sectionIndex={sectionIndex}
            assetIndex={assetIndex}
          />
          <div className={styles.contenTitle}>
            {getCourseContentIndex()}
            {masterCourseService.getAssetDisplayName(courseContent?.name)}
          </div>
        </div>
        {getDownloadLink()}
      </div>
      <div className={styles.contentWrapper}>{getContentRenderer()}</div>
    </div>
  );
}
