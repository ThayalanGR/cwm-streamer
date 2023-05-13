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
  volume: number;
  setCourseSearchText: (value: string) => void;
  setIsSidePanelOpen: (isSidePanelOpen: boolean) => void;
  setIsAutoPlayEnabled: (autoPlay: boolean) => void;
  setVolume: (volume: number) => void;
}>((set) => ({
  isSidePanelOpen: ls.get("isSidePanelOpen") ?? true,
  isAutoPlayEnabled: ls.get("isAutoPlayEnabled") ?? true,
  courseSearchText: ls.get("courseSearchText") ?? "",
  volume: ls.get("volume") ?? 1,
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
          <Route
            path="*"
            element={<div>Content your are looking for is not found!</div>}
          />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
