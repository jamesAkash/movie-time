import { useEffect, useState } from "react";

const useLocalStorageState = (initialState, key) => {
  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key)
      ? JSON.parse(localStorage.getItem(key))
      : initialState;
    return storedValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
};

export { useLocalStorageState };
