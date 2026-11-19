export const url = "http://localhost:3000";
const TIMEOUT_MS = 8000;

function makeError(type, status, message) {
  return { type, status, message };
}

function httpMessage(status) {
  if (status === 404) {
    return "element doesnt exist";
  }
  if (status >= 500) {
    return "server run into a problem , try again later";
  }
  return `request failed (error ${status}).`;
}

export async function request(path, { method = "GET", body } = {}) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw makeError("offline", 0, "Check your network.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw makeError("timeout", 0, "server took too long to respond");
    }
    throw makeError("network", 0, "server not available check again later");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw makeError("http", res.status, httpMessage(res.status));
  }

  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    throw makeError("parse", res.status, "data not readable");
  }
}
