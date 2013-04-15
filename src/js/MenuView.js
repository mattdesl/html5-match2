//the main menu view, which displays instructions 

var MenuView = (function() {
    
    var root;
    
    var MenuView = function(stage, resources, width, height, modalPane) {
        this.stage = stage;
        this.resources = resources;
        this.width = width;
        this.height = height;
        this.modalPane = modalPane;
        
        root = new createjs.Container();
        root.width = this.width;
        root.height = this.height;
        
        this.help = new createjs.Bitmap(this.resources.images['instructions']);
        this.help.x = Math.floor(width/2);
        this.help.y = Math.floor(height/2);
        this.help.regX = Math.floor(this.help.image.width/2);
        this.help.regY = Math.floor(this.help.image.height/2);
        root.addChild(this.help);
        
        this.logo = new createjs.Bitmap(this.resources.images['logo']);
        this.logo.x = 75;
        this.logo.y = 75;
        this.logo.regX = Math.floor(this.logo.image.width/2);
        this.logo.regY = Math.floor(this.logo.image.height/2);
        root.addChild(this.logo);
        
        this.clickAnywhere = new createjs.Bitmap(this.resources.images['click-anywhere']);
        this.clickAnywhere.x = Math.floor(width/2);
        this.clickAnywhere.y = Math.floor(height * 0.85);
        this.clickAnywhere.regX = Math.floor(this.clickAnywhere.image.width/2);
        this.clickAnywhere.regY = Math.floor(this.clickAnywhere.image.height/2);
        root.addChild(this.clickAnywhere);
        
        var sc = 1.05;
        var tween = new createjs.Tween.get(this.clickAnywhere, {override:true, loop:true})
                .wait(2000)
                .to({rotation:1, scaleX:sc, scaleY:sc}, 105, createjs.Ease.quadOut)
                .to({rotation:-3}, 105, createjs.Ease.quadOut)
                .to({rotation:0, scaleX:1.0, scaleY:1.0}, 400, createjs.Ease.quadOut);
        
        
        var hit = new createjs.Shape();
        hit.graphics.beginFill('#000').rect(0, 0, width, height).endFill();
        root.hitArea = hit;
        root.addEventListener("mousedown", onMouseDown.bind(this));
        
        root.alpha = 0.0;
    }
        
    function onMouseDown() {
        if (this.onClick)
            this.onClick();
    }
    
    MenuView.prototype.constructor = MenuView;
    
    MenuView.prototype.fadeIn = function() {
        //createjs.Ticker.addEventListener("tick", this.tick.bind(this));
        this.stage.addChild(root);
        
        var fadeInTime = 500;
        createjs.Tween.get(root, {override:true})
            .to({alpha:1.0}, fadeInTime, createjs.Ease.quadIn)
            .call(onShowEvent.bind(this));
        
        this.logo.scaleX = 1.2;
        this.logo.scaleY = 1.2;
        this.logo.rotation = -15;
        createjs.Tween.get(this.logo, {override:true})
            .to({rotation:0, scaleX:1.0, scaleY:1.0}, 1500, createjs.Ease.bounceOut);        
    };
    
    MenuView.prototype.fadeOut = function() {
        createjs.Tween.get(root, {override:true})
            .to({alpha:0.0}, 50, createjs.Ease.quadOut)
            .call(onHideEvent.bind(this));
    };
              
    MenuView.prototype.tick = function() {            
        //this.stage.update();
    };
    
    function onShowEvent(evt) {
        root.alpha = 1.0;
    }
    
    function onHideEvent(evt) {
        this.stage.removeChild(root);
        //createjs.Ticker.removeEventListener("tick", this.tick.bind(this));
    }
    
    return MenuView;
}());