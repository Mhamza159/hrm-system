import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice.js';
import { baseApi } from '../lib/baseApi.js';

const appReducer = combineReducers({
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // When logging out, completely reset the entire state to initial values
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware)
});

// Phase 41: Activate global lifecycle auto-refetch listeners (focus, network reconnect)
setupListeners(store.dispatch);

if (typeof window !== 'undefined') { window.store = store; }
