/**************** RSVP CONFIG ****************/
const RSVP_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbwF49QYSMh9fCLeTUF9M-C5WL3qV7vc83DT4BYzBH91n1JdiN15HMkS95lX5GnuzLkn/exec";

const $ = (s) => document.querySelector(s);

function getEventId() {
  return window.config?.event?.defaultEventId || "anthonycarolina2026";
}

function getRemoteGuestId(guestId) {
  return `${getEventId()}_${String(guestId || "")}`;
}

function showMsg(el, text, type = "ok") {
  if (!el) return;
  el.textContent = text;
  el.className = `rsvp-msg ${type}`;
  el.style.display = "block";
}

function hideMsg(el) {
  if (!el) return;
  el.style.display = "none";
  el.textContent = "";
}

async function apiCheck(id) {
  const url = `${RSVP_ENDPOINT}?guestId=${encodeURIComponent(id)}&t=${Date.now()}`;
  const r = await fetch(url, { cache: "no-store" });
  const text = await r.text();

  try {
    const j = JSON.parse(text);
    return j.alreadyConfirmed === true || j.alreadyConfirmed === "true" || j.alreadyConfirmed === 1;
  } catch {
    console.warn("apiCheck no devolvió JSON. Respuesta:", text.slice(0, 200));
    return false;
  }
}

async function apiSend(data) {
  const body = new URLSearchParams(data).toString();

  const r = await fetch(RSVP_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });

  const text = await r.text();
  try {
    return JSON.parse(text);
  } catch {
    console.warn("apiSend no devolvió JSON. Respuesta:", text.slice(0, 200));
    return { ok: false, raw: text };
  }
}

function clearStoredConfirmations() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("rsvp_confirmed_")) localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("No se pudo limpiar la memoria local de RSVP:", error);
  }
}

function getGuestFromURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return null;

  if (window.currentGuest && String(window.currentGuest.id) === String(id)) {
    return {
      id: String(window.currentGuest.id),
      nombre: window.currentGuest.name || "Invitado",
      pases: Number(window.currentGuest.passes || 1),
    };
  }
  return null;
}

function markConfirmedUI(message) {
  const form = $("#rsvp-form");
  const btn = $("#btnConfirmarRsvp");
  const msg = $("#msgRsvp");
  const popup = $("#rsvpPopup");
  const popupCount = $("#rsvp-popup-count");
  const popupYes = $("#rsvp-popup-yes");

  if (form) { form.classList.add("is-confirmed"); form.hidden = true; }
  document.querySelectorAll('#rsvp-form input, #rsvp-form select, #rsvp-form button').forEach((el) => {
    if (!el.hasAttribute("readonly")) el.disabled = true;
  });

  if (btn) {
    btn.textContent = "Confirmación enviada ✓";
    btn.classList.add("rsvp-confirmed");
  }

  if (msg) {
    msg.style.display = "block";
    msg.className = "rsvp-msg ok";
    msg.textContent = message || "Tu respuesta ya fue registrada. Muchas gracias.";
  }
}

function resetConfirmUI() {
  const form = $("#rsvp-form");
  const btn = $("#btnConfirmarRsvp");
  const msg = $("#msgRsvp");

  if (form) { form.classList.remove("is-confirmed"); form.hidden = false; }
  document.querySelectorAll('#rsvp-form input, #rsvp-form select, #rsvp-form button').forEach((el) => {
    if (!el.hasAttribute("readonly")) el.disabled = false;
  });

  if (btn) {
    btn.textContent = "Confirmar asistencia";
    btn.classList.remove("rsvp-confirmed");
  }

  hideMsg(msg);
}

document.addEventListener("DOMContentLoaded", () => {
  clearStoredConfirmations();

  const form = $("#rsvp-form");
  const inputNombre = $("#rsvp-name");
  const guestCountWrapper = $("#guest-count-wrapper");
  const guestCount = $("#guest-count");
  const btnSubmit = $("#btnConfirmarRsvp");
  const radioYes = $("#rsvp-response-yes");
  const radioNo = $("#rsvp-response-no");
  const msg = $("#msgRsvp");

  if (!form || !inputNombre || !guestCountWrapper || !guestCount || !btnSubmit || !radioYes || !radioNo || !msg) return;

  let invitado = getGuestFromURL();

  function paintGuestData() {
    invitado = getGuestFromURL();

    if (!invitado) {
      inputNombre.value = "Nombre del invitado";
      guestCount.innerHTML = '<option value="1">1 pase</option>';
      guestCount.disabled = true;
      return;
    }

    inputNombre.value = invitado.nombre;

    const maxPasses = Math.max(1, Number(invitado.pases || 1));
    guestCount.innerHTML = "";
    for (let count = maxPasses; count >= 1; count -= 1) {
      const option = document.createElement("option");
      option.value = String(count);
      option.textContent = `${count} ${count === 1 ? "pase" : "pases"}`;
      guestCount.appendChild(option);
    }
  }

  function toggleGuestCount() {
    const show = radioYes.checked;
    guestCountWrapper.style.display = show ? "grid" : "none";
    guestCountWrapper.hidden = !show;
    guestCount.disabled = !show;
  }

  paintGuestData();
  toggleGuestCount();
  hideMsg(msg);
  window.addEventListener("guest:updated", paintGuestData);
  setTimeout(paintGuestData, 0);
  radioYes.addEventListener("change", () => { toggleGuestCount(); btnSubmit.hidden = false; });
  radioNo.addEventListener("change", () => { toggleGuestCount(); btnSubmit.hidden = false; });

  (async () => {
    if (!invitado) return;
    try {
      const savedRsvp = await window.RSVPDatabase?.getEventData?.("rsvp", getEventId());
      const savedResponse = savedRsvp?.[`${getEventId()}_${invitado.id}`] || savedRsvp?.[invitado.id];
      if (savedResponse?.respuesta === "confirmado" || savedResponse?.respuesta === "no_asistira") {
        markConfirmedUI(savedResponse.respuesta === "confirmado"
          ? "Gracias por confirmar tu asistencia. Nos alegra mucho compartir este día tan especial contigo. ¡Nos vemos pronto en nuestra boda!"
          : "Lamentamos que no puedas acompañarnos. Te extrañaremos y agradecemos mucho que nos hayas hecho saber tu respuesta.");
        return;
      }
      const ya = await apiCheck(getRemoteGuestId(invitado.id));
      if (ya) {
        markConfirmedUI();
      } else {
        resetConfirmUI();
      }
    } catch (error) {
      console.warn("apiCheck inicial falló:", error);
      resetConfirmUI();
    }
  })();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMsg(msg);
    invitado = getGuestFromURL();

    if (!invitado) {
      showMsg(msg, "No se encontró el invitado en la URL. Usa ?id=1.", "error");
      return;
    }

    if (!radioYes.checked && !radioNo.checked) {
      showMsg(msg, "Selecciona si asistirás o no para continuar.", "error");
      return;
    }

    const respuesta = radioYes.checked ? "SI" : "NO";
    const pasesSeleccionados = respuesta === "SI"
      ? Math.max(1, Number(guestCount.value || invitado.pases || 1))
      : 0;

    btnSubmit.disabled = true;

    try {
      const firebaseResponse = {
        guestId: String(invitado.id),
        nombre: invitado.nombre,
        pasesAsignados: Number(invitado.pases || 1),
        cantidad: pasesSeleccionados,
        respuesta: respuesta === "SI" ? "confirmado" : "no_asistira",
        actualizadoEn: new Date().toISOString(),
      };
      await window.RSVPDatabase?.saveRsvp?.(getEventId(), invitado.id, firebaseResponse);

      try {
        await apiSend({
          guestId: getRemoteGuestId(invitado.id),
          nombre: invitado.nombre,
          pases: String(pasesSeleccionados),
          respuesta,
        });
      } catch (apiError) {
        console.warn("No se pudo enviar la respuesta externa:", apiError);
      }

        const okMessage = respuesta === "SI"
           ? "Gracias por confirmar tu asistencia. Nos alegra mucho compartir este día tan especial contigo. ¡Nos vemos pronto en nuestra boda!"
           : "Lamentamos que no puedas acompañarnos. Te extrañaremos y agradecemos mucho que nos hayas hecho saber tu respuesta.";
         markConfirmedUI(okMessage);
         const message = `Hola, soy ${invitado.nombre} (ID ${invitado.id}). Mi respuesta para la boda de Anthony y Carolina es: ${respuesta === "SI" ? "Sí asistiré" : "No asistiré"}. Pases: ${pasesSeleccionados}.`;
         window.location.href = `https://wa.me/50248997187?text=${encodeURIComponent(message)}`;
        return;
    } catch (error) {
      console.error("apiSend:", error);
      btnSubmit.disabled = false;
      showMsg(msg, "Error de conexión al enviar tu respuesta.", "error");
    }
  });
});
