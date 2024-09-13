import React from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/authConfig';
import styles from './Login.module.css';

export default function Login() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest)
      .catch(error => {
        console.error('Error during login:', error);
      });
  };

  return (
    <div className={styles.loginWrapper}>
      <h1>CWM Streamer</h1>
      <button onClick={handleLogin} className={styles.ssoButton}>
        Login with Microsoft 365
      </button>
    </div>
  );
}