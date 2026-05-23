
$(document).ready(function () {
    

    RefreshCart(UI.rdblchoice());
});


$(function () {
    setValidatedBordersOnLoad();
});
function ValidatorUpdateDisplay(val) {
    if (typeof (val.display) == "string") {
        if (val.display == "None") {
            return;
        }
        if (val.display == "Dynamic") {
            val.style.display = val.isvalid ? "none" : "inline";
            if (val.className == 'red-border' && val.controltovalidate) {
                if (val.isvalid) {
                    document.getElementById(val.controltovalidate).style.border = '1px solid #ccc';
                }
                else {
                    document.getElementById(val.controltovalidate).style.border = '1px solid red';
                }
            }
            return;
        }
    }
    val.style.visibility = val.isvalid ? "hidden" : "visible";
}

function setValidatedBordersOnLoad() {
    for (var i = 0; i < Page_Validators.length; i++) {
        var val = Page_Validators[i];
        if (val.className == 'red-border' && val.controltovalidate) {
            var ctrl = document.getElementById(val.controltovalidate);
            if (ctrl != null && ctrl.style != null) {
                if (!val.isvalid)
                    ctrl.style.border = '1px solid red';
                else
                    ctrl.style.border = '1px solid #ccc';
            }
        }
    }
}

$('.btn-toggle').click(function () {
    $(this).find('.btn').toggleClass('active');

    if ($(this).find('.btn-primary').size() > 0) {
        $(this).find('.btn').toggleClass('btn-primary');
    }
    if ($(this).find('.btn-danger').size() > 0) {
        $(this).find('.btn').toggleClass('btn-danger');
    }
    if ($(this).find('.btn-success').size() > 0) {
        $(this).find('.btn').toggleClass('btn-success');
    }
    if ($(this).find('.btn-info').size() > 0) {
        $(this).find('.btn').toggleClass('btn-info');
    }

    $(this).find('.btn').toggleClass('btn-default');

});

$('form').submit(function () {
    return false;
});



$(document).ready(function () {
    initPage();
});

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

//// --- 2. INITIALISATIE ---
//$(document).ready(function () {
//    initPage();
// //   if (typeof loadPlanner === "function") loadPlanner();
//});

function initPage() {
    // Stel de initiële staat van de bestelknop in
    updateOrderButtonState();

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

// --- 3. BESTELKNOP LOGICA (De gevraagde blokkade) ---
function updateOrderButtonState() {
    const $btn = UI.btnOrder();
    const selectedTime = UI.hfSelectedTime().val();
    const basket = JSON.parse(localStorage.getItem('basket') || "[]");
    const openInfoVal = UI.openInfo().val() || "";
    const isClosed = openInfoVal.split(';')[2] === "NOORDER"; // [cite: 105]

    if (!$btn.length) return;

    if (isClosed) {
        $btn.val("Restaurant gesloten").prop('disabled', true).css('background-color', 'gray'); // [cite: 106]
    }
    else if (basket.length === 0) {
        $btn.val("Winkelmandje leeg").prop('disabled', true).css('background-color', 'gray'); // [cite: 113]
    }
    else if (!selectedTime || selectedTime === "") {
        // Blokkeer de knop als er geen tijd is gekozen
        $btn.val("Kies eerst een tijd").prop('disabled', true);
        $btn.css({ 'background-color': '#ffc107', 'color': 'black' }); // Waarschuwingsgeel
    }
    else {
        // Activeer de knop pas als alles klopt
        $btn.val("Bestellen").prop('disabled', false);
        $btn.css({ 'background-color': '#630303', 'color': 'white' }); // Actief donkerrood [cite: 107]
    }
}

// --- 4. TYPE LOGICA (Afhalen vs Bezorgen) ---
function handleTypeChange(type) {
    const isTakeaway = (type === "takeaway");
    const addressDiv = $('#divAddress'); // Zorg dat dit ID in je HTML staat

    if (isTakeaway) {
        if (addressDiv.length) addressDiv.hide();
        // Deactiveer validatie voor adres bij afhalen [cite: 96, 99]
        if (UI.reqStreet().length) ValidatorEnable(UI.reqStreet()[0], false);
        if (UI.reqHouse().length) ValidatorEnable(UI.reqHouse()[0], false);
        if (UI.reqPost().length) ValidatorEnable(UI.reqPost()[0], false);

        $("[id$='rowDeliveryCost']").hide(); // [cite: 97]
    } else {
        if (addressDiv.length) addressDiv.show();
        // Activeer validatie voor adres bij bezorgen [cite: 98, 102]
        if (UI.reqStreet().length) ValidatorEnable(UI.reqStreet()[0], true);
        if (UI.reqHouse().length) ValidatorEnable(UI.reqHouse()[0], true);
        if (UI.reqPost().length) ValidatorEnable(UI.reqPost()[0], true);

        $("[id$='rowDeliveryCost']").show();
    }

    // Update de knopstatus ook bij type-wijziging
    updateOrderButtonState();
}
function ValidatorUpdateDisplay(val) {
    if (typeof (val.display) == "string") {
        if (val.display == "None") return;
        if (val.display == "Dynamic") {
            val.style.display = val.isvalid ? "none" : "inline";
            if (val.className == 'red-border' && val.controltovalidate) {
                document.getElementById(val.controltovalidate).style.border = val.isvalid ? '1px solid #ccc' : '1px solid red';
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
    console.log("selectedTime" + selectedTime);
    if (!selectedTime || selectedTime === "") {
        alert("Gelieve een tijdslot te kiezen." + selectedTime);
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
        myButton.value = "laden...";
    }

    return true;
}


