// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Trainers", {
// 	refresh(frm) {

// 	},
// });
frappe.ui.form.on('Trainers', {
    first_name: function(frm) {
        update_trainer_name(frm);
    },
    middle_name: function(frm) {
        update_trainer_name(frm);
    },
    last_name: function(frm) {
        update_trainer_name(frm);
    },
});

function update_trainer_name(frm) {
    let first_name = frm.doc.first_name || '';
    let middle_name = frm.doc.middle_name || '';
    let last_name = frm.doc.last_name || '';

    // Only use the middle initial if the middle name is provided
    let middle_initial = middle_name ? middle_name.charAt(0) + '. ' : '';

    let trainer_name = `${first_name} ${middle_initial}${last_name}`.trim();
    frm.set_value('trainer_name', trainer_name);
}
