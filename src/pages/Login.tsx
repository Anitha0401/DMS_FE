import React, { useState } from 'react';
import './Login.scss';
import { COMPANY_NAME } from '../config/appConfig';

interface LoginProps {
    onLogin: (userId: string, password: string) => void | Promise<void>;
    isToShowAlert: boolean;
    alertText?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, isToShowAlert, alertText }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [busy, setBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        if (!userId || !password) return;
        setBusy(true);
        try {
            await onLogin(userId, password);
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="login-page">
            <form className="login-card" onSubmit={handleSubmit} noValidate>
                <div className="login-brand">
                    <img src="/logo.png" alt="" />
                    <div>
                        <div className="login-company">{COMPANY_NAME}</div>
                        <div className="login-product">Document Management System</div>
                    </div>
                </div>

                <h1 className="login-title">Sign in</h1>

                {isToShowAlert && (
                    <div className="login-alert" role="alert">
                        <i className="pi pi-exclamation-circle" /> {alertText ?? 'Invalid user ID or password.'}
                    </div>
                )}

                <label htmlFor="userID">User ID</label>
                <input
                    id="userID"
                    name="userID"
                    type="text"
                    autoComplete="username"
                    className={'form-control' + (submitted && !userId ? ' is-invalid' : '')}
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoFocus
                />
                {submitted && !userId && <div className="invalid-feedback">User ID is required</div>}

                <label htmlFor="pwd">Password</label>
                <input
                    id="pwd"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className={'form-control' + (submitted && !password ? ' is-invalid' : '')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {submitted && !password && <div className="invalid-feedback">Password is required</div>}

                <button type="submit" className="login-button" disabled={busy}>
                    {busy ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </main>
    );
};

export default Login;
