describe("Genealogy tests suit", function () {
    it("When I logged as an admin and when I click on genealogy, choose a source, and compare with a term ", function () {
        cy.viewport(1920, 975);

        cy.visit("http://localhost:3010/login");

        cy.get(".modal-content > .modal-body > form > .form-group > #username").click();

        cy.get(".modal-content > .modal-body > form > .form-group > #username").type("admin");

        cy.get(".modal-content > .modal-body > form > .form-group > #password").type("admin");

        cy.get(".modal-dialog > .modal-content > .modal-body > form > .btn").click();

        cy.visit("http://localhost:3010/vocables/");

        cy.get("#ui-id-2 > #toolsTreeDiv > .jstree-container-ul > #ancestors > #ancestors_anchor").click();

        cy.get(".jstree-container-ul > #OWL > .jstree-children > #CFIHOS-ISO > #CFIHOS-ISO_anchor").click();

        cy.get("#leftPanelDiv > #accordion > #sourcesPanel > #sourceDivControlPanelDiv > .btn").click();

        cy.get("#toolPanelDiv > #actionDiv > #dialogDiv > div:nth-child(2) > .btn").click();

        cy.get("#CFIHOS-ISO > .jstree-children > #http\3A//data.15926.org/rdl/RDS479744 > #http\3A//data.15926.org/rdl/RDS479744_anchor > .tree_level_2").click();

        cy.get("#toolPanelDiv > #actionDiv > #dialogDiv > #conceptOperationsDiv > .btn").click();

        cy.get("div > #centralPanelDiv > #graphDiv > .vis-network > canvas").click();

        cy.get("#accordion > #toolPanelDiv > #actionDiv > #graphPopupDiv > .popupMenuItem:nth-child(2)").click();

        cy.get(".infosTable > tbody > tr:nth-child(1) > td > a").click();

        cy.visit("http://data.15926.org/dm/PossibleIndividual");
    });
});
