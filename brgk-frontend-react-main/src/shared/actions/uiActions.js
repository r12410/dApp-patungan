import uiSlice from "../slices/uiSlice";

const uiActions = uiSlice.actions;

export const setSidebar = (payload, dispatch) => {
  dispatch(uiActions.setSidebar(payload));
};
