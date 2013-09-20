Live blink detection
============

Using getUserMedia for camera input, detects eyes and then compares frames to see if the eyes disappear then reappear (i.e. blinking). A very rough prototype for the project that eventually became http://www.youtube.com/user/virginmobileusa/blinkwashing.

##Version order##

/initial-demo
/movement
/area
/headtracker

##Credits##

The code is based on Dave Burke's blink detection demo (http://gddbeijing.appspot.com/blink.html), which used pre-recorded video input; we added getUserMedia.

This currently only works in Firefox because of the requirement to use let (JS 1.7), and is very far from optimised.