import "./config.js";
import { getEventData } from "./database.js";
import { onValue, ref } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

const eventId = window.config?.event?.defaultEventId || "anthonycarolina2026";
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const normalizeStatus = (response) => response?.respuesta === "SI" ? "confirmado" : response?.respuesta === "NO" ? "no_asistira" : response?.respuesta || "pendiente";
const formatDate = (value) => { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("es-GT", { dateStyle: "short", timeStyle: "short" }).format(date); };

const [guestData, rsvpData] = await Promise.all([getEventData("invitados"), getEventData("rsvp")]);
let entries = Object.values(guestData || {}).filter(Boolean).map((guest) => ({ guest, response: rsvpData?.[`${eventId}_${guest.id}`] || rsvpData?.[guest.id] }));
const statusLabel = (status) => ({ confirmado: "Confirmado", no_asistira: "No asistirá", pendiente: "Pendiente" }[status] || status);
const confirmed = entries.filter((entry) => normalizeStatus(entry.response) === "confirmado");
const declined = entries.filter((entry) => normalizeStatus(entry.response) === "no_asistira");
document.getElementById("total-guests").textContent = entries.length;
document.getElementById("attendee-count").textContent = confirmed.reduce((sum, entry) => sum + Number(entry.response?.cantidad || 0), 0);
document.getElementById("confirmed-count").textContent = confirmed.length;
document.getElementById("pending-count").textContent = entries.length - confirmed.length - declined.length;
document.getElementById("declined-count").textContent = declined.length;
document.getElementById("summary").textContent = `${entries.length} invitaciones · ${confirmed.length} confirmaciones recibidas`;
const render = () => {
  const query = document.getElementById("search").value.trim().toLowerCase();
  const filter = document.getElementById("status-filter").value;
  const rows = entries.filter(({ guest, response }) => { const status = normalizeStatus(response); return String(guest.nombre || "").toLowerCase().includes(query) && (filter === "todos" || status === filter); });
  document.getElementById("empty").hidden = rows.length > 0;
  document.getElementById("rows").innerHTML = rows.map(({ guest, response }) => { const status = normalizeStatus(response); return `<tr><td data-label="Invitado">${escapeHtml(guest.nombre)}</td><td data-label="Pases">${guest.pases ?? "Libre"}</td><td data-label="Estado"><span class="status ${status}">${statusLabel(status)}</span></td><td data-label="Confirmados">${response?.cantidad ?? "-"}</td><td data-label="Fecha y hora">${formatDate(response?.actualizadoEn || response?.timestamp || response?.fecha)}</td></tr>`; }).join("");
};
document.getElementById("search").addEventListener("input", render);
document.getElementById("status-filter").addEventListener("change", render);
render();
onValue(ref(window.firebaseDb, `eventos/${eventId}/invitados`), (snapshot) => {
  entries = Object.values(snapshot.val() || {}).filter(Boolean).map((guest) => ({ guest, response: rsvpData?.[`${eventId}_${guest.id}`] || rsvpData?.[guest.id] }));
  const confirmedNow = entries.filter((entry) => normalizeStatus(entry.response) === "confirmado");
  const declinedNow = entries.filter((entry) => normalizeStatus(entry.response) === "no_asistira");
  document.getElementById("total-guests").textContent = entries.length;
  document.getElementById("confirmed-count").textContent = confirmedNow.length;
  document.getElementById("pending-count").textContent = entries.length - confirmedNow.length - declinedNow.length;
  document.getElementById("declined-count").textContent = declinedNow.length;
  document.getElementById("summary").textContent = `${entries.length} invitaciones · ${confirmedNow.length} confirmaciones recibidas`;
  render();
});
