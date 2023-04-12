import { Route, Routes } from "react-router-dom";
import Courses from "../Courses/Courses";
import Header from "../Header/Header";
import styles from "./App.module.css";
import Course from "../Course/Course";

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
