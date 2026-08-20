import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

import * as Sentry from "@sentry/browser";
export interface AuthState {
  token: boolean;
  participant_id: number | string;
  pin: number | string;
  loggedOut?: boolean;
}

const initialState: AuthState = {
  token: false,
  participant_id: 0,
  pin: 0,
  loggedOut: false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<AuthState>) => {},
    logout: (state) => {}
  }
});

export const authToken = (state: { auth: AuthState }) => state.auth;

export const { login, logout } = authSlice.actions;

export default authSlice.reducer;
