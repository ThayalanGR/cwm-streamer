import { Link, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import { useMemo } from "react";
import { useAppStore } from "../App/App";
import ToggleButton from "react-toggle-button";

function Header() {
  // hooks
  const location = useLocation();
  const hasSidePanel = useMemo(
    () => location.pathname.includes("/course"),
    [location]
  );

  const isSidePanelOpen = useAppStore((state) => state.isSidePanelOpen);
  const isAutoPlayEnabled = useAppStore((state) => state.isAutoPlayEnabled);
  const courseSearchText = useAppStore((state) => state.courseSearchText);
  const toggleSidePanel = useAppStore((state) => state.setIsSidePanelOpen);
  const setCourseSearchText = useAppStore((state) => state.setCourseSearchText);
  const setIsAutoPlayEnabled = useAppStore(
    (state) => state.setIsAutoPlayEnabled
  );

  // actions
  const onSidePanelToggle = () => {
    toggleSidePanel(!isSidePanelOpen);
  };

  return (
    <div className={styles.wrapper}>
      {hasSidePanel && (
        <button className={styles.hamburger} onClick={onSidePanelToggle}>
          &equiv;
        </button>
      )}
      <Link to="/">
        <h1 className={styles.logo}>CWM Streamer</h1>
      </Link>

      {hasSidePanel ? (
        <div className={styles.autoPlayWrapper}>
          <div>Autoplay</div>
          <ToggleButton
            value={isAutoPlayEnabled}
            onToggle={(value) => setIsAutoPlayEnabled(!value)}
            colors={{
              active: {
                base: "#646cff",
              },
            }}
          />
        </div>
      ) : (
        <input
          className={styles.searchInput}
          type="text"
          autoFocus
          value={courseSearchText}
          onChange={(e) => setCourseSearchText(e.target.value)}
          placeholder="Search for Courses"
        />
      )}
    </div>
  );
}

export default Header;
