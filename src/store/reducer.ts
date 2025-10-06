import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import appReducer from "./slices/appSlice";

const rootReducer = combineReducers({
  userInfo: userReducer,
  appInfo: appReducer,
});
export default rootReducer;