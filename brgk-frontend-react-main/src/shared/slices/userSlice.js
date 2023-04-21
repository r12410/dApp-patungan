import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    address: "",
    role: "",
    // isLoggedin: false,
    guestMode: false
  },
  reducers: {
    setUser(state, action) {
      state.address = action.payload.address;
      state.role = action.payload.role;
      state.isLoggedin = action.payload.isLoggedin;
    },
    setIsGuest(state, action) {
      state.guestMode = action.payload;
    }
  }
});

export default userSlice;
