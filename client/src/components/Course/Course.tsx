import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import styles from "./Course.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import CourseSidePane from "../CourseSidePane/CourseSidePane";

type CourseParams = {
  courseName: string;
};

export default function Course() {
  const params = useParams<CourseParams>();
  const masterCourseService = useMemo(MasterCourseService.getInstance, []);
  const courseDetails = useMemo(
    () => masterCourseService.getCourse(params.courseName as string),
    [params]
  );

  if (!courseDetails) return <div>Loading...</div>;
  return (
    <div className={styles.wrapper}>
      <CourseSidePane courseDetails={courseDetails} />
      {/* <pre>{JSON.stringify(courseDetails, null, 4)}</pre> */}
    </div>
  );
}
