var Grid = (function() {
    
    var TILE_SIZE = 48;
    
    var PADDING = 0;
    var GRID_LINE_THICKNESS = 1;
    var PIXEL_OFF = -0.5; //pixel off-center for sharper line
    
    //max number of moves we can make from point A to point B
    var MAX_MOVES = 4; //-1 => unlimited moves
    
    var OUTLINE_COLOR = '#917056';
    var OUTLINE_FAIL_COLOR = '#a32a2a';
    var PATH_COLOR = '#9d897a';
    var GRID_STROKE_COLOR = '#493829';
    
    var Grid = function(stage, resources) {
        this.stage = stage;
        this.resources = resources;
        this.currentTile = null;
        this.container = new createjs.Container();
        
        this.gridLines = new createjs.Shape();
        this.container.addChild(this.gridLines);
        
        this.MAX_TILES_X = 10;
        this.MAX_TILES_Y = 10;
        
        this.container.width = this.MAX_TILES_X * PADDING + this.MAX_TILES_X * TILE_SIZE;
        this.container.height = this.MAX_TILES_Y * PADDING + this.MAX_TILES_Y * TILE_SIZE;
        
        this.enabled = true;
        
        //the grid lines graphics context
        this.border = 3;
        var g = this.gridLines.graphics;
        g.beginStroke(GRID_STROKE_COLOR);
        g.setStrokeStyle(GRID_LINE_THICKNESS);
        this.tiles = new Array(this.MAX_TILES_Y);
        for (var y=0, c=0; y<this.MAX_TILES_Y; y++) {
            this.tiles[y] = new Array(this.MAX_TILES_X);
            for (var x=0; x<this.MAX_TILES_X; x++, c++) {
                var t = new createjs.Bitmap( resources.tileImages[ c % resources.tileImages.length ] );
                t.width = TILE_SIZE;
                t.height = TILE_SIZE;
                t.regX = TILE_SIZE/2;
                t.regY = TILE_SIZE/2;
                t.xIndex = x;
                t.yIndex = y;
                
                //use floor to avoid image interpolation on sub-pixel placement
                t.x = Math.floor( PADDING/2 + TILE_SIZE * x + PADDING * x ) + TILE_SIZE/2;
                t.y = Math.floor( PADDING/2 + TILE_SIZE * y + PADDING * y ) + TILE_SIZE/2;
                
                t.addEventListener("mousedown", onMouseClick.bind(this));
                
                this.tiles[y][x] = t;
                
                this.container.addChild(t);
                
                var dashSize = 5;
                var spaceSize = 2;
                var lineX = Math.floor( x * TILE_SIZE + x * PADDING );
                GraphicsUtils.dashedLine(g, 
                           PIXEL_OFF + lineX, PIXEL_OFF,
                           PIXEL_OFF + this.container.height,
                           true, dashSize, spaceSize);
                
                var lineY = Math.floor( y * TILE_SIZE + y * PADDING);                
                GraphicsUtils.dashedLine(g, 
                           PIXEL_OFF, PIXEL_OFF + lineY,
                           PIXEL_OFF + this.container.width, 
                           false, dashSize, spaceSize);
            }
        }
        //stroke the entire grid
        g.setStrokeStyle(this.border);
        g.rect(PIXEL_OFF, PIXEL_OFF, this.container.width, this.container.height);
        g.endStroke();
        
        this.pathShape = new createjs.Shape();
        this.pathShape.width = this.container.width;
        this.pathShape.height = this.container.height;    
        this.container.addChild(this.pathShape);
        
        this.outlineA = createOutline();
        this.outlineB = createOutline();
        this.container.addChild(this.outlineA);
        this.container.addChild(this.outlineB);
        
        this.log = new createjs.Text("", resources.DEFAULT_FONT, '#fff');
        this.log.x = 5;
        this.log.y = 340;
        this.container.addChild(this.log);
        
        this.setup(this.MAX_TILES_X, this.MAX_TILES_Y);
    };
        
    function createOutline() {
        var out = new createjs.Shape();
        setOutlineStyle(out, OUTLINE_COLOR);
        out.width = TILE_SIZE;
        out.height = TILE_SIZE;
        out.alpha = 0.0;
        out.visible = false;
        return out;
    }
    
    function setOutlineStyle(outline, style) {
        outline.graphics
                .clear()
                .beginStroke(style)
                .setStrokeStyle(2)
                .drawRect(0, 0, TILE_SIZE, TILE_SIZE)
                .endStroke();
    }
    
    function getShuffledTiles(size) {
        var lst = [];
        
        //create a list AABBCC etc
        for (var i=0; i<size; i++) {
            var t = this.resources.tileImages[ i % this.resources.tileImages.length ];
            lst.push(t);
            lst.push(t); //push two of each type
        }
        
        //randomize list using our Utils.js prototype
        lst.shuffle();
        return lst;
    }
    
    function isAdjacent(tileA, tileB) {
        var dx = Math.abs(tileB.xIndex - tileA.xIndex);
        var dy = Math.abs(tileB.yIndex - tileA.yIndex);
        return (dx==1 || dy==1) && (dx+dy == 1);
    }
        
    function hideTweenEvent(evt) {
        if (evt.target)
            evt.target.visible = false;
    }
    
    function showTweenEvent(evt) {
        if (evt.target)
            evt.target.visible = true;
    }
    
    function tweenVisible(show, target, duration, ease) {
        //target.alpha = show ? 0.0 : 1.0;
        //target.visible = show;
        var tween = createjs.Tween.get(target, {override:true})
            .to( {alpha: show ? 1.0 : 0.0 }, duration || 500, ease || createjs.Ease.quadIn )
            .call( show ? showTweenEvent : hideTweenEvent );
    }
    
    
    function onMouseClick(evt) {
        //ignore if the grid is disabled
        if (!this.enabled)
            return;
        
        //tile A selected, user is clicking tile B
        if (this.currentTile) {
            var a = this.currentTile;
            var b = evt.target;
            
            //tween outline A alpha to zero
            this.outlineA.visible = true;
            tweenVisible(false, this.outlineA, 150);
            
            var p = this.path(a, b);
            
            this.outlineB.x = b.x - TILE_SIZE/2;
            this.outlineB.y = b.y - TILE_SIZE/2;
            this.outlineB.visible = true;
            this.outlineB.alpha = 1.0;
            
            var color = p.length > 0 ? OUTLINE_COLOR : OUTLINE_FAIL_COLOR;
            setOutlineStyle(this.outlineA, color);
            setOutlineStyle(this.outlineB, color);
            tweenVisible(false, this.outlineB, 150);
            
            if (p.length > 0) {                
                this.drawPath(p);
                a.visible = false;
                b.visible = false;
                if (this.onMatch) //onMatch callback
                    this.onMatch(a, b);
                this.onChange();                
            } else {
                var sc = 0.85;
                
                createjs.Tween.get(a, {override:true})
                    .to({rotation:15}, 105, createjs.Ease.quadOut)
                    .to({rotation:-15}, 105, createjs.Ease.quadOut)
                    .to({rotation:0, scaleX:1.0, scaleY:1.0}, 400, createjs.Ease.quadOut);
                if (a != b) {   
                    createjs.Tween.get(b, {override:true})
                    .to({rotation:-25}, 105, createjs.Ease.quadOut)
                    .to({rotation:25}, 105, createjs.Ease.quadOut)
                    .to({rotation:0, scaleX:1.0, scaleY:1.0}, 400, createjs.Ease.quadOut);
                }
                
                if (this.onFail)
                    this.onFail(a, b);
            }
            
            this.currentTile = null;
        }
        //no tile is selected, user is clicking tile A
        else {
            this.currentTile = evt.target;
            
            var sc = 0.85;
            createjs.Tween.get(this.currentTile, {override:true})
                .to({scaleX:sc, scaleY:sc}, 50, createjs.Ease.quadOut)
                .to({scaleX:1.0, scaleY:1.0, rotation:0}, 300, createjs.Ease.quadOut);
                      
            //ensure visible
            this.outlineA.visible = false;
            this.outlineA.x = evt.target.x - TILE_SIZE/2;
            this.outlineA.y = evt.target.y - TILE_SIZE/2;
            
            setOutlineStyle(this.outlineA, OUTLINE_COLOR);
            
            //tween alpha to 1.0
            tweenVisible(true, this.outlineA, 150);
        }
        this.stage.update();
    }
        
    //constructor
    Grid.prototype.constructor = Grid;
        
    //called whenever the grid is changed
    Grid.prototype.onChange = function() {
        //TODO: use a more optimized algorithm here
        var start = new Date();
        
        //first check to see if no matching cards are left
        var matchesRemaining = this.matchingTilesRemaining();
        
        //the game is over if no matches remain
        var gameOver = !matchesRemaining;
        
        //if we still have some matches left...
        if (matchesRemaining) {
            //start by assuming there are no valid moves
            gameOver = true;
                        
            //ugly... avoid too many checks and just give up 
            var MAX_ITERATIONS = 100;
            
            //shuffle map until we find a move
            for (var i=0; i<MAX_ITERATIONS; i++) {
                //validate the map with brute force A* 
                var valid = this.validate();
                if (!valid) {
                    //randomize the current grid
                    this.shuffle();
                    
                    //... then we'll try again
                } else { //we found a pattern that has some moves left
                    gameOver = false;
                }
            }
            
            //if we found no valid moves, gameOver will be false
        }
        
        if (gameOver && this.onComplete) {
            this.onComplete();
        }
        var end = new Date();
        //this.log.text = (end-start);
    };
    
    Grid.prototype.allMatchingTiles = function(tileA) {
        lst = [];
        for (var x=0; x<this.MAX_TILES_X; x++) {
            for (var y=0; y<this.MAX_TILES_Y; y++) {
                var t = this.tile(x, y);
                if (tileA != t && t.visible && t.image == tileA.image)
                    lst.push(t);
            }
        }
        return lst;
    };
    
    Grid.prototype.matchingTilesRemaining = function() {
        //iterate through each tile...
        for (var x=0; x<this.MAX_TILES_X; x++) {
            for (var y=0; y<this.MAX_TILES_Y; y++) {
                var tileA = this.tile(x, y);
                
                //skip invisible tiles
                if (!tileA.visible)
                    continue;
                
                //get all matching tiles
                var lst = this.allMatchingTiles( tileA );
                
                //if we have some elements in the list
                if (lst.length > 0)
                    return true;
            }
        }
        return false;
    };
    
    Grid.prototype.hint = function() {
        //iterate through each tile...
        for (var x=0; x<this.MAX_TILES_X; x++) {
            for (var y=0; y<this.MAX_TILES_Y; y++) {
                var tileA = this.tile(x, y);
                
                //skip invisible tiles
                if (!tileA.visible)
                    continue;
                
                //get all matching tiles
                var lst = this.allMatchingTiles( tileA );
                
                //iterate through each tileA -> tileN
                for (var i=0; i<lst.length; i++) {
                    var p = this.path(tileA, lst[i]);
                    //if we have a valid path
                    if (p.length > 0) {
                        var a = this.tile(p[0].x, p[0].y);
                        var b = this.tile(p[p.length-1].x, p[p.length-1].y);
                        var sc = 1.15;
                        //jiggle tiles a little
                        createjs.Tween.get(a, {override:true})
                            .to({rotation:15, scaleX:sc, scaleY:sc}, 105, createjs.Ease.quadOut)
                            .to({rotation:-15}, 105, createjs.Ease.quadOut)
                            .to({rotation:0, scaleX:1.0, scaleY:1.0}, 400, createjs.Ease.quadOut);
                        createjs.Tween.get(b, {override:true})
                            .to({rotation:-15, scaleX:sc, scaleY:sc}, 105, createjs.Ease.quadOut)
                            .to({rotation:15}, 105, createjs.Ease.quadOut)
                            .to({rotation:0, scaleX:1.0, scaleY:1.0}, 400, createjs.Ease.quadOut);
                        
                        
                        this.drawPath(p, 2000, 4, '#fff');                        
                        //we only need to find one hint
                        return;
                    }                        
                }
            }
        }
    };
    
    Grid.prototype.validate = function() {
        //iterate through each tile...
        for (var x=0; x<this.MAX_TILES_X; x++) {
            for (var y=0; y<this.MAX_TILES_Y; y++) {
                var tileA = this.tile(x, y);
                
                //skip invisible tiles
                if (!tileA.visible)
                    continue;
                
                //get all matching tiles
                var lst = this.allMatchingTiles( tileA );
                
                //iterate through each tileA -> tileN
                for (var i=0; i<lst.length; i++) {
                    var p = this.path(tileA, lst[i]);
                    //if we have a valid path
                    if (p.length > 0) {
                        //stop the validation check early
                        return true;
                    }                        
                }
            }
        }
        return false;
    };
    
    Grid.prototype.tile = function(xIndex, yIndex) {
        return this.tiles[yIndex][xIndex];
    };
    
    Grid.prototype.swapTiles = function(tileA, tileB) {
        var tmpImg = tileA.image;
        var tmpVis = tileA.visible;
        tileA.image = tileB.image;
        tileA.visible = tileB.visible;
        tileB.image = tmpImg;
        tileB.visible = tmpVis;
    };
    
    Grid.prototype.path = function(tileA, tileB) {
        //no change in pos; or tile images do not match.. 
        if (tileA == tileB || tileA.image != tileB.image)
            return [];  
        //tiles are next to each other, no need to perform A*
        if (isAdjacent(tileA, tileB))
            return [{x:tileA.xIndex, y:tileA.yIndex}, {x:tileB.xIndex, y:tileB.yIndex}];
        var p = this.search(tileA, tileB);
        var validPath = (p.length > 1) && ((MAX_MOVES == -1) || (p.length <= MAX_MOVES));
        return validPath ? p : [];
    };
    
    Grid.prototype.drawPath = function(path, duration, thickness, style, ease) {
        var g = this.pathShape.graphics;
        this.pathShape.visible = true;
        this.pathShape.alpha = 1.0;
        
        g.clear();
        g.setStrokeStyle(thickness || 2);
        g.beginStroke(style || PATH_COLOR);
        
        if (path.length < 1)
            return;
        
        var x1 = path[0].x;
        var y1 = path[0].y;
        var t1 = this.tile(x1, y1);
        g.moveTo(t1.x, t1.y);
        
        for (var i=1; i<path.length; i++) {
            var x = path[i].x;
            var y = path[i].y;
            var t2 = this.tile(x, y);
            g.lineTo(t2.x, t2.y);
        }
        
        g.endStroke();
        tweenVisible(false, this.pathShape, duration, ease);
    };
        
    //determines the path from point A to point B using A* search
    Grid.prototype.search = function(tileA, tileB) {
        var graph = new Array(this.MAX_TILES_X);
        
        for (var x=0; x<this.MAX_TILES_X; x++) {
            graph[x] = new Array(this.MAX_TILES_Y);
            for (var y=0; y<this.MAX_TILES_Y; y++) {
                graph[x][y] = !this.tile(x, y).visible; //its visible => "a wall"
                if ((tileA.xIndex == x && tileA.yIndex == y) || (tileB.xIndex==x && tileB.yIndex==y))
                    graph[x][y] = true; //start/end pos are not walls
            }
        }
        
        var path = AStar(graph, tileA.xIndex, tileA.yIndex, 
                                tileB.xIndex, tileB.yIndex, this.MAX_TILES_X, this.MAX_TILES_Y);
        return path;
    };
    
    //shuffles the current tiles within our grid size
    Grid.prototype.shuffle = function() {
        var newList = [];
        var lowX = Math.floor( (this.MAX_TILES_X - this.tilesX)/2 );
        var lowY = Math.floor( (this.MAX_TILES_Y - this.tilesY)/2 );
        var highX = lowX + this.tilesX;
        var highY = lowY + this.tilesY;
        for (var x=highX-1; x>=lowX; x--) {
            for (var y=highY-1; y>=lowY; y--) {
                var rx = Math.floor(Math.random() * ((highX-1) - lowX + 1)) + lowX;
                var ry = Math.floor(Math.random() * ((highY-1) - lowY + 1)) + lowY;                
                this.swapTiles( this.tile(x, y), this.tile(rx, ry) );
            }
        }
    };
    
    Grid.prototype.setup = function(tilesX, tilesY) {
        this.tilesX = tilesX;
        this.tilesY = tilesY;
        this.currentTile = null;
        this.outlineA.visible = false;
        this.outlineA.alpha = 0.0;
        this.outlineB.visible = false;
        this.outlineB.alpha = 0.0;
        
        //TODO: center visible tiles instead of using top left
        
        //constrain container size
        
        var area = tilesX * tilesY;
        var types = getShuffledTiles(area / 2);
        //this.log.text = area;
        
        for (var x=0, count=0; x<this.MAX_TILES_X; x++) {
            for (var y=0; y<this.MAX_TILES_Y; y++) {
                var t = this.tile(x, y);
                
                //center visible tiles
                var left = Math.floor( (this.MAX_TILES_X - tilesX)/2 );
                var top = Math.floor( (this.MAX_TILES_Y - tilesY)/2 );
                var right = left + tilesX;
                var bottom = top + tilesY;
                t.visible = x >= left && y >= top && x < right && y < bottom;
                t.rotation = 0.0;
                t.scaleX = 1.0;
                t.scaleY = 1.0;
                
                if (t.visible) {
                    t.image = types[ count % types.length ];
                    count++;
                }
            }
        }
        this.onChange();        
    };
        
    return Grid;
}());