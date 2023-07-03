import React, { useMemo } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import styles from "./Course.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import CourseSidePane from "../CourseSidePane/CourseSidePane";
import CourseContentOrchestrator from "../CourseContentOrchestrator/CourseContentOrchestrator";

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
    const currentActiveContent = useMemo<{
        section: string;
        content: string;
    }>(() => {
        const section = searchParams.get("section") ?? "";
        const content = searchParams.get("content") ?? "";
        return { section, content };
    }, [searchParams]);

    // compute
    const course = courseDetails?.name;
    const hasContent =
        course && currentActiveContent.section && currentActiveContent.content;
    const defaultContentPath =
        masterCourseService.getDefaultContentPath(courseDetails);

    // paint
    if (!courseDetails) return <div>Loading...</div>;

    if (!hasContent) return <Navigate to={defaultContentPath} />;

    return (
        <div className={styles.wrapper}>
            <CourseSidePane
                courseDetails={courseDetails}
                currentActiveContent={currentActiveContent}
            />
            <CourseContentOrchestrator
                course={course}
                section={currentActiveContent.section}
                content={currentActiveContent.content}
            />
        </div>
    );
}
