let productList = [];
var discountPerc = "";
var deliveryCost = "";
var isLogged;
var finalPrice = 0;
var btn = $('#button');
var limit = 3;
var amount = 1;
var baseValue = 0.0;
var reducedPrice = 0.0;
var discountText;
var subTotal = 0.0;
var productId;
var mainProductId;
var productName;
var chk = $(this).parent().closest('[id*=Repeater2]').find('[id*="chkGarnish"]');
var stepAmount = 0.05;
var extraTotal = 0.0;


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
                console.log("Generated slots:", openNowSlots);
                populateDropdown("MainContent_ddlDeliveryHours", openNowSlots, openInfo.split(';')[3], openInfo);
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



function RefreshCart(type) {
    var basket = localStorage.getItem('basket');

    $.ajax({
        url: 'WebService.asmx/GetJson',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{basket: ' + JSON.stringify(basket) + ', type: "' + type + '"}',
        success: function (data) {
            var str = JSON.stringify(data).substring(6);
            var json = str.substring(0, str.length - 2);
            json = json.replace(/\\/g, "");

            localStorage.setItem('basket', json);
            initBasket();
        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });
}

function calcTotPrice() {
    var basket = JSON.parse(localStorage.getItem('basket'));

    var totPrice = 0;

    if (localStorage.getItem('basket') != null && basket.length > 0) {
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



function TotPrice() {
    var basket = localStorage.getItem('basket');
    var totPrice = 0;

    if (basket != null) {
        if (JSON.parse(basket).length > 0) {
            JSON.parse(basket).forEach((item) => {
                totPrice = totPrice + (parseFloat(item.totPrice) * parseInt(item.quantity));
            });
            return totPrice.toFixed(2);
        } else {
            return 0;
        }
    } else {

        return 0;
    }
}


function saveOrder(listControlId, controlName) {
    let productList = [];
    $('#modelProductDetail').modal('hide');

    calculatePrices(listControlId, controlName);



    var extraList = [];
    var productExtraList = [];
    var orderid = uuidv4();
    var totPricePerProduct;
    var basePrice;
    var id = listControlId.id
    var optionList = [];
    var lineId = "";
    const now = new Date();
    // Get all elements with class names starting with "form-check-input" (including asterisk at end)
    var input = document.querySelectorAll('[class^="form-check-input"]');
    console.log(input);

    if (listControlId.id != null) {


        var ddl = document.getElementsByName("dropdown");
        if (ddl.length > 0) {
            for (var i = 0; i < ddl.length; i++) {

                if (ddl[i].options[ddl[i].selectedIndex].value.split(',')[5] == "extra") {
                    extraList.push({
                        "id": ddl[i].options[ddl[i].selectedIndex].value.split(',')[0],
                        "price": ddl[i].options[ddl[i].selectedIndex].value.split(',')[1],
                        "name": ddl[i].options[ddl[i].selectedIndex].value.split(',')[2]
                    });
                } else {
                    productExtraList.push({
                        "id": ddl[i].options[ddl[i].selectedIndex].value.split(',')[0],
                        "price": ddl[i].options[ddl[i].selectedIndex].value.split(',')[1],
                        "name": ddl[i].options[ddl[i].selectedIndex].value.split(',')[2]
                    });
                }
            }
        }

        if (input.length > 0) {


            for (var i = 0; i < input.length; i++) {
                if (input[i].checked) {

                    if (input[i].value.split(',')[5] == "extra") {
                        extraList.push({
                            "id": input[i].value.split(',')[0],
                            "price": input[i].value.split(',')[1],
                            "name": input[i].value.split(',')[2]
                        });
                    } else {
                        productExtraList.push({
                            "id": input[i].value.split(',')[0],
                            "price": input[i].value.split(',')[1],
                            "name": input[i].value.split(',')[2]
                        });
                    }

                }
            }
        }



    }



    //  totPricePerProduct = parseFloat($('#bottombar_hfTotPrice').prop('value').replace('€', '').replace(',', '.'));
    //  basePrice = $('#bottombar_hfInitialTotPrice').prop('value').replace('€', '').replace(',', '.');


    // Get the existing data
    var existing = localStorage.getItem('basket');

    // If no existing data, create an array
    // Otherwise, convert the localStorage string to an array
    existing = existing ? JSON.parse(existing) : {};

    var extraListId = $.map(extraList, function (v) { return v.id; }).join('');
    var optionListId = $.map(optionList, function (v) { return v.id; }).join('');
    var productExtraListId = $.map(productExtraList, function (v) { return v.id; }).join('');


    //if (subTotal == null ) {
    //    subTotal = totPricePerProduct;
    //}
    subTotal = DecRound(parseFloat(subTotal), stepAmount, "Nearest").toFixed(2);
    totPricePerProduct = DecRound(parseFloat(reducedPrice) + parseFloat(extraTotal), stepAmount, "Nearest").toFixed(2);
    baseValue = DecRound(parseFloat(baseValue), stepAmount, "Nearest").toFixed(2);




    lineId = mainProductId + productId + optionListId + extraListId + productExtraListId;
    if (!isObjectEmpty(existing)) {
        existing.push({
            "lineId": lineId, "mainProductId": mainProductId, "productId": productId, "productName": productName,
            "options": optionList,
            "extras": extraList, "productExtraList": productExtraList,
            "totPrice": totPricePerProduct
            , "totInitialPrice": subTotal, "discountText": discountText, "quantity": amount, "mainPrice": baseValue
        })
        var unique = dedup_and_sum(existing, 'lineId');

        localStorage.setItem('basket', JSON.stringify(unique));

    } else {
        productList.push({
            "lineId": lineId, "mainProductId": mainProductId, "productId": productId, "productName": productName,
            "options": optionList,
            "extras": extraList, "productExtraList": productExtraList,
            "totPrice": totPricePerProduct
            , "totInitialPrice": subTotal, "discountText": discountText, "quantity": amount, "mainPrice": baseValue
        })
        var unique = dedup_and_sum(productList, 'lineId');
        localStorage.setItem('basket', JSON.stringify(unique));

    }

    // Save back to localStorage
    $('#bottombar_hfCart').val(localStorage.getItem('basket'));

    $("input[type=checkbox]").prop('checked', false);
    $('#bottombar_btnOrder').innerText = TotPrice();
    $('#bottombar_hfTotPrice').val(TotPrice());

    $('#bottombar_btnOrder').removeAttr("disabled");
    $('#bottombar_btnOrder').attr("style", "background-color: white");

    // calculatePrices(listControlId, controlName);

    const item = {
        expiry: now.getTime() + 180000,
    }
    localStorage.setItem('timestamp', JSON.stringify(item))

    subTotal = 0;
    extraTotal = 0;

    $("input[type=checkbox]").prop('checked', false);
    $('#cartbar_btnOrder').removeAttr("disabled");
    $('#cartbar_btnOrder').attr('Value', 'Bestellen');
    $('#cartbar_btnOrder').attr('Style', 'background-color:darkred');

    initBasket();

    $('#modalProductDetail').modal('hide');
    return false;

}

function saveOrder_old(listControlId, controlName) {
    var extraOptionId = "";
    var extraOptionName = "";
    var extraList = [];
    var productExtraList = [];
    var optionList = [];
    var id = listControlId.id;

    var orderid = uuidv4();
    var chkExtras = id.replace(controlName, "chkExtras");
    var ddlMenu = id.replace(controlName, "ddlMenu");
    var rdblExtraOption = id.replace(controlName, "rdblExtraOption");
    var hfCart = id.replace(controlName, "hfCart");


    var totPricePerProduct;
    var basePrice;
    var reductedPrice;
    //var rdblSize = id.replace(controlName, "rdblSize");
    var hfProductId = id.replace(controlName, "hfProductId");
    var hfMainProductId = id.replace(controlName, "hfMainProductId");
    var btnSave = id.replace(controlName, "btnSave");
    var lblHeaderTotPrice = id.replace(controlName, "lblHeaderTotPrice");
    var hfReducedPrice = id.replace(controlName, "hfReducedPrice");
    var hfPrice = id.replace(controlName, "hfPrice");
    var hfHeaderDiscountText = id.replace(controlName, "hfHeaderDiscountText");

    var lblProductName = id.replace(controlName, "lblProductName");
    var lineId = "";

    calculatePrices(listControlId, controlName);

    hfProductId = $('#' + hfProductId + '').prop('value')
    hfMainProductId = $('#' + hfMainProductId + '').prop('value')
    lblProductName = $('#' + lblProductName + '').prop('innerHTML')
    hfHeaderDiscountText = $('#' + hfHeaderDiscountText + '').prop('value')


    //$.each($("input[id*='" + chkGarnish + "']:checked"), function () {

    //    garnishList.push({
    //        "id": $(this).val().split(',')[0],
    //        "price": $(this).val().split(',')[1],
    //        "name": $(this).val().split(',')[2]
    //    })
    //});
    //$.each($("input[id*='" + chklExtraDrink + "']:checked"), function () {
    //    extraDrinkList.push({
    //        "id": $(this).val().split(',')[0],
    //        "priceId": $(this).val().split(',')[1],
    //        "price": $(this).val().split(',')[2],
    //        "name": $(this).val().split(',')[3]
    //    })
    //});

    if (listControlId.tagName != "DIV") {

        var optionchldren = listControlId.parentNode.parentNode.firstElementChild.children;
        var extrachldren = listControlId.parentNode.parentNode.children[1].children;


        for (var i = 0; i < extrachldren.length; i++) {

            var child = extrachldren[i].firstElementChild.children[1].id;
            if (extrachldren[i].firstElementChild.children[1].tagName == "SELECT") {
                if (extrachldren[i].firstElementChild.children[1].id.split('§')[1] == "productExtra") {
                    productExtraList.push({
                        "id": $("[id$='" + child + "']").find(":selected").val().split(',')[0],
                        "price": $("[id$='" + child + "']").find(":selected").val().split(',')[1],
                        "name": $("[id$='" + child + "']").find(":selected").val().split(',')[2]
                    });

                } else {
                    extraList.push({
                        "id": $("[id$='" + child + "']").find(":selected").val().split(',')[0],
                        "price": $("[id$='" + child + "']").find(":selected").val().split(',')[1],
                        "name": $("[id$='" + child + "']").find(":selected").val().split(',')[2]
                    });
                }
            }

            if (extrachldren[i].firstElementChild.children[1].className == "checklist") {

                if (extrachldren[i].firstElementChild.children[1].id.split('§')[1] == "productExtra") {
                    $.each($("input[id*='" + child + "']:checked"), function () {

                        productExtraList.push({
                            "id": $(this).val().split(',')[0],
                            "price": $(this).val().split(',')[1],
                            "name": $(this).val().split(',')[2]
                        });
                    });

                } else {
                    $.each($("input[id*='" + child + "']:checked"), function () {

                        extraList.push({
                            "id": $(this).val().split(',')[0],
                            "price": $(this).val().split(',')[1],
                            "name": $(this).val().split(',')[2]
                        });
                    });
                }
            }

            if (extrachldren[i].firstElementChild.children[1].className == "radiolist") {
                if (extrachldren[i].firstElementChild.children[1].id.split('§')[1] == "productExtra") {
                    if ($("[id$='" + child + "']").find(":checked").val() != null) {
                        productExtraList.push({
                            "id": $("[id$='" + child + "']").find(":checked").val().split(',')[0],
                            "price": $("[id$='" + child + "']").find(":checked").val().split(',')[1],
                            "name": $("[id$='" + child + "']").find(":checked").val().split(',')[2]
                        });
                    }
                } else {

                    if ($("[id$='" + child + "']").find(":checked").val() != null) {
                        extraList.push({
                            "id": $("[id$='" + child + "']").find(":checked").val().split(',')[0],
                            "price": $("[id$='" + child + "']").find(":checked").val().split(',')[1],
                            "name": $("[id$='" + child + "']").find(":checked").val().split(',')[2]
                        });
                    }
                }
            }
        }


        for (var i = 0; i < optionchldren.length; i++) {

            var child = optionchldren[i].firstElementChild.children[1].id;

            if (optionchldren[i].firstElementChild.children[1].tagName == "SELECT") {

                optionList.push({
                    "id": $("[id$='" + child + "']").find(":selected").val().split(',')[0],
                    "name": $("[id$='" + child + "']").find(":selected").val().split(',')[1]
                });
            }

            if ($("[id$='" + child + "']").find(":checked").val() != null) {
                $.each($("input[id*='" + child + "']:checked"), function () {
                    optionList.push({
                        "id": $(this).val().split(',')[0],
                        "name": $(this).val().split(',')[1]
                    });
                });
            }
        }
    }

    //if ($("[id$='" + rdblSize + "']").find(":checked").val() != null) {
    //    sizeId = $("[id$='" + rdblSize + "']").find(":checked").val().split(',')[0];
    //    sizePrice = $("[id$='" + rdblSize + "']").find(":checked").val().split(',')[1];
    //    sizeName = $("[id$='" + rdblSize + "']").find(":checked").next("label").html().split(' ')[0];
    //} else {
    //    sizeId = "nvt";
    //}
    //if (controlName == "hdr") {
    //    totPricePerProduct = $('#' + lblHeaderTotPrice + '').prop('innerText').replace('€', '').replace(' ', '');

    //} else {
    //    totPricePerProduct = $('#cartbar_hfTotPrice').prop('value').replace('€', '').replace(',', '.');

    //}
    totPricePerProduct = $('#cartbar_hfTotPrice').prop('value').replace('€', '').replace(',', '.');
    basePrice = $('#cartbar_hfInitialTotPrice').prop('value').replace('€', '').replace(',', '.');

    // Get the existing data
    var existing = localStorage.getItem('basket');
    // If no existing data, create an array
    // Otherwise, convert the localStorage string to an array
    existing = existing ? JSON.parse(existing) : {};

    ;
    var mainPrice = $('#' + hfPrice).prop('value').replace('€', '').replace(',', '.');
    var extraListId = $.map(extraList, function (v) { return v.id; }).join('');
    //  var garnishListId = $.map(garnishList, function (v) { return v.id; }).join('');
    //   var extraDrinkListId = $.map(extraDrinkList, function (v) { return v.id; }).join('');
    var optionListId = $.map(optionList, function (v) { return v.id; }).join('');
    let sum = 0
    var sumExtraList = $.map(extraList, function (v) { return sum += Number.parseFloat(v.price); });
    var productExtraListId = $.map(productExtraList, function (v) { return v.id; }).join('');


    const now = new Date()
    lineId = hfMainProductId + hfProductId + optionListId + extraListId + productExtraListId;
    if (!isObjectEmpty(existing)) {
        existing.push({
            "lineId": lineId, "mainProductId": hfMainProductId, "productId": hfProductId, "productName": lblProductName,
            "options": optionList, "extras": extraList, "productExtraList": productExtraList,
            "totPrice": totPricePerProduct, "totInitialPrice": basePrice, "discountText": hfHeaderDiscountText, "quantity": 1, "mainPrice": mainPrice
        })
        var unique = dedup_and_sum(existing, 'lineId');

        localStorage.setItem('basket', JSON.stringify(unique));

    } else {
        productList.push({
            "lineId": lineId, "mainProductId": hfMainProductId, "productId": hfProductId, "productName": lblProductName,
            "options": optionList, "extras": extraList, "productExtraList": productExtraList, "totPrice": totPricePerProduct,
            "totInitialPrice": basePrice, "discountText": hfHeaderDiscountText, "quantity": 1, "mainPrice": mainPrice
        })
        var unique = dedup_and_sum(productList, 'lineId');
        localStorage.setItem('basket', JSON.stringify(unique));
    }
    // Save back to localStorage
    $('#cartbar_hfCart').val(localStorage.getItem('basket'));

    $("input[type=checkbox]").prop('checked', false);
    $('#cartbar_btnOrder').removeAttr("disabled");
    $('#cartbar_btnOrder').attr('Value', 'Bestellen');
    $('#cartbar_btnOrder').attr('Style', 'background-color:darkred');


    initBasket();

    const item = {
        expiry: now.getTime() + 180000,
    }
    localStorage.setItem('timestamp', JSON.stringify(item))
    return false;

}

function getLoggedUserSuccess(result) {
    isLogged = result;
}

function DecRound(value, stepAmount) {
    var type = $('#MainContent_hfRounding').prop('value');
    var inverse = 1 / stepAmount;
    var dividend = value * inverse;
    switch (type) {
        case "Nearest":
            value = Math.ceil(value / stepAmount) * stepAmount;
            break;
        case "Round":
            value = Math.max(Math.round(value * 10) / 10);
            break;
        case "noroundup":
            value = value;
            break;
        default:
            break;
    }
    return value;
}



function InitProduct(event) {


    baseValue = parseFloat($(event).find("[id*='hfPrice']").val()).toFixed(2);
    productId = $(event).find("[id*='hfProductId']").val();
    mainProductId = $(event).find("[id*='hfMainProductId']").val();
    productName = $(event).find("[id*='lblProductName']").html(); // document.getElementById(event.id.replace("hdr", "lblProductName")).innerText;
    isModal = $(event).find("[id*='hfType']").val();
    reducedPrice = parseFloat($(event).find("[id*='hfReducedPrice']").val()).toFixed(2);

    discountText = $(event).find("[id*='hfDiscount']").val();

    if (isModal == "true") {
        // Add modal-specific CSS dynamically
        if (!document.getElementById('modalProductDetailCustomStyles')) {
            var style = document.createElement('style');
            style.id = 'modalProductDetailCustomStyles';
            style.innerHTML = `
                #modalProductDetail .modal-dialog {
                    overflow-y: initial !important;
                }
                #modalProductDetail .modal-body {
                    overflow-y: auto;
                }
            `;
            document.head.appendChild(style);
        }

        $('#modalProductDetail').modal('show');
        GetProductDetail();
    } else {

        $(event).find("[id*='hdr']").attr('data-toggle', 'hidden');
        $(event).find("[id*='hdr']").removeAttr('data-target');


        //                productImage.Attributes["data-toggle"] = "hidden";

        amount = 1;
        saveOrder(this, 'hdr');
    }


}
function isEmpty(obj) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }
    return true;
}

function GetProductDetail(listControlId) {

    //    modalTrigger = listControlId.id;
    fieldName = $(".btn-number").attr('data-field');
    var input = $("input[name='" + fieldName + "']");
    input.val(1).change();
    subTotal = 0;
    amount = 1;


    $.ajax({
        url: '../WebService.asmx/GetProductDetail',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{mainProductId: ' + mainProductId + ', productId: "' + productId + '"}',
        success: function (data) {
            const result = Object.groupBy(data.d, ({ line_name }) => line_name);
            console.log(result);
            document.getElementById("MainContent_pnlExtra").innerHTML = "";


            if (isEmpty(data.d)) {
                console.log("json is empty");

                $('#' + listControlId.id).attr('data-toggle', 'hidden');
                $('#' + listControlId.id).attr('onclick', "return saveOrder(this, 'hdr');");
                return;
            } else {


                document.getElementById("modelCenterTitleProductDetail").innerHTML = productName;
                var i = 0
                for (const key in result) {
                    var card = document.createElement('div');
                    card.className = "card bg-transparent m-0 ";
                    document.getElementById("MainContent_pnlExtra").appendChild(card);
                    card.id = result[key][0].extra_type_id;
                    var cardBody = document.createElement('div');
                    cardBody.className = "card-body bg-transparent m-0";
                    card.appendChild(cardBody);


                    i = 0;
                    var cardBodyH5 = document.createElement('h5');
                    cardBodyH5.className = "card-title text-dark font-weight-bold bg-transparent mb-10";
                    cardBody.appendChild(cardBodyH5);

                    // Check the inner value for the limit and use it in the innerText
                    if (result[key] && result[key][0] && result[key][0].limit) {
                        const limitValue = result[key][0].limit;
                        cardBodyH5.innerText = "Keuze " + key + " (max: " + limitValue + ")";
                    } else {
                        cardBodyH5.innerText = "Keuze " + key;
                    }
                    cardBody.appendChild(cardBodyH5);
                    var textnode2 = document.createElement("select");
                    textnode2.classList = "form-select";


                    var span = document.createElement('span');
                    var keyId = key.replace(/\s/g, '');
                    keyId = keyId.replace(/[^a-zA-Z0-9']/g, '_');
                    span.id = "more" + keyId;
                    span.className = "more";
                    cardBody.appendChild(span);

                    var dropdownFlag = false;

                    result[key].forEach(item => {
                        //radio, check or dropdown depending on control value


                        switch (item.control) {
                            case "check":
                                var div = document.createElement('div');
                                div.className = "form-check";

                                var checkbox = document.createElement('input');
                                checkbox.type = "checkbox";
                                checkbox.className = "form-check-input " + keyId;
                                checkbox.name = "extra";
                                checkbox.value = item.extra_id + "," + item.value + "," + item.name + "," + item.control + "," + item.limit + "," + item.type;

                                checkbox.id = item.line_name + item.extra_id;


                                checkbox.setAttribute("onclick", "return calculatePrices(this, '" + checkbox.id + "') && limitSelection(this,'" + keyId + "');");

                                var label = document.createElement('label');
                                label.htmlFor = item.line_name + item.extra_id;;
                                label.className = "form-check-label";
                                if (item.value != 0) {
                                    label.appendChild(document.createTextNode(item.name + " (+€" + item.value.toFixed(2) + ")"));
                                } else {
                                    label.appendChild(document.createTextNode(item.name));
                                }
                                if (i > 4) {
                                    span.appendChild(div);

                                } else {
                                    cardBody.appendChild(div);
                                }
                                div.appendChild(checkbox);
                                div.appendChild(label);

                                break;
                            case "radio":
                                var div = document.createElement('div');
                                div.className = "form-check";
                                if (i > 4) {
                                    span.appendChild(div);

                                } else {
                                    cardBody.appendChild(div);
                                }

                                var checkbox = document.createElement('input');
                                checkbox.type = "radio";
                                checkbox.className = "form-check-input";
                                checkbox.name = "extra" + key;
                                // checkbox.name = item.line_name + key;                                        
                                checkbox.setAttribute("onclick", "return calculatePrices(this, '" + checkbox.id + "')");

                                checkbox.value = item.extra_id + "," + item.value + "," + item.name + "," + item.control + "," + item.limit + "," + item.type;
                                checkbox.id = item.line_name + item.extra_id;
                                var label = document.createElement('label')
                                label.htmlFor = item.line_name + item.extra_id;;
                                label.className = "form-check-label";
                                if (item.value != 0) {
                                    label.appendChild(document.createTextNode(item.name + " (+€" + item.value.toFixed(2) + ")"));
                                } else {
                                    label.appendChild(document.createTextNode(item.name));
                                }
                                //  label.appendChild(document.createTextNode(item.name));
                                div.appendChild(checkbox);
                                div.appendChild(label);

                                break;
                            case "dropdown":
                                // code block
                                var op = new Option();
                                op.value = item.extra_id + "," + item.value + "," + item.name + "," + item.control + "," + item.limit + "," + item.type + "," + item.related_extra_type;
                                textnode2.name = "dropdown";
                                op.setAttribute("onclick", "return calculatePrices(this, '" + op.id + "')");

                                if (item.value != 0) {
                                    op.text = item.name + " (+€" + item.value.toFixed(2) + ")";
                                } else {
                                    op.text = item.name;
                                }
                                textnode2.options.add(op);
                                cardBody.appendChild(textnode2);
                                dropdownFlag = true;
                                break;
                        }

                        i++;
                    });

                    if (result[key][0].inherited === true) {

                        card.style.display = "none";
                        continue;
                    }

                    if (i > 4 && dropdownFlag == false) {


                        var dots = document.createElement('span');
                        var keyId = key.replace(/\s/g, '');
                        keyId = keyId.replace(/[^a-zA-Z0-9]/g, '_');
                        dots.id = "dots" + keyId;
                        dots.innerText = "";
                        cardBody.appendChild(dots);

                        var button = document.createElement('a');
                        var keyId = key.replace(/\s/g, '');
                        keyId = keyId.replace(/[^a-zA-Z0-9]/g, '_');
                        button.id = "btnMore" + keyId;
                        button.style.color = "Red";
                        button.style.fontFamily = "Zapf Dingbats";
                        button.innerHTML = "Laat meer zien <span class='material-symbols-outlined'>arrow_drop_down</span>";
                        button.setAttribute("onclick", "moreLess('" + button.id + "'); return false;");
                        cardBody.appendChild(button);
                    }
                    calculatePrices('', '');
                }

            }
        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });

}

function moreLess(id) {
    var dots = document.getElementById("dots" + id.substring(7));
    var moreText = document.getElementById("more" + id.substring(7));
    var btnText = document.getElementById(id);
    if (dots.style.display === "none") {
        dots.style.display = "inline";
        btnText.innerHTML = "Laat meer zien <span class='material-symbols-outlined'>arrow_drop_down</span>";
        moreText.style.display = "none";
    } else {
        dots.style.display = "none";
        btnText.innerHTML = "Laat minder zien <span class='material-symbols-outlined'>arrow_drop_up</span>";
        moreText.style.display = "inline";
    }
    return false;
}

$(function () {
    // Scroll Event
    $(window).on('scroll', function () {
        var scrolled = $(window).scrollTop();
        if (scrolled > 300) $('.back-to-top').addClass('active');
        if (scrolled < 300) $('.back-to-top').removeClass('active');
    });
    // Click Event
    $('.back-to-top').on('click', function () {
        $("html, body").animate({
            scrollTop: "0"
        }, 500);
    });
});


var oldId = "";
var isModal;


$("#modelProductDetail").on("hidden.bs.modal", function () {

});

function hideImg() {
    //document.getElementById("HideImg")
    //    .style.display = "none";
}

$(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
        btn.addClass('show');
    } else {
        btn.removeClass('show');
    }
});

btn.on('click', function (e) {
    e.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, '300');
});



function limitSelection(listControlId, controlName) {
    var input = document.getElementsByClassName("form-check-input " + controlName);
    var it = 0;
    console.log("test");
    for (var i = 0; i < input.length; i++) {
        if (input[i].checked) {
            limit = input[i].value.split(',')[4];

            if (limit != 0) {
                it++;

                if (it > limit) {
                    listControlId.checked = false;
                }
            }
        }
    }
}


function calculatePrices(listControlId, controlName) {
    //  var id = listControlId.id
    var stepAmount = 0.05;
    var total = 0.0;
    var initalprice = 0;

    initalprice = baseValue; //parseFloat($('#' + hfPrice + '').prop('value').replace(",", "."));

    if (parseFloat(reducedPrice) != parseFloat(initalprice)) {
        initalprice = reducedPrice;
    }


    if (isModal == "true") {

        var it = 0;
        var input = document.querySelectorAll('[class^="form-check-input"]');
        // var input = document.getElementsByClassName("form-check-input");

        for (var i = 0; i < input.length; i++) {
            if (input[i].checked) {
                total += parseFloat(input[i].value.split(',')[1]);
                //limit = input[i].value.split(',')[4];

                //if (limit != 0) {
                //    it++;
                //    if (it > limit) {
                //        listControlId.checked = false;
                //    }
                //}
            }
        }

        var ddl = document.getElementsByName("dropdown");
        for (var i = 0; i < ddl.length; i++) {
            var card;
            var relatedExtraType = ddl[i].options[ddl[i].selectedIndex].value.split(',')[6];


            if (relatedExtraType && relatedExtraType !== "0") {
                // If there is a value, show the card
                card = document.getElementById(relatedExtraType);
                if (card) {
                    card.style.display = "";
                    oldId = relatedExtraType;
                }
            }
            if (relatedExtraType === "0") {
                // If there is no value, hide the previous card

                card = document.getElementById(oldId);
                if (card) {
                    card.style.display = "none";
                }
            }
            total += parseFloat(ddl[i].options[ddl[i].selectedIndex].value.split(',')[1]);
        }
        extraTotal = parseFloat(total);
    }
    console.log("baseValue: " + baseValue);

    subTotal = parseFloat(parseFloat(baseValue) + parseFloat(total)).toFixed(2);
    var totalText = subTotal * amount;
    document.getElementById("MainContent_btnAdd").value = "€" + totalText.toFixed(2);
    return subTotal;
}

function calculatePrices_old(listControlId, controlName) {
    var total = 0.0;
    var id = listControlId.id
    var chkGarnish = id.replace(controlName, "chkGarnish");
    var chklExtraDrink = id.replace(controlName, "chklExtraDrink");
    var chkExtras = id.replace(controlName, "chkExtras");
    var rdblSize = id.replace(controlName, "rdblSize");
    var rdblExtraSauce = id.replace(controlName, "rdblExtraSauce");
    var ddlMenu = id.replace(controlName, "ddlMenu");
    var hfReducedPrice = id.replace(controlName, "hfReducedPrice");
    var initalprice = 0;
    var stepAmount = 0.05;


    var extrachldren;
    if (listControlId.className == "card-header") {
        var hfPrice = id.replace(controlName, "hfPrice");
        var hfReducedPrice = id.replace(controlName, "hfReducedPrice");
        var basePrice = parseFloat($('#' + hfPrice + '').prop('value').replace(",", "."));
        var reducedPrice = parseFloat($('#' + hfReducedPrice + '').prop('value').replace(",", "."));
        initalprice = parseFloat($('#' + hfPrice + '').prop('value').replace(",", "."));


        if (parseFloat(reducedPrice) != parseFloat(initalprice)) {
            initalprice = reducedPrice;
        }

        $('#cartbar_hfTotPrice').prop('value', DecRound(parseFloat(initalprice + total), stepAmount).toFixed(2));
        $('#cartbar_hfInitialTotPrice').prop('value', DecRound(parseFloat(basePrice + total), stepAmount).toFixed(2));
    } else {



        if (listControlId.tagName == "INPUT") {
            extrachldren = listControlId.parentNode.parentNode.children[1].children;
            var hfPrice = listControlId.parentNode.parentNode.children[2].children[1].id;
            var hfReducedPrice = listControlId.parentNode.parentNode.children[2].children[2].id;
            var btnSave = listControlId.parentNode.parentNode.children[2].children[0].id;
        } else {
            extrachldren = listControlId.parentNode.parentNode.parentNode.parentNode.children[1].children;
            var hfPrice = listControlId.parentNode.parentNode.parentNode.parentNode.children[2].children[1].id;
            var hfReducedPrice = listControlId.parentNode.parentNode.parentNode.parentNode.children[2].children[2].id;
            var btnSave = listControlId.parentNode.parentNode.parentNode.parentNode.children[2].children[0].id;
        }

        for (var i = 0; i < extrachldren.length; i++) {
            var child = extrachldren[i].firstElementChild.children[1].id;

            if (extrachldren[i].firstElementChild.children[1].tagName == "SELECT") {
                total += parseFloat($("[id$='" + child + "']").find(":selected").val().split(',')[1]);

            }
            var it = 0;
            var limit = 0;
            if (extrachldren[i].firstElementChild.children[1].tagName != "SELECT") {
                $.each($("input[id*='" + child + "']:checked"), function () {
                    total += parseFloat($(this).val().split(',')[1]);
                    limit = $(this).val().split(',')[4];

                    if (limit != 0) {
                        it++;
                        if (it > limit) {
                            this.checked = false;
                        }
                    }
                });
            }
        }

        $.each($("input[id*='" + chklExtraDrink + "']:checked"), function () {
            total += parseFloat($(this).val().split(',')[2]);
        });
        if ($("[id$='" + rdblExtraSauce + "']").find(":checked").val() != null) {
            if ($("[id$='" + rdblExtraSauce + "']").find(":checked").val().toLowerCase() != 'geen saus') {
                extraSauce = $("[id$='" + rdblExtraSauce + "']").find(":checked").val().split(',')[1];
                total += parseFloat(extraSauce);
            }
        }
        //make base price and set to btnsave
        var basePrice = parseFloat($('#' + hfPrice + '').prop('value').replace(",", "."));
        var reducedPrice = parseFloat($('#' + hfReducedPrice + '').prop('value').replace(",", "."));
        initalprice = parseFloat($('#' + hfPrice + '').prop('value').replace(",", "."));




        if (parseFloat(reducedPrice) != parseFloat(initalprice)) {
            initalprice = reducedPrice;
        }

        $('#' + btnSave + '').prop('value', "€ " + (basePrice + total).toFixed(2));

        $('#cartbar_hfTotPrice').prop('value', DecRound(parseFloat(initalprice + total), stepAmount).toFixed(2));
        $('#cartbar_hfInitialTotPrice').prop('value', DecRound(parseFloat(basePrice + total), stepAmount).toFixed(2));
    }
}

function checkOut() {
    var basket = JSON.parse(localStorage.getItem('basket'));
    if (localStorage.getItem('basket') != null && basket.length > 0) {
        location.href = '/PlaceOrderDesktop.aspx';
    }
}

function sendBasket() {
    var items = localStorage.getItem("basket");
    $.ajax({
        type: "POST",
        url: 'Default.aspx/sendBasket',
        data: { "items": items },
        contentType: "application/json; charset=utf-8",
        success: function (data) {
            ////  console.log(data.d);
        },
        failure: function (response) {
            //         console.log(response.d);
            alert(response.d);
        }
    });
}

function initBasket() {


    calcTotPrice();

    var basket = JSON.parse(localStorage.getItem('basket'));
    if (localStorage.getItem('basket') != null && basket.length > 0) {
        $('#cartbar_hfCart').val(JSON.stringify(basket));

        $("#cart").html('');

        //if (takeaway){


        //}
        for (i = 0; i < basket.length; i++) {
            var side = "";

            if (basket[i].optionList != "") {
                side += $.map(basket[i].options, function (v) { return v.name; }).join(', ');
            }

            if (basket[i].extras.length > 0) {
                side += $.map(basket[i].extras, function (v) { return v.name; }).join(', ');
            }
            if (basket[i].productExtraList.length > 0) {
                side += $.map(basket[i].productExtraList, function (v) { return v.name; }).join(', ');
            }

            // Remove leading comma and trim whitespace
            side = side.replace(/^,/, '').trim();

            var priceHTML = "";
            var discountTextHTML = "";

            if (parseFloat(basket[i].totPrice) == parseFloat(basket[i].totInitialPrice)) {
                priceHTML = "<td style='width: 60px; font-size:17px;'> €" + parseFloat(basket[i].totPrice).toFixed(2) + "</td>";
            } else {
                priceHTML = "<td style='width: 60px; font-size:17px;color:Red;font-weight: bold;'>€" + parseFloat(basket[i].totPrice).toFixed(2) + " <div style='width: 60px; font-size:17px;text-decoration: line-through;color:black;font-weight: normal;'>€" + parseFloat(basket[i].totInitialPrice).toFixed(2) + "<div></td>";
                discountTextHTML = "<div class='extraList' style='color:Red' >Korting: " + basket[i].discountText + " </div>"
            }

            $("#cart").append("<tr class='cartItem'><td style='width: 5px; font-size:17px;font-weight:bold'> " + basket[i].quantity + " </td>" +
                "<td style='width: 300px; font-size:17px;font-weight:bold'> " + basket[i].productName + "<div class='extraList'>" + side +
                "</div><div>" + discountTextHTML + "</div> <div class= 'extraList' > " + comment(basket[i].comment, i) + "</div ></td>" +
                "<td style='width: 20px'><div id='btnPlus" + i + "' onclick='plusMinusCart(this)' style='cursor: pointer;'  class='plusmin'  > +</div> </td>" +
                "<td style='width: 40px'> <div id='btnMin" + i + "' onclick='plusMinusCart(this)' style='cursor: pointer;'  class='plusmin'  > -</div></td>"
                + priceHTML +
                "<td style='width: 15px'> <img id='btnDel" + i + "' src='../Images/delete.png' onclick='deleteItem(this)' style='cursor: pointer;' CssClass='linkbutton' ></img>  </td> </tr > ");
            $("#cart").append('<div class="solid" />');
        }
        $("#cart").append("</br>");
        $("#cart").append('<div class="blacksolid" />');
        $get("cartbar_lblSubTotal").innerHTML = "€ " + parseFloat(finalPrice).toFixed(2);
        var reductionPercentage = $get("cartbar_lblReduction").innerHTML.replace('%', '');


        //if (window.location.pathname == "/Default.aspx") {
        //    var discountedPrice = finalPrice * (parseInt(reductionPercentage) / 100);
        //    finalPrice = finalPrice - discountedPrice;
        //}

        if (window.location.pathname == "/PlaceOrderDesktop.aspx") {
            var deliveryCost = getDeliveryInfo().split(';')[2];
            var minPrice = getDeliveryInfo().split(';')[1];
            var noDeliveryCostPrice = getDeliveryInfo().split(';')[3];
            var checked_radio = $("[id*=cartbar_rdblchoice] input:checked").val();

            if (checked_radio == 'takeaway') {
                deliveryCost = "0";
                $get("divMinOrderText").style.display = "none";
                $('#cartbar_btnOrder').attr('disabled', false);
                $get("cartbar_btnOrder").style.display = "";
                $get("cartbar_btnMenuBack").style.display = "none";
                $('#cartbar_btnOrder').attr('Value', 'Bestellen');
                $('#cartbar_btnOrder').attr('Style', 'background-color:darkred');
                $get("MainContent_hfStatus").value = "2";
            }


            if (parseFloat(finalPrice) <= parseFloat(noDeliveryCostPrice)) {
                $get("cartbar_lblDeliveryCost").innerHTML = "€ " + parseFloat(deliveryCost).toFixed(2);
                finalPrice = parseFloat(finalPrice) + parseFloat(deliveryCost.replace(',', '.'));
                $get("divDeliveryMessage").style.display = "none";
                //$get("cartbar_lblDeliveryMessage").innerHTML = "Bestel hoger dan €" + noDeliveryCostPrice + " om te genieten van gratis bezorging!";
            }
            else {
                $get("cartbar_lblDeliveryCost").innerHTML = "Gratis";
                $get("divDeliveryMessage").style.display = "none";
            }

            //var discountedPrice = finalPrice * (parseInt(reductionPercentage) / 100);
            //finalPrice = finalPrice - discountedPrice;

            $get("cartbar_hfCart").value = localStorage.getItem('basket');


            if (parseFloat(finalPrice) < parseFloat(minPrice)) {
                if (checked_radio != 'takeaway') {

                    $get("divMinOrderText").style.display = "";
                    $get("cartbar_lblMinOrder").innerHTML = "Voor deze bezorglocatie moet het bestelbedrag hoger zijn dan €"
                    $get("cartbar_lblMinOrder").innerHTML += parseFloat(minPrice).toFixed(2);
                    //$('#cartbar_btnOrder').attr('onClientClick', "javascript:window.location.href='Default.aspx'; return false;");
                    $get("cartbar_btnMenuBack").style.display = "";
                    //$('#cartbar_btnOrder').attr('Style', 'background-color:darkred');
                    $get("cartbar_btnOrder").style.display = "none";
                    $get("MainContent_hfStatus").value = "1";
                }
            } else {
                $get("divMinOrderText").style.display = "none";
                $('#cartbar_btnOrder').attr('disabled', false);
                $get("cartbar_btnOrder").style.display = "";
                $get("cartbar_btnMenuBack").style.display = "none";
                $('#cartbar_btnOrder').attr('Value', 'Bestellen');
                $('#cartbar_btnOrder').attr('Style', 'background-color:darkred');
                $get("MainContent_hfStatus").value = "2";


            }
        }

        $get("cartbar_lblTotPrice").innerHTML = "€ " + parseFloat(finalPrice).toFixed(2);
        $('#cartbar_hfTotPrice').prop('value', parseFloat(finalPrice).toFixed(2));

        document.getElementById("cart").style.display = "";
        document.getElementById("cartCalc").style.display = "";




    } else {
        document.getElementById("cart").style.display = "none";
        document.getElementById("cartCalc").style.display = "none";
        document.getElementById("cartbar_btnOrder").value = "Winkelmandje leeg";
        $('#cartbar_btnOrder').attr('disabled', true);
        $('#cartbar_btnOrder').attr('Style', 'border-color:gray;background-color:gray');

    }
}

function goBack() {
    window.location.href = "www.google.be";
    //history.go(-1);
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
    if ($get("MainContent_hfStatus").value == "1") {
        $get("cartbar_btnOrder").style.display = "none";
        $get("cartbar_btnMenuBack").style.display = "";
    } else {
        $get("cartbar_btnOrder").style.display = "";
        $get("cartbar_btnMenuBack").style.display = "none";
    }
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
    if ($get("MainContent_hfStatus").value == "1") {
        $get("cartbar_btnOrder").style.display = "none";
        $get("cartbar_btnMenuBack").style.display = "";
    } else {
        $get("cartbar_btnOrder").style.display = "";
        $get("cartbar_btnMenuBack").style.display = "none";
    }
}

function getDeliveryInfo() {

    var selectedValue = $get("MainContent_ddlCity").value;
    return selectedValue;
}

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function MoveScrollPosition(object) { //object here is object of dropdownlist
    document.getElementById(object.className).scrollIntoView({ behavior: 'smooth' });
    return false;
}

$(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
        btn.addClass('show');
    } else {
        btn.removeClass('show');
    }
});

btn.on('click', function (e) {
    e.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, '300');
});

function dedup_and_sum(arr, prop) {
    var seen = {},
        order = [];
    arr.forEach(function (o) {
        var id = o[prop];
        if (id in seen) {
            // keep running sum of stocklevel
            var quantity = seen[id].quantity + o.quantity;
            // keep this newest record's values
            seen[id] = o;
            seen[id].quantity = quantity;
            // keep track of ordering, having seen again, push to end
            order.push(order.splice(order.indexOf(id), 1));
        }
        else {
            seen[id] = o;
            order.push(id);
        }
    });

    return order.map(function (k) { return seen[k]; });
}

function uncheckCheckBoxList(listControlId) {
    var tableBody = document.getElementById(listControlId).childNodes[1].childNodes[1].childNodes[7].childNodes[2];

    for (var i = 0; i < tableBody.childNodes.length; i++) {
        var currentTd = tableBody.childNodes[i].childNodes[0];
        var listControl = currentTd.childNodes[0];

        listControl.checked = false;
    }
}
/**
 * @fileoverview Utility functions for generating 15-minute delivery time slots 
 * within a specified window, respecting a 40-minute preparation lead time.
 */

//// --- Configuration ---
//const LEAD_TIME_MINUTES = 40;
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
    console.log("Start Time String: " + startTimeString);
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
function populateDropdown(elementId, slots, startTimeString, openInfo) {
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
    if (openInfo.split(';')[2] == "NOORDER") {
        const closedOption = document.createElement('option');
        closedOption.value = 'ZSM';
        closedOption.textContent = 'Geen slot beschikbaar';
        document.getElementById("cartbar_btnOrder").value = "Gesloten";
        $('#cartbar_btnOrder').attr('disabled', true);
        $('#cartbar_btnOrder').attr('Style', 'border-color:gray;background-color:gray');
        $get("cartbar_btnMenuBack").style.display = "none";
        dropdown.appendChild(closedOption);
    }


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


