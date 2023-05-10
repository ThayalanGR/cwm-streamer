import { useMemo } from "react";
import { Link } from "react-router-dom";
import MasterCourseService from "../../services/MasterCourse.service";
import styles from "./CourseContentOrchestrator.module.css";
import cn from "classnames";

export const NavigationButton = (props: {
  courseIndex: number;
  sectionIndex: number;
  assetIndex: number;
}) => {
  // props
  const { courseIndex, sectionIndex, assetIndex } = props;

  const { next, previous } = useMemo(
    () =>
      MasterCourseService.getInstance().getAssetNavigationLinks({
        courseIndex,
        sectionIndex,
        assetIndex,
      }),
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
