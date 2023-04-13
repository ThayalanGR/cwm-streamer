import React, { useMemo } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import styles from "./Course.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import CourseSidePane from "../CourseSidePane/CourseSidePane";

type CourseParams = {
  courseName: string;
};

export default function Course() {
  // hooks
  const params = useParams<CourseParams>();
  const [searchParams] = useSearchParams();
  const masterCourseService = useMemo(MasterCourseService.getInstance, []);
  const courseDetails = useMemo(
    () => masterCourseService.getCourse(params.courseName as string),
    [params]
  );

  // compute
  const course = courseDetails?.name;
  const section = searchParams.get("section");
  const content = searchParams.get("content");
  const hasContent = course && section && content;
  const defaultContentPath =
    masterCourseService.getDefaultContentPath(courseDetails);

  // paint
  if (!courseDetails) return <div>Loading...</div>;

  if (!hasContent) return <Navigate to={defaultContentPath} />;

  return (
    <div className={styles.wrapper}>
      <CourseSidePane courseDetails={courseDetails} />
      {/* <pre>{JSON.stringify(courseDetails, null, 4)}</pre> */}
    </div>
  );
}
