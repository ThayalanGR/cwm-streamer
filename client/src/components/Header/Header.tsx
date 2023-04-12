import { Link } from "react-router-dom";
import styles from "./Header.module.css";

function Header() {
  return (
    <div className={styles.wrapper}>
      <Link to="/">
        <h1 className={styles.logo}>CWM Streamer</h1>
      </Link>
    </div>
  );
}

export default Header;
