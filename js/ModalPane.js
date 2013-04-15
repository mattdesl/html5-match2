var ModalPane = (function() {
    
    
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
        
        this.label = new createjs.Text('', resources.DEFAULT_FONT, '#fff');
        this.label.x = width/2;
        this.label.y = height/2;
        this.label.textAlign = 'center';
        this.label.textBaseline = 'middle';
        this.label.addEventListener("mousedown", onLabelClick.bind(this));
    };
    
    ModalPane.prototype.constructor = ModalPane;
    
    ModalPane.prototype.fadeIn = function(text, buttonCallback, screenCallback) {
        this.modal.alpha = 0.0;
        this.label.alpha = 0.0;
        this.label.text = text;
                
        this.buttonCallback = buttonCallback;
        this.screenCallback = screenCallback || buttonCallback;
        
        this.stage.addChild(this.modal);        
        this.stage.addChild(this.label);
        
        createjs.Tween.get(this.modal, {override:true})
            .to({alpha: 0.75}, 250, createjs.Ease.quadIn);
        
        createjs.Tween.get(this.label, {override:true})
            .to({alpha: 1.0}, 500, createjs.Ease.quadIn);
    };
    
    ModalPane.prototype.fadeOut = function(hideCallback) {        
        this.stage.removeChild(this.label);
        
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
        this.stage.removeChild(this.label);
        if (this.hideCallback)
            this.hideCallback();
    }
    
    return ModalPane;
}());