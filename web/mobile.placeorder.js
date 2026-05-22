var finalPrice = 0;
var currentTab = 0; // Current tab is set to be the first tab (0)


$(document).ready(function () {
    loadPlanner();
    // Behoud originele toggle logica
    $('.btn-toggle').click(function () {
        $(this).find('.btn').toggleClass('active btn-default').toggleClass('btn-primary');
    });
});

$(document).ready(loadPlanner);



$(document).ready(function () {
    // Get the value from localStorage
    var type = localStorage.getItem('type');
    if (type) {
        // Find the radio button with the matching value and select it
        $("[id*=MainContent_rdblchoice] [value='" + type + "']").prop('checked', true);
    }

});




$(document).ready(function () {

    showTab(currentTab); // Display the current tab
    initBasket();
    var type = localStorage.getItem('type');

    if (type == null) {
        type = "delivery";
    }
    console.log("type : " + type);
    if (type == "takeaway") {
        $('#divAddressEdit').hide();


        (document.getElementById("reqvalStreet"), false);
        ValidatorEnable(document.getElementById("reqvalHouseNr"), false);
        ValidatorEnable(document.getElementById("reqvalPostalcode"), false);
        $get("rowDeliveryCost").style.display = "none";
        $("#MainContent_lblDeliveryTime").text("Kies uw afhaaltijd");
        fillDeliveryHours(true);
        RefreshCart("takeaway");


    } else {

        ValidatorEnable(document.getElementById("reqvalStreet"), true);
        ValidatorEnable(document.getElementById("reqvalHouseNr"), true);
        ValidatorEnable(document.getElementById("reqvalPostalcode"), true);

        $get("rowDeliveryCost").style.display = "";
        $('#divAddressEdit').show();
        $("#MainContent_lblDeliveryTime").text("Kies uw bezorgtijd");
        fillDeliveryHours(false);
        RefreshCart("delivery");


    }

    $('#MainContent_rdblchoice_0').on('change', function () {
        if ($(this).is(':checked')) {
            $('#divAddressEdit').hide();
            ValidatorEnable(document.getElementById("reqvalStreet"), false);
            ValidatorEnable(document.getElementById("reqvalHouseNr"), false);
            ValidatorEnable(document.getElementById("reqvalPostalcode"), false);
            //   PageMethods.SetSessionValue('type', "takeaway", null, null);
            $get("rowDeliveryCost").style.display = "none";
            $("#MainContent_lblDeliveryTime").text("Kies uw afhaaltijd");
            $('#MainContent_hfMethod').val("takeaway");
            RefreshCart("takeaway");
            localStorage.setItem('type', 'takeaway');
            fillDeliveryHours(true);

        }

    });
    $('#MainContent_rdblchoice_1').on('change', function () {
        if ($(this).is(':checked')) {
            ValidatorEnable(document.getElementById("reqvalStreet"), true);
            ValidatorEnable(document.getElementById("reqvalHouseNr"), true);
            ValidatorEnable(document.getElementById("reqvalPostalcode"), true);
            //   PageMethods.SetSessionValue('type', "delivery", null, null);
            $get("rowDeliveryCost").style.display = "";
            $('#divAddressEdit').show();
            $("#MainContent_lblDeliveryTime").text("Kies uw bezorgtijd");
            $('#MainContent_hfMethod').val("delivery");
            localStorage.setItem('type', 'delivery');

            RefreshCart("delivery");
            fillDeliveryHours(false);

        }
    });

    $('#MainContent_btnOrder').hide();
    $('#MainContent_btnMenuBack').hide();

});


function fillDeliveryHours(isTakeaway) {
    $.ajax({
        type: "POST",
        url: "/WebService.asmx/GetCheckServiceOpen",
        data: JSON.stringify({ isTakeaway: isTakeaway }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            var openInfo = response.d;
            var $ddl = $("#MainContent_ddlDeliveryHours");
            $ddl.empty();

            if (!openInfo) {
                $ddl.append($("<option></option>").val("").text("Geen tijden beschikbaar"));
                return;
            }

            // If you have client helpers generateDeliverySlots & populateDropdown use them:
            try {
                var openNowSlots = generateDeliverySlots(openInfo.split(';')[3], openInfo.split(';')[4], openInfo.split(';')[5], openInfo.split(';')[6]);
                populateDropdown("MainContent_ddlDeliveryHours", openNowSlots, openInfo.split(';')[3]);
                return;
            } catch (e) {
                // Fallback: try to build options from the same logic used server-side (simple fallback)
                try {
                    var start = openInfo.split(';')[3];
                    var end = openInfo.split(';')[4];

                    if (start && start.length > 0) {
                        var startDate = new Date("1970-01-01T" + start + ":00");
                        var endDate = new Date("1970-01-01T" + end + ":00");
                        var now = new Date();
                        // If start time in future use startDate else use now + 40 minutes
                        var cursor = (now.getHours() < startDate.getHours() || (now.getHours() === startDate.getHours() && now.getMinutes() < startDate.getMinutes()))
                            ? new Date(startDate.getTime())
                            : new Date(now.getTime() + 40 * 60000);

                        // Round up to next 15-minute interval
                        function roundUpTo15(d) {
                            var mins = d.getMinutes();
                            var rounded = Math.ceil(mins / 15) * 15;
                            if (rounded === 60) {
                                d.setHours(d.getHours() + 1);
                                d.setMinutes(0);
                            } else {
                                d.setMinutes(rounded);
                            }
                            d.setSeconds(0);
                            d.setMilliseconds(0);
                            return d;
                        }

                        cursor = roundUpTo15(cursor);

                        // Add "Zo snel mogelijk" if we used now
                        if (cursor.getTime() !== startDate.getTime()) {
                            $ddl.append($("<option></option>").val("ZSM").text("Zo snel mogelijk"));
                        }

                        while (cursor < endDate) {
                            var hh = ("0" + cursor.getHours()).slice(-2);
                            var mm = ("0" + cursor.getMinutes()).slice(-2);
                            var txt = hh + ":" + mm;
                            $ddl.append($("<option></option>").val(txt).text(txt));
                            cursor = new Date(cursor.getTime() + 15 * 60000);
                        }

                    } else {
                        $ddl.append($("<option></option>").val("ZSM").text("Zo snel mogelijk"));
                    }
                } catch (err) {
                    $ddl.empty();
                    $ddl.append($("<option></option>").val("").text("Geen tijden beschikbaar"));
                }
            }
        },
        error: function (xhr, status, error) {
            var $ddl = $("#MainContent_ddlDeliveryHours");
            $ddl.empty();
            $ddl.append($("<option></option>").val("").text("Fout bij laden tijden"));
            console.error("GetCheckServiceOpen error:", status, error);
        }
    });
}


$(document).ready(function () {
    // Get the value from localStorage
    var type = localStorage.getItem('type');
    console.log("localstore type: " + type);
    if (type) {
        // Find the radio button with the matching value and select it
        $("[id*=MainContent_rdblchoice] [value='" + type + "']").prop('checked', true);
    }

});

function RefreshCart(type) {
    var basket = localStorage.getItem('basket');

    $.ajax({
        url: '/WebService.asmx/GetJson',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{basket: ' + JSON.stringify(basket) + ', type: "' + type + '"}',
        success: function (data) {
            var str = JSON.stringify(data).substring(6);
            var json = str.substring(0, str.length - 2);
            json = json.replace(/\\/g, "");

            localStorage.setItem('basket', json);
            // initmBasket();
            calcTotPrice();
        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });
}

$(document).ready(function () {

    showTab(currentTab); // Display the current tab
    initBasket();
    var type = localStorage.getItem('type');

    if (type == null) {
        type = "delivery";
    }
    console.log("type : " + type);
    if (type == "takeaway") {
        $('#divAddressEdit').hide();
        ValidatorEnable(document.getElementById("reqvalStreet"), false);
        ValidatorEnable(document.getElementById("reqvalHouseNr"), false);
        ValidatorEnable(document.getElementById("reqvalPostalcode"), false);
        $get("rowDeliveryCost").style.display = "none";
        $("#MainContent_lblDeliveryTime").text("Kies uw afhaaltijd");
        fillDeliveryHours(true);
        RefreshCart("takeaway");


    } else {

        ValidatorEnable(document.getElementById("reqvalStreet"), true);
        ValidatorEnable(document.getElementById("reqvalHouseNr"), true);
        ValidatorEnable(document.getElementById("reqvalPostalcode"), true);

        $get("rowDeliveryCost").style.display = "";
        $('#divAddressEdit').show();
        $("#MainContent_lblDeliveryTime").text("Kies uw bezorgtijd");
        fillDeliveryHours(false);
        RefreshCart("delivery");


    }

    $('#MainContent_rdblchoice_0').on('change', function () {
        if ($(this).is(':checked')) {
            $('#divAddressEdit').hide();
            ValidatorEnable(document.getElementById("reqvalStreet"), false);
            ValidatorEnable(document.getElementById("reqvalHouseNr"), false);
            ValidatorEnable(document.getElementById("reqvalPostalcode"), false);
            //   PageMethods.SetSessionValue('type', "takeaway", null, null);
            $get("rowDeliveryCost").style.display = "none";
            $("#MainContent_lblDeliveryTime").text("Kies uw afhaaltijd");
            $('#MainContent_hfMethod').val("takeaway");
            RefreshCart("takeaway");
            localStorage.setItem('type', 'takeaway');
            fillDeliveryHours(true);

        }

    });
    $('#MainContent_rdblchoice_1').on('change', function () {
        if ($(this).is(':checked')) {
            ValidatorEnable(document.getElementById("reqvalStreet"), true);
            ValidatorEnable(document.getElementById("reqvalHouseNr"), true);
            ValidatorEnable(document.getElementById("reqvalPostalcode"), true);
            //   PageMethods.SetSessionValue('type', "delivery", null, null);
            $get("rowDeliveryCost").style.display = "";
            $('#divAddressEdit').show();
            $("#MainContent_lblDeliveryTime").text("Kies uw bezorgtijd");
            $('#MainContent_hfMethod').val("delivery");
            localStorage.setItem('type', 'delivery');

            RefreshCart("delivery");
            fillDeliveryHours(false);

        }
    });

    $('#MainContent_btnOrder').hide();
    $('#MainContent_btnMenuBack').hide();

});

function ClientSideClick(myButton) {
    
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
function check(control) {

    var x = control.id.replace("MainContent_hd", "") + "ViewDetail";

    if ($('#MainContent_hdAddress').attr('aria-expanded') == 'false') {
        document.getElementById('MainContent_hdAddress').style.height = "40px";

    } else {
        document.getElementById('MainContent_hdAddress').style.height = "100px";
    }


    if ($('#MainContent_hdPersInfo').attr('aria-expanded') == 'false') {
        document.getElementById('MainContent_hdPersInfo').style.height = "40px";

    } else {
        document.getElementById('MainContent_hdPersInfo').style.height = "100px";
    }



}


function showTab(n) {

    // This function will display the specified tab of the form ...
    var x = document.getElementsByClassName("tab");
    x[n].style.display = "block";
    // ... and fix the Previous/Next buttons:
    if (n == 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }
    if (n == (x.length - 1)) {
        document.getElementById("nextBtn").innerHTML = "Volgende";
    } else {
    }

}

function prev(n) {
    // This function will figure out which tab to display
    var x = document.getElementsByClassName("tab");
    x[currentTab].style.display = "none";
    $('#MainContent_btnOrder').hide();
    $('#MainContent_btnMenuBack').hide();

    document.getElementById("nextBtn").hidden = "";
    $('#btnPrexNext').attr('style', '');

    // Increase or decrease the current tab by 1:
    currentTab = currentTab + n;
    // if you have reached the end of the form... :
    if (currentTab >= x.length) {
        return false;
    }
    // Otherwise, display the correct tab:
    showTab(currentTab);
}

function next(n) {
    if (Page_ClientValidate()) {

        var calendarTime = document.getElementById('hfSelectedTime').value;
        console.log("calendarTime" + calendarTime);
        if (!calendarTime || calendarTime === "") {
            alert("Gelieve eerst een tijdslot aan te klikken op de kalender.");
            return false; // Stop de navigatie
        } else {
            initBasket();
            var x = document.getElementsByClassName("tab");
            x[currentTab].style.display = "none";
            document.getElementById("prevBtn").style.marginLeft = "7%";

            $('#btnPrexNext').attr('style', 'display: flex');

            document.getElementById("nextBtn").hidden = "hidden";
            currentTab = currentTab + n;
            if (currentTab >= x.length) {
                window.scrollTo(0, 0);
                return false;
            }
            showTab(currentTab);
            window.scrollTo(0, 0);
            return false;
        }
    }
}


function calcTotPrice() {
    var basket = JSON.parse(localStorage.getItem('basket'));

    var totPrice = 0;
    if (localStorage.getItem('basket') != null || basket.length > 0) {

        basket.forEach((item) => {
            totPrice = totPrice + (parseFloat(item.totPrice) * parseInt(item.quantity));
        });

        finalPrice = totPrice.toFixed(2);
        if (totPrice != 0) {
            return totPrice.toFixed(2);
        } else {
            return "Winkelmandje leeg";
        }
        $('#cartbar_btnOrder').removeAttr("disabled");
    } else {

        return "Winkelmandje leeg";
    }
}

function checkStorage() {
    var basket = JSON.parse(localStorage.getItem('basket'));
    if (basket != null) {
        $('#MainContent_hfCart').val(JSON.stringify(basket));
    }
}
function initBasket() {

    var basket = JSON.parse(localStorage.getItem('basket'));
    if (localStorage.getItem('basket') != null && basket.length > 0) {
        calcTotPrice();

        $('#cartbar_hfCart').val(JSON.stringify(basket));

        //  $('#MainContent_Wizard1_basket tr').not($('#MainContent_Wizard1_basket tr:first-child')).remove();
        $("#cart").html('');


        for (i = 0; i < basket.length; i++) {
            var side = "";

            if (basket[i].optionList != "") {
                side = side + "<br /> &#62;" + $.map(basket[i].options, function (v) { return v.name; }).join('<br /> &#62;');
            }
            if (basket[i].extras.length > 0) {
                side = side + "<br /> &#62;" + $.map(basket[i].extras, function (v) { return v.name; }).join('<br /> &#62;');
            }
            if (basket[i].productExtraList.length > 0) {
                side = side + "<br /> &#62;" + $.map(basket[i].productExtraList, function (v) { return v.name; }).join('<br /> &#62;');
            }
            if (side.charAt(side.length - 1) == ",") {
                side = side.slice(0, -1)

            }
            if (side.charAt(0) == ",") {
                side = side.substring(1);

            }
            var priceHTML = "";
            var discountTextHTML = "";

            if (parseFloat(basket[i].totPrice) == parseFloat(basket[i].totInitialPrice)) {
                priceHTML = "<td style='width: 60px; font-size:17px;'> €" + basket[i].totPrice + "</td>";
            } else {
                priceHTML = "<td style='width: 60px; font-size:17px;color:Red;font-weight: bold;'>€" + basket[i].totPrice + " <div style='width: 60px; font-size:17px;text-decoration: line-through;color:black;font-weight: normal;'>€" + parseFloat(basket[i].totInitialPrice).toFixed(2) + "<div></td>";
                discountTextHTML = "<div class='extraList' style='color:Red' >Korting: " + basket[i].discountText + " </div>"
            }

            $("#cart").append("<tr class='cartItem'><td style='width: 4%; font-size:15px;font-weight:bold'> " + basket[i].quantity + " </td>" +
                "<td style='width: 60%; font-size:15px;font-weight:bold'> " + basket[i].productName + "<div class='extraList'>" + side.substring(19) + "</div><div>" + discountTextHTML + "</div> <div class= 'extraList' > " +
                comment(basket[i].comment, i) + "</div > </td>" +
                "<td style='width: 3%'> <div  id='btnPlus" + i + "' onclick='plusMinusCart(this)' style='cursor: pointer;'  class='plusmin'  > +</div> </td>" +
                "<td style='width: 7%'> <div  id='btnMin" + i + "' onclick='plusMinusCart(this)' style='cursor: pointer;'  class='plusmin'  > -</div></td>"
                + priceHTML +
                //"<td style='width: 15%; font-size:15px;'> €" + basket[i].totPrice + "</td>" +
                "<td style='width: 5%'> <img id='btnDel" + i + "' src='../Images/delete.png' onclick='deleteItem(this)' CssClass='linkbutton' ></img>  </td> </tr > ");
            $("#cart").append('<div class="solid" />');

        }
        $("#cart").append("</br>");
        // $("#cart").append('<div class="blacksolid" />');
        $get("MainContent_lblSubTotal").innerHTML = "€ " + parseFloat(finalPrice).toFixed(2);
        //  var reductionPercentage = $get("MainContent_lblReduction").innerHTML.replace('%', '');

        var deliveryCost = getDeliveryInfo().split(';')[2];
        var minPrice = getDeliveryInfo().split(';')[1];
        var noDeliveryCostPrice = getDeliveryInfo().split(';')[3];
        var checked_radio = $("[id*=MainContent_rdblchoice] input:checked").val();

        if (checked_radio == 'takeaway') {
            deliveryCost = "0";
            $get("divMinOrderText").style.display = "none";
            $get("MainContent_btnMenuBack").style.display = "none";
            $('#MainContent_btnOrder').attr('Value', "Bestel");
            $('#MainContent_btnOrder').attr('Style', 'display:block;margin-left:10px');
            $('#nextBtn').attr('cssclass', 'button');

        }


        if (parseFloat(finalPrice) <= parseFloat(noDeliveryCostPrice)) {
            $get("MainContent_lblDeliveryCost").innerHTML = "€ " + parseFloat(deliveryCost).toFixed(2);
            finalPrice = parseFloat(finalPrice) + parseFloat(deliveryCost.replace(',', '.'));
            $get("divDeliveryMessage").style.display = "none";
            //  $get("MainContent_lblDeliveryMessage").innerHTML = "Bestel hoger dan €" + noDeliveryCostPrice + " om te genieten van gratis bezorging!";
        }
        else {
            $get("MainContent_lblDeliveryCost").innerHTML = "Gratis";
            $get("divDeliveryMessage").style.display = "none";
        }
        console.log(finalPrice);

        //var discountedPrice = finalPrice * (parseInt(reductionPercentage) / 100);
        //finalPrice = finalPrice - discountedPrice;

        $get("MainContent_hfCart").value = localStorage.getItem('basket');

        if (parseFloat(finalPrice) < parseFloat(minPrice)) {
            if (checked_radio != 'takeaway') {
                $get("divMinOrderText").style.display = "";
                $get("MainContent_lblMinOrder").innerHTML = "Voor deze levering moet het bestelbedrag hoger zijn dan €"
                $get("MainContent_lblMinOrder").innerHTML += parseFloat(minPrice).toFixed(2);
                $get("MainContent_btnOrder").style.display = "none";
                $get("MainContent_btnMenuBack").style.display = "";
            }
        } else {
            $get("divMinOrderText").style.display = "none";
            $get("MainContent_btnMenuBack").style.display = "none";
            $('#MainContent_btnOrder').attr('Value', "Bestel");
            $('#MainContent_btnOrder').attr('Style', 'display:block;margin-left:10px');
            // $('#MainContent_nextBtn').attr('Style', 'background-color:#1f701f');
            $('#nextBtn').attr('cssclass', 'button');

        }


        $get("MainContent_lblTotPrice").innerHTML = "€ " + parseFloat(finalPrice).toFixed(2);
        $('#MainContent_hfTotPrice').prop('value', parseFloat(finalPrice).toFixed(2));

        document.getElementById("cart").style.display = "";
        document.getElementById("cartCalc").style.display = "";
    } else {
        document.getElementById("cart").style.display = "none";
        document.getElementById("cartCalc").style.display = "none";
        document.getElementById("MainContent_btnOrder").value = "Winkelmandje leeg";
        document.getElementById("nextBtn").innerHTML = "Winkelmandje leeg";
        var bColl = document.getElementsByClassName('informationText');
        for (var i = 0, len = bColl.length; i < len; i++) {
            bColl[i].style["display"] = 'none';
        }
        window.location.href = './mobile/Default.aspx';

        $('#MainContent_btnOrder').attr('disabled', true);
        $('#MainContent_btnOrder').attr('Style', 'border-color:gray;background-color:gray');

    }
}
function getDeliveryInfo() {

    var selectedValue = $get("MainContent_ddlCity").value;
    return selectedValue;
}

function showComment(ctrl) {
    var index = ctrl.id.replace('btnComment', 'divComment');
    var x = document.getElementById(index);
    if (x.style.display == "none") {
        x.style.display = "block";
        $('#' + ctrl.id).attr('style', 'display:none');

    } else {
        x.style.display = "none";
        $('#' + ctrl.id).attr('style', 'display:block');

    }
}
function hideComment(ctrl) {
    var index = ctrl.id.replace('btnCommentCancel', 'divComment');
    var btnComment = ctrl.id.replace('btnCommentCancel', 'btnComment');
    document.getElementById(btnComment).style.display = "block";
    var x = document.getElementById(index);
    x.style.display = "none";
}
function addComment(ctrl) {
    var index = ctrl.id.replace('btnCommentAdd', '');
    var btnComment = ctrl.id.replace('btnCommentAdd', 'btnComment');
    var commentText = ctrl.id.replace('btnCommentAdd', 'txtComment');
    document.getElementById(btnComment).style.display = "block";

    var getItem = JSON.parse(localStorage.getItem('basket'));

    getItem[index].comment = document.getElementById(commentText).value;

    localStorage.setItem('basket', JSON.stringify(getItem));
    initBasket();

}

function goBack() {
    history.go(-1);
    return false;
}

function comment(cmt, i) {
    var commentTitle = "";
    if (cmt == null || cmt == "") {
        cmt = "";
        commentTitle = "Voeg opmerking toe";

    } else {
        commentTitle = "Wijzig opmerking";

    }

    return "<div style='font-style:italic;'>" + cmt + "</div>" +
        "<input id='btnComment" + i + "'  class='btnComment' type='button' onclick='showComment(this)'  value='" + commentTitle + "' /></br>" +
        "<div id='divComment" + i + "' class='divComment' style='display: none;'>" +
        "<input id='txtComment" + i + "' class='txtComment' type='text' value='" + cmt + "' /></br > " +
        "<input id='btnCommentAdd" + i + "'  class='btnComment'  onclick='addComment(this)' type='button' value='Voeg toe' /> " +
        "<input id='btnCommentCancel" + i + "' class='btnComment' onclick='hideComment(this)' type='button' value='Annuleer' />" +
        "</div > ";
}

function plusMinusCart(ctrl) {
    var getItem = JSON.parse(localStorage.getItem('basket'));

    if (String(ctrl.id).startsWith("btnPlus")) {
        var index = ctrl.id.replace('btnPlus', '');
        getItem[index].quantity += 1;

    } else {
        var index = ctrl.id.replace('btnMin', '');
        if (getItem[index].quantity != 1) {
            getItem[index].quantity -= 1;
        }

    }
    // after operation setting it to local storage
    localStorage.setItem('basket', JSON.stringify(getItem));
    initBasket();
}


function deleteItem(ctrl) {
    var index = ctrl.id.replace('btnDel', '');
    var getItem = JSON.parse(localStorage.getItem('basket'));
    // setting the dataCache with new array. The new array will be created as splice is used. splice is used to remove an item from array,
    //0 is the index of the array, while second parameter 1 is to represent how many item to be removed starting from 0 ndex
    getItem.splice(index, 1);
    // after operation setting it to local storage
    localStorage.setItem('basket', JSON.stringify(getItem));
    initBasket();
}


function calcDiscount(totPrice) {
    console.log(totPrice);
    $.ajax({
        type: "POST",
        url: '../PlaceOrder.aspx/calcDisc',
        contentType: "application/json; charset=utf-8",
        data: "{price:" + totPrice + "}",
        success: function (data) {
            console.log(data.d);
            $('#MainContent_reductedPrice').val(data.d);

        },
        failure: function (response) {
            console.log(response.d);
            alert(response.d);
        }
    });
}



// --- Configuration ---
// const LEAD_TIME_MINUTES = 40;
//const START_LEAD_TIME_MINUTES = 15;
const INTERVAL_MINUTES = 15;
const OVERNIGHT_CUTOFF_HOUR = 5; // Times 00:00 to 04:59 are considered part of the previous day's shift

/**
 * Helper function to convert an HH:mm time string into a Date object, 
 * correctly setting the day for overnight shifts.
 *
 * @param {string} timeString The time in 'HH:mm' format (e.g., '14:30').
 * @returns {Date} A Date object representing the time on the correct calendar day.
 */
function parseTimeStringToDate(timeString) {
    if (!timeString || typeof timeString !== 'string') {
        console.error("Invalid time string provided.");
        return new Date(); // Return current time as a fallback
    }
    const [hours, minutes] = timeString.split(':').map(Number);

    let baseDate = new Date(); // Start with today's date

    // 1. Determine the service window's reference date (baseDate)
    // If the current time is early morning (e.g., 01:00 AM), we assume we are still 
    // within the business day that started yesterday.
    if (baseDate.getHours() < OVERNIGHT_CUTOFF_HOUR) {
        // Shift the base date back one day
        baseDate.setDate(baseDate.getDate() - 1);
    }

    // 2. Create the date object using the determined baseDate (Today or Yesterday)
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);

    // 3. Handle overnight wraps for the closing time.
    // If the parsed time is an early morning time (00:00-05:00), it means it's the 
    // closing time, which must be pushed to the calendar day *after* the base date.
    if (hours >= 0 && hours < OVERNIGHT_CUTOFF_HOUR) {
        date.setDate(date.getDate() + 1);
    }

    return date;
}

/**
 * Rounds a given Date object up to the next nearest 15-minute interval.
 * * @param {Date} date The date/time object to round.
 * @returns {Date} The rounded-up Date object.
 */
function roundUpTime(date) {
    const ms = 1000 * 60 * INTERVAL_MINUTES; // 15 minutes in milliseconds

    // Calculate the difference needed to reach the next interval boundary
    const nextInterval = Math.ceil(date.getTime() / ms) * ms;

    return new Date(nextInterval);
}

/**
 * Generates an array of delivery time slots between a start and end date/time strings,
 * factoring in a 40-minute lead time and 15-minute intervals.
 *
 * @param {string} startTimeString The earliest possible time the restaurant is open (e.g., '10:00').
 * @param {string} endTimeString The restaurant's closing time (e.g., '22:30').
 * @returns {Array<string>} An array of time strings (HH:mm).
 */
function generateDeliverySlots(startTimeString, endTimeString, START_LEAD_TIME_MINUTES, LEAD_TIME_MINUTES) {

    const slots = [];

    // --- CONVERT STRINGS TO DATE OBJECTS ---
    console.log("Start Time Strding: " + startTimeString);
    console.log("End Time String: " + endTimeString);
    const startDate = parseTimeStringToDate(startTimeString);
    const endDate = parseTimeStringToDate(endTimeString);

    // Get the current time for lead time calculation
    const now = new Date();

    // Check if the restaurant is already closed
    if (now.getTime() >= endDate.getTime()) {
        console.log("Restaurant is already closed for the current shift.");
        return slots;
    }

    // 1. Calculate the Soonest Available Time (Now + 40 minutes lead time)
    const earliestReadyTime = new Date(now.getTime() + LEAD_TIME_MINUTES * 60000); // 60000 ms/min

    // 2. Calculate the minimum scheduled time (Start Time + 40 minutes)
    const minScheduledTime = new Date(startDate.getTime() + START_LEAD_TIME_MINUTES * 60000);

    // 3. Determine the Actual Start Time for the dropdown (unrounded)
    // This is the LATER of the minimum scheduled time OR the earliest time the order can be ready.
    let currentSlot = (minScheduledTime.getTime() > earliestReadyTime.getTime()) ? minScheduledTime : earliestReadyTime;

    // 4. Round the starting slot up to the next 15-minute interval
    // Example: 20:55 (unrounded) rounds to 21:00. This is the issue.
    currentSlot = roundUpTime(currentSlot);

    // 4b. ******* CORRECTION FOR LAST SLOT BOUNDARY *******
    // If the rounded currentSlot is exactly equal to the endDate, we check if the unrounded time
    // was close enough to include the previous slot (i.e., the delivery will finish before closing).
    if (currentSlot.getTime() === endDate.getTime()) {
        // Calculate the last possible slot start time: endDate minus 15 minutes.
        const lastValidSlotStart = new Date(endDate.getTime() - INTERVAL_MINUTES * 60000);

        // If the unrounded earliestReadyTime is greater than the last valid slot start time
        // but still less than the end time (e.g., 20:55 > 20:45 AND 20:55 < 21:00), 
        // we force the start time back to the last valid slot start.
        if (earliestReadyTime.getTime() < endDate.getTime() && earliestReadyTime.getTime() > lastValidSlotStart.getTime()) {
            // Force the currentSlot back to the start of the last valid interval (e.g., 20:45)
            currentSlot = lastValidSlotStart;
            console.log("Boundary correction applied. First slot forced to: " + currentSlot.toLocaleTimeString());
        }
    }

    // 5. Loop and generate slots in 15-minute increments
    while (currentSlot.getTime() < endDate.getTime()) {

        // Format the time as HH:mm
        const hours = currentSlot.getHours().toString().padStart(2, '0');
        const minutes = currentSlot.getMinutes().toString().padStart(2, '0');

        slots.push(`${hours}:${minutes}`);

        // Advance to the next 15-minute interval
        currentSlot.setMinutes(currentSlot.getMinutes() + INTERVAL_MINUTES);
    }

    return slots;
}

/**
 * Populates a dropdown element with time slots and the "Zo snel mogelijk" option.
 *
 * The "Zo snel mogelijk" (ZSM) option is only added if:
 * 1. The restaurant is currently open (current time > start time).
 * 2. The current time is before the first calculated time slot.
 *
 * * @param {string} elementId The client-side ID of the select element.
 * @param {Array<string>} slots An array of formatted time strings (HH:mm).
 * @param {string} startTimeString The restaurant's opening time in HH:mm format.
 */
function populateDropdown(elementId, slots, startTimeString) {
    const dropdown = document.getElementById(elementId);

    if (!dropdown) {
        console.error(`Dropdown element with ID '${elementId}' not found.`);
        return;
    }

    // 1. Clear existing options
    dropdown.innerHTML = '';

    const now = new Date();
    const startDate = parseTimeStringToDate(startTimeString);

    // 2. Determine if the first time slot is ready immediately (ZSM condition)
    let shouldAddZSM = false;


    // ZSM Condition Check:
    // A. Is the restaurant currently open? (now > startDate)
    const isRestaurantOpen = now.getTime() > startDate.getTime();
    console.log("startdate: " + startDate);
    // B. Is the shop currently open for the next 40 minutes?
    // We check if the earliest order time is before the shop's closing time.
    const isOrderPossible = slots.length > 0;
    console.log("isRestaurantOpen: " + isRestaurantOpen);
    console.log("isOrderPossible: " + isOrderPossible);
    // C. If the restaurant is open AND we have calculated available slots, ZSM should be an option.
    if (isRestaurantOpen && isOrderPossible) {
        console.log("Adding ZSM option: Restaurant is open and order is possible.");
        shouldAddZSM = true;
    }

    // --- OLD LOGIC CHECK (for debugging comparison) ---
    // If the old logic prevented ZSM, it meant 'now' was greater than the first slot time.
    // Example: Shop opens 17:15. If it's 17:20, 'now' is greater than '17:15', but ZSM should still apply.
    // By using 'isOrderPossible' (slots.length > 0), we simplify this: if the calculated start time 
    // (which includes the 40 min lead time) is before the close time, we're good to go.

    // 3. Add ZSM option if conditions are met
    if (shouldAddZSM) {
        const zsmOption = document.createElement('option');
        zsmOption.value = 'ZSM';
        zsmOption.textContent = 'Zo snel mogelijk';
        dropdown.appendChild(zsmOption);
    }

    // 4. Handle case where no slots are available
    if (slots.length === 0 && !shouldAddZSM) {
        const closedOption = document.createElement('option');
        closedOption.value = 'ZSM';
        closedOption.textContent = 'Zo snel mogelijk';
        dropdown.appendChild(closedOption);
        return;
    }

    // 5. Add generated time slots
    slots.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        dropdown.appendChild(option);
    });
}



