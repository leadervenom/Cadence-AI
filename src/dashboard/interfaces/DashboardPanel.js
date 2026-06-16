class DashboardPanel {

    constructor(
        panelId,
        panelName,
        panelRoleScope
    ) {

        this.panelId = panelId;

        this.panelName = panelName;

        this.panelRoleScope = panelRoleScope;

    }


    updateStream(segmentId) {

        throw new Error(

            "updateStream() must be implemented."

        );

    }

}

export default DashboardPanel;