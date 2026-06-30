class ProtocolRule {

    constructor(

        ruleId,

        description,

        category

    ) {

        this.ruleId = ruleId;

        this.description = description;

        this.category = category;

    }



    applyRule() {

        console.log(

            `Applying rule:
            ${this.description}`

        );

    }

}

export default ProtocolRule;