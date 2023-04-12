import styles from "./CourseSidePane.module.css";
import { ICourse } from "../../typings/typings";
import { Link } from "react-router-dom";

type CourseParams = {
  courseName: string;
};

interface ICourseSidePaneProps {
  courseDetails: ICourse;
}

export default function CourseSidePane(props: ICourseSidePaneProps) {
  // props
  const { courseDetails } = props;

  // paint
  if (!courseDetails) return <div>Loading...</div>;
  return (
    <div className={styles.wrapper}>
      <div className={styles.courseTitle}>{courseDetails.name}</div>
      <div className={styles.courseSectionWrapper}>
        {courseDetails.sections.map((section) => (
          <div className={styles.courseSection}>
            <div className={styles.couseSecionTitle}>{section.name}</div>
            <div className={styles.CourseSectionContent}>
              {section.assets.map((asset) => (
                <Link className={styles.CourseSectionContentNode} to={""}>
                  {asset.name}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
