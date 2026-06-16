class Observer {
    update() {
        throw new Error(
            "update() must be implemented."
        );
    }
}

export default Observer;