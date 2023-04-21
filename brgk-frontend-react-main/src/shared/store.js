import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./slices/userSlice";
import uiSlice from "./slices/uiSlice";
// import { createWrapper } from "next-redux-wrapper"

// const makeStore = () => {
//   return configureStore({
//     reducer: {
//       [userSlice.name]: userSlice.reducer
//     },
//     devTools: true
//   })
// }

// export const wrapper = createWrapper(makeStore)

export const store = configureStore({
  reducer: {
    [userSlice.name]: userSlice.reducer,
    [uiSlice.name]: uiSlice.reducer
  },
  devTools: true
});
