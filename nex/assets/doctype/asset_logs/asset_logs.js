// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Asset Logs", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Asset Logs", {
    refresh: function(frm) {
        set_creator_and_modifier_names(frm);
    }
});

function set_creator_and_modifier_names(frm) {
    if (frm.doc.owner) {
        console.log("Fetching creator and modifier names for owner: ", frm.doc.owner);
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
                    console.log("No creator response message");
                }
            }
        });
    } else {
        console.log("No owner found in document");
    }

    if (frm.doc.modified_by) {
        console.log("Fetching last modified by name: ", frm.doc.modified_by);
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'User',
                name: frm.doc.modified_by
            },
            callback: function(r) {
                if (r.message) {
                    console.log("Last modified by name fetched: ", r.message.full_name);
                    frm.set_value('last_modified_by', r.message.full_name);
                } else {
                    console.log("No modifier response message");
                }
            }
        });
    } else {
        console.log("No modified_by found in document");
    }
}