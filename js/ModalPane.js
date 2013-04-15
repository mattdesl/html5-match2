//a modal pane shared across all states that acts a little
//like your standard "LightBox"

//It can show images or a two-tiered text message

// (currently we only use it for simple GameView messages)

var ModalPane = (function() {
    
    var FONT = FontStyle(28);
    var SUB_FONT = FontStyle(20);
    var SUB_TEXT_COLOR = '#aaa';
    
    var ModalPane = function(stage, resources, width, height) {
        this.stage = stage;
        this.resources = resources;
        this.width = width;
        this.height = height;
        
        this.modal = new createjs.Shape();
        this.modal.graphics.beginFill('#000').rect(0, 0, width, height).endFill();
        this.modal.width = width;
        this.modal.height = height;
        
        this.modal.addEventListener("mousedown", onMouseDown.bind(this));
        
        this.label = new createjs.Text('', FONT, '#fff');
        this.label.x = width/2;
        this.label.y = height/2;
        this.label.textAlign = 'center';
        this.label.textBaseline = 'middle';
        
        var mousedn = onLabelClick.bind(this);
        
        this.label.addEventListener("mousedown", mousedn);
        
        this.subLabel = new createjs.Text('', SUB_FONT, SUB_TEXT_COLOR);
        this.subLabel.x = width/2;
        this.subLabel.y = height/2 + this.label.getMeasuredLineHeight() + 10;
        this.subLabel.textAlign = 'center';
        this.subLabel.textBaseline = 'middle';
        this.subLabel.addEventListener("mousedown", mousedn);
        
        this.bitmap = new createjs.Bitmap();
        this.bitmap.addEventListener("mousedown", mousedn); 
    };
    
    ModalPane.prototype.constructor = ModalPane;
    
    ModalPane.prototype.fadeInImage = function(image, screenCallback) {
        this.modal.alpha = 0.0;
        this.screenCallback = screenCallback;
        
        this.bitmap.alpha = 0.0;
        this.bitmap.image = image;
        this.bitmap.width = image.width;
        this.bitmap.height = image.height;
        this.bitmap.x = this.width/2 - image.width/2;
        this.bitmap.y = this.height/2 - image.height/2;
        
        this.stage.addChild(this.modal);
        this.stage.addChild(this.bitmap);
        
        createjs.Tween.get(this.modal, {override:true})
            .to({alpha: 0.75}, 250, createjs.Ease.quadIn);
        createjs.Tween.get(this.bitmap, {override:true})
            .to({alpha: 1.0}, 500, createjs.Ease.quadIn);
    };
    
    ModalPane.prototype.fadeIn = function(text, subText, buttonCallback, screenCallback) {
        this.modal.alpha = 0.0;
        this.label.alpha = 0.0;
        this.label.text = text;
        this.subLabel.alpha = 0.0;
        this.subLabel.text = subText;
                
        this.buttonCallback = buttonCallback;
        this.screenCallback = screenCallback || buttonCallback;
        
        this.stage.addChild(this.modal);        
        this.stage.addChild(this.label);
        this.stage.addChild(this.subLabel);
        
        createjs.Tween.get(this.modal, {override:true})
            .to({alpha: 0.75}, 250, createjs.Ease.quadIn);
        createjs.Tween.get(this.label, {override:true})
            .to({alpha: 1.0}, 500, createjs.Ease.quadIn);
        createjs.Tween.get(this.subLabel, {override:true})
            .to({alpha: 1.0}, 500, createjs.Ease.quadIn);
    };
    
    ModalPane.prototype.fadeOut = function(hideCallback) {        
        this.stage.removeChild(this.label);
        this.stage.removeChild(this.subLabel);
        this.stage.removeChild(this.bitmap);
        
        this.hideCallback = hideCallback;
        
        createjs.Tween.get(this.modal, {override:true})
            .to({alpha: 0.0}, 150, createjs.Ease.quadOut)
            .call(onModalEnd.bind(this));
    };
    
    function onMouseDown(evt) {
        this.fadeOut(this.screenCallback);
    }
    
    function onLabelClick(evt) {
        this.fadeOut(this.buttonCallback);
    }
    
    function onModalEnd(evt) {
        this.stage.removeChild(this.modal);
        if (this.hideCallback)
            this.hideCallback();
    }
    
    return ModalPane;
}());