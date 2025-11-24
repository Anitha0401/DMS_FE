import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setLoggedIn, setShowAlert } from '../store/slices/userSlice';
import Login from './Login';
import Dashboard from '../components/Dashboard/Dashboard';
import dmsLifecycleService from '../services/DMSLifecycleService';

const LandingPage: React.FC = () => {
    const dispatch = useDispatch();
    const userInfo = useSelector((state: RootState) => state.userInfo);
    const [token, setToken] = React.useState<string | null>(null);

    // useEffect(() => {
    //     const fetchToken = async () => {
    //         const token = await dmsLifecycleService.getToken();
    //         console.log('Token:', token);
    //         if (token) {
    //             setToken(token['RequestToken']);
    //             Cookies.set('XSRF-TOKEN', token['RequestToken'], {
    //                 // expires: 1, // Set the cookie to expire in 1 day
    //                 secure: true, // Use secure cookies if your site is served over HTTPS
    //                 sameSite: 'Strict'
    //             }); // Store the token in cookies
    //             dispatch(setUser(token['User']));
    //         }
    //     }
    //     fetchToken();
    // }, []);

    const handleLogin = async (userId: string, password: string) => {
        try {
            dispatch(setShowAlert(false));
           
           const loginInfo = { userId, password };
           const isLoginSuccessful = await dmsLifecycleService.postApiCall('Login', loginInfo);

            if (isLoginSuccessful) {
                dispatch(setLoggedIn(isLoginSuccessful));
                dispatch(setShowAlert(false));
            } 
            else {
                dispatch(setShowAlert(true));
            }
        } catch (error) {
            console.error('Login failed:', error);
            dispatch(setShowAlert(true));
        }
    };

    return (
        <div>
            {!userInfo.loggedIn &&
                <div>
                    <Login onLogin={handleLogin} isToShowAlert={userInfo.isToShowAlert} />
                </div>
            }
            {userInfo.loggedIn && (
                <Dashboard userId={userInfo.id ?? 'TestUser13'} />
            )}
        </div>
    );
};

export default LandingPage;