import callApi from "@/utils/api";

const API_URL_USER =
  process.env.API_URL_USER || "https://api.sfcinemacity.com/userapidev";

export async function login(payload: { username: string; password: string }) {
  return await callApi.post(`${API_URL_USER}/Auth`, {
    body: JSON.stringify(payload),
  });
}

export async function fetchUserInfo(token: string) {
  try {
    const res = await callApi.get(`${API_URL_USER}/User`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // 401 Unauthorized handling
    if (res.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      return null;
    }
    return res;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}
