// --- GLOBALE VARIABELEN ---
var plannerBaseDate = window.plannerBaseDate || new Date();
const monthNames = ["JAN", "FEB", "MRT", "APR", "MEI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEC"];

// --- 1. SELECTORS (Zonder server-tags) ---
// Zoekt elementen die eindigen op de opgegeven ID
const getEl = (id) => $(`[id$='${id}']`);

const UI = {
    btnOrder: () => getEl('btnOrder'),
    hfSelectedTime: () => getEl('hfSelectedTime'),
    rdblchoice: () => getEl('rdblchoice'),
    reqStreet: () => getEl('reqvalStreet'),
    reqHouse: () => getEl('reqvalHouseNr'),
    reqPost: () => getEl('reqvalPostalcode'),
    openInfo: () => getEl('hfOpenInfo')
};

// --- 2. INITIALISATIE ---
$(document).ready(function () {
    initPage();

    // Verberg custom picker als de gebruiker ergens anders op de pagina klikt
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#datePickerTrigger, #customPickerPopup').length) {
            $('#customPickerPopup').hide();
        }
    });
});

function initPage() {
    // Stel de initiële staat van de bestelknop in
    updateOrderButtonState();
    
    // Initialiseer de custom picker tekst
    updatePickerTriggerText();
    buildPickerGrids();

    // Laad type (afhalen/bezorgen) en stel UI in
    const currentType = localStorage.getItem('type') || 'delivery';

    // Selecteer de juiste radiobutton
    UI.rdblchoice().find(`input[value='${currentType}']`).prop('checked', true);

    handleTypeChange(currentType);
    if (typeof setValidatedBordersOnLoad === "function") setValidatedBordersOnLoad();
    if (typeof initBasket === "function") initBasket();

    // Event Listeners voor Radio Buttons
    UI.rdblchoice().find('input').on('change', function () {
        const selectedType = $(this).val();
        localStorage.setItem('type', selectedType);
        handleTypeChange(selectedType);
        if (typeof RefreshCart === "function") RefreshCart(selectedType);
    });

    // Toggle Button UI Logica
    $('.btn-toggle').on('click', function () {
        $(this).find('.btn').toggleClass('active btn-default').toggleClass('btn-primary');
    });
}

// --- 3. CUSTOM DESKTOP PICKER LOGICA ---
function toggleCustomPicker() {
    $('#customPickerPopup').toggle();
    buildPickerGrids(); // Herbouw om te zorgen dat de 'active' classes kloppen met plannerBaseDate
}

function updatePickerTriggerText() {
    $('#displayMonthName').text(monthNames[plannerBaseDate.getMonth()]);
    $('#displayYear').text(plannerBaseDate.getFullYear());
}

function buildPickerGrids() {
    const $yearGrid = $('#yearGrid');
    const $monthGrid = $('#monthGrid');
    if (!$yearGrid.length || !$monthGrid.length) return;
    
    $yearGrid.empty();
    $monthGrid.empty();

    const currentYear = new Date().getFullYear();
    const selectedYear = plannerBaseDate.getFullYear();
    const selectedMonth = plannerBaseDate.getMonth();

    // Bouw Jaren (Huidig jaar + 2 jaar in de toekomst)
    for (let i = 0; i < 3; i++) {
        let y = currentYear + i;
        let isActive = (y === selectedYear) ? 'active' : '';
        $yearGrid.append(`<div class="picker-item ${isActive}" onclick="selectPickerYear(${y})">${y}</div>`);
    }

    // Bouw Maanden
    for (let m = 0; m < 12; m++) {
        let isActive = (m === selectedMonth) ? 'active' : '';
        
        // Blokkeer maanden in het verleden (als het gekozen jaar het huidige jaar is)
        let isPast = (selectedYear === currentYear && m < new Date().getMonth());
        
        if (isPast) {
            $monthGrid.append(`<div class="picker-item" style="opacity: 0.4; cursor: not-allowed;">${monthNames[m]}</div>`);
        } else {
            $monthGrid.append(`<div class="picker-item ${isActive}" onclick="selectPickerMonth(${m})">${monthNames[m]}</div>`);
        }
    }
}

function selectPickerYear(year) {
    plannerBaseDate.setFullYear(year);
    
    // Voorkom dat ze in het verleden belanden als ze het jaar terugzetten naar dit jaar
    if (year === new Date().getFullYear() && plannerBaseDate.getMonth() < new Date().getMonth()) {
        plannerBaseDate.setMonth(new Date().getMonth());
    }
    
    buildPickerGrids(); 
    applyPickerSelection();
}

function selectPickerMonth(monthIndex) {
    plannerBaseDate.setMonth(monthIndex);
    plannerBaseDate.setDate(1); // Reset de dag naar 1 om maand-oversprong te voorkomen
    
    // Als de gekozen maand = huidige maand, zet de datum terug op vandaag
    if (plannerBaseDate.getFullYear() === new Date().getFullYear() && monthIndex === new Date().getMonth()) {
        plannerBaseDate = new Date(); 
    }
    
    buildPickerGrids();
    applyPickerSelection();
    
    // Sluit de popup automatisch nadat een maand is gekozen
    $('#customPickerPopup').hide();
}

function applyPickerSelection() {
    updatePickerTriggerText();
    
    // Reset de kalender view naar het begin
    if (typeof currentPos !== 'undefined') currentPos = 0;
    const track = document.getElementById('agendaTrack');
    if (track) track.style.transform = `translateX(0px)`;
    
    // Reset selecties en blokkeer de bestelknop!
    $('.slot-btn').removeClass('selected');
    UI.hfSelectedTime().val('');
    updateOrderButtonState();
    
    // Roep je bestaande render functie aan in tracker.js (indien aanwezig)
    if (typeof renderAgenda === "function") {
        renderAgenda();
    }
}


// --- 4. BESTELKNOP LOGICA (De gevraagde blokkade) ---
function updateOrderButtonState() {
    const $btn = UI.btnOrder();
    const selectedTime = UI.hfSelectedTime().val();
    const basket = JSON.parse(localStorage.getItem('basket') || "[]");
    const openInfoVal = UI.openInfo().val() || "";
    const isClosed = openInfoVal.split(';')[2] === "NOORDER";

    if (!$btn.length) return;

    if (isClosed) {
        $btn.val("Restaurant gesloten").prop('disabled', true).css('background-color', 'gray');
    }
    else if (basket.length === 0) {
        $btn.val("Winkelmandje leeg").prop('disabled', true).css('background-color', 'gray');
    }
    else if (!selectedTime || selectedTime === "") {
        // Blokkeer de knop als er geen tijd is gekozen
        $btn.val("Kies eerst een tijd").prop('disabled', true);
        $btn.css({ 'background-color': '#ddd', 'color': 'black' }); // Waarschuwingsgeel
    }
    else {
        // Activeer de knop pas als alles klopt
        $btn.val("Bestellen").prop('disabled', false);
        $btn.css({ 'background-color': '#630303', 'color': 'white' }); // Actief donkerrood
    }
}

// --- 5. TYPE LOGICA (Afhalen vs Bezorgen) ---
function handleTypeChange(type) {
    const isTakeaway = (type === "takeaway");
    const addressDiv = $('#divAddress'); 

    if (isTakeaway) {
        if (addressDiv.length) addressDiv.hide();
        // Deactiveer validatie voor adres bij afhalen
        if (UI.reqStreet().length) ValidatorEnable(UI.reqStreet()[0], false);
        if (UI.reqHouse().length) ValidatorEnable(UI.reqHouse()[0], false);
        if (UI.reqPost().length) ValidatorEnable(UI.reqPost()[0], false);

        $("[id$='rowDeliveryCost']").hide(); 
    } else {
        if (addressDiv.length) addressDiv.show();
        // Activeer validatie voor adres bij bezorgen
        if (UI.reqStreet().length) ValidatorEnable(UI.reqStreet()[0], true);
        if (UI.reqHouse().length) ValidatorEnable(UI.reqHouse()[0], true);
        if (UI.reqPost().length) ValidatorEnable(UI.reqPost()[0], true);

        $("[id$='rowDeliveryCost']").show();
    }

    // Update de knopstatus ook bij type-wijziging
    updateOrderButtonState();
}

// --- 6. VALIDATIE & FORMULIER HELPERS ---
function ValidatorUpdateDisplay(val) {
    if (typeof (val.display) == "string") {
        if (val.display == "None") return;
        if (val.display == "Dynamic") {
            val.style.display = val.isvalid ? "none" : "inline";
            if (val.className == 'red-border' && val.controltovalidate) {
                const ctrl = document.getElementById(val.controltovalidate);
                if (ctrl) ctrl.style.border = val.isvalid ? '1px solid #ccc' : '1px solid red';
            }
            return;
        }
    }
    val.style.visibility = val.isvalid ? "hidden" : "visible";
}

function setValidatedBordersOnLoad() {
    if (typeof Page_Validators === 'undefined') return;
    for (var i = 0; i < Page_Validators.length; i++) {
        var val = Page_Validators[i];
        if (val.className == 'red-border' && val.controltovalidate) {
            var ctrl = document.getElementById(val.controltovalidate);
            if (ctrl) ctrl.style.border = val.isvalid ? '1px solid #ccc' : '1px solid red';
        }
    }
}

function ClientSideClick(myButton) {
    const selectedTime = UI.hfSelectedTime().val();
    console.log("selectedTime: " + selectedTime);
    
    if (!selectedTime || selectedTime === "") {
        alert("Gelieve een aankomsttijd te kiezen op de kalender.");
        return false;
    }

    if (typeof (Page_ClientValidate) === 'function') {
        if (Page_ClientValidate() === false) {
            return false;
        }
    }

    if (myButton.getAttribute('type') === 'button' || myButton.type === 'submit') {
        myButton.disabled = true;
        myButton.className = "button";  
        myButton.value = "Bezig met verwerken...";
    }

    return true;
}

$('form').submit(function () {
    return false;
});