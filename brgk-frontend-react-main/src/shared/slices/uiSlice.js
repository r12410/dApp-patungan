import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebar: {
      left: false,
      top: false
    }
    // add others ...
  },
  reducers: {
    setSidebar(state, action) {
      state.sidebar = action.payload;
    }
  }
});

export default uiSlice;
