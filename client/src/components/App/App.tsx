import {
    Route,
    Routes,
    useLocation,
    useMatch,
    useNavigate,
    useParams,
    useRoutes,
    useSearchParams,
} from "react-router-dom";
import Courses from "../Courses/Courses";
import Header from "../Header/Header";
import styles from "./App.module.css";
import Course, { ICourseActiveContent, TCourseParams } from "../Course/Course";
import * as ls from "local-storage";
import { create } from "zustand";
import { useEffect, useLayoutEffect, useMemo } from "react";
import MasterCourseService from "../../services/MasterCourse.service";

export const useAppStore = create<{
    isSidePanelOpen: boolean;
    isAutoPlayEnabled: boolean;
    courseSearchText: string;
    volume: number;
    lastKnownRoute: string;
    setCourseSearchText: (value: string) => void;
    setIsSidePanelOpen: (isSidePanelOpen: boolean) => void;
    setIsAutoPlayEnabled: (autoPlay: boolean) => void;
    setVolume: (volume: number) => void;
    setLastKnownRoute: (lastKnownRoute: string) => void;
}>((set) => ({
    isSidePanelOpen: ls.get("isSidePanelOpen") ?? true,
    isAutoPlayEnabled: ls.get("isAutoPlayEnabled") ?? true,
    courseSearchText: ls.get("courseSearchText") ?? "",
    volume: ls.get("volume") ?? 1,
    lastKnownRoute: ls.get("lastKnownRoute") ?? "",
    setVolume: (volume) => {
        ls.set("volume", volume);
        set({ volume });
    },
    setIsSidePanelOpen: (isSidePanelOpen) => {
        ls.set("isSidePanelOpen", isSidePanelOpen);
        set({ isSidePanelOpen });
    },
    setIsAutoPlayEnabled: (autoPlay) => {
        ls.set("isAutoPlayEnabled", autoPlay);
        set({ isAutoPlayEnabled: autoPlay });
    },
    setCourseSearchText: (courseSearchText) => {
        ls.set("courseSearchText", courseSearchText);
        set({ courseSearchText });
    },
    setLastKnownRoute(lastKnownRoute) {
        ls.set("lastKnownRoute", lastKnownRoute);
        set({ lastKnownRoute });
    },
}));

function App() {
    // hooks
    const location = useLocation();
    const matchParams = useMatch("/course/:courseName/*");
    const navigate = useNavigate();
    const params = useParams<TCourseParams>();
    const [searchParams] = useSearchParams();
    const masterCourseService = useMemo(
        () => MasterCourseService.getInstance(),
        []
    );

    // state
    const currentActiveContent = useMemo<ICourseActiveContent>(() => {
        const section = searchParams.get("section") ?? "";
        const content = searchParams.get("content") ?? "";
        const courseName = matchParams?.params?.courseName ?? "";
        return { courseName, section, content };
    }, [params, searchParams]);
    const lastKnownRoute = useAppStore((state) => state.lastKnownRoute);
    const setLastKnownRoute = useAppStore((state) => state.setLastKnownRoute);

    // effects
    useEffect(() => {
        const currentRoute = location.pathname + location.search;
        if (lastKnownRoute !== currentRoute) {
            navigate(lastKnownRoute);
        }
    }, []);

    useEffect(() => {
        if (location) {
            const newLastKnownRoute = location.pathname + location.search;
            const isValidContent =
                masterCourseService.checkIsValidContent(currentActiveContent);
            if (lastKnownRoute !== newLastKnownRoute && isValidContent)
                setLastKnownRoute(newLastKnownRoute);
        }
    }, [currentActiveContent]);

    // paint
    return (
        <div className={styles.coreWrapper}>
            <Header />
            <Routes>
                <Route path="/">
                    <Route index element={<Courses />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="course/:courseName" element={<Course />} />
                    <Route
                        path="*"
                        element={
                            <div>
                                Content your are looking for is not found!
                            </div>
                        }
                    />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
