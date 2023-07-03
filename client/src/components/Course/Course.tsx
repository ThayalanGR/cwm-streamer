import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import styles from "./Course.module.css";
import MasterCourseService from "../../services/MasterCourse.service";
import CourseSidePane from "../CourseSidePane/CourseSidePane";
import CourseContentOrchestrator from "../CourseContentOrchestrator/CourseContentOrchestrator";
import { ICourse } from "../../typings/typings";
import { useAppStore } from "../App/App";

export type TCourseParams = {
    courseName: string;
};

export interface ICourseActiveContent {
    courseName: string;
    section: string;
    content: string;
}

export default function Course() {
    // hooks
    const params = useParams<TCourseParams>();
    const [searchParams] = useSearchParams();
    const masterCourseService = useMemo(MasterCourseService.getInstance, []);
    const currentActiveContent = useMemo<ICourseActiveContent>(() => {
        const section = searchParams.get("section") ?? "";
        const content = searchParams.get("content") ?? "";
        const courseName = params.courseName ?? "";
        return { section, content, courseName };
    }, [params, searchParams]);
    const courseDetails = useMemo(
        () =>
            masterCourseService.getCourse(
                currentActiveContent.courseName as string
            ),
        [currentActiveContent]
    );
    const isValidContent = useMemo(
        () => masterCourseService.checkIsValidContent(currentActiveContent),
        [currentActiveContent]
    );

    // compute
    const course = courseDetails?.name;
    const hasContent =
        course &&
        currentActiveContent.section &&
        currentActiveContent.content &&
        isValidContent;
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
