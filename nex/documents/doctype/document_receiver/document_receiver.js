// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Document Receiver", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on("Document Receiver", "is_drrmd", function(frm) {
    toggle_internal_fields(frm);
    toggle_external_fields(frm);
    update_dr_name(frm);
});

frappe.ui.form.on("Document Receiver", "onload", function(frm) {
    toggle_internal_fields(frm);
    toggle_external_fields(frm);
    update_dr_name(frm);
});

frappe.ui.form.on("Document Receiver", "name_external", function(frm) {
    update_dr_name(frm);
});

frappe.ui.form.on("Document Receiver", "drrmd_personnel_name", function(frm) {
    update_dr_name(frm);
});


function toggle_internal_fields(frm) {
    const internal_fields = [
        "drrmd_personnel_name",
        "position_title",
        "email",
        "contact_number",
        "office"
    ];

    internal_fields.forEach(fieldname => {
        let field = frm.get_field(fieldname);
        if (field && field.$wrapper) {
            if (frm.doc.is_drrmd) {
                field.$wrapper.show();
                if (field.input) {
                    field.input.disabled = false;
                }
            } else {
                field.$wrapper.hide();
                if (field.input) {
                    field.input.disabled = true;
                }
            }
        }
    });
}

function toggle_external_fields(frm) {
    const external_fields = [
        "name_external",
        "position_title_external",
        "email_external",
        "contact_number_external",
        "office_external"
    ];

    external_fields.forEach(fieldname => {
        let field = frm.get_field(fieldname);
        if (field && field.$wrapper) {
            if (frm.doc.is_drrmd) {
                field.$wrapper.hide();
                if (field.input) {
                    field.input.disabled = true;
                }
            } else {
                field.$wrapper.show();
                if (field.input) {
                    field.input.disabled = false;
                }
            }
        }
    });
}

function update_dr_name(frm) {
    frm.set_value("dr_name", frm.doc.is_drrmd ? frm.doc.drrmd_personnel_name : frm.doc.name_external);
}