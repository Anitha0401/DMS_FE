import React, { useState } from 'react';
import './Login.scss';

interface LoginProps {
    onLogin: (userId: string, password: string) => void;
    isToShowAlert: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, isToShowAlert }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: any) => {
        e.preventDefault();
        setSubmitted(true);
        if (!userId || !password) {
            return;
        }
        if (onLogin) {
            onLogin(userId, password);
        }
    };

    return (<>
        <div className='containers loginDiv'>
            <div className='headerAlignCenter'>
                <h2>Company Name</h2>
            </div>
            {isToShowAlert && (
            <div className='alert loginShowAlert alert-danger'>
                Invalid UserID or Password!
            </div>
            )}
            <form name="form" className="form-horizontal rounded py-2 loginForm">
                <h2 className="dmTextAlignCenter">Login</h2>
                <div className="form-group pdg-btm-10">
                    <label className="control-label col-sm-4" htmlFor="userID">
                        &nbsp;User ID:
                    </label>
                    <div className="col-sm-12">
                        <input
                            type="text"
                            className={
                                "form-control" + (submitted && !userId ? " is-invalid" : "")
                            }
                            id="userID"
                            placeholder="Enter User ID"
                            name="userID"
                            onChange={e => setUserId(e.target.value)}
                            required
                        />
                        {submitted && !userId && (
                            <div className="invalid-feedback">User ID is required</div>
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <label className="control-label col-sm-4" htmlFor="pwd">
                        &nbsp;Password:
                    </label>
                    <div className="col-sm-12">
                        <input
                            type="password"
                            className={
                                "form-control" + (submitted && !password ? " is-invalid" : "")
                            }
                            autoComplete="password"
                            id="pwd"
                            placeholder="Enter password"
                            name="passWord"
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        {submitted && !password && (
                            <div className="invalid-feedback">password is required</div>
                        )}
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-sm-12" style={{ textAlign: 'center' }}>
                        <button className="btn btn-info mgn-top-10" onClick={(e) => handleSubmit(e)}>
                            Login
                        </button>
                    </div>
                </div>
            </form>
        </div></>
    );
};

export default Login;