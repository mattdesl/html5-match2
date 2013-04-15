var canvas; //HTML5 Canvas Element
var canvasContext; //2D drawing context
var stage;  //EaselJS Stage
var preloader; //PreloadJS

var soundWorks = false; //Whether to play sounds
var warning; //jQuery-selected Warning element

var ASSETS = 'assets/';
var IMAGES = [
    {src:ASSETS+'brick.png', id:'brick'}
];
var SOUNDS = [
    {src:ASSETS+'Music.mp3|Music.ogg', id:'Music'},
    {src:ASSETS+'ExitReached.mp3|ExitReached.ogg', id:'ExitReached'}
];
var DEFAULT_FONT = '20px Calibri';

//the manifest, which might only be IMAGES if no sound works
var manifest = IMAGES;
var totalLoaded = 0;
var progressLabel;

function log( msg ) {
    warning.append('<p>'+msg+'</p>');
}

//Main entry-point of our HTML5 application
function start() {
    warning = $('#warning');
        
    //get our HTML5 canvas element
    canvas = $('#gameCanvas')[0];
    
    //get our canvas context
    canvasContext = canvas.getContext("2d");
        
    //create the Stage for holding actors/entities
    stage = new createjs.Stage(canvas);
    
    //register WebAudio and HTML5 audio.. hopefully one of them works
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]);
    
    //setup our preloader for images and sounds
    preloader = new createjs.LoadQueue();
    
    //check if sound is available
    if (createjs.Sound.isReady()) {
        soundWorks = true;
        
        //install the sound plugin
        preloader.installPlugin(createjs.Sound);
        
        //add sound assets to our preloader manifest
        manifest = manifest.concat(SOUNDS);
    }
    
    //attach our event listeners for progress loading
    preloader.addEventListener("complete", onLoadComplete);
    preloader.addEventListener("fileload", onFileLoad);
    preloader.addEventListener("error", onFileError);
    preloader.addEventListener("progress", onProgress);
    
    //load our images (and sound if it works)
    preloader.loadManifest(manifest);
    
    //Add our preload text
    progressLabel = new createjs.Text('Loading assets...', DEFAULT_FONT, '#fff');
    progressLabel.x = canvas.width/2;
    progressLabel.y = canvas.height/2;
    progressLabel.textAlign = 'center';
    progressLabel.textBaseline = 'middle';
    stage.addChild(progressLabel);
    stage.update(); //update with new progress label
    
    //set up our ticker for smooth game loop
    createjs.Ticker.setFPS(60);
    createjs.Ticker.useRAF = true;
    createjs.Ticker.addEventListener("tick", gameLoop);
}

function onLoadComplete(evt) {
    //createjs.Sound.play("ExitReached");
}

function onFileLoad(evt) {
    //determine type
    switch (evt.item.type) {
        case createjs.LoadQueue.IMAGE:
            //now we need to create an image
            var img = new Image();
            img.onload = onFileComplete;
            img.src = evt.item.src;
            break;
        case createjs.LoadQueue.SOUND:
            onFileComplete();
            break;
    }
}

function onFileComplete(evt) {
    totalLoaded++;
    progressLabel.text = 'Progress: '+Math.floor(totalLoaded/manifest.length * 100)+'%';
    stage.update();
    
    if (totalLoaded == manifest.length) {
        stage.removeChild(progressLabel);
        stage.update();
        log('All images loaded');
    }
}

function onFileError(evt) {
    var it = evt.item && evt.item.src ? evt.item.src : 'unknown';    
    log('<p><em>Error on file load:</em> ' + it + '</p>' );
}

function onProgress(evt) {
    
}