import { useCallback, useLayoutEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./CourseContentOrchestrator.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import mime from "mime-types";
import { useRef } from "react";
import cn from "classnames";

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
  const {
    courseIndex,
    sectionIndex,
    assetIndex,
    asset: courseContent,
  } = useMemo(
    () => masterCourseService.getContent({ course, section, content }),
    [course, section, content]
  );

  // effects
  useLayoutEffect(() => {
    videoRef?.current?.load();
    videoRef?.current?.play();
  }, [courseContent]);

  // paint
  const getContentRenderer = useCallback(() => {
    if (!courseContent) return null;

    const { assetData, compressedAssetData, originUrl } = courseContent;
    const requiredAssetData = compressedAssetData ?? assetData;
    const { browser_download_url: assetUrl, content_type: contentType } =
      requiredAssetData;
    const type = mime.extension(contentType);
    console.log(type);

    switch (type) {
      case "mp4":
      case "qt":
      case "mov":
        const requiredUrl =
          masterCourseService.getCachedContentBlobUrl(assetUrl);
        return (
          <video ref={videoRef} autoPlay controls>
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
            {masterCourseService.getAssetDisplayName(courseContent?.name)}
          </div>
        </div>
        {getDownloadLink()}
      </div>
      <div className={styles.contentWrapper}>{getContentRenderer()}</div>
    </div>
  );
}

const NavigationButton = (props: {
  courseIndex: number;
  sectionIndex: number;
  assetIndex: number;
}) => {
  // props
  const { courseIndex, sectionIndex, assetIndex } = props;

  const { next, previous } = useMemo(
    () =>
      MasterCourseService.getInstance().getAssetNavigationLinks(
        courseIndex,
        sectionIndex,
        assetIndex
      ),
    [courseIndex, sectionIndex, assetIndex]
  );

  // actions

  // paint
  return (
    <div className={styles.navigationButtonGroup}>
      <Link
        className={cn(styles.navigationButton, {
          [styles.navigationButtonDisabled]: previous === undefined,
        })}
        to={previous ?? "#"}
      >
        &larr;
      </Link>
      <Link
        className={cn(styles.navigationButton, {
          [styles.navigationButtonDisabled]: next === undefined,
        })}
        to={next ?? "#"}
      >
        &rarr;
      </Link>
    </div>
  );
};
