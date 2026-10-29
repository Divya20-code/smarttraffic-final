

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const STORAGE_KEY = "smartTrafficTheme";

const readTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(readTheme);

  // Theme yaad rakho (refresh ke baad bhi wahi rahe)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // storage band ho to ignore
    }

    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark: theme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);