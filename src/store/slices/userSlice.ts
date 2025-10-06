import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    id: string | null;
    name: string;
    email: string;
    loggedIn: boolean;
    isToShowAlert: boolean;
    user: string | null;
}

const initialState: UserState = {
    id: null,
    name: '',
    email: '',
    loggedIn: false,
    isToShowAlert: false,
    user: null,
};

const userSlice = createSlice({
    name: 'userInfo',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<string | null>) => {
            state.user = action.payload;
        },
        setLoggedIn: (state, action: PayloadAction<boolean>) => {
            state.loggedIn = action.payload;
        },
        setShowAlert: (state, action: PayloadAction<boolean>) => {
            state.isToShowAlert = action.payload;
        },
        login(state, action: PayloadAction<{ id: string; name: string; email: string }>) {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.loggedIn = true;
        },
        logout(state) {
            state.id = null;
            state.name = '';
            state.email = '';
            state.loggedIn = false;
        },
        updateProfile(state, action: PayloadAction<{ name?: string; email?: string }>) {
            if (action.payload.name !== undefined) {
                state.name = action.payload.name;
            }
            if (action.payload.email !== undefined) {
                state.email = action.payload.email;
            }
        },
    },
});

export const { login, logout, updateProfile, setUser, setLoggedIn, setShowAlert } = userSlice.actions;
export default userSlice.reducer;