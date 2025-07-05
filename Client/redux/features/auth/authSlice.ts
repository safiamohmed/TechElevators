import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: "",
  user: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userRegistration: (state, action: PayloadAction<{ token: string }>) => {
      state.token = action.payload.token;
    },
    userLoggedIn: (
      state,
      action: PayloadAction<{ accessToken: string; user: string }>
    ) => {
      state.token = action.payload.accessToken;
      state.user = action.payload.user;
    },
    userLoggedOut: (state) => {
      state.token = "";
      state.user = "";
    },
    passwordResetLinkSent: (state, action: PayloadAction<{ email: string }>) => {
      // يمكنك تخزين البريد الإلكتروني هنا بعد إرسال رابط إعادة تعيين كلمة المرور
      console.log("Reset link sent to: ", action.payload.email);
    },
    passwordUpdated: (state) => {
      // يمكن إضافة حالة لتحديث كلمة المرور هنا
      console.log("Password successfully updated!");
    },
  },
});

export const { 
  userRegistration, 
  userLoggedIn, 
  userLoggedOut, 
  passwordResetLinkSent, 
  passwordUpdated 
} = authSlice.actions;

export default authSlice.reducer;
