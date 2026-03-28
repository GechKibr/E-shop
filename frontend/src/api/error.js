export const getApiErrorMessage = (error, fallback = "Something went wrong") => {
  const data = error?.response?.data;
  if (typeof data === "string") {
    return data;
  }
  if (data?.detail) {
    return data.detail;
  }
  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    const value = data[firstKey];
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }
    if (typeof value === "string") {
      return value;
    }
  }
  return fallback;
};
