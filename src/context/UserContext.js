


import { createContext } from "react";

const UserContext = createContext({
  user: null,
  setUser: () => {},
  updateUser: () => {},
  reports: [],
  setReports: () => {},
  addReport: () => {},
  fetchReports: async () => {},
  refreshReports: async () => {},
  reportsLoading: false,
  reportsError: "",
  logoutUser: () => {},
});

export default UserContext;