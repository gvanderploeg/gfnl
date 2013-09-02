// Developed by Sam Judson, sam@wackylabs.net
// http://www.wackylabs.net
//
// This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
// http://creativecommons.org/licenses/by-nc-sa/3.0/

$(document).ready(function() {
    // perform initial loading
    justifiedLayout.loadData();
});


// Namespace justifiedLayout, using Dynamic namespaces pattern
// http://javascriptweblog.wordpress.com/2010/12/07/namespacing-in-javascript/
var justifiedLayout = {};

(function(context) {

    var minWidth = 1000;
    var minHeight = 400;

    var lastWidth = 0;
    var photoArray = null;
    var maxPhotos = 30;
    // total number of images appearing in all previous rows
    var baseLine = 0;

    $(window).resize(function() {

        var nowWidth = $("div#picstest").innerWidth();

        if( nowWidth < minWidth ) return;

        // test to see if the window resize is big enough to deserve a reprocess
        if( nowWidth * 1.1 < lastWidth || nowWidth * 0.9 > lastWidth ) {
            // if so call method
            updateRows();
        }
    });

    context.loadData = function() {
        photoArray = null;
        baseLine = 0;
        maxPhotos = 30;
        $("div#pics").empty();
        $("#loading").show();

        var tags = $("#tags").val();
        var sort = $("#sort").val();

		  // http://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=03ff68be76d279f7042a77210bc30723&photoset_id=72157626068285517&format=json&nojsoncallback=1
        $.getJSON("http://api.flickr.com/services/rest/", {
                method: "flickr.photosets.getPhotos",
                api_key: "03ff68be76d279f7042a77210bc30723",
			  		    photoset_id: "72157635348796256",
                extras: "url_n,url_m,url_z,url_l",
                format: "json",
                nojsoncallback: 1
            },

            function(data, status) {
                photoArray = data.photoset.photo;
					 console.log("Data from flickr contains " + photoArray.length + " items");
                updateRows();
                $("#loading").hide();
            }
        );
    };

    var clickHandler = function(photo) {
          return function() {
            var url = "http://www.flickr.com/photos/geertpl/" + photo.id;
            location.href = url;
          };
        };

    // only call this when either the data is loaded, or the windows resizes by a chunk
    var updateRows = function() {
        lastWidth = $("div#picstest").innerWidth();
        lastWidth = Math.max(lastWidth, minWidth);
        baseLine = 0;
        processPhotos(photoArray);
        //$("div.picrow").width(lastWidth);
    };

    var processPhotos = function(photos) {
        if (!photos) return;

        // divs to contain the images
        var d = $("div#pics");
        if( baseLine === 0 ) {
            d.empty();
        }

        // get row width - this is fixed.
        var w = lastWidth;

        // initial height - effectively the maximum height +/- 10%;
        var h = Math.max(minHeight,Math.floor(w / 5));
        // margin width
        var border = 5;

        // store relative widths of all images (scaled to match estimate height above)
        var ws = [];
        $.each(photos, function(key, val) {
            var wt = parseInt(val.width_n, 10);
            var ht = parseInt(val.height_n, 10);
            if( ht != h ) { wt = Math.floor(wt * (h / ht)); }
            ws.push(wt);
        });

        var rowNum = 0;
        var limit = Math.min(maxPhotos, photos.length);
		  console.log("Limit: " + limit + ", maxPhotos: " + maxPhotos + ", photos.length: " + photos.length);

        while(baseLine < limit) {
            rowNum++;

            // number of images appearing in this row
            var nrOfImagesInRow = 0;

            // total width of images in this row - including margins
            var totalWidthInRow = 0;

            // calculate width of images and number of images to view in this row.
            while( (totalWidthInRow * 1.1 < w) && (baseLine + nrOfImagesInRow < limit)) {
                totalWidthInRow += ws[baseLine + nrOfImagesInRow++] + border * 2;
            }

            // skip the last row
            if( baseLine + nrOfImagesInRow >= limit ) return;

            var d_row = $("<div/>", {"class" : "picrow"});
            d.append(d_row);

            // Ratio of actual width of row to total width of images to be used.
            var widthRatio = w / totalWidthInRow;

            // image number being processed
            var i = 0;

            // reset total width to be total width of processed images
            totalWidthInRow = 0;

            // new height is not original height * ratio
            var ht = Math.floor(h * widthRatio);
            d_row.height(ht + border * 2);

            while( i < nrOfImagesInRow ) {
              console.log("processing image " + i);

                var photo = photos[baseLine + i];
                // Calculate new width based on ratio
                var wt = Math.floor(ws[baseLine + i] * widthRatio);
                // add to total width with margins
                totalWidthInRow += wt + border * 2;

                // Create image, set src, width, height and margin
                var purl = photo.url_n;
                if( wt > photo.width_n * 1.2 || ht > photo.height_n * 1.2 ) purl = photo.url_m;
                if( wt > photo.width_m * 1.2 || ht > photo.height_m * 1.2 ) purl = photo.url_z;
                if( wt > photo.width_z * 1.2 || ht > photo.height_z * 1.2 ) purl = photo.url_l;

                var img = $(
                  '<img/>',
                  {
                      "class": "photo",
                      src: purl,
                      width: wt,
                      height: ht
                  }).css("margin", border + "px");

                img.click(clickHandler(photo));
                d_row.append(img);

                i++;
            }

            // set row height to actual height + margins
            baseLine += nrOfImagesInRow;

            // if total width is slightly smaller than
            // actual div width then add 1 to each
            // photo width till they match
            i = 0;
            while( totalWidthInRow < w )
            {
                var img1 = d_row.find("img:nth-child(" + (i + 1) + ")");
                img1.width(img1.width() + 1);
                i = (i + 1) % nrOfImagesInRow;
                totalWidthInRow++;
            }
            // if total width is slightly bigger than
            // actual div width then subtract 1 from each
            // photo width till they match
            i = 0;
            while( totalWidthInRow > w ) {
                var img2 = d_row.find("img:nth-child(" + (i + 1) + ")");
                img2.width(img2.width() - 1);
                i = (i + 1) % nrOfImagesInRow;
                totalWidthInRow--;
            }
        }
    };

    // levelReached function taken from infiniteScroll jquery plugin
    // https://github.com/holtonma/infini_scroll

    var levelReached = function(){
        // is it low enough to add elements to bottom?
        var pageHeight = Math.max(document.body.scrollHeight ||
        document.body.offsetHeight);
        var viewportHeight = window.innerHeight  ||
        document.documentElement.clientHeight  ||
        document.body.clientHeight || 0;
        var scrollHeight = window.pageYOffset ||
        document.documentElement.scrollTop  ||
        document.body.scrollTop || 0;
        // Trigger for scrolls within 20 pixels from page bottom
        return pageHeight - viewportHeight - scrollHeight < 10;
    };

    var pollLevel = function() {
        if( photoArray && levelReached() ) {
            maxPhotos = Math.min(maxPhotos+30, 150);
			  console.log("maxPhotos: " + maxPhotos);
            processPhotos(photoArray);
        }
        setTimeout(pollLevel, 100);
    };

    pollLevel();

})(justifiedLayout);
