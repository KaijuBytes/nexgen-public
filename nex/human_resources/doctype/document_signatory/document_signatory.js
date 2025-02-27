// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Document Signatory", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Document Signatory", "onload", function(frm) {
    frm.set_query("office_selector", () => {
        return {
            filters: {
                name: ["in", ["Division", "Bureau"]],
            },
        };
    });
  });