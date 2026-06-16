class AIServiceClient {

    async generateSeating(data, modelName) {

        const response = await fetch(
            "http://localhost:8000/generate-seating",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    modelName,
                    ...data
                })
            }
        );

        return await response.json();

    }


    async generateRunningOrder(data, modelName) {

        const response = await fetch(
            "http://localhost:8000/generate-running-order",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    modelName,
                    ...data
                })
            }
        );

        return await response.json();

    }


    async suggestTrafficFlow(data, modelName) {

        const response = await fetch(
            "http://localhost:8000/suggest-traffic-flow",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    modelName,
                    ...data
                })
            }
        );

        return await response.json();

    }

}

export default AIServiceClient;