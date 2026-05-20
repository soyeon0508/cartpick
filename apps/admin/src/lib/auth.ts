import Cookies from 'js-cookie';

const REFRESH_TOKEN_KEY = 'admin_refresh_token';

export const authStorage = {
  setRefreshToken(token: string) {
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  },

  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  },

  removeRefreshToken() {
    Cookies.remove(REFRESH_TOKEN_KEY);
  },
};

// Access token is stored in memory only
let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const clearTokens = () => {
  accessToken = null;
  authStorage.removeRefreshToken();
};