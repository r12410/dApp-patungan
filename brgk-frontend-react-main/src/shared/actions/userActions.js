import userSlice from "../slices/userSlice";

const userActions = userSlice.actions;

export const setUser = (payload, dispatch) => {
  dispatch(userActions.setUser(payload));
};

/**
 * Set guest mode
 * @param {boolean} payload
 * @param {ThunkDispatch} dispatch
 */
export const setIsGuest = (payload, dispatch) => {
  if (payload == true) {
    localStorage.setItem("isGuest", "true");
    dispatch(userActions.setIsGuest(payload));
    dispatch(
      userActions.setUser({
        role: "guest"
      })
    );
  } else {
    localStorage.removeItem("isGuest");
    dispatch(userActions.setIsGuest(false));
    dispatch(
      userActions.setUser({
        role: ""
      })
    );
  }
};
