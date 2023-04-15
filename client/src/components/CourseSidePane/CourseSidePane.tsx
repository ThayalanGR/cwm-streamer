import styles from "./CourseSidePane.module.css";
import { ICourse } from "../../typings/typings";
import cn from "classnames";
import { Link } from "react-router-dom";
import { useLayoutEffect, useMemo } from "react";
import MasterCourseService from "../../services/MasterCourse.service";

type CourseParams = {
  courseName: string;
};

interface ICourseSidePaneProps {
  courseDetails: ICourse;
  currentActiveContent: {
    section: string | null;
    content: string | null;
  };
}

export default function CourseSidePane(props: ICourseSidePaneProps) {
  // props
  const { courseDetails, currentActiveContent } = props;

  // hooks
  const masterCourseService = useMemo(MasterCourseService.getInstance, []);

  // compute

  // actions
  const checkIsContentActive = (section: string, content: string) => {
    const isActive =
      masterCourseService.getEncodedString(section) ===
        masterCourseService.getEncodedString(currentActiveContent.section) &&
      masterCourseService.getEncodedString(content) ===
        masterCourseService.getEncodedString(currentActiveContent.content);
    return isActive;
  };

  // effects
  useLayoutEffect(() => {
    const activeContent = document.getElementsByClassName(
      styles.CourseSectionContentNodeActive
    )[0];
    activeContent.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentActiveContent]);

  // paint
  if (!courseDetails) return <div>Loading side panel...</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.courseTitle}>
        {courseDetails.name}&nbsp;(&nbsp;{courseDetails.sections.length}&nbsp;)
      </div>
      <div className={styles.courseSectionWrapper}>
        {courseDetails.sections.map((section, sectionIndex) => (
          <div className={styles.courseSection} key={section.name}>
            <div className={styles.couseSecionTitle}>
              {sectionIndex + 1}.&nbsp;{section.name}&nbsp;(&nbsp;
              {section.assets.length}&nbsp;)
            </div>
            <div className={styles.CourseSectionContent}>
              {section.assets.map((asset, contentIndex) => (
                <Link
                  key={asset.name}
                  className={cn(styles.CourseSectionContentNode, {
                    [styles.CourseSectionContentNodeActive]:
                      checkIsContentActive(section.name, asset.name),
                  })}
                  to={masterCourseService.getContentPath(
                    courseDetails.name,
                    section.name,
                    asset.name
                  )}
                >
                  {contentIndex + 1}.&nbsp;
                  {masterCourseService.getAssetDisplayName(asset.name)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
