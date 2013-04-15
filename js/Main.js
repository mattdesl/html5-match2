var stage;  //EaselJS Stage
var resources; //our Resources object
var width, height; //width & height of our canvas
var gameView;
var modalPane;

//Main entry-point of our HTML5 application
function Main() {
    //get our HTML5 canvas element
    var canvas = $('#gameCanvas')[0];
    
    width = canvas.width;
    height = canvas.height;
    
    //get our canvas context
    var canvasContext = canvas.getContext("2d");
    
    //create the Stage for holding actors/entities
    stage = new createjs.Stage(canvas);
    stage.enableMouseOver(10);
    
    //only if i need mouse over, like cursors or hover animations...
    //stage.enableMouseOver(10);
    
    //create our Resources object
    resources = new Resources(stage, width, height);
    resources.onLoaded = onLoaded;
    resources.load();
    
    //set up our ticker for smooth game loop
    createjs.Ticker.setFPS(30);
    createjs.Ticker.useRAF = true;
}

function onLoaded() {
    //wood background pattern
    var woodPattern = new createjs.Shape();
    woodPattern.graphics
        .beginBitmapFill( resources.images['wood'] )
        .rect(0, 0, width, height)
        .endFill();
    woodPattern.width = width;
    woodPattern.height = height;
    stage.addChild(woodPattern);
    
    modalPane = new ModalPane(stage, resources, width, height);
    
    gameView = new GameView(stage, resources, width, height, modalPane);
    gameView.onExit = onGameViewExit.bind(this);
    gameView.fadeIn();
}

function onGameViewExit() {
    gameView.fadeOut();   
}