import { jwtDecode } from "jwt-decode";

export function decodeToken(token) {
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
}
