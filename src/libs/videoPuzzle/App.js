import 'pixi.js'
import 'pixi-filters'
import 'pixi-sound'
import 'pixi-display'
import Stats from 'stats.js'
import {Piece} from './Piece.js'

export class App {

  constructor() {
    this.pixiApp = undefined
    this.fpsCount = undefined
    this.canvas = undefined

    this.maxWidth = 1280
    this.maxHeight = 720

    this.targetFPS = 60
    this.lastTick = window.performance.now() / 1000
    this.hasFocus = true

    this.soundResources = {}
    this.instances = []
  }

  initApp(pm) {

    let type = "WebGL"
      if(!PIXI.utils.isWebGLSupported()){
      type = "canvas"
    }

    PIXI.utils.sayHello(type)
    console.log(this.targetFPS)

    this.canvas = document.getElementById('videoPuzzle')
    this.pixiApp = new PIXI.Application({
      width: this.maxWidth,
      height: this.maxHeight,
      backgroundColor: 0x77C9D4,
      view: this.canvas
    }) 

    //Add the canvas to the HTML document
    document.body.appendChild(this.pixiApp.view)

    // Stage
    this.scaleStageToWindow()

    // Fps counter
    if (process.env.NODE_ENV != 'production') {
      this.fpsCount = new Stats()
      this.fpsCount.showPanel(0)
      document.body.appendChild(this.fpsCount.dom)
    }

    // responsive canvas
    window.addEventListener("resize", this.scaleStageToWindow.bind(this), false)

    window.addEventListener("visibilitychange", this.onVisibiityChange.bind(this), false)

    // Display groups
    this.pixiApp.stage.displayList = new PIXI.DisplayList()
    this.uiLayer = new PIXI.DisplayGroup(1, false)

    this.gameLoop()
  }

  // Load sprites to cache
  loadTextures(texArray, next) {
    console.log("Loading textures")
    PIXI.loader
    .add(texArray)
    .on("progress", this.loadProgressHandler)
    .load(next)
  }

  loadAudio(sndArray, next) {
    console.log("Loading sounds")    
    sndArray.forEach( (snd) => {
      this.soundResources[snd.name] = PIXI.sound.Sound.from(snd.file)
      this.soundResources[snd.name].loop = snd.loop
      this.soundResources[snd.name].volume = snd.volume
    })
    next()
  }

  loadProgressHandler(loader, resource) {
    console.log(`Loading "${resource.url}" ... ${loader.progress}%`)
  }

  scaleStageToWindow() {
    let hRatio = (window.innerHeight) / this.maxHeight
    let wRatio = (window.innerWidth) / this.maxWidth
    let leastRatio = Math.min(hRatio, wRatio)
    
    this.pixiApp.renderer.resize(Math.min(this.maxWidth * leastRatio, this.maxWidth), Math.min(this.maxHeight * leastRatio, this.maxHeight))
    this.pixiApp.stage.scale = new PIXI.Point(Math.min(1, leastRatio), Math.min(1, leastRatio))
  }

  destroyInstance(instance) {
    if (instance) {
      this.pixiApp.stage.removeChild(instance)
      instance.destroy({
        children: true,
        texture: true,
        baseTexture: false   
      })
      instance = null
    }
  }

  registerInstance(inst) {
    this.instances.push(inst)
  }

  unregisterInstance(inst) {
    let index = this.instances.indexOf(inst)

    if (index > -1) {
      this.instances.splice(index, 1)
    }
  }

  onVisibiityChange() {
    if (document.hidden) {
      this.hasFocus = false
    } else {
      this.hasFocus = true
      this.lastTick = window.performance.now() / 1000
      this.timeSinceLastFrame = 0
    }
  }

  gameLoop() {
    if (process.env.NODE_ENV != 'production') {
      this.fpsCount.begin()
    }
    
    requestAnimationFrame(this.gameLoop.bind(this));
    
    this.instances.forEach( (inst) => {
      if (!inst.processPaused) {
        inst.process()
      }
    })

    if (this.hasFocus) {
      let thisTick = window.performance.now() / 1000
      let elapsed = thisTick - this.lastTick

      if (elapsed > 1 / this.targetFPS) {
        this.pixiApp.renderer.render(this.pixiApp.stage)
        this.lastTick = thisTick - (elapsed % (1 / this.targetFPS))
      }
    }

    if (process.env.NODE_ENV != 'production') {
      this.fpsCount.end()
    }
  }
}