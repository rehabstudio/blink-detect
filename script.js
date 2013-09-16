var webcam = (function(){

    var video = document.createElement('video'),
        feed = document.createElement('canvas'),
        display = document.createElement('canvas'),
        photo = document.createElement('canvas');

    var options = [];

    function play() {

        if (navigator.getUserMedia) {

            navigator.getUserMedia({video: true, audio: true, toString : function() {return "video,audio";} }, onSuccess, onError);

        } else {

            changeStatus('getUserMedia is not supported in this browser.', true);
        }

    }

    function onSuccess(stream) {

        var source;
 
        if (window.webkitURL) {

            source = window.webkitURL.createObjectURL(stream);

        } else {

            source = window.URL.createObjectURL(stream); // Opera and Firefox
        }
 

        video.autoplay = true;

        video.src = source;

        streamFeed();

        changeStatus('Connected.', false);

    }

    function onError() {

        changeStatus('Please accept the getUserMedia permissions! Refresh to try again.', true);

    }

    function streamFeed() {

        requestAnimationFrame(streamFeed);

        var feedContext = feed.getContext('2d');
        var displayContext = display.getContext('2d');
        var imageData;

        feedContext.drawImage(video, 0, 0, display.width, display.height);
        imageData = feedContext.getImageData(0, 0, display.width, display.height);

        //addEffects
        imageData = addEffects(imageData);
        displayContext.putImageData(imageData, 0, 0);
        
    }

    function changeStatus(msg, error) {
        var status = document.getElementById('status');
        status.innerHTML = msg;
        status.style.color = (error) ? 'red' : 'green';
    }


    // allow the user to take a screenshot
    function setupPhotoBooth() {
        var takeButton = document.createElement('button');
        takeButton.textContent = 'Smile!';
        takeButton.addEventListener('click', takePhoto, true);
        document.body.appendChild(takeButton);

        var saveButton = document.createElement('button');
        saveButton.id = 'save';
        saveButton.textContent = 'Save!';
        saveButton.disabled = true;
        saveButton.addEventListener('click', savePhoto, true);
        document.body.appendChild(saveButton);

    }

    function takePhoto() {

        // set our canvas to the same size as our video
        photo.width = display.width;
        photo.height = display.height;

        var context = photo.getContext('2d');
        context.drawImage(display, 0, 0, photo.width, photo.height);
        
        // allow us to save
        var saveButton = document.getElementById('save');
        saveButton.disabled = false;

    }

    function savePhoto() {
        var data = photo.toDataURL("image/png");

        data = data.replace("image/png","image/octet-stream");

        document.location.href = data;

    }


    // effects
    function setupEffectsButtons() {

        var effects = ["invert","red","blue","green"];
        var effectButton;

        for (var i=0, l=effects.length; i < l; i++) {

            effectButton = document.createElement('button');
            effectButton.id = effects[i];
            effectButton.textContent = effects[i];
            effectButton.addEventListener('click', toggleEffect, true);
            document.body.appendChild(effectButton);

        }

    }

    function toggleEffect(e) {

        var effect = this.id;
        
        if (options.indexOf(effect) > -1) {
            options.splice(options.indexOf(effect), 1);
        } else {
            options.push(effect);
        }

        console.log(options);

    }

    function addEffects(imageData) {

        var data = imageData.data;

        for (var i = 0; i < options.length; i++) {

            var type = options[i];

            for (var j = 0; j < data.length; j += 4) {

                switch (type) {

                    case "invert":
                        data[j] = 255 - data[j];         // r
                        data[j + 1] = 255 - data[j + 1]; // g
                        data[j + 2] = 255 - data[j + 2]; // b
                        break;
                    case "red":
                        data[j] = Math.min(255,data[j] * 2);         // r
                        data[j + 1] = data[j + 1] / 2; // g
                        data[j + 2] = data[j + 2] / 2; // b
                        break;
                    case "blue":
                        data[j] = data[j] / 2;         // r
                        data[j + 1] = data[j + 1] / 2; // g
                        data[j + 2] = Math.min(255,data[j + 2] * 2); // b
                        break;
                    case "green":
                        data[j] = data[j] / 2;         // r
                        data[j + 1] = Math.min(255,data[j + 2] * 2); // g
                        data[j + 2] = data[j + 1] / 2; // b
                        break;
                    default:
                        break;
                }
            }
        }

        return imageData;

    }

    return {
        init: function() {

            changeStatus('Please accept the permissions dialog.', true);

            video.style.display = 'none';
            feed.style.display = 'none';

            feed.width = 640;
            feed.height = 480;

            display.width = 640;
            display.height = 480;

            document.body.appendChild(video);
            document.body.appendChild(feed);
            document.body.appendChild(display);
            document.body.appendChild(photo);

            navigator.getUserMedia || (navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia);

            window.requestAnimationFrame || (window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame || 
                function( callback ){
                   window.setTimeout(callback, 1000 / 60);
                });

            play();
            setupPhotoBooth();
            setupEffectsButtons();

        }()

    }


})();