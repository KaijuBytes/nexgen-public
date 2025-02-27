// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Records", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Records", "onload", function(frm) {
    frm.set_query("reference_doctype", () => {
        return {
            filters: {
                name: ["in", ["Travel Order", "Compensatory Time-Off Request", "Gatepass"]],
            },
        };
    });
  });