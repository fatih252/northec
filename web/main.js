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



function SetCulture(language) {
    $.ajax({
        url: '../WebService.asmx/SetCulture',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{language: "' + language + '"}',
        success: function (data) {
            console.log(data)

        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });



}

function GetBanner() {
    var language = "BE";

    // 1. First, get the TEXT details from the Database
    $.ajax({
        url: 'WebService.asmx/GetBannerDetails',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{language: "' + language + '"}',
        success: function (dbResponse) {
            var dbData = dbResponse.d; // This is the array of text details (titles, subtitles)

            // 2. Second, get the IMAGE filenames from the Folder
            $.ajax({
                url: 'WebService.asmx/GetBannerImages',
                dataType: "json",
                method: 'post',
                contentType: "application/json; charset=utf-8",
                data: '{}',
                success: function (imgResponse) {
                    var imgData = imgResponse.d; // This is the array of filenames ["a.jpg", "b.jpg"...]

                    $("#swiper-wrapper").empty();

                    // We loop through the IMAGES (so all images are shown)
                    imgData.forEach((imageFile, index) => {

                        // LOGIC: Match Image to DB Text
                        // We use the modulo operator (%) to cycle through DB records.
                        // If we have 10 images but only 2 DB records:
                        // Image 1 gets Text 1, Image 2 gets Text 2, Image 3 gets Text 1, etc.
                        var textItem = dbData.length > 0 ? dbData[index % dbData.length] : null;

                        // Fallback defaults if DB is empty
                        var topName = textItem ? textItem.top_name : "";
                        var midName = textItem ? textItem.mid_name : "";
                        var subName = textItem ? textItem.sub_name : "";

                        // Build the HTML
                        // Note: Image source is 'Images/banner/' + imageFile
                        var slideHtml =
                            '<div class="swiper-slide"> ' +
                            '<div class="bg-img valign" data-background="Images/banner/' + imageFile + '" data-overlay-dark="1" > ' +
                            '<div class="container"> ' +
                            '<div class="row"> ' +
                            '<div class="col-lg-12 col-md-12"> ' +
                            '<div class="caption text-left"> ' +
                            '<h2>' + topName + '</h2> ' +
                            '<h1>' + midName + '</h1> ' +
                            '<p style="max-width: 700px;">' + subName + '</p> ' +
                            '<div class="home-button-box home-slider-btn"> ' +
                            //'<a class="button home-btn js-scroll" data-toggle="modal" data-target="#exampleModalCenter">Klik hier om te reserveren!</a> ' +
                            '<a class="button home-btn js-scroll" href="/Default.aspx?type=reservation">Klik hier om te reserveren!</a> ' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>' +
                            '</div>';

                        $("#swiper-wrapper").append(slideHtml);
                    });

                    // 3. Initialize Swiper (Logic moved to helper function for clarity)
                    initSwiper();
                },
                error: function (err) {
                    console.log("Error getting images:", err);
                }
            });
        },
        error: function (err) {
            console.log("Error getting DB details:", err);
        }
    });
}

// Separate the Swiper init code to ensure it runs only AFTER slides are added
function initSwiper() {
    // Set Backgrounds
    $(".bg-img").each(function () {
        if ($(this).attr("data-background")) {
            $(this).css("background-image", "url(" + $(this).data("background") + ")");
        }
    });

    var parallaxSliderOptions = {
        speed: 3000,
        autoplay: {
            delay: 4000,
            disableOnInteraction: true
        },
        effect: "fade",
        parallax: true,
        loop: true,
        grabCursor: false,
        cubeEffect: {
            shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94,
        },
        on: {
            autoplayTimeLeft(s, time, progress) {
                // Ensure elements exist to avoid console errors
                if (typeof progressCircle !== 'undefined' && typeof progressContent !== 'undefined') {
                    progressCircle.style.setProperty("--progress", 1 - progress);
                    progressContent.textContent = `${Math.ceil(time / 1000)}s`;
                }
            },
            init: function () {
                var swiper = this;
                for (var i = 0; i < swiper.slides.length; i++) {
                    $(swiper.slides[i]).find('.bg-img').attr({
                        'data-swiper-parallax': 0.75 * swiper.width
                    });
                }
            },
            resize: function () {
                this.update();
            }
        },
        pagination: {
            el: '.slider-prlx .parallax-slider .swiper-pagination',
            dynamicBullets: true,
            clickable: true
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
    };

    // Initialize or Re-Initialize
    if (window.parallaxSlider instanceof Swiper) {
        window.parallaxSlider.destroy(true, true);
    }
    window.parallaxSlider = new Swiper('.slider-prlx .parallax-slider', parallaxSliderOptions);
}

function GetBanner_() {
    var language = "BE";

    $.ajax({
        url: 'WebService.asmx/GetBannerDetails',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{language: "' + language + '"}',
        success: function (data) {


            localStorage.setItem('banner', JSON.stringify(data.d));

            JSON.parse(localStorage.getItem('banner')).forEach((item) => {
                $("#swiper-wrapper").append('<div class="swiper-slide"> ' +
                    '<div class="bg-img valign" data-background="Images/' + item.image_name + '" data-overlay-dark="1" > ' +
                    '<div class="container"> ' +
                    '<div class="row"> ' +
                    '<div class="col-lg-12 col-md-12"> ' +
                    '<div class="caption text-left"> ' +
                    '<h2>' + item.top_name + '</h2> ' +
                    '<h1>' + item.mid_name + '</h1> ' +
                    '<p style="max-width: 700px;">' + item.sub_name + '</p> ' +
                    '<div class="home-button-box home-slider-btn"> ' +
                    '<a class="button home-btn js-scroll" data-toggle="modal" data-target="#exampleModalCenter">Klik hier om te bestellen!</a> ' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div> ');
            });

            var parallaxSliderOptions = {
                speed: 3000,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: true
                },
                effect: "fade",
                parallax: true,
                loop: true,
                grabCursor: false,
                cubeEffect: {
                    shadow: true,
                    slideShadows: true,
                    shadowOffset: 20,
                    shadowScale: 0.94,
                },
                on: {
                    autoplayTimeLeft(s, time, progress) {
                        progressCircle.style.setProperty("--progress", 1 - progress);
                        progressContent.textContent = `${Math.ceil(time / 1000)}s`;
                    }
                },
                on: {
                    init: function () {
                        var swiper = this;
                        for (var i = 0; i < swiper.slides.length; i++) {
                            $(swiper.slides[i]).find('.bg-img').attr({
                                'data-swiper-parallax': 0.75 * swiper.width
                            });
                        }
                    },
                    resize: function () {
                        this.update();
                    }
                },
                pagination: {
                    el: '.slider-prlx .parallax-slider .swiper-pagination',
                    dynamicBullets: true,
                    clickable: true
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                },
            };
            parallaxSlider = new Swiper('.slider-prlx .parallax-slider', parallaxSliderOptions);
            // Var Background image
            var pageSection = $(".bg-img, section");
            pageSection.each(function (indx) {
                if ($(this).attr("data-background")) {
                    $(this).css("background-image", "url(" + $(this).data("background") + ")");
                }
            });


        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });

}
function GetBannerTable() {
    var language = getWithExpiry("language");
    var MenuButtonText;
    var languageSelectorText;
    if (language == "TR") {
        MenuButtonText = 'Sipariş icin buraya tıklayınız!';
        languageSelectorText = "Dil seçeneği";
    } else {
        MenuButtonText = 'Klik hier om te bestellen !';
        languageSelectorText = "Taalkeuze";

    }

    $.ajax({
        url: 'WebService.asmx/GetBannerDetails',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        data: '{language: "' + language + '"}',
        success: function (data) {

            const url = window.location.href;

            // Parse the URL 
            const parsedUrl = new URL(url);

            // Get the value of a specific parameter from the query string 
            const paramName = 'table';
            var tableName = getWithExpiry("table");


            localStorage.setItem('banner', JSON.stringify(data.d));
            document.getElementById("swiper-wrapper").innerHTML = "";
            JSON.parse(localStorage.getItem('banner')).forEach((item) => {
                $("#swiper-wrapper").append('<div class="swiper-slide"> ' +
                    '<div class="bg-img valign" data-background="Images/' + item.image_name + '" data-overlay-dark="1" > ' +
                    '<div class="container"> ' +
                    '<div class="row"> ' +
                    '<div class="col-lg-12 col-md-12"> ' +
                    '<div class="caption text-left"> ' +
                    '<h2>' + item.top_name + '</h2> ' +
                    '<h1>' + item.mid_name + '</h1> ' +
                    '<p style="max-width: 700px;">' + item.sub_name + '</p> ' +
                    '<div class="home-button-box home-slider-btn"> ' +

                    '<a class="button home-btn js-scroll" href="mobile/TableOrder.aspx?table=' + tableName + '" >Klik hier om te bestellen!</a> ' +

                    '<br />' +
                    '</div>' +

                    //'<h4 style="text-align:center;">' + languageSelectorText + '</h4> ' +
                    //'<div style="text-align:center">' +
                    //'<a class="a" onclick="return SetLanguage(\'TR\')" ><img src="Images/turkey.png"  class="button-large language"  style="background:transparant;background-color:transparent"  /></a>' +
                    //'<a class="a" onclick="return SetLanguage(\'BE\');" ><img  src="Images/belgium.png"  class="button-large language"  style="background:transparant;background-color:transparent" /></a>' +
                    //'</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div> ');
            });

            var parallaxSliderOptions = {
                speed: 3000,
                autoplay: {
                    delay: 4000,
                    disableOnInteraction: true
                },
                effect: "fade",
                parallax: true,
                loop: true,
                grabCursor: false,
                cubeEffect: {
                    shadow: true,
                    slideShadows: true,
                    shadowOffset: 20,
                    shadowScale: 0.94,
                },
                on: {
                    autoplayTimeLeft(s, time, progress) {
                        progressCircle.style.setProperty("--progress", 1 - progress);
                        progressContent.textContent = `${Math.ceil(time / 1000)}s`;
                    }
                },
                on: {
                    init: function () {
                        var swiper = this;
                        for (var i = 0; i < swiper.slides.length; i++) {
                            $(swiper.slides[i]).find('.bg-img').attr({
                                'data-swiper-parallax': 0.75 * swiper.width
                            });
                        }
                    },
                    resize: function () {
                        this.update();
                    }
                },
                pagination: {
                    el: '.slider-prlx .parallax-slider .swiper-pagination',
                    dynamicBullets: true,
                    clickable: true
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                },
            };
            parallaxSlider = new Swiper('.slider-prlx .parallax-slider', parallaxSliderOptions);
            // Var Background image
            var pageSection = $(".bg-img, section");
            pageSection.each(function (indx) {
                if ($(this).attr("data-background")) {
                    $(this).css("background-image", "url(" + $(this).data("background") + ")");
                }
            });


        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });

}
function GetTable() {

    $.ajax({
        url: '../WebService.asmx/GetTable',
        dataType: "json",
        method: 'post',
        contentType: "application/json; charset=utf-8",
        //  data: '{mainProductId: ' + mainProductId + ', productId: "' + productId + '"}',
        success: function (data) {
            console.log("TABLE session" + JSON.stringify(data.d));
            setWithExpiry("table", JSON.stringify(data.d).replace(/["']/g, ""), 1800000);

        },
        error: function (err) {
            //  alert(err);
            console.log(err)
        }
    });
}

function getCookie(cookieName) {
    var cookieValue = document.cookie;
    var cookieStart = cookieValue.indexOf(" " + cookieName + "=");
    if (cookieStart == -1) {
        cookieStart = cookieValue.indexOf("=");
    }
    if (cookieStart == -1) {
        cookieValue = null;
    }
    else {
        cookieStart = cookieValue.indexOf("=", cookieStart) + 1;
        var cookieEnd = cookieValue.indexOf(";", cookieStart);
        if (cookieEnd == -1) {
            cookieEnd = cookieValue.length;
        }
        cookieValue = unescape(cookieValue.substring(cookieStart, cookieEnd));
    }
    return cookieValue;
}

(function ($) {
    const url = window.location.href;


    // Parse the URL 
    const parsedUrl = new URL(url);

    // Get the value of a specific parameter from the query string 
    const paramName = 'table';
    var tableName = parsedUrl.searchParams.get(paramName);
    GetTable();
    //  tableName = getWithExpiry("table");

    //if (tableName == null) {

    var table = getCookie('table');
    //}
    if (tableName != null) {

        GetBannerTable();
        setWithExpiry("table", tableName, 1800000);

    } else {
        GetBanner();
    }

    "use strict";
    var wind = $(window);
    var parallaxSlider;

    const progressCircle = document.querySelector(".autoplay-progress svg");
    const progressContent = document.querySelector(".autoplay-progress span");




    var nav = $('slider-home');
    var navHeight = nav.outerHeight();
    $('.navbar-toggler').on('click', function () {
        if (!$('#mainNav').hasClass('navbar-reduce')) {
            $('#mainNav').addClass('navbar-reduce');
        }
    });


    // Navbar Menu Reduce 
    $(window).trigger('scroll');
    $(window).on('scroll', function () {
        var pixels = 50;
        var top = 1200;
        if ($(window).scrollTop() > pixels) {
            $('.navbar-expand-lg').addClass('navbar-reduce');
            $('.navbar-expand-lg').removeClass('navbar-trans');
        } else {
            $('.navbar-expand-lg').addClass('navbar-trans');
            $('.navbar-expand-lg').removeClass('navbar-reduce');
        }
        if ($(window).scrollTop() > top) {
            $('.scrolltop-mf').fadeIn(1000, "easeInOutExpo");
        } else {
            $('.scrolltop-mf').fadeOut(1000, "easeInOutExpo");
        }
    });
    // Back to top button 
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
    //  Star Scrolling nav
    $('a.js-scroll[href*="#"]:not([href="#"])').on("click", function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
            if (target.length) {
                $('html, body').animate({
                    scrollTop: (target.offset().top - navHeight + 30)
                }, 1000, "easeInOutExpo");
                return false;
            }
        }
    });
    // Closes responsive menu when a scroll trigger link is clicked
    $('.js-scroll').on("click", function () {
        $('.navbar-collapse').collapse('hide');
    });
    // Activate scrollspy to add active class to navbar items on scroll
    $('body').scrollspy({
        target: '#slider-home',
        offset: 30
    });


    // Preloader Area
    jQuery(window).on('load', function () {
        jQuery('.preloader').delay(500).fadeOut('slow');
    });





})(jQuery);