import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./Courses.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import { useAppStore } from "../App/App";

export default function Courses() {
    // state
    const courseSearchText = useAppStore((state) => state.courseSearchText);

    // hooks
    const masterCourseService = useMemo(MasterCourseService.getInstance, []);
    const courses = useMemo(() => masterCourseService.getAllCourses(), []);
    const filteredCourses = useMemo(() => {
        if (courseSearchText.length === 0) return courses;
        return courses.filter((course) =>
            course.name.toLowerCase().includes(courseSearchText.toLowerCase())
        );
    }, [courseSearchText]);

    const getPath = (courseName: string) =>
        `/course/${masterCourseService.getEncodedString(courseName)}`;

    return (
        <div className={styles.wrapper}>
            {filteredCourses.length === 0 && (
                <div className={styles.noCourseFoundContainer}>
                    No Courses found! <br />
                    (Try searching with different keywords)
                </div>
            )}
            <div className={styles.coursesWrapper}>
                {filteredCourses.map((course) => (
                    <Link
                        key={course.name}
                        className={styles.courseCard}
                        to={getPath(course.name)}
                    >
                        {course.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}
