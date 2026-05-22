var baseValue = 0.0;
var reducedPrice = 0.0;
var discountText;
var subTotal = 0.0;
var extraTotal = 0.0;
var productId;
var mainProductId;
var productName;
var modalTrigger = "";
var amount = 1;
var stepAmount = 0.05;
var limit = 3;





$('.btn-number').click(function (e) {
    e.preventDefault();

    fieldName = $(this).attr('data-field');
    type = $(this).attr('data-type');
    var input = $("input[name='" + fieldName + "']");
    var currentVal = parseInt(input.val());
    if (!isNaN(currentVal)) {
        if (type == 'minus') {

            if (currentVal > input.attr('min')) {
                input.val(currentVal - 1).change();
            }
            if (parseInt(input.val()) == input.attr('min')) {
                $(this).attr('disabled', true);
            }

        } else if (type == 'plus') {

            if (currentVal < input.attr('max')) {
                input.val(currentVal + 1).change();
            }
            if (parseInt(input.val()) == input.attr('max')) {
                $(this).attr('disabled', true);
            }

        }
        amount = parseInt(input.val());
        calculatePrices('', '');
    } else {
        input.val(0);
    }
});

$('.input-number').focusin(function () {
    $(this).data('oldValue', $(this).val());
});
$('.input-number').change(function () {

    minValue = parseInt($(this).attr('min'));
    maxValue = parseInt($(this).attr('max'));
    valueCurrent = parseInt($(this).val());

    var name = $(this).attr('name');
    if (valueCurrent >= minValue) {
        $(".btn-number[data-type='minus'][data-field='" + name + "']").removeAttr('disabled')
    } else {
        $(this).val($(this).data('oldValue'));
    }
    if (valueCurrent <= maxValue) {
        $(".btn-number[data-type='plus'][data-field='" + name + "']").removeAttr('disabled')
    } else {
        $(this).val($(this).data('oldValue'));
    }
});


var isModal;



$(function () {
    //hide first div or remove after append using `$(".card:first").remove()`

    var openInfo = $("#MainContent_hfOpenInfo").val();
    var orderAllowed;
    if (openInfo.split(';')[2] == "ORDER" || openInfo.split(';')[2] == "ORDER_TAKEAWAY") {

        orderAllowed = true
    } else {
        orderAllowed = false;
    }
    const urlParams = new URLSearchParams(window.location.search);
    var myParam = urlParams.get('type');
    var localType = localStorage.getItem('type');
    if (myParam == null) {
        myParam = localType;
    }



    $(".card:first").hide()
    $(".mainProducts:first").hide()
    $.ajax({
        url: "../WebService.asmx/GetProducts",
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        beforeSend: function () {
            $("#overlay").fadeIn(300);
        },
        complete: function () {
            $("#overlay").fadeOut(300);
        },
        data: '{orderType: "' + myParam + '"}',
        success: function (result) {
            $.each(result.d, function (index, mainProduct) {
                var header = $(".mainProducts:first").clone() //clone first divs
                $(header).find(".mainProductName").html(mainProduct.name);
                $(header).find("[id*='lblMainProductDescription']").html(mainProduct.description);
                $(header).find(".picMainProduct").attr("id", mainProduct.main_product_id);
                $(header).find(".menu").attr("id", mainProduct.main_product_id);
                $(header).find(".pic").attr("src", "../images/" + mainProduct.main_product_id + ".jpg");

                var accordion = $(header).find(".accordion");

                $.each(mainProduct.products, function (index, item2) {
                    var cards = $(".card:first").clone() //clone first divs
                    $(cards).find(".ProductNameClass").html(item2.name);

                    $(cards).find("[id*='hfPrice']").val(item2.web_value);
                    $(cards).find("[id*='hfProductId']").val(item2.product_id);
                    $(cards).find("[id*='hfMainProductId']").val(item2.main_product_id);
                    $(cards).find("[id*='hfProductName2']").val(item2.name_2);


                    $(cards).find("[id*='hfType']").val(item2.hasExtras);

                    $(cards).find(".ProductDescriptionClass").html(item2.description);
                    $(cards).find(".lblHeaderTotPrice").html(parseFloat(item2.web_value).toFixed(2));
                    $(cards).find("[id*='hfReducedPrice']").val(item2.reducedValue);
                    $(cards).find("[id*='hfDiscount']").val(mainProduct.promo_text);
                    var productImage = $(cards).find(".productImage"); //.attr("ImageUrl", "../images/" + item2.product_id + ".jpg");

                    productImage.attr("data-target", "#c" + item2.product_id);

                    if (item2.show_image == true) {
                        productImage.attr("src", "../images/" + item2.product_id + ".jpg");
                    }
                    else {
                        productImage.css({ "display": "none", "width": "0%" });
                        $(cards).find("[id*='imageTD']").attr("width", "0%");
                    }

                    if (item2.hasExtras == "false") {
                        $(cards).find("[id*='hdr']").attr('data-toggle', 'hidden');
                        $(cards).find("[id*='hdr']").removeAttr('data-target');
                    }

                    if (orderAllowed == false) {

                        $(cards).find("[id*='hdr']").attr('data-toggle', 'hidden');
                        $(cards).find("[id*='hdr']").removeAttr('onclick');
                        $(cards).find("[id*='hdr']").css({ "background-image": "none" });
                        $(cards).removeAttr('onclick');
                        $("#bottombar_btnOrder").removeAttr('onclick');
                        $("#bottombar_btnOrder").html("Winkel gesloten");
                        $("#bottombar_btnOrder").attr('disabled', true);


                    }

                    $(cards).show(); //show cards
                    $(cards).appendTo(accordion);//append to container
                });

                $(header).show(); //show cards
                $(header).appendTo($(".mainDiv"));//append to container

            });
        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });


});

function InitProduct(event) {
    console.log(event);

    baseValue = parseFloat($(event).find("[id*='hfPrice']").val()).toFixed(2);
    productId = $(event).find("[id*='hfProductId']").val();
    mainProductId = $(event).find("[id*='hfMainProductId']").val();
    productName = $(event).find("[id*='lblProductName']").html(); // document.getElementById(event.id.replace("hdr", "lblProductName")).innerText;
    isModal = $(event).find("[id*='hfType']").val();
    reducedPrice = parseFloat($(event).find("[id*='hfReducedPrice']").val()).toFixed(2);

    discountText = $(event).find("[id*='hfDiscount']").val();

    if (isModal == "true") {
        GetProductDetail();
    } else {

        $(event).find("[id*='hdr']").attr('data-toggle', 'hidden');
        $(event).find("[id*='hdr']").removeAttr('data-target');

        amount = 1;
        saveOrder(this, 'hdr');
    }


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
                    textnode2.classList = "custom-select";



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
                                // checkbox.setAttribute("onclick", "return calculatePrices(this, '" + item.line_name + "')");
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
                                textnode2.setAttribute("onchange", "return calculatePrices(this, '" + op.id + "')");

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
                        keyId = keyId.replace(/[^a-zA-Z0-9']/g, '_');

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

function GetTable() {

    $.ajax({
        url: '../WebService.asmx/GetTable',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        success: function (data) {
            setWithExpiry("table", JSON.stringify(data.d).replace(/["']/g, ""), 1800000);
        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });
}



var tableName = getWithExpiry("table");

function checkOut() {
    var basket = JSON.parse(localStorage.getItem('basket'));
    if (basket != null) {
        // Set session storage key "type" to "empty" before redirecting
        window.location.href = '../PlaceOrder.aspx';
    }
}

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
            initmBasket();
            calcTotPrice();
        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });
}

window.onload = function () {
    GetTable();
    var language = getWithExpiry("language");
    var lblProductName = document.querySelectorAll('.lblProductName');
    var lblMainProductName = document.querySelectorAll('.lblMainProductName');
    if (language == 'TR') {

        lblProductName.forEach(function (element) {
            var hfProductName2 = document.getElementById(element.id.replace('lblProductName', 'hfProductName2'));
            if (hfProductName2.value != "") {
                element.innerText = hfProductName2.value;
            }
        })

        lblMainProductName.forEach(function (element) {
            var hfMainProductName2 = document.getElementById(element.id.replace('lblMainProductName', 'hfMainProductName2'));
            if (hfMainProductName2.value != "") {
                element.innerText = hfMainProductName2.value;
            }
        })

    }


    logoHeight = document.getElementById("w3-top").clientHeight;
    height = logoHeight + 5;

    document.getElementById("ddl").style.marginTop = height + "px";

    if (/iP(hone|ad)/.test(window.navigator.userAgent)) {
        document.body.addEventListener('touchstart', function () { }, false);
    }
    calcTotPrice();
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

function calcTotPrice() {
    var basket = localStorage.getItem('basket');
    var totPrice = 0;

    if (basket != null) {
        if (JSON.parse(basket).length > 0) {
            document.getElementById('bottombar_btnOrder').style.backgroundColor = 'white';


            JSON.parse(basket).forEach((item) => {
                totPrice = totPrice + (parseFloat(DecRound(parseFloat(item.totInitialPrice), stepAmount, "Nearest").toFixed(2)) * parseInt(item.quantity));
            });
            document.getElementById('bottombar_btnOrder').innerText = "Winkelmandje: €" + totPrice.toFixed(2);
            $('#bottombar_btnOrder').removeAttr("disabled");

            return "Winkelmandje: €" + totPrice.toFixed(2);

        } else {

            $('#bottombar_btnOrder').attr('disabled', true);
            $('#bottombar_btnOrder').attr('BackColor', 'Gray');

            document.getElementById('bottombar_btnOrder').style.backgroundColor = 'Gray';
            document.getElementById('bottombar_btnOrder').style.color = 'White';
            document.getElementById('bottombar_btnOrder').innerText = "Winkelmandje leeg";
            return "Winkelmandje leeg";
        }
    } else {

        $('#bottombar_btnOrder').attr('disabled', true);
        $('#bottombar_btnOrder').attr('BackColor', 'Gray');

        document.getElementById('bottombar_btnOrder').style.backgroundColor = 'Gray';

        return "Winkelmandje leeg";
    }
}


function saveOrder(listControlId, controlName) {
    let productList = [];
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

    //  var input = document.getElementsByClassName("form-check-input");
    var input = document.querySelectorAll('[class^="form-check-input"]');

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
    console.log("22: " + reducedPrice)
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
        console.log(productList);
        console.log(localStorage.getItem('basket'));

    }

    // Save back to localStorage
    $('#bottombar_hfCart').val(localStorage.getItem('basket'));

    $("input[type=checkbox]").prop('checked', false);
    $('#bottombar_btnOrder').innerText = calcTotPrice();
    $('#bottombar_hfTotPrice').val(TotPrice());

    $('#bottombar_btnOrder').removeAttr("disabled");
    $('#bottombar_btnOrder').attr("style", "background-color: white");

    // calculatePrices(listControlId, controlName);

    const item = {
        expiry: now.getTime() + 180000,
    }
    localStorage.setItem('timestamp', JSON.stringify(item))

    $('#modelProductDetail').modal('hide');
    subTotal = 0;
    extraTotal = 0;


    return false;

}

var oldId = null;


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
        //  var input = document.getElementsByClassName("form-check-input " + controlName);
        var input = document.querySelectorAll('[class^="form-check-input"]');

        for (var i = 0; i < input.length; i++) {
            if (input[i].checked) {
                total += parseFloat(input[i].value.split(',')[1]);
                //limit = input[i].value.split(',')[4];
                //console.log("limit: " + limit)

                //if (limit != 0) {
                //    it++;
                //    console.log("limit no: " + it)

                //    if (it > limit) {
                //        listControlId.checked = false;
                //        console.log("limit trued: " + listControlId)

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
                    console.log("oldId: " + oldId);

                }
            }
            if (relatedExtraType === "0") {
                // If there is no value, hide the previous card
                console.log("oldId2: " + oldId);

                card = document.getElementById(oldId);
                if (card) {
                    card.style.display = "none";
                }
                // oldId = null;
            }
            total += parseFloat(ddl[i].options[ddl[i].selectedIndex].value.split(',')[1]);

            console.log("relatedExtraType: " + relatedExtraType);
        }
        extraTotal = parseFloat(total);
    }

    subTotal = parseFloat(parseFloat(baseValue) + parseFloat(total)).toFixed(2);
    var totalText = subTotal * amount;
    document.getElementById("MainContent_btnAdd").value = "€" + totalText.toFixed(2);
    return subTotal;
}

function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key)
    // if the item doesn't exist, return null
    if (!itemStr) {
        return null
    }
    const item = JSON.parse(itemStr)
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        localStorage.removeItem(key)
        return null
    }
    return item.value
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
        default:
        case "noroundup":
            value = value;
            break;
            break;
    }
    return value;
}

$("#modelProductDetail").on("hidden.bs.modal", function () {

});


$(document).ready(function () {
    $('#bottombar_btnOrder').innerText = calcTotPrice();

    var basket = localStorage.getItem('basket');
    if (basket != null) {
        $('#bottombar_hfCart').val(basket);
        $('#bottombar_hfTotPrice').val(TotPrice());

    }

});


function initmBasket() {
    var basket = JSON.parse(localStorage.getItem('basket'));
    if (basket != null) {
        $('#bottombar_hfCart').val(JSON.stringify(basket));
        $("#MainContent_Wizard1_basket").html('');

    }
}

$(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    var myParam = urlParams.get('type');
    var localType = localStorage.getItem('type');
    if (myParam == null) {
        myParam = localType;
    }

    if (myParam == null) {
        window.location = "/landingpage.aspx";
    }
    var basket = JSON.parse(localStorage.getItem('basket'));
    if (localStorage.getItem('basket') != null && basket.length > 0) {


        RefreshCart(myParam);
    }
    var timestamp = JSON.parse(localStorage.getItem('timestamp'));
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (timestamp != null) {
        if (now.getTime() > timestamp.expiry) {
            document.getElementById('bottombar_btnOrder').style.backgroundColor = 'Gray';
            document.getElementById('bottombar_btnOrder').innerText = "Winkelmandje leeg";
            //     document.getElementById('bottombar_btnOrder').style.color = 'White';

            //   localStorage.clear();
            localStorage.removeItem("basket");
            return null
        }
    }
    // initmBasket();



    document.getElementById('modelCenterTitleOrderDetail').innerText += tableName;
});



function deleteItem(ctrl) {
    var index = ctrl.id.replace('btnDel', '');

    var getItem = JSON.parse(localStorage.getItem('basket'));
    // setting the dataCache with new array. The new array will be created as splice is used. splice is used to remove an item from array,
    //0 is the index of the array, while second parameter 1 is to represent how many item to be removed starting from 0 ndex
    getItem.splice(index, 1);
    // after operation setting it to local storage
    localStorage.setItem('basket', JSON.stringify(getItem))
    initmBasket();
    calcTotPrice();

    showSummary();
}

function showSummary() {
    $("#sumCart").html('');

    var basket = JSON.parse(localStorage.getItem('basket'));
    if (localStorage.getItem('basket') != null && basket.length > 0) {
        $('#cartbar_hfCart').val(JSON.stringify(basket));
        $("#sumCart").html('');

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
            if (side.charAt(0) == ',') {
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

            $("#sumCart").append("<tr class='cartItem'><td style='width: 4%; font-size:15px;font-weight:bold'> " + basket[i].quantity + "x </td>" +
                "<td style='width: 60%; font-size:15px;font-weight:bold'> " + basket[i].productName + "<div class='extraList'>" + side.substring(19) + "</div> <div>" + discountTextHTML + "</div>" +
                "<td style='width: 3%'> <div  id='btnPlus" + i + "' onclick='plusMinusCart(this)' style='cursor: pointer;'  class='plusmin'  > +</div> </td>" +
                "<td style='width: 7%'> <div  id='btnMin" + i + "' onclick='plusMinusCart(this)' style='cursor: pointer;'  class='plusmin'  > -</div></td>"
                + priceHTML +
                //"<td style='width: 15%; font-size:15px;'> €" + basket[i].totPrice + "</td>" +
                "<td style='width: 5%'> <img id='btnDel" + i + "' src='../Images/delete.png' onclick='deleteItem(this)' CssClass='linkbutton' ></img>  </td> </tr > ");
            $("#sumCart").append('<div class="solid" />');
        }
        $("#sumCart").append("</br>");

        document.getElementById('bottombar_btnOrderModal').innerText = "Bestel: €" + TotPrice();

    } else {
        $('#modelOrderSummary').modal('hide');
        calcTotPrice();
        basket = null;
        $('#bottombar_hfCart').val("");

    }
    return false;
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
    showSummary();
}
function sleep(ms) {
    const now = Date.now();
    const limit = now + ms;
    let execute = true;
    while (execute) {
        if (limit < Date.now()) {
            execute = false;
        }
    }
    return;
}
function showHide(elem) {
    if ($('#showhidebtn').text() == "Show") {
        $('#' + elem.parentNode.firstElementChild.id + ' tr:gt(2)').show();
        $('#showhidebtn').text('Hide');
        return;
    }
    if ($('#showhidebtn').text() == "Hide") {
        $('#' + elem.parentNode.firstElementChild.id + ' tr:gt(2)').hide();
        $('#showhidebtn').text('Show');
        return;
    }
}

window.onscroll = function () { scrollFunction() };
var logoHeight;
var height = logoHeight + 5;
function scrollFunction() {

    if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
        document.getElementById("w3-top").style.display = "None"
        document.getElementById("w3-top").style.transition = "0.3s";
        document.getElementById("ddl").style.marginTop = "-10px";


    } else {
        document.getElementById("w3-top").style.display = ""
        document.getElementById("w3-top").style.transition = "0.3s";
        document.getElementById("ddl").style.marginTop = height + "px";


    }
}

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
function setWithExpiry(key, value, ttl) {
    const now = new Date()

    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item))
}
function isEmpty(obj) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }

    return true;
}
function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key)
    // if the item doesn't exist, return null
    if (!itemStr) {
        return null
    }
    const item = JSON.parse(itemStr)
    const now = new Date()
    // compare the expiry time of the item with the current time
    if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        localStorage.removeItem(key)
        return null
    }
    return item.value
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
    document.getElementById(object.value).scrollIntoView({ behavior: 'smooth' });

}
var btn = $('#button');

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





