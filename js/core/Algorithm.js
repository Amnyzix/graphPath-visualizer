class Algorithm {
    constructor(name) {
        this.name = name;
    }

    /**
     * @param {Object} document - Les données pures (ex: GraphDocument avec nodes et edges)
     * @returns {Animation} - L'objet Animation contenant toutes les frames
     */
    run(document) {
        throw new Error(`Method 'run()' must be implemented in ${this.constructor.name}`);
    }
}