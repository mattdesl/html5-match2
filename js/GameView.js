var GameView = (function() {
    
    var root;
    var DEFAULT_LEVEL_SIZE = 4;
    var LEVEL_TIME_MULT = 5000; //levelSize * levelTimeMult
    var LEVEL_ADD_AMT = 0.25; //increases by 25%
    var DEFAULT_HINTS = 2;
    var DEFAULT_TIME_ADDS = 4;
    
    var MATCHES_NEEDED_FOR_TIME = 5;
    var MATCHES_NEEDED_FOR_HINT = 6;
    var MATCH_SCORE_INC = 20;
    
    var TEXT_COLOR = '#806142';
    var PANEL_COLOR = '#37291c';
    var TIME_BAR_OFFSET = 2.0;
    var SMALL_FONT = FontStyle(16);
    var SCORE_FONT = FontStyle(16);
    var BUTTON_ICON_OFFSET_X = 7; //offset from left
    var BUTTON_TEXT_OFFSET_X = 9; //offset from right
    var BUTTON_OUT_ALPHA = 0.25;
    
    var GameView = function(stage, resources, width, height, modalPane) {
        this.stage = stage;
        this.resources = resources;
        this.width = width;
        this.height = height;
        this.modalPane = modalPane;
        
        root = new createjs.Container();
        //TODO: place this somewhere....
        root.x += 10;
        root.y += 10;
        
        //setup default params
        this.matchCountInLevel = 0;
        this.running = false;
        this.level = 1;
        this.totalScore = 0;
        this.levelScore = 0;
        this.levelTilesX = DEFAULT_LEVEL_SIZE;
        this.levelTilesY = DEFAULT_LEVEL_SIZE;
        this.hintsLeft = DEFAULT_HINTS;
        this.timeAddsLeft = DEFAULT_TIME_ADDS;
        this.levelTime = this.levelTilesX * LEVEL_TIME_MULT;
        
        //setup GUI elements
        this.setupGUI();    
        
        this.updateLabels();
        
        //root starts as transparent, then fades in
        root.alpha = 0.0;
    };
        
    //constructor
    GameView.prototype.constructor = GameView;
        
    //sets up all the GUI elements of our game view...
    GameView.prototype.setupGUI = function() {
        //the game grid
        this.grid = new Grid(this.stage, this.resources);
        this.grid.onMatch = onMatch.bind(this);
        this.grid.onFail = onFail.bind(this);
        this.grid.onComplete = onLevelComplete.bind(this);
        this.grid.enabled = false;
        this.grid.setup(this.levelTilesX, this.levelTilesY);
        
        this.grid.container.x = 0;
        this.grid.container.y = 0;
        root.addChild(this.grid.container);
        
        //the time progress bar
        this.timeBar = new createjs.Shape();
        //offset to align with grid stroke
        this.timeBar.width = this.grid.container.width + 3.0; 
        this.timeBar.height = 20;
        this.timeBar.graphics.beginFill(PANEL_COLOR)
                .rect(0, 0, this.timeBar.width, this.timeBar.height)
                .endFill();
        this.timeBar.x = this.grid.container.x - 2.0;
        this.timeBar.y = this.grid.container.height;
        root.addChild(this.timeBar);
        
        this.timeRemainingLabel = new createjs.Text('', 
                                                    SMALL_FONT, TEXT_COLOR);
        this.timeRemainingLabel.x = this.grid.container.x + 5.0;
        this.timeRemainingLabel.y = this.grid.container.height + this.timeBar.height/2 - 1.0;
        this.timeRemainingLabel.textBaseline = 'middle';
        root.addChild(this.timeRemainingLabel);
        
        //padding for our score panel
        var PAD = 5;
        this.scorePanel = new createjs.Container();
        this.scorePanel.width = this.resources.images['button-hover'].width + PAD*2;
        this.scorePanel.height = 300;
        this.scorePanel.x = this.grid.container.width;
        this.scorePanel.y = -2.0; //offset to align with grid stroke
        
        root.addChild(this.scorePanel);
        
        //a dotted separator we can re-use for our score panel
        var separator = new createjs.Graphics();
        separator.setStrokeStyle(1);
        separator.beginStroke('#5c4733');
        GraphicsUtils.dashedLine(separator, 
                                 PAD, 0,
                                 this.scorePanel.width-PAD*2,
                                 false, 2, 2);
        separator.endStroke();
        
        
        //the add time button    
        this.addTimeButton = imgButton(this.timeAddsLeft, 'clock',
                                       PAD, PAD*2, timeButtonCallback.bind(this));
        this.scorePanel.addChild(this.addTimeButton);
                
        //the show hint button
        this.hintButton = imgButton(this.hintsLeft, 'hint',
                                    PAD, this.addTimeButton.y+this.addTimeButton.height+PAD,
                                    hintButtonCallback.bind(this));
        this.scorePanel.addChild(this.hintButton);
        
        var sep1 = new createjs.Shape(separator);
        sep1.y = this.hintButton.y + this.hintButton.height + PAD*2 + 0.5;
        this.scorePanel.addChild(sep1);
        
        var scoreX = PAD;
        var scoreY = PAD*2 + sep1.y;
        
        this.levelLabel = scoreText('Level: 1', 
                                scoreX, scoreY);
        this.scorePanel.addChild(this.levelLabel);
        
        //get line off of first label
        var lineOff = 10 + this.levelLabel.getMeasuredLineHeight();
        
        this.levelScoreLabel = scoreText('Level Score: 0', 
                                scoreX, scoreY += lineOff);
        this.scorePanel.addChild(this.levelScoreLabel);
        
        this.totalScoreLabel = scoreText('Total Score: 0', 
                                scoreX, scoreY += lineOff);
        this.scorePanel.addChild(this.totalScoreLabel);
        
        //determine final size
        scoreY += lineOff;
        
        var sep2 = new createjs.Shape(separator);
        sep2.y = scoreY + PAD;
        this.scorePanel.addChild(sep2);
        
        this.exitButton = imgButton('menu', 'menu', 
                                    PAD, sep2.y + PAD*2,
                                    exitButtonCallback.bind(this));
        this.scorePanel.addChild(this.exitButton);
        
        this.scorePanel.height = this.exitButton.y + this.exitButton.height + PAD*2;
        this.scorePanel.width = this.exitButton.width + PAD*2;
        
        //the panel for our buttons/score
        this.scorePanelBG = new createjs.Shape();
        this.scorePanelBG.width = this.scorePanel.width;
        this.scorePanelBG.height = this.scorePanel.height;
        this.scorePanelBG.graphics.beginFill(PANEL_COLOR)
                .rect(0, 0, this.scorePanelBG.width, this.scorePanelBG.height)
                .endFill(); 
        this.scorePanel.addChildAt(this.scorePanelBG, 0);
    };
        
    GameView.prototype.fadeIn = function() {
        this.stop(); //ensure its not running...
        createjs.Ticker.addEventListener("tick", this.tick.bind(this));
        this.stage.addChild(root);
        createjs.Tween.get(root, {override:true})
            .to({alpha:1.0}, 500, createjs.Ease.quadIn)
            .call(onShowEvent.bind(this));
    };
    
    GameView.prototype.fadeOut = function() {
        createjs.Tween.get(root, {override:true})
            .to({alpha:0.0}, 250, createjs.Ease.quadOut)
            .call(onHideEvent.bind(this));
    };
    
    GameView.prototype.start = function() {
        this.levelStartTime = createjs.Ticker.getTime();
        this.running = true;
        this.grid.enabled = true; //enable mouse events
        root.alpha = 1.0;
    };
    
    GameView.prototype.stop = function() {
        this.running = false;
        this.grid.enabled = false; //disable mouse events
    };
        
    GameView.prototype.tick = function() {
        if (this.running) {
            var elapsed = createjs.Ticker.getTime() - this.levelStartTime;
            var amt = Math.max(0, Math.min(1, 1.0 - (elapsed / this.levelTime)));
            this.timeBar.scaleX = amt;
            
            var rem = Math.max(0, Math.floor((this.levelTime - elapsed)/1000))+" s";
            this.timeRemainingLabel.text = 'Time Left: '+rem;
            if (amt<=0) {
                this.running = false;
                this.grid.enabled = false;
                modalPane.fadeIn('Game over!', 'click to try again', this.restart.bind(this));
            }
        } else {
            this.timeRemainingLabel.text = '';
        }
        this.stage.update();
    };
    
    GameView.prototype.updateLabels = function() {        
        this.hintButton.label.text = this.hintsLeft;
        this.addTimeButton.label.text = this.timeAddsLeft;
        
        this.levelLabel.text = 'Level: '+this.level;
        this.levelScoreLabel.text = 'Level Score: '+this.levelScore;
        this.totalScoreLabel.text = 'Total Score: '+this.totalScore;
    };
    
    GameView.prototype.restart = function() {
        this.matchCountInLevel = 0;
        this.level = 1;
        this.totalScore = 0;
        this.levelScore = 0;
        this.levelTilesX = DEFAULT_LEVEL_SIZE;
        this.levelTilesY = DEFAULT_LEVEL_SIZE;
        this.grid.setup(this.levelTilesX, this.levelTilesY);
        
        this.running = true;
        this.grid.enabled = true;
        
        this.hintsLeft = DEFAULT_HINTS;
        this.timeAddsLeft = DEFAULT_TIME_ADDS;
        this.levelTime = this.levelTilesX * LEVEL_TIME_MULT;
        this.levelStartTime = createjs.Ticker.getTime();
        this.updateLabels();      
    };
    
    //loads the next level
    GameView.prototype.nextLevel = function() {
        
        if (this.levelTilesX == this.grid.MAX_TILES_X 
                 && this.levelTilesY == this.grid.MAX_TILES_Y) {
            modalPane.fadeIn('You win!', 'final score: '+this.totalScore,
                                 this.restart.bind(this));
        } else {
            this.levelTilesX = Math.min(this.grid.MAX_TILES_X, this.levelTilesX+1);
            this.levelTilesY = Math.min(this.grid.MAX_TILES_Y, this.levelTilesY+1);
            this.matchCountInLevel = 0;
            this.levelScore = 0;
            this.level++;   
            this.grid.setup(this.levelTilesX, this.levelTilesY);
            this.running = true;
            this.grid.enabled = true;
            this.levelTime = this.levelTilesX * LEVEL_TIME_MULT;
            this.levelStartTime = createjs.Ticker.getTime();
            this.updateLabels();
        }   
    };
    
    function exitButtonCallback(evt) {
        this.running = false;
        this.grid.enabled = false;
        if (this.onExit)
            this.onExit();
    }
            
    function onShowEvent(evt) {
        this.start();
    }
    
    function onHideEvent(evt) {
        this.stage.removeChild(root);
        createjs.Ticker.removeEventListener("tick", this.tick.bind(this));
    }
    
    function scoreText(text, x, y) {
        var txt = new createjs.Text(text, SCORE_FONT, TEXT_COLOR);
        txt.x = x;
        txt.y = y;
        txt.textBaseline = 'top';
        return txt;
    }
    
    function imgButtonOver(evt) {
        createjs.Tween.get(evt.target.buttonBorder, {override:true})
            .to({alpha:1.0}, 300, createjs.Ease.quadOut);
    }
    
    function imgButtonOut(evt) {
        createjs.Tween.get(evt.target.buttonBorder, {override:true})
            .to({alpha:BUTTON_OUT_ALPHA}, 300, createjs.Ease.quadIn);
    }
    
    function imgButton(text, iconID, x, y, callback) {
        var c = new createjs.Container();
        c.x = Math.floor(x);
        c.y = Math.floor(y);
                
        //the border image.. only visible on mouse over
        var bmp = new createjs.Bitmap(this.resources.images['button-hover']);
        bmp.alpha = BUTTON_OUT_ALPHA;
        
        c.width = bmp.image.width;
        c.height = bmp.image.height;
        c.buttonBorder = bmp;
        
        //define a hit area for our container
        var hit = new createjs.Shape();
        hit.graphics.beginFill('#000').drawRect(0, 0, c.width, c.height).endFill();
        c.hitArea = hit;
                
        var txt = new createjs.Text(text, this.resources.DEFAULT_FONT, TEXT_COLOR);
        txt.textAlign = 'right';
        txt.textBaseline = 'middle';
        txt.x = c.width - BUTTON_TEXT_OFFSET_X;
        txt.y = c.height/2;
        c.label = txt;
        
        if (iconID) {
            var ic = new createjs.Bitmap(this.resources.images[iconID]);
            ic.x = Math.round(BUTTON_ICON_OFFSET_X);
            ic.y = Math.round(c.height/2 - ic.image.height/2);
            c.addChild(ic);
            c.icon = ic;
        } else {
            txt.x = c.width/2;   
            txt.textAlign = 'center';
        }
        
        //bmp.addEventListener("mousedown", callback);
        //ic.addEventListener("mousedown", callback);
        c.addEventListener("mousedown", callback);
        c.addEventListener("mouseover", imgButtonOver);
        c.addEventListener("mouseout", imgButtonOut);        
        
        c.addChild(bmp);
        c.addChild(txt);      
        return c;
    }
    
    function hintButtonCallback(evt) {
        if (this.running && this.hintsLeft>0) {
            this.hintsLeft = Math.max(0, this.hintsLeft-1);
            this.updateLabels();
            this.grid.hint();
        }
    }
    
    function timeButtonCallback(evt) {
        if (this.running && this.timeAddsLeft>0) {
            this.timeAddsLeft = Math.max(0, this.timeAddsLeft-1);
            this.levelStartTime += this.levelTime * LEVEL_ADD_AMT;   
            this.updateLabels();
        }
    }
    
    function onMatch(a, b) {
        if (this.running) {
            this.matchCountInLevel++;
            if (this.matchCountInLevel % MATCHES_NEEDED_FOR_HINT == 0) 
                this.hintsLeft++;
            if (this.matchCountInLevel % MATCHES_NEEDED_FOR_TIME == 0)
                this.timeAddsLeft++;
            this.levelScore += MATCH_SCORE_INC;
            this.totalScore += MATCH_SCORE_INC;
            this.updateLabels();
        }
    }
    
    function onFail(a, b) {
        if (this.running) {
            //TODO: describe the match failure (i.e. too many steps)
        }
    }
    
    function onLevelComplete() {
        this.running = false;
        this.grid.enabled = false;
        this.modalPane.fadeIn('Level complete!', 'click to continue', this.nextLevel.bind(this));
    }
    
    return GameView;
}());