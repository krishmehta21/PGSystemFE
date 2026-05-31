const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "pg_token";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const pgContextId = localStorage.getItem("pg_context_id");
  if (pgContextId) {
    headers.set("X-PG-ID", pgContextId);
  }

  // Automatically set Content-Type for JSON requests
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw { status: 408, message: "Request timed out — check your connection." };
    }
    throw { status: 500, message: err.message || "Network error" };
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && !path.includes("/auth/")) {
    localStorage.clear();
    window.location.href = "/login";
    return {} as T;
  }

  if (!response.ok) {
    let message = "An error occurred";
    try {
      const errorData = await response.json();
      
      // Handle FastAPI/Pydantic validation errors (array of objects)
      if (Array.isArray(errorData.detail)) {
        message = errorData.detail.map((err: any) => {
          const loc = err.loc ? err.loc.join('.') : '';
          return `${loc}: ${err.msg}`;
        }).join(', ');
      } else {
        message = errorData.detail || errorData.message || message;
      }
      
      // Ensure message is a string
      if (typeof message !== 'string') {
        message = JSON.stringify(message);
      }
    } catch (e) {
      // Fallback if response is not JSON
    }
    
    const error = {
      status: response.status,
      message,
    };
    throw error;
  }


  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

const get = <T>(path: string) => request<T>(path, { method: "GET" });

const post = <T>(path: string, body?: any) =>
  request<T>(path, {
    method: "POST",
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
  });

const patch = <T>(path: string, body?: any) =>
  request<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });

const put = <T>(path: string, body?: any) =>
  request<T>(path, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });

const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

export { get, post, patch, put, del as delete };
