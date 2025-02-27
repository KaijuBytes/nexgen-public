// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Employee", {
// 	refresh(frm) {

// 	},
// });

// Custom script for Employee doctype

frappe.ui.form.on('Employee', {
    company: function(frm) {
        // Filter Bureau based on selected Company
        frm.set_query('bureauservices', function() {
            return {
                filters: {
                    'agency': frm.doc.company
                }
            };
        });
        // Clear fields if Company is changed
        frm.set_value('bureauservices', null);
        frm.set_value('division', null);
        frm.set_value('section', null);
    },
    bureau: function(frm) {
        // Filter Division based on selected Bureau
        frm.set_query('division', function() {
            return {
                filters: {
                    'bureau': frm.doc.bureau
                }
            };
        });
        // Clear fields if Bureau is changed
        frm.set_value('division', null);
        frm.set_value('section', null);
    },
    division: function(frm) {
        // Filter Section based on selected Division
        frm.set_query('section', function() {
            return {
                filters: {
                    'division': frm.doc.division
                }
            };
        });
        // Clear field if Division is changed
        frm.set_value('section', null);
    },
    first_name: function(frm) {
        update_employee_name(frm);
    },
    middle_name: function(frm) {
        update_employee_name(frm);
    },
    last_name: function(frm) {
        update_employee_name(frm);
    },
	create_user: function (frm) {
		if (!frm.doc.prefered_email) {
			frappe.throw(__("Please enter Preferred Contact Email"));
		}
		frappe.call({
			method: "nex.human_resources.doctype.employee.employee.create_user",
			args: {
				employee: frm.doc.name,
				email: frm.doc.prefered_email,
			},
			freeze: true,
			freeze_message: __("Creating User..."),
			callback: function (r) {
				frm.reload_doc();
			},
		});
	},
});

function update_employee_name(frm) {
    let first_name = frm.doc.first_name || '';
    let middle_name = frm.doc.middle_name || '';
    let last_name = frm.doc.last_name || '';

    // Only use the middle initial if the middle name is provided
    let middle_initial = middle_name ? middle_name.charAt(0) + '. ' : '';

    let employee_name = `${first_name} ${middle_initial}${last_name}`.trim();
    frm.set_value('employee_name', employee_name);
}

function create_user_if_not_exists(frm) {
    if (!frm.doc.user_id && frm.doc.email) {
        frappe.call({
            method: 'frappe.core.doctype.user.user.sign_up',
            args: {
                email: frm.doc.email,
                first_name: frm.doc.first_name,
                last_name: frm.doc.last_name,
                send_welcome_email: true
            },
            callback: function(r) {
                if (r.message) {
                    frm.set_value('user_id', r.message.name);
                    frm.save();
                }
            }
        });
    }
}
