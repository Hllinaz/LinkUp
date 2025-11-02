class Query extends StateBase {
    nextState;
    queryParams;
    queryResults;
    method;

    constructor(nextState) {
        super();
        this.nextState = nextState;
        this.queryParams = this.nextState.queryParams;
        this.method = this.queryParams[0].options.method
    }

    async enter() {
        switch (this.method) {
            case 'GET':
                await this.getters()
                break;
            case 'POST':
            case 'DELETE':
            case 'PUT':
                await this.mutators()
                break;
            default:
                console.error(`Unsupported method: ${this.method}`);
        }

    }

    async getters() {
        try {
            const results = {}
            const errors = {}

            const queryPromises = this.queryParams.map(async (params, index) => {
                try {
                    const response = await fetch(params.url, params.options);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const contentType = response.headers.get('content-type');
                    const data = contentType?.includes('application/json')
                        ? await response.json()
                        : await response.text();
                    return {
                        key: params.key || `query ${index}`,
                        success: true,
                        data: data
                    }
                } catch (e) {
                    return {
                        key: params.key || `query${index}`,
                        success: false,
                        error: e.message
                    };
                }
            });

            const settledResults = await Promise.allSettled(queryPromises);

            settledResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    const item = result.value;
                    if (item.success) {
                        results[item.key] = item.data;
                    } else {
                        errors[item.key] = item.error;
                    }
                } else {
                    errors[`query${index}`] = result.reason.message;
                }
            });
            await AppStateMachine.changeStateReady(this.nextState,
                {
                    data: results,
                    errors: errors,
                    hasErrors: Object.keys(errors).length > 0
                }
            );

        } catch (e) {
            console.log('error in getters', e)
            await AppStateMachine.changeStateReady(getError(),
                {
                    error: e.message
                }
            );
        }
    }

    async mutators() {
        try {
            const results = {};
            const errors = {};

            const queryPromises = this.queryParams.map(async (params, index) => {
                try {
                    const response = await fetch(params.url, params.options);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const contentType = response.headers.get('content-type');
                    let data = null;

                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else if (response.status !== 204) {
                        data = await response.text();
                    }
                    console.log(data)
                    return {
                        key: params.key || `mutation${index}`,
                        success: true,
                        data: data,
                        status: response.status
                    };
                } catch (e) {
                    return {
                        key: params.key || `mutation${index}`,
                        success: false,
                        error: e.message
                    };
                }
            });

            const settledResults = await Promise.allSettled(queryPromises);

            settledResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const item = result.value;
                    if (item.success) {
                        results[item.key] = item.data;
                    } else {
                        errors[item.key] = item.error;
                    }
                } else {
                    errors[`mutation${index}`] = result.reason.message;
                }
            });

            await AppStateMachine.changeStateReady(this.nextState, {
                data: results,
                errors: errors,
                hasErrors: Object.keys(errors).length > 0,
                method: this.method
            });

        } catch (e) {
            console.error('Error in mutators:', e);
            await AppStateMachine.changeStateReady(this.nextState, {
                error: e.message
            });
        }
    }
}