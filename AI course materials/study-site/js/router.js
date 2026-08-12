// router.js — tiny hash router. No build step, no framework: just enough
// routing to switch views and pass a param (usually a moduleId) to each.

const routes = [];

function on(pattern, handler) {
  // pattern like "#/flashcards/:moduleId" or "#/dictionary"
  const paramNames = [];
  const regexStr = pattern.replace(/:[^/]+/g, (m) => {
    paramNames.push(m.slice(1));
    return "([^/]+)";
  });
  const regex = new RegExp("^" + regexStr + "$");
  routes.push({ regex, paramNames, handler });
}

function resolve() {
  const hash = window.location.hash || "#/";
  for (const r of routes) {
    const match = hash.match(r.regex);
    if (match) {
      const params = {};
      r.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
      r.handler(params);
      return;
    }
  }
  // fallback: no match -> home
  window.location.hash = "#/";
}

function start() {
  window.addEventListener("hashchange", resolve);
  resolve();
}

function navigate(hash) {
  window.location.hash = hash;
}

export const Router = { on, start, navigate };
