function Resources(stage, width, height) {
    
    //PRIVATE MEMBERS
    //---------------
    
    //the assets folder
    var ASSETS_DIR = 'assets/';
    
    //the manifest, which might only be IMAGES if no sound works
    var manifest;
    var totalLoaded = 0;
    var progressLabel;
    
    //PUBLIC MEMBERS
    //---------------
    
    this.soundWorks = false; //Whether to play sounds
    
    this.TILE_IMAGES = [
        'youtube','html5','instagram','rss','skype','twitter'   
    ];
    
    //the list of image file paths
    this.IMAGE_PATHS = [
        //tile images 
        {src:ASSETS_DIR+'youtube.png', id:'youtube'},
        {src:ASSETS_DIR+'html5.png', id:'html5'},
        {src:ASSETS_DIR+'instagram.png', id:'instagram'},
        {src:ASSETS_DIR+'rss.png', id:'rss'},
        {src:ASSETS_DIR+'skype.png', id:'skype'},
        {src:ASSETS_DIR+'twitter.png', id:'twitter'},
        {src:ASSETS_DIR+'wordpress.png', id:'wordpress'},
        
        //non-tile images
        {src:ASSETS_DIR+'wood.png', id:'wood'},
        {src:ASSETS_DIR+'clock.png', id:'clock'},
        {src:ASSETS_DIR+'glass.png', id:'hint'},
        {src:ASSETS_DIR+'power.png', id:'menu'},
        {src:ASSETS_DIR+'button.png', id:'button-hover'}
    ];
    
    //the list of sound file paths
    this.SOUND_PATHS = [
        //{src:ASSETS_DIR+'Music.mp3|Music.ogg', id:'Music'},
        //{src:ASSETS_DIR+'ExitReached.mp3|ExitReached.ogg', id:'ExitReached'}
    ];
    
    this.images = {};
    this.tileImages = [];
    
    //some other public members that we can keep in Resources
    this.DEFAULT_FONT = '20px Lato, sans-serif';
    
    // Callback for load completion
    this.onLoaded = function() {
        //stub
    }
    
    // Starts the progress loader
    this.load = function() {
        //Add our preload text
        progressLabel = new createjs.Text('Loading assets...', this.DEFAULT_FONT, '#fff');
        progressLabel.x = width/2;
        progressLabel.y = height/2;
        progressLabel.textAlign = 'center';
        progressLabel.textBaseline = 'middle';
        stage.addChild(progressLabel);
                
        stage.update(); //update with new progress label       
        
        //register WebAudio and HTML5 audio.. hopefully one of them works
        createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]);
        
        //manifest starts with images only
        manifest = this.IMAGE_PATHS;
        
        //setup our preloader for images and sounds
        this.preloader = new createjs.LoadQueue();
        
        //check if sound is available
        if (createjs.Sound.isReady()) {
            this.soundWorks = true;
            
            //install the sound plugin
            this.preloader.installPlugin(createjs.Sound);
            
            //add sound assets to our preloader manifest
            manifest = manifest.concat(this.SOUND_PATHS);
        }
        
        //attach our event listeners for progress loading
        //use bind(this) to maintain proper scope
        this.preloader.addEventListener("complete", onLoadComplete.bind(this));
        this.preloader.addEventListener("fileload", onFileLoad.bind(this));
        this.preloader.addEventListener("error", onFileError.bind(this));
        this.preloader.addEventListener("progress", onProgress.bind(this));
        
        //load our images (and sound if it works)
        this.preloader.loadManifest(manifest);
    };
    
    function onLoadComplete(evt) {
        
    }
        
    function onFileLoad(evt) {
        //determine type
        switch (evt.item.type) {
            case createjs.LoadQueue.IMAGE:
                //now we need to create an image
                var img = new Image();
                img.onload = onFileComplete.bind(this);
                img.src = evt.item.src;
                this.images[evt.item.id] = img;
                
                //if the array is one of our tile images
                if ($.inArray(evt.item.id, this.TILE_IMAGES) != -1)
                    this.tileImages.push(img);
                break;
            case createjs.LoadQueue.SOUND:
                onFileComplete();
                break;
        }
    }
    
    function onFileComplete(evt) {
        totalLoaded++;
        progressLabel.text = 'Loading: '+Math.floor(totalLoaded/manifest.length * 100)+'%';
        stage.update();
        
        if (totalLoaded === manifest.length) {
            stage.removeChild(progressLabel);
            stage.update();
            this.onLoaded();
        }
    }
    
    function onFileError(evt) {
        //TODO: add error check
    }
    
    function onProgress(evt) {
        
    }
}