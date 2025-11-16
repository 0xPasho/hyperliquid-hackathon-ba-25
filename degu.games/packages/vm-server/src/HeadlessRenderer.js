/**
 * HeadlessRenderer - Minimal mock renderer for server-side Scratch VM
 *
 * Provides just enough functionality to load SVG costumes without WebGL.
 * The actual rendering happens on the client side.
 */

class HeadlessRenderer {
    constructor() {
        this._skins = new Map();
        this._nextSkinId = 0;
    }

    /**
     * Create an SVG skin from SVG data
     * @param {string} svgData - SVG string data
     * @param {number} rotationCenter - Rotation center [x, y]
     * @returns {number} Skin ID
     */
    createSVGSkin(svgData, rotationCenter) {
        const skinId = this._nextSkinId++;
        this._skins.set(skinId, {
            type: 'svg',
            data: svgData,
            rotationCenter: rotationCenter || [0, 0]
        });
        return skinId;
    }

    /**
     * Create a bitmap skin from image data
     * @param {ImageData} imageData - Image data
     * @param {number} rotationCenter - Rotation center [x, y]
     * @returns {number} Skin ID
     */
    createBitmapSkin(imageData, rotationCenter) {
        const skinId = this._nextSkinId++;
        this._skins.set(skinId, {
            type: 'bitmap',
            data: imageData,
            rotationCenter: rotationCenter || [0, 0]
        });
        return skinId;
    }

    /**
     * Create a text skin for speech bubbles (no-op for headless)
     * @param {string} type - Bubble type ('say' or 'think')
     * @param {string} text - Text content
     * @returns {number} Skin ID
     */
    createTextSkin(type, text) {
        const skinId = this._nextSkinId++;
        this._skins.set(skinId, {
            type: 'text',
            bubbleType: type,
            text: text
        });
        return skinId;
    }

    /**
     * Update a text skin (no-op for headless)
     * @param {number} skinId - Skin ID
     * @param {string} type - Bubble type
     * @param {string} text - Text content
     */
    updateTextSkin(skinId, type, text) {
        if (this._skins.has(skinId)) {
            const skin = this._skins.get(skinId);
            skin.bubbleType = type;
            skin.text = text;
        }
    }

    /**
     * Update a skin's rotation center
     * @param {number} skinId - Skin ID
     * @param {Array<number>} rotationCenter - New rotation center [x, y]
     */
    updateSVGSkin(skinId, svgData, rotationCenter) {
        if (this._skins.has(skinId)) {
            const skin = this._skins.get(skinId);
            skin.data = svgData;
            skin.rotationCenter = rotationCenter || skin.rotationCenter;
        }
    }

    /**
     * Destroy a skin
     * @param {number} skinId - Skin ID to destroy
     */
    destroySkin(skinId) {
        this._skins.delete(skinId);
    }

    /**
     * Get skin info (for debugging)
     * @param {number} skinId - Skin ID
     * @returns {object} Skin info
     */
    getSkinInfo(skinId) {
        return this._skins.get(skinId) || null;
    }

    /**
     * Create a drawable (placeholder for VM compatibility)
     * @returns {number} Drawable ID
     */
    createDrawable() {
        return this._nextSkinId++;
    }

    /**
     * Update drawable properties (no-op for headless)
     */
    updateDrawableProperties() {
        // No-op in headless mode
    }

    /**
     * Update drawable position (no-op for headless)
     */
    updateDrawablePosition(drawableId, position) {
        // No-op in headless mode
    }

    /**
     * Update drawable direction (no-op for headless)
     */
    updateDrawableDirection(drawableId, direction) {
        // No-op in headless mode
    }

    /**
     * Update drawable direction and scale (no-op for headless)
     */
    updateDrawableDirectionScale(drawableId, direction, scale) {
        // No-op in headless mode
    }

    /**
     * Update drawable scale (no-op for headless)
     */
    updateDrawableScale(drawableId, scale) {
        // No-op in headless mode
    }

    /**
     * Update drawable visibility (no-op for headless)
     */
    updateDrawableVisible(drawableId, visible) {
        // No-op in headless mode
    }

    /**
     * Update drawable effect (no-op for headless)
     */
    updateDrawableEffect(drawableId, effectName, value) {
        // No-op in headless mode
    }

    /**
     * Clear drawable effects (no-op for headless)
     */
    clearDrawableEffects(drawableId) {
        // No-op in headless mode
    }

    /**
     * Set drawable order (no-op for headless)
     */
    setDrawableOrder() {
        // No-op in headless mode
    }

    /**
     * Destroy a drawable (no-op for headless)
     */
    destroyDrawable() {
        // No-op in headless mode
    }

    /**
     * Draw (no-op for headless - rendering happens on client)
     */
    draw() {
        // No-op in headless mode - client handles rendering
    }

    /**
     * Resize (no-op for headless)
     */
    resize() {
        // No-op in headless mode
    }

    /**
     * Get skin size
     * @param {number} skinId - Skin ID
     * @returns {Array<number>} [width, height]
     */
    getSkinSize(skinId) {
        // Return default Scratch sprite size
        return [100, 100];
    }

    /**
     * Get skin rotation center
     * @param {number} skinId - Skin ID
     * @returns {Array<number>} [x, y]
     */
    getSkinRotationCenter(skinId) {
        const skin = this._skins.get(skinId);
        return skin ? skin.rotationCenter : [0, 0];
    }

    /**
     * Check if the renderer uses GPU
     * @returns {boolean} Always false for headless
     */
    get useGpuMode() {
        return false;
    }

    /**
     * Set layer group ordering (no-op for headless)
     * @param {Array} groupOrdering - Layer group ordering
     */
    setLayerGroupOrdering(groupOrdering) {
        // No-op in headless mode
    }

    /**
     * Set background color (no-op for headless)
     * @param {number} red - Red value (0-1)
     * @param {number} green - Green value (0-1)
     * @param {number} blue - Blue value (0-1)
     */
    setBackgroundColor(red, green, blue) {
        // No-op in headless mode
    }

    /**
     * Update drawable skin (no-op for headless)
     * @param {number} drawableId - Drawable ID
     * @param {number} skinId - Skin ID
     */
    updateDrawableSkin(drawableId, skinId) {
        // No-op in headless mode
    }

    /**
     * Update drawable skin ID (no-op for headless)
     * @param {number} drawableId - Drawable ID
     * @param {number} skinId - Skin ID
     */
    updateDrawableSkinId(drawableId, skinId) {
        // No-op in headless mode
    }

    /**
     * Get fenced position of drawable (for boundary collision)
     * @param {number} drawableId - Drawable ID
     * @param {Array<number>} position - [x, y] position
     * @returns {Array<number>} Fenced [x, y] position
     */
    getFencedPositionOfDrawable(drawableId, position) {
        // Return position as-is (no fencing in headless mode)
        return position;
    }

    /**
     * Get bounds for a skin
     * @param {number} drawableId - Drawable ID
     * @returns {object} Bounds {left, right, top, bottom}
     */
    getBounds(drawableId) {
        // Return default bounds
        return {
            left: -50,
            right: 50,
            top: 50,
            bottom: -50
        };
    }

    /**
     * Get tight bounds for a skin (used for collision detection)
     * @param {number} drawableId - Drawable ID
     * @returns {object} Bounds {left, right, top, bottom}
     */
    getTightBounds(drawableId) {
        return this.getBounds(drawableId);
    }

    /**
     * Check if a drawable is touching a color
     * @returns {boolean} Always false in headless mode
     */
    isTouchingColor() {
        return false;
    }

    /**
     * Check if a drawable is touching another drawable
     * @returns {boolean} Always false in headless mode
     */
    isTouchingDrawable() {
        return false;
    }

    /**
     * Get current render target
     * @returns {null} No render target in headless mode
     */
    getCurrentRenderTarget() {
        return null;
    }

    /**
     * Create a pen skin for pen extension (no-op for headless)
     * @returns {number} Skin ID
     */
    createPenSkin() {
        const skinId = this._nextSkinId++;
        this._skins.set(skinId, {
            type: 'pen'
        });
        return skinId;
    }

    /**
     * Pen operations (no-op for headless)
     */
    penClear() {
        // No-op in headless mode
    }

    penLine(penSkinId, attributes, x1, y1, x2, y2) {
        // No-op in headless mode
    }

    penPoint(penSkinId, attributes, x, y) {
        // No-op in headless mode
    }

    penStamp(penSkinId, drawable) {
        // No-op in headless mode
    }

    /**
     * Get bounds for bubble (speech/think)
     * @param {object} drawable - Drawable
     * @returns {object} Bounds {left, right, top, bottom, width, height}
     */
    getBoundsForBubble(drawable) {
        return {
            left: -50,
            right: 50,
            top: 50,
            bottom: -50,
            width: 100,
            height: 100
        };
    }

    /**
     * Get current size of a skin
     * @param {number} skinId - Skin ID
     * @returns {Array<number>} [width, height]
     */
    getCurrentSkinSize(skinId) {
        return this.getSkinSize(skinId);
    }

    /**
     * Get native size of a skin
     * @param {number} skinId - Skin ID
     * @returns {Array<number>} [width, height]
     */
    getNativeSize(skinId) {
        return [100, 100];
    }

    /**
     * Get drawable order
     * @param {number} drawableId - Drawable ID
     * @returns {number} Order
     */
    getDrawableOrder(drawableId) {
        return 0;
    }

    /**
     * Check if drawable is touching another drawable
     * @returns {boolean} Always false in headless mode
     */
    drawableTouching() {
        return false;
    }

    /**
     * Check if drawable is touching drawables (plural)
     * @returns {boolean} Always false in headless mode
     */
    isTouchingDrawables() {
        return false;
    }

    /**
     * Enter draw region (no-op for headless)
     */
    enterDrawRegion() {
        // No-op in headless mode
    }

    /**
     * Event emitter support (no-op for headless)
     */
    on() {
        // No-op in headless mode
    }

    /**
     * GL context (null for headless)
     */
    get gl() {
        return null;
    }
}

module.exports = HeadlessRenderer;
