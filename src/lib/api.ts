const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '' : 'https://roadmap-api-se84.onrender.com');
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function handleError(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch (e) {
      // Ignored
    }
    throw new Error(message);
  }
}

async function fetchWithRefresh(url: string, options: RequestInit): Promise<any> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, options);


  if (res.status === 403) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshRes.ok) {
            const { token: newToken, refreshToken: newRefreshToken } = await refreshRes.json();
            localStorage.setItem('token', newToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            isRefreshing = false;
            onTokenRefreshed(newToken);
          } else {
            isRefreshing = false;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // We can't easily redirect without potentially breaking React flow, 
            // but clearing storage will force re-auth on next check or reload.
            // window.location.reload(); // Option to force reload
            throw new Error('Session expired');
          }
        } catch (err) {
          isRefreshing = false;
          throw err;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token: string) => {
          const newHeaders = new Headers(options.headers);
          newHeaders.set('Authorization', `Bearer ${token}`);
          resolve(fetchWithRefresh(url, { ...options, headers: newHeaders }));
        });
      });
    }
  }

  await handleError(res);
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  async get(url: string, token: string | null) {
    return fetchWithRefresh(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  },
  async post(url: string, data: any, token: string | null) {
    return fetchWithRefresh(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
  },
  async put(url: string, data: any, token: string | null) {
    return fetchWithRefresh(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
  },
  async delete(url: string, token: string | null) {
    return fetchWithRefresh(url, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  }
};
