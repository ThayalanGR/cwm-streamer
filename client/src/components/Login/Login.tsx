import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    const handleSSO = () => {
        // Implement SSO logic here
        // For now, we'll just simulate a successful login
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/');
    };

    return (
        <div className={styles.loginWrapper}>
            <h1>CWM Streamer</h1>
            <button onClick={handleSSO} className={styles.ssoButton}>
                Login with SSO
            </button>
        </div>
    );
}