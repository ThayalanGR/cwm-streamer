import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./CourseContentOrchestrator.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import mime from "mime-types";
import { useRef } from "react";
import cn from "classnames";
import { NavigationButton } from "./NavigationButton";
import { useAppStore } from "../App/App";
import BufferedPdfViewer from "./BufferedPdfViewer";

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

    videoRef?.current?.addEventListener("ended", onVideoEnded);

    return () => {
      videoRef?.current?.removeEventListener("ended", onVideoEnded);
    };
  }, [courseContent, isAutoPlayEnabled]);

  // paint
  const getNoRendererFoundElement = (
    contentUrl: string,
    contentType: string
  ) => {
    return (
      <div className={styles.noContentRenderer}>
        <div>
          No Specific Renderer found for this file type,
          <br />
          kindly download manually! <br />
        </div>
        <Link
          className={cn(styles.contentNoRendererDownloadButton)}
          to={contentUrl}
          target="_blank"
        >
          Download ({contentType})
        </Link>
      </div>
    );
  };

  const getContentRenderer = useCallback(() => {
    if (!courseContent) return null;

    const { assetData, compressedAssetData, originUrl } = courseContent;
    const requiredAssetData = compressedAssetData ?? assetData;
    const { browser_download_url: assetUrl, content_type: contentType } =
      requiredAssetData;
    const type = mime.extension(contentType);
    const isVideo = contentType?.includes("video");

    if (isVideo) {
      const requiredUrl = masterCourseService.getCachedContentBlobUrl(assetUrl);
      return (
        <video ref={videoRef} autoPlay={isAutoPlayEnabled} controls>
          <source src={requiredUrl} type={"video/mp4"} />
          <source
            src={masterCourseService.getProxiedUrl(assetUrl)}
            type={"video/mp4"}
          />
          <source
            src={masterCourseService.getProxiedUrl(originUrl)}
            type={"video/mp4"}
          />
        </video>
      );
    }

    switch (type) {
      case "pdf":
        return (
          <BufferedPdfViewer
            assetUrl={courseContent.assetData.browser_download_url}
            noContentRenderer={getNoRendererFoundElement(
              courseContent.assetData.browser_download_url,
              courseContent.assetData.content_type
            )}
          />
        );
      default:
        return getNoRendererFoundElement(
          courseContent.assetData.browser_download_url,
          courseContent.assetData.content_type
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
          Download ({requiredContent.content_type})
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
