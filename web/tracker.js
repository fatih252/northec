


var map;
var truckMarker;
var trackingInterval;
var plannerBaseDate = window.plannerBaseDate || new Date();
// Pictogram definitie buiten de ready-functie is prima
var truckIcon = L.divIcon({
    html: '<div class="truck-pictogram"><i class="fas fa-truck-moving fa-3x text-primary"></i></div>',
    className: 'custom-div-icon',
    iconSize: [50, 50],
    iconAnchor: [25, 25]
});

$(document).ready(function () {
    // Reference the modal using jQuery
    var $locationModal = $('#locationModal');

    if ($locationModal.length) {
        // Bootstrap 4 Event: shown.bs.modal
        $locationModal.on('shown.bs.modal', function () {
            if (!map) {
                // Initialize the map
                map = L.map('map').setView([51.2194, 4.4025], 14);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                truckMarker = L.marker([0, 0], { icon: truckIcon }).addTo(map);
            } else {
                // Leaflet needs this because the container was hidden (display: none)
                // Bootstrap 4 sometimes needs a slightly longer delay
                setTimeout(function () {
                    map.invalidateSize();
                }, 200);
            }

            updateTruckPosition();
            if (trackingInterval) clearInterval(trackingInterval);
            trackingInterval = setInterval(updateTruckPosition, 10000);
        });

        // Bootstrap 4 Event: hidden.bs.modal
        $locationModal.on('hidden.bs.modal', function () {
            if (trackingInterval) clearInterval(trackingInterval);
        });
    }
});

function updateTruckPosition() {
    fetch('/WebService.asmx/get_truck_location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => {
            if (data.d && map) {
                var lat = data.d.lat;
                var lng = data.d.lng;
                var newPos = [lat, lng];
                truckMarker.setLatLng(newPos);
                map.flyTo(newPos, 17, { animate: true, duration: 2.0 });
            }
        })
        .catch(err => console.error('Fout bij ophalen locatie:', err));
}

// --- 1. GLOBALE VARIABELEN & SELECTORS ---
let currentPos = 0;
let bookedSlots = [];
let plannerSettings = {
    minHour: 11,
    maxHour: 21,
    closedDays: []
};

// Helper object om ASP.NET elementen te vinden (ongeacht MasterPages)
const trackUI = {
    hfSelectedTime: () => $("[id$='hfSelectedTime']"),
    agendaTrack: () => document.getElementById('agendaTrack'),
    prevBtn: () => $('#calprevBtn'), // Updated to target the calendar arrow
    nextBtn: () => $('#calnextBtn')  // Updated to target the calendar arrow
};

// --- 2. INITIALISATIE ---
$(document).ready(function () {
    loadPlanner();

    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let yyyy = today.getFullYear();
    let todayString = `${yyyy}-${mm}-${dd}`;

    $('#jumpToDate').attr('min', todayString); // Blokkeer het verleden
    $('#jumpToDate').val(todayString);         // Zet de default waarde naar vandaag
    // Optioneel: herbereken slider bij resize van venster
    let windowWidth = $(window).width();

    $(window).on('resize', function () {
        let newWidth = $(window).width();
        if (newWidth !== windowWidth) {
            windowWidth = newWidth; // Update de opgeslagen breedte

            currentPos = 0;
            if (trackUI.agendaTrack()) trackUI.agendaTrack().style.transform = `translateX(0px)`;
            updateNavButtons();
        }
    });
});

// --- 3. DATA OPHALEN ---
async function loadPlanner() {
    try {
        const res = await fetch('WebService.asmx/get_planner_settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();

        // Data vantrackUIt de C# WebMethod (get_planner_settings)
        plannerSettings.minHour = data.d.minHour;
        plannerSettings.maxHour = data.d.maxHour;
        plannerSettings.closedDays = data.d.closedDays;
        bookedSlots = data.d.bookedSlots || [];

        console.log("Planner settings geladen:", plannerSettings);
        renderAgenda();
    } catch (e) {
        console.error("Fout bij laden planner:", e);
    }
}

// --- 4. DE PLANNER RENDERING ---
function renderAgenda() {
    const track = trackUI.agendaTrack();
    if (!track) return;
    track.innerHTML = "";

    const now = new Date();
    const startAtMidnight = new Date(plannerBaseDate.getFullYear(), plannerBaseDate.getMonth(), plannerBaseDate.getDate(), 0, 0, 0);
    // Genereer 5 dagen vanaf vandaag
    for (let i = 0; i < 5; i++) {
        let d = new Date(startAtMidnight); // Gebruik startAtMidnight hier
        d.setDate(d.getDate() + i);

        let dayIdx = d.getDay(); // 0 = Zon, 1 = Man...
        let isFullyClosed = plannerSettings.closedDays.includes(dayIdx);

        let col = document.createElement('div');
        col.className = 'day-card';

        let html = `
            <div class="day-header">
                <div class="text-primary fw-bold" style="font-size:1.1rem;">
                    ${d.toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric' })}
                </div>
                <small class="text-muted text-uppercase">${d.toLocaleDateString('nl-BE', { month: 'short' })}</small>
            </div>`;

        if (isFullyClosed) {
            html += `
                <div class="closed-day-msg">
                    <i class="fas fa-door-closed mb-2"></i><br>
                    Gesloten
                </div>`;
        } else {
            // Genereer uren op basis van shop instellingen
            for (let h = plannerSettings.minHour; h <= plannerSettings.maxHour; h++) {
                let slotTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, 0, 0);
                let slotMS = slotTime.getTime();

                // Check: is het al voorbij?
                let isPast = slotMS < now.getTime();

                // Check: is het al bezet in de DB?
                let isBooked = bookedSlots.some(slot => {
                    let bStart = parseSqlDate(slot.start || slot.Start).getTime();
                    let bEnd = parseSqlDate(slot.end || slot.End).getTime();
                    return (slotMS >= bStart && slotMS < bEnd);
                });

                let statusClass = isBooked ? 'booked' : (isPast ? 'past' : 'available');
                let isDisabled = isBooked || isPast;

                let slotMonth = String(d.getMonth() + 1).padStart(2, '0');
                let slotDay = String(d.getDate()).padStart(2, '0');
                let slotHour = String(h).padStart(2, '0');

                let dateValue = `${d.getFullYear()}-${slotMonth}-${slotDay} ${slotHour}:00`;

                html += `
    <button type="button" 
        class="slot-btn ${statusClass}" 
        ${isDisabled ? 'disabled' : `onclick="selectSlot(this, '${dateValue}')"`}>
        ${slotHour}:00 ${isBooked ? '<i class="fas fa-lock ms-1"></i>' : ''}
    </button>`;
            }
        }
        col.innerHTML = html;
        track.appendChild(col);
    }

    updateNavButtons();
}

// --- 5. HELPER FUNCTIES ---

// Voorkomt tijdzone-verschuivingen bij het inlezen van database-tijden
function parseSqlDate(sqlDate) {
    if (!sqlDate) return new Date(0);
    let t = sqlDate.split(/[- :T]/);
    return new Date(t[0], t[1] - 1, t[2], t[3] || 0, t[4] || 0, t[5] || 0);
}

// Wordt aangeroepen bij klik op een vrij uur
function selectSlot(btn, timeString) {
    $('.slot-btn').removeClass('selected');
    $(btn).addClass('selected');

    trackUI.hfSelectedTime().val(timeString);
    console.log("Gekozen tijdstip:", timeString);
    if (typeof updateOrderButtonState === "function") {
        updateOrderButtonState();
    }
}

// Horizontale navigatie (slider)
function slide(dir) {
    const track = trackUI.agendaTrack();
    const $cards = $('.day-card');
    if ($cards.length === 0) return;

    const cardWidth = $cards.first().outerWidth();
    const viewportWidth = $(track).parent().width();
    const visibleCards = Math.round(viewportWidth / cardWidth);
    const maxPos = 5 - visibleCards;

    currentPos = Math.max(0, Math.min(currentPos + dir, maxPos));
    track.style.transform = `translateX(-${currentPos * cardWidth}px)`;

    updateNavButtons(maxPos);
}

function updateNavButtons(maxPos) {
    // Als maxPos niet is meegegeven, berekenen we het zelf
    if (maxPos === undefined) {
        const cardWidth = $('.day-card').first().outerWidth();
        const visibleCards = Math.round($(trackUI.agendaTrack()).parent().width() / cardWidth);
        maxPos = 5 - visibleCards;
    }

    trackUI.prevBtn().toggleClass('disabled', currentPos === 0);
    trackUI.nextBtn().toggleClass('disabled', currentPos >= maxPos);
}

// Validatie voor de 'Bestel' knop
function validateOrder(btn) {
    const selectedTime = trackUI.hfSelectedTime().val();

    if (!selectedTime) {
        alert("Gelieve eerst een aankomsttijd te selecteren in de planner.");
        // Scroll naar de planner
        $('html, body').animate({ scrollTop: $("#planner").offset().top - 100 }, 500);
        return false;
    }

    if (typeof (Page_ClientValidate) === 'function') {
        if (Page_ClientValidate() === false) return false;
    }

    // Voorkom dubbel klikken
    $(btn).prop('disabled', true).val("Bezig met verwerken...");
    return true;
}

// NEW: Functie om naar een gekozen datum te springen
function jumpToSelectedDate(dateString) {
    if (!dateString) return;

    // Converteer YYYY-MM-DD naar een Date object
    let parts = dateString.split('-');
    plannerBaseDate = new Date(parts[0], parts[1] - 1, parts[2]);

    // Reset de slider positie
    currentPos = 0;
    if (trackUI.agendaTrack()) trackUI.agendaTrack().style.transform = `translateX(0px)`;

    // 2. Wis de oude reservering als ze van datum veranderen
    $('.slot-btn').removeClass('selected');
    trackUI.hfSelectedTime().val('');
    // Teken de agenda opnieuw vanaf de nieuwe datum
    renderAgenda();
}