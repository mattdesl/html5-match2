//simple A* implementation, using the following references:
//http://en.wikipedia.org/wiki/A*_search_algorithm
//http://www.briangrinstead.com/blog/astar-search-algorithm-in-javascript

//A less expensive alternative would be to store each tile with an "other" (x, y) index,
//pointing to its match. However, this only work if we show each pair no more than once.

function Node(x, y, parent, g, h, f) {
    this.x = x;
    this.y = y;
    this.parent = parent || -1;
    this.g = g || 0;
    this.h = h || 0;
    this.f = f || 0;
}

//Manhattan distance
function heuristic(a, b) {
    var dx = Math.abs(b.x - a.x);
    var dy = Math.abs(b.y - a.y);
    return dx + dy;
}

function low_f(open) {
    var c = open[0].f; //lowest score
    var n = 0; //node index
    for (var i=1; i<open.length; i++) {
        if (open[i].f < c) { //if node is lower...
            c = open[i].f;
            n = i;
        }                
    }
    return n;
}

function neighbours(grid, current, columns, rows) {
    var x = current.x;
    var y = current.y;
    var n = [];
    if ( x-1 >= 0 ) //left
        n.push( new Node(x-1, y) );
    if ( x+1 < columns ) //right
        n.push( new Node(x+1, y) );
    if ( y-1 >= 0 ) //up
        n.push( new Node(x, y-1) );
    if ( y+1 < rows ) //down
        n.push( new Node(x, y+1) );
    return n;
}

function indexOf(list, node) {
    for (var i=0; i<list.length; i++) {
        if ( list[i].x == node.x && list[i].y == node.y )
            return i;
    }
    return -1;
}

function AStar(grid, startX, startY, endX, endY, columns, rows, maxMoves) {
    maxMoves = maxMoves || -1;
    
    var startNode = new Node(startX, startY);
    var endNode = new Node(endX, endY);
    
    var closed = [];
    var open = [];
    
    startNode.g = 0;
    startNode.h = heuristic(startNode, endNode);
    startNode.f = startNode.g + startNode.h;
    
    open.push(startNode);
    
    while (open.length > 0) {
        //first, find the best open node (with lowest f score)
        var currentIndex = low_f(open);
        var current = open[currentIndex];
        
        //if current node is end node.. we've reached the destination
        if (current.x == endNode.x && current.y == endNode.y) {
            var c = current;
            //reached the end... walk back to front
            var list = [];
            //walk up the closed list 
            while (c && c.parent) {
                list.push(c);
                c = c.parent;
            }
            return list.reverse();
        }
        
        //remove current from open set
        open.splice(currentIndex, 1);
        
        //push onto closed set
        closed.push(current);
        
        var neighb = neighbours(grid, current, columns, rows);
        
        for (var i=0; i<neighb.length; i++) {
            var n = neighb[i];
                
            var tooFar = false;
            
            //if we have a limited number of moves
            if (maxMoves!=-1) {
                var dx = Math.abs(n.x - startNode.x);
                var dy = Math.abs(n.y - startNode.y);
                tooFar = dx>=maxMoves || dy>=maxMoves;
            }
            
            //grid true => walkable (i.e. not visible) 
            if ( !tooFar && (grid[n.x][n.y] || (n.x == endNode.x && n.y == endNode.y)) ) {
                //if the node is already in our closed list, skip it
                if (indexOf(closed, n) != -1)
                    continue;
                
                var g_score = current.g + 1; //distance from node to neighbour
                var best_g = false;
                
                //first time we're looking at this node
                if (indexOf(open, n) == -1) {
                    best_g = true;
                    n.h = heuristic(n, endNode);
                    open.push(n); //push neighbour to open list
                } else if (g_score < n.g) {
                    best_g = true;   
                }
                
                if (best_g) {
                    n.parent = current;
                    n.g = g_score;
                    n.f = n.g + n.h;
                }
            }
        }
    }
    return [];
}
    
