function search(frame, width, height) {
  var kNoBlobsError = -1;
  var kTooManyBlobsError = -2;
  var kWrongGeometryError = -3;
  var kMaxBlobsToFind = 30;
  var kBlobsSearchBorder = 20;
  var kMinBlobsFound = 2;
  var kMaxBlobsFound = 25;
  var kMinEyeXSep = 40;
  var kMaxEyeXSep = 60;
  var kMaxEyeYSep = 40;

  function pixel(x, y) {
	if (x < 0 || x >= width || y < 0 || y >= height) {
	  return 255;
	}
    return frame[x + y * width];
  }

  // Heuristic to trace the perimeter of a blob of pixels
  function tracePerim(i, j) {
	  x = i;
	  y = j + 1;
	  xmin = i
	  xmax = i;
	  ymin = j;
	  ymax = j;
    dir = 1;
    
    for (count = 0; count < 300; count++) {
	    found = false;
  	  if ((x == i) && (y == j)) break; // gone full circle

        //   /3\
        // 2<   >4
        //   \1/   
	 
  	  if (!found && dir == 1) {  // Downwards
  	    if (!found && pixel(x-1, y) == 0) {
  		  x--;
  		  found = true;
  		  dir = 2;
  		  }
    		if (!found && pixel(x, y+1) == 0) {
    		  y++;
    		  found = true;
    		  dir = 1;
    		}
    		if (!found && pixel(x+1, y) == 0) {
    		  x++;
    		  found = true;
    		  dir = 4;
    		}
        if (!found && pixel(x, y-1) == 0) {
  		    y--;
  		    found = true;
  		    dir = 3;
  		  }
      }
	  
	    if (!found && dir == 4) { // Rightwards
  	    if (!found && pixel(x, y+1) == 0) {
  		    y++;
  		    found = true;
  		    dir = 1;
  		  }
  		  if (!found && pixel(x+1, y) == 0) {
  		    x++;
  		    found = true;
  		    dir = 4;
  		  }
  		  if (!found && pixel(x, y-1) == 0) {
    		  y--;
    		  found = true;
    		  dir = 3;
    		}
        if (!found && pixel(x-1, y) == 0) {
    		  x--;
    		  found = true;
    		  dir = 2;
    		  }
        }

	      if (!found && dir == 3) { // Upwards
    	    if (!found && pixel(x+1, y) == 0) {
    		  x++;
    		  found = true;
    		  dir = 4;
    		}
    		if (!found && pixel(x, y-1) == 0) {
    		  y--;
    		  found = true;
    		  dir = 3;
    		}
    		if (!found && pixel(x-1, y) == 0) {
    		  x--;
    		  found = true;
    		  dir = 2;
    		}
        if (!found && pixel(x, y+1) == 0) {
    		  y++;
    		  found = true;
    		  dir = 1;
    		  }
        }

	      if (!found && dir == 2) { // Leftwards
    	    if (!found && pixel(x, y-1) == 0) {
    		  y--;
    		  found = true;
    		  dir = 3;
    		}
    		if (!found && pixel(x-1, y) == 0) {
    		  x--;
    		  found = true;
    		  dir = 2;
    		}
    		if (!found && pixel(x, y+1) == 0) {
    		  y++;
    		  found = true;
    		  dir = 1;
    		}
        if (!found && pixel(x+1, y) == 0) {
    		  x++;
    		  found = true;
    		  dir = 4;
    		}
      }
      xmin = Math.min(x, xmin);
      ymin = Math.min(y, ymin);
  	  xmax = Math.max(x, xmax);
  	  ymax = Math.max(y, ymax);
  	}
	
	  return [xmin, ymin, xmax, ymax];
  }
  
  // Find blobs
  var blobs = new Array();
  var arr = [];
  var xmax,xmin,ymax,ymin;

  for (h = kBlobsSearchBorder; h < height - kBlobsSearchBorder; h++) {
	  if (blobs.length >= kMaxBlobsToFind) break;
  	for (j = kBlobsSearchBorder; j < width - kBlobsSearchBorder; j++) {
  	  if (pixel(j, h) == 0 && pixel(j, h-1) != 0) {
  	    //[xmin, ymin, xmax, ymax] = tracePerim(j, h);
        arr = tracePerim(j,h);
        xmin = arr[0];
        ymin = arr[1];
        xmax = arr[2];
        ymax = arr[3];

  	    if ((xmax - xmin) * (ymax - ymin) > 5) {
  		    blobs.push({ xmin: xmin, ymin: ymin, xmax: xmax, ymax: ymax });
  		    if (blobs.length >= kMaxBlobsToFind) break;
  		  }
  	  }
  	}
  }

  // Sort blobs
  if (blobs.length < kMinBlobsFound) {
	  return [kNoBlobsError, "No blobs"];
  } else if (blobs.length > kMaxBlobsFound) {
	  return [kTooManyBlobsError, "Too many blobs"];
  }
  blobs.sort(function(a, b) { (b.xmax - b.xmin) * (b.ymax - b.ymin) - (a.xmax - a.xmin) * (a.ymax - a.ymin) });

  // Check dimensions
  xSep = Math.abs((blobs[0].xmax + blobs[0].xmin) - (blobs[1].xmax + blobs[1].xmin)) / 2;
  ySep = Math.abs((blobs[0].ymax + blobs[0].ymin) - (blobs[1].ymax + blobs[1].ymin)) / 2;

  if (xSep < kMinEyeXSep || xSep > kMaxEyeXSep || ySep > kMaxEyeYSep) {
	  return [kWrongGeometryError, "Geometry off, xSep:" + xSep + ", ySep:" + ySep];
  }

  // Find which eye is which
  if (blobs[0].xmax < blobs[1].xmax) {
	  l = 0;
  	r = 1;
  } else {
	  l = 1;
  	r = 0;
  }
  
  // Expand bounding boxes
  dx = 3;
  dy = 3;
  return [0, blobs[l].xmin - dx, blobs[l].ymin - dy, blobs[l].xmax + dx, blobs[l].ymax + dy, blobs[r].xmin - dx, blobs[r].ymin - dy, blobs[r].xmax + dx, blobs[r].ymax + dy];
}

onmessage = function(event) {
  var data = event.data;
  if (data.frame == null) { postMessage([-100]); }
  var res = search(data.frame,
                   data.width,
                   data.height);
  postMessage(res);
}