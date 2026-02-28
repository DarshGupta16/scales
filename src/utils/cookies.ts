import { parse, serialize } from "cookie-es";

const LOCAL_READY_COOKIE = "scales_local_ready";

export const getLocalReadyCookie = (cookieHeader?: string | null) => {
  if (typeof window !== "undefined") {
    const cookies = parse(document.cookie);
    return cookies[LOCAL_READY_COOKIE] === "true";
  }
  if (cookieHeader) {
    const cookies = parse(cookieHeader);
    return cookies[LOCAL_READY_COOKIE] === "true";
  }
  return false;
};

export const setLocalReadyCookie = (ready: boolean) => {
  if (typeof window !== "undefined") {
    document.cookie = serialize(LOCAL_READY_COOKIE, String(ready), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
};
