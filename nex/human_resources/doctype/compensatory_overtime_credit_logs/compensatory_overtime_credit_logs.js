// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Compensatory Overtime Credit Logs", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Compensatory Overtime Credit Logs", {
    refresh: function(frm) {
        set_creator_name(frm);
    }
});

function set_creator_name(frm) {
    if (frm.doc.owner) {
        console.log("Fetching creator name for owner: ", frm.doc.owner);
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'User',
                name: frm.doc.owner
            },
            callback: function(r) {
                if (r.message) {
                    console.log("Creator name fetched: ", r.message.full_name);
                    frm.set_value('created_by', r.message.full_name);
                } else {
                    console.log("No response message");
                }
            }
        });
    } else {
        console.log("No owner found in document");
    }
}