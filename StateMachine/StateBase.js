class StateBase {
    async enter() {}
}

class StateBaseHTML extends StateBase {
    queryParams;
    data;
    root;
    
    constructor(queryParams, root){
        super();
        this.queryParams = queryParams;
        this.root = $(root)
    }

    async enter(queryResults) {
        this.data = queryResults.data;
        await this.render();
        this.bindEvents();
    }

    async render() {}
    bindEvents() {}
}