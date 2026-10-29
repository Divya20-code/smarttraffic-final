


// Har API call ke saath JWT token jodta hai, aur
// "http://localhost:5000" ko asli backend URL se badal deta hai (deploy ke liye).

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const LOCAL_ORIGIN = "http://localhost:5000";

const originalFetch = window.fetch.bind(window);

// Kaun sa token try karna hai (pehla jo localStorage mein mile)
const tokenCandidates = (path) => {
  if (path.startsWith("/api/admin/")) return ["adminToken"];

  const page = window.location.pathname;

  if (page.startsWith("/admin")) return ["adminToken"];
  if (page.startsWith("/authority")) return ["authorityToken", "adminToken"];

  return ["citizenToken", "authorityToken", "adminToken"];
};

const clearSession = (tokenKey) => {
  localStorage.removeItem(tokenKey);

  if (tokenKey === "adminToken") localStorage.removeItem("adminUser");
  if (tokenKey === "authorityToken") localStorage.removeItem("authorityUser");
  if (tokenKey === "citizenToken") {
    localStorage.removeItem("smartTrafficCurrentUser");
  }
};

const loginPageFor = (tokenKey) => {
  if (tokenKey === "adminToken") return "/admin-login";
  if (tokenKey === "authorityToken") return "/authority-login";
  return "/login";
};

window.fetch = async (input, init = {}) => {
  let url =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.href
      : "";

  // localhost wala address deploy ke time asli backend URL ban jata hai
  if (url.startsWith(LOCAL_ORIGIN) && API_ORIGIN !== LOCAL_ORIGIN) {
    url = API_ORIGIN + url.slice(LOCAL_ORIGIN.length);
    input = url;
  }

  const isApiCall = url.startsWith(`${API_ORIGIN}/api/`);
  const path = isApiCall ? url.slice(API_ORIGIN.length) : "";
  const isPublic = path.includes("/login") || path.includes("/register");

  if (!isApiCall || isPublic) {
    return originalFetch(input, init);
  }

  const tokenKey = tokenCandidates(path).find((key) =>
    localStorage.getItem(key)
  );
  const token = tokenKey ? localStorage.getItem(tokenKey) : "";

  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await originalFetch(input, { ...init, headers });

  // Token expire ya galat: session saaf karke login page par bhejo
  if (response.status === 401 && token) {
    clearSession(tokenKey);
    window.location.href = loginPageFor(tokenKey);
  }

  return response;
};