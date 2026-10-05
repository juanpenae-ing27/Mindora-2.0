/* =========================================================
   MINDORA - Inicio de sesión
   Sistema de cuentas en localStorage (demo, sin backend).
   Se incluye en todas las páginas: agrega al menú el botón
   "Iniciar sesión" o, con sesión activa, el nombre y "Salir".

   API: MindoraAuth.register / login / logout / currentUser
========================================================= */
(function (global) {
  "use strict";

  const USERS_KEY = "mindora_users";
  const SESSION_KEY = "mindora_session";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  async function hash(password, salt) {
    const data = new TextEncoder().encode(salt + ":" + password);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const normEmail = (e) => String(e || "").trim().toLowerCase();

  async function register(name, email, password) {
    name = String(name || "").trim();
    email = normEmail(email);
    if (name.length < 2) return { error: "Escribe tu nombre." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Correo no válido." };
    if (String(password).length < 6) return { error: "La contraseña debe tener al menos 6 caracteres." };

    const users = read(USERS_KEY, {});
    if (users[email]) return { error: "Ya existe una cuenta con ese correo." };

    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    users[email] = { name: name, email: email, salt: salt, hash: await hash(password, salt) };
    if (!write(USERS_KEY, users)) return { error: "No se pudo guardar la cuenta." };
    write(SESSION_KEY, { name: name, email: email });
    return { ok: true };
  }

  async function login(email, password) {
    email = normEmail(email);
    const user = read(USERS_KEY, {})[email];
    if (!user || user.hash !== await hash(password, user.salt))
      return { error: "Correo o contraseña incorrectos." };
    write(SESSION_KEY, { name: user.name, email: user.email });
    return { ok: true };
  }

  function logout() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function currentUser() { return read(SESSION_KEY, null); }

  // ---- Menú de cada pestaña ----
  // Sin sesión: se muestra el menú público + botón "Iniciar sesión".
  // Con sesión: el menú se reemplaza por las 3 secciones del panel.
  const PANEL_LINKS = [
    ["Estadísticas", "admin.html#estadisticas", "estadisticas"],
    ["Compartimentos", "admin.html#compartimentos", "compartimentos"],
    ["Sensores", "admin.html#sensores", "sensores"]
  ];

  function injectNavButton() {
    const ul = document.querySelector(".navbar .navbar-nav");
    if (!ul || ul.querySelector("[data-auth]")) return;

    const user = currentUser();
    const li = document.createElement("li");
    li.className = "nav-item d-flex align-items-center ms-lg-2";
    li.setAttribute("data-auth", "");

    if (user) {
      ul.textContent = "";
      PANEL_LINKS.forEach(([label, href, view]) => {
        const item = document.createElement("li");
        item.className = "nav-item";
        const a = document.createElement("a");
        a.className = "nav-link";
        a.href = href;
        a.dataset.view = view;
        a.textContent = label;
        item.appendChild(a);
        ul.appendChild(item);
      });
      const brand = document.querySelector(".navbar-brand");
      if (brand) brand.href = "admin.html";

      const name = document.createElement("span");
      name.className = "small text-muted me-2";
      name.textContent = "Hola, " + user.name.split(" ")[0];
      const out = document.createElement("button");
      out.className = "btn btn-outline-secondary btn-sm";
      out.textContent = "Cerrar sesión";
      out.onclick = () => { logout(); location.href = "logging.html"; };
      li.append(name, out);
    } else {
      const a = document.createElement("a");
      a.className = "btn btn-primary btn-sm";
      a.href = "logging.html";
      a.textContent = "Iniciar sesión";
      li.appendChild(a);
    }
    ul.appendChild(li);
  }

  document.addEventListener("DOMContentLoaded", injectNavButton);

  global.MindoraAuth = { register, login, logout, currentUser };
})(window);
