import { Route, Routes } from "react-router-dom";
import Courses from "../Courses/Courses";
import Header from "../Header/Header";
import styles from "./App.module.css";
import Course from "../Course/Course";
import * as ls from "local-storage";
import { create } from "zustand";

export const useAppStore = create<{
  isSidePanelOpen: boolean;
  isAutoPlayEnabled: boolean;
  courseSearchText: string;
  setCourseSearchText: (value: string) => void;
  setIsSidePanelOpen: (isSidePanelOpen: boolean) => void;
  setIsAutoPlayEnabled: (autoPlay: boolean) => void;
}>((set) => ({
  isSidePanelOpen: ls.get("isSidePanelOpen") ?? true,
  isAutoPlayEnabled: ls.get("isAutoPlayEnabled") ?? true,
  courseSearchText: ls.get("courseSearchText") ?? "",
  setIsSidePanelOpen: (isSidePanelOpen: boolean) => {
    ls.set("isSidePanelOpen", isSidePanelOpen);
    set({ isSidePanelOpen });
  },
  setIsAutoPlayEnabled: (autoPlay: boolean) => {
    ls.set("isAutoPlayEnabled", autoPlay);
    set({ isAutoPlayEnabled: autoPlay });
  },
  setCourseSearchText: (courseSearchText: string) => {
    ls.set("courseSearchText", courseSearchText);
    set({ courseSearchText });
  },
}));

function App() {
  return (
    <div className={styles.coreWrapper}>
      <Header />
      <Routes>
        <Route path="/">
          <Route index element={<Courses />} />
          <Route path="courses" element={<Courses />} />
          <Route path="course/:courseName" element={<Course />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
