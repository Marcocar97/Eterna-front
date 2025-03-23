import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice"; // Asegúrate de que este archivo existe

export const store = configureStore({
  reducer: {
    user: userReducer, // Agrega al menos un reducer
  },
});
