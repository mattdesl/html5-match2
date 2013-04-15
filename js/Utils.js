//Standard Array shuffle utility
Array.prototype.shuffle = function () {
    for (var i = this.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = this[i];
        this[i] = this[j];
        this[j] = tmp;
    }
    return this;
};

var GraphicsUtils = new function() {
    
    //simple dashed line implementation for horizontal and vertical lines
    this.dashedLine = function(g, x, y, dst, vert, dashSize, spaceSize) {
        //move to starting position
        g.moveTo(x, y);
        var count = dst / (dashSize+spaceSize);
        var draw = true;
        for (var i=0; i<count*2; i++) {
            if (vert)
                y += draw ? dashSize : spaceSize;
            else
                x += draw ? dashSize : spaceSize;            
            if (draw) 
                g.lineTo(x, y);
            else 
                g.moveTo(x, y);
            draw = !draw;
        }
    }   
}