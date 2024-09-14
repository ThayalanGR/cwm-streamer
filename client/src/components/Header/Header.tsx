import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import styles from "./Header.module.css";
import { useMemo } from "react";
import { useAppStore } from "../App/App";
import ToggleButton from "react-toggle-button";
import { useMsal } from "@azure/msal-react";

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
    const setCourseSearchText = useAppStore(
        (state) => state.setCourseSearchText
    );
    const setIsAutoPlayEnabled = useAppStore(
        (state) => state.setIsAutoPlayEnabled
    );
    const navigate = useNavigate();
    const { instance } = useMsal();

    // actions
    const onSidePanelToggle = () => {
        toggleSidePanel(!isSidePanelOpen);
    };

    const onLogoClick = () => {
        setCourseSearchText("");
    };

    const handleLogout = () => {
        instance.logoutRedirect().catch(e => {
            console.error(e);
        });
    };

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                {hasSidePanel && (
                    <button
                        className={styles.hamburger}
                        onClick={onSidePanelToggle}
                    >
                        &equiv;
                    </button>
                )}
                <Link to="/" onClick={onLogoClick}>
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
                <button className={styles.logoutButton} onClick={handleLogout}>
                    Logout
                </button>
            </header>
            <main className={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
}

export default Header;
