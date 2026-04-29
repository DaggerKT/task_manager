const callApi = {
  async get(url: string, options?: RequestInit) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  },
  async post(url: string, options?: RequestInit) {
    // get token จาก cookie แล้วใส่ใน header (ถ้ามี)
    const token = localStorage.getItem("accessToken");
    if (token) {
      options = {
        ...options,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  },
};

export default callApi;
