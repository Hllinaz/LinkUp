class StateMachine {
    currentState;

    constructor(){
        this.currentState = null;
        this.currentViewState = null;
        this.isInAction = false;
    }
    
    async changeStateReady(newState, queryResults) {
        this.currentState = newState;

        if (!this.isInAction) {
            this.currentViewState = newState;
        }
        if (this.currentState && this.currentState.enter) {
            await this.currentState.enter(queryResults);
        }
    }

    async changeView (newState) {
        try {
            if (!getToken()) {
                document.location.href = "login.html"
            }
            await this.reloadWeb(getWeb());
            if (newState.queryParams?.length > 0) {        
                const queryState = new Query(newState);
                await queryState.enter();
            } else {
                await this.changeStateReady(newState);
            }
        } catch (e) {
            console.error('Error in changeView:', e);
        }
    }

    async reloadWeb(webState) {
        try {
            const webQuery = new Query(webState);
            await webQuery.enter();
        } catch (e) {
            console.error('Error reloading Web', e);
        }
    }

    async executeAction(actionState) {
        this.originalStateBeforeAction = this.currentViewState;
        this.isInAction = true;

        try {
            const queryState = new Query(actionState);
            await queryState.enter();
        } catch (e) {
            console.error(e);
        } finally {
            this.isInAction = false;
            if (this.originalStateBeforeAction) {
                await this.changeView(this.originalStateBeforeAction);
            }
        } 
    }
}