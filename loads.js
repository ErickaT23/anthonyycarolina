// ===================== LOADS.JS =====================
// 1) Lista real de invitados
const guests = [
  { id: "1", name: "Humberto Chavaloc y familia", passes: 6 },
  { id: "2", name: "Antonio Rivera", passes: 2 },
  { id: "3", name: "Willam García y familia", passes: 5 },
  { id: "4", name: "Esperanza Tzoc de López", passes: 3 },
  { id: "5", name: "Guillermo Rosales y Guillermina López de Rosales", passes: 2 },
  { id: "6", name: "Thomas Toledo y Sofía Diéguez", passes: 2 },
  { id: "7", name: "Marta Velázquez", passes: 2 },
  { id: "8", name: "Diego Chacón y Victoria Saravia", passes: 2 },
  { id: "9", name: "Karla Santos", passes: 1 },
  { id: "10", name: "Luis Oliva y familia", passes: 3 },
  { id: "11", name: "Carlos Rivera y familia", passes: 4 },
  { id: "12", name: "Bertha Aura Rivera", passes: 2 },
  { id: "13", name: "Kimberly Rivera", passes: 1 },
  { id: "14", name: "Jaqueline Rivera", passes: 1 },
  { id: "15", name: "Antonio López", passes: 3 },
  { id: "16", name: "Gerardo López y Claudia López", passes: 2 },
  { id: "17", name: "Marcos López y familia", passes: 4 },
  { id: "18", name: "Abraham López", passes: 1 },
  { id: "19", name: "Amarildo de León y familia", passes: 4 },
  { id: "20", name: "Angelo Gonzalez y familia", passes: 4 },
  { id: "21", name: "Nohemy Chuga e Ingrid Chuga", passes: 2 },
  { id: "22", name: "Mayra Carolina y Luis Humberto González", passes: 2 },
  { id: "23", name: "Janeth Chuga", passes: 1 },
  { id: "24", name: "Coryna y familia", passes: 3 },
  { id: "25", name: "Eduardo de Polanco y Ana de Polanco", passes: 2 },
  { id: "26", name: "Angel González y Rosmery de González", passes: 2 },
  { id: "27", name: "Pedro Pérez", passes: 1 },
  { id: "28", name: "Hugo de León y esposa", passes: 2 },
  { id: "29", name: "Patricia Calderón", passes: 2 },
  { id: "30", name: "Vinicio Godínez y esposa", passes: 2 },
  { id: "31", name: "Verónica Chocon", passes: 1 },
  { id: "32", name: "Miriam Rivera de López", passes: 1 },
  { id: "33", name: "Paola Lemus", passes: 2 },
  { id: "34", name: "Dulce Cotol", passes: 1 },
  { id: "35", name: "Jenifer Godoy", passes: 1 },
  { id: "36", name: "Osvaldo Cabrera y esposa", passes: 2 },
  { id: "37", name: "Brandy García", passes: 1 },
  { id: "38", name: "Luis garabito y esposa", passes: 2 },
  { id: "39", name: "Celso Say y familia", passes: 3 },
  { id: "40", name: "Walter Alexander Garcia y esposa", passes: 2 },
  { id: "41", name: "Gustado Santiago y Alejandra Diaz", passes: 2 },
  { id: "42", name: "Ismael Orantes", passes: 1 },
  { id: "43", name: "Cristin Batch y esposo", passes: 2 },
  { id: "44", name: "Thelma Jerónimo", passes: 1 },
  { id: "45", name: "Eric Lopez y esposa", passes: 2 },
];

window.LocalGuestSeeds = {
  ...(window.LocalGuestSeeds || {}),
  anthonycarolina2026: guests.reduce((acc, guest) => {
    acc[String(guest.id)] = {
      id: String(guest.id),
      nombre: guest.name,
      pases: Number(guest.passes || 1),
      activo: true,
    };
    return acc;
  }, {}),
};

window.seedEventGuestsToFirebase = async function seedEventGuestsToFirebase() {
  const eventId = window.config?.event?.defaultEventId || "anthonycarolina2026";
  const rsvpDB = window.RSVPDatabase;

  if (!rsvpDB?.migrateLocalGuestsToFirebase) {
    console.warn("RSVPDatabase no está disponible. Revisa que database.js esté cargado.");
    return { ok: false, guests: 0 };
  }

  await rsvpDB.seedEventConfigToFirebase?.(eventId, { force: true });
  const result = await rsvpDB.migrateLocalGuestsToFirebase(eventId, { force: true });
  console.log(`Invitados creados en Firebase: ${result.total || guests.length}`);
  return { ok: true, guests: result.total || guests.length };
};

// Helper: leer parámetros ?id=1
function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

document.addEventListener("DOMContentLoaded", async () => {
  const guestId = getQueryParam("id");

  // Si no hay id, no marcamos error: solo no hay invitado
  if (!guestId) {
    window.currentGuest = null;
    return;
  }

  let guest = null;

  try {
    const remoteGuest = await window.RSVPDatabase?.getInvitadoById?.(
      window.config?.event?.defaultEventId || "anthonycarolina2026",
      guestId
    );
    if (remoteGuest) {
      guest = {
        id: String(remoteGuest.id || guestId),
        name: remoteGuest.nombre,
        passes: Number(remoteGuest.pases || 1),
        activo: remoteGuest.activo !== false,
      };
    }
  } catch (error) {
    console.warn("No se pudo leer el invitado desde Firebase.", error);
  }

  if (guest && guest.activo !== false) {
    window.currentGuest = guest;

    // Si tienes estos elementos en alguna parte, los llena (opcional)
    const guestNameEl = document.getElementById("guest-name");
    const passesEl = document.getElementById("passes");

    if (guestNameEl) guestNameEl.textContent = guest.name;
    if (passesEl) {
      const p = Number(guest.passes || 1);
      passesEl.textContent = `${p} ${p === 1 ? "pase" : "pases"}`;
    }
  } else {
    window.currentGuest = null;

    const guestNameEl = document.getElementById("guest-name");
    if (guestNameEl) guestNameEl.textContent = "Invitado no encontrado";
  }
});
