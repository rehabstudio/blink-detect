// Processor to detect blinks based on an approach by Burke et al,
// Medical and Biological Engineering and Computing, Volume 39, Number 3 / May, 2001
// HTML 5 implementation inspired by Paul Rouget's motion tracker work

var processor = {
  worker: null,
  video: null,
  audio: null,
  outCanvas: null,
  outCtx: null,
  diffCanvas: null,
  diffCtx: null,
  lastFrame: null,
  videoX:null,
  videoY:null,
  videoWidth: null,
  videoHeight: null,
  widthScale: 2,
  heightScale: 2,
  leftEye: null,
  rightEye: null,
  label: null,
  kEyeBoxDisarmTime: 1000,
  tolerance: 15,
  hasAudio: false,
  calibrationTime: 3000,
  headRefX:0,
  headRefY:0,
  recalibrationTolerance: 10,
  eyeDiffTolerance: 25,


  timerCallback: function() {

    //requestAnimationFrame(this.timerCallback());


    //console.log('timerCallback');

    if (this.video.paused) {
      console.log('Paused');
    }
  
    this.processFrame();

    var self = this;
    setTimeout(function () {
      self.timerCallback();
    }, 33);
    //window.mozRequestAnimationFrame(self.timerCallback());
  },

  onLoad: function() {



    this.outline = document.getElementById("outline");
    this.video = document.getElementById("video");
    //console.log(this.video.src);
    this.outCanvas = document.getElementById("out");
    this.outCtx = this.outCanvas.getContext("2d");
    this.diffCanvas = document.getElementById("diff");
    this.diffCtx = this.diffCanvas.getContext("2d");
    this.faceCanvas = document.getElementById("face");
    this.videoX = 0;
    this.videoY = 0;
    this.videoWidth = 100;//this.video.videoWidth / this.widthScale;
    this.videoHeight = 100;//this.video.videoHeight / this.heightScale;
    // this.videoWidth = 320;
    // this.videoHeight = 240;
    this.label = document.getElementById("label");
    this.audio = document.getElementById("audio");
    this.worker = new Worker("findeyes.js");

    var self = this;
    this.worker.onmessage = function(event) {
      if (event.data[0] == 0) {
        self.foundEyes(event.data.slice(1));
      }
    };

    // var htracker = new headtrackr.Tracker();

    this.video.addEventListener("play", function() {
      console.log("video play");
      self.count = 0;
      self.timerCallback();
      // htracker.init(self.video, self.faceCanvas);
      // htracker.start();
    }, false);
    
    // Workaround to make looping work
    /*this.video.addEventListener("ended", function() {
      self.video.play();
    }, false);*/

  },

  setWidth: function(value) {
    // console.log("getting setWidth : " + value );
    

    this.videoWidth = value;
    this.outCanvas.width = value;
    this.diffCanvas.width = value;
    outline.style.width = value + "px";
    // outline.style.left = (160 - (value/2)) + "px";
  },

  setHeight: function(value) {
    // console.log("getting setHeight : " + value );
    this.videoHeight = value;
    this.outCanvas.height = value;
    this.diffCanvas.height = value;
    outline.style.height = value + "px";
    // outline.style.top = (120 - (value/2)) + "px";
  },

  setX: function(value) {
    // console.log("getting setX : " + value );
    // outline.style.left = (value - (value/2)) + "px";
    this.videoX = value;
    outline.style.left = value + "px";
  },

  setY: function(value) {
    // console.log("getting setY : " + value );
    this.videoY = value;
    outline.style.top = (value - (value/2)) + "px";
    // outline.style.top = value + "px";
  },

  setTolerance: function(value) {
    this.tolerance = value;
  },

  setHasAudio: function(value) {
    this.hasAudio = value;
  },

  setCalibrationTime: function(value) {
    this.calibrationTime = value;
  },

  getCalibrationTime: function() {
    return this.calibrationTime;
  },

  setRecalibrationTolerance: function(value) {
    this.recalibrationTolerance = value;
  },

  setEyeDiffTolerance: function(value) {
    this.eyeDiffTolerance = value;
  },

  setSizeAndLocation: function(value) {
    // console.log("getting setSizeAndLocation : " + value.x, value.y, value.width, value.height );
    // console.log("confidence: " + value.confidence);

    if (!this.outCanvas || !this.diffCanvas) {
      console.log("setSizeAndLocation called, but bailing out");
      return;
    } 

    var recalibrate = false;

    // check to see how far the head has moved
    // TODO check Math.abs speed in JS vs *-1
    var difX = Math.abs(value.x - this.headRefX);
    if ( difX > this.recalibrationTolerance ) recalibrate = true;

    var difY = Math.abs(value.y - this.headRefY);
    if ( difY > this.recalibrationTolerance ) recalibrate = true;      
    
    // head has moved far enough to reset
    if (recalibrate === true) {
      this.setWidth( (value.width > 110 ) ? value.width * .9 : value.width );
      
      if (value.height < 90) value.height = 100;
      this.setHeight( (value.height > 110 ) ? value.height * .9 : value.height);
      
      this.setX( value.x );
      this.setY( value.y );

      // reset the base references
      this.headRefX = value.x;
      this.headRefY = value.y;
    }


    
  },

  getVideoFrame: function() {

    try {
      this.outCtx.drawImage(video, (this.videoX - (this.videoWidth/2)) * 2, (this.videoY - (this.videoHeight/2)) * 2, this.videoWidth * 2, this.videoHeight * 2, 0, 0, this.videoWidth, this.videoHeight);
      return this.outCtx.getImageData(0, 0, this.videoWidth, this.videoHeight);
    } catch (e) {
      // The video may not be ready, yet.
      console.log(e);
      return null;
    }
  },

  putGreyFrame: function(frame, x, y) {
    var img = this.diffCtx.createImageData(this.videoWidth, this.videoHeight);
    for (var i = 0; i < frame.length; i++) {
      img.data[i * 4 + 3] = 255;
      img.data[i * 4 + 0] = frame[i];
      img.data[i * 4 + 1] = frame[i];
      img.data[i * 4 + 2] = frame[i];
    }
    this.diffCtx.putImageData(img, x, y);
  },

  diffFrame: function(frame1, frame2) {
    var newFrame = new Array(frame1.data.length / 4);
    for (var i = 0; i < newFrame.length; i++) {
      newFrame[i] = (Math.abs(frame1.data[i * 4] - frame2.data[i * 4]) +
                     Math.abs(frame1.data[i * 4 + 1] - frame2.data[i * 4 + 1]) +
                     Math.abs(frame1.data[i * 4 + 2] - frame2.data[i * 4 + 2])) / 3;

      // Threshold and invert
      if (newFrame[i] > this.tolerance) {
        newFrame[i] = 0;
      } else {
        newFrame[i] = 255;
      }
    }

    return newFrame;
  },

  processFrame: function() {
    var currentFrame = this.getVideoFrame();

    if (this.lastFrame == null) {
      this.lastFrame = currentFrame;
      return;
    }
  
    // Get the difference frame
    var diffFrame = this.diffFrame(currentFrame, this.lastFrame);
    this.putGreyFrame(diffFrame, 0, 0);
    this.lastFrame = currentFrame;
  
    // Draw eye boxes if eyes recently detected
    this.maybeDrawEyeBoxes();


    // Locate eyes in worker thread
    var args = {
      frame: diffFrame,
      height: this.videoHeight,
      width: this.videoWidth,
    }

    this.worker.postMessage(args);
  },

  foundEyes: function(result) {
    if (this.leftEye != null) return;

    // Store found eye geometry
    this.leftEye = {};
    this.rightEye = {};
    this.blink = {};
    this.blink.falsePositive = false;

    console.log("foundEyes!");

    console.log( result );
    // [this.leftEye.x1, this.leftEye.y1, this.leftEye.x2, this.leftEye.y2, this.rightEye.x1, this.rightEye.y1, this.rightEye.x2, this.rightEye.y2] = result;

    //////////////////
    this.leftEye.x1 = result[0];
    this.leftEye.y1 = result[1];
    this.leftEye.x2 = result[2];
    this.leftEye.y2 = result[3];
    this.rightEye.x1 = result[4];
    this.rightEye.y1 = result[5];
    this.rightEye.x2 = result[6];
    this.rightEye.y2 = result[7];

    // compare box sizes to try to rule out some false positives when the 
    var lW = (this.leftEye.x2 - this.leftEye.x1);
    var lH = (this.leftEye.y2 - this.leftEye.y1);
    var rW = (this.rightEye.x2 - this.rightEye.x1);
    var rH = (this.rightEye.y2 - this.rightEye.y1);

    this.blink.falsePositive = Math.abs( rW - lW ) > this.eyeDiffTolerance || Math.abs( rH - lH ) > this.eyeDiffTolerance;

    console.log("blink sizes: " + Math.abs( rW - lW ), Math.abs( rH - lH ), this.eyeDiffTolerance);

    if (this.blink.falsePositive){
      console.log("false Positive!!!!!!!!!: " + Math.abs( rW - lW ), Math.abs( rH - lH ), this.eyeDiffTolerance);
    }
    else
    {
      console.log("valid blink detected");
    }
    console.log("----------------");



    // Update text and play audio 
    //this.label.innerHTML = "&nbsp;&nbsp;<font color=\"green\"><b>Blink detected!</b></font>";

    if (this.hasAudio) this.audio.play();  // causes Firefox to slow down

    // Disarm
    var self = this;
    setTimeout(function () {
      self.leftEye = null;
      self.rightEye = null;
      //self.label.innerHTML = "";
    }, self.kEyeBoxDisarmTime);
  },

  maybeDrawEyeBoxes: function() {
    if (this.leftEye != null && this.rightEye != null) {
      var color = (this.blink.falsePositive) ? '#ff0000' : '#00ff00';
      this.drawBox(this.outCtx, color, this.leftEye.x1, this.leftEye.y1, this.leftEye.x2, this.leftEye.y2);
      this.drawBox(this.outCtx, color, this.rightEye.x1, this.rightEye.y1, this.rightEye.x2, this.rightEye.y2);
      this.drawBox(this.diffCtx, color, this.leftEye.x1, this.leftEye.y1, this.leftEye.x2, this.leftEye.y2);
      this.drawBox(this.diffCtx, color, this.rightEye.x1, this.rightEye.y1, this.rightEye.x2, this.rightEye.y2);
    }
  },

  drawBox: function(ctx, style, x1, y1, x2, y2) {
    ctx.strokeStyle = style;
    ctx.lineWidth = 1;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }
};