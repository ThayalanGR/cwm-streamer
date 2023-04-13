import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./Courses.module.css";
import MasterCourseService from "../../services/MasterCourse.service";

export default function Courses() {
  const masterCourseService = useMemo(MasterCourseService.getInstance, []);
  const courses = useMemo(() => masterCourseService.getAllCourses(), []);

  const getPath = (courseName: string) =>
    `/course/${masterCourseService.getEncodedString(courseName)}`;

  return (
    <div className={styles.wrapper}>
      {courses.map((course) => (
        <Link
          key={course.name}
          className={styles.courseCard}
          to={getPath(course.name)}
        >
          {course.name}
        </Link>
      ))}
    </div>
  );
}
