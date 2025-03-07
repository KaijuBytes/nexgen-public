// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Compensatory Overtime Credits", {
// 	refresh(frm) {

// 	},
// });
// frappe.ui.form.on("Compensatory Overtime Credits", {
//     refresh: function(frm) {
//         set_creator_name(frm);
//     }
// });

// function set_creator_name(frm) {
//     if (frm.doc.owner) {
//         console.log("Fetching creator name for owner: ", frm.doc.owner);
//         frappe.call({
//             method: 'frappe.client.get',
//             args: {
//                 doctype: 'User',
//                 name: frm.doc.owner
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     console.log("Creator name fetched: ", r.message.full_name);
//                     frm.set_value('created_by', r.message.full_name);
//                 } else {
//                     console.log("No response message");
//                 }
//             }
//         });
//     } else {
//         console.log("No owner found in document");
//     }
// }

// frappe.ui.form.on('Compensatory Overtime Credits', {
//     refresh: function(frm) {
//         frm.fields_dict['employee_list_and_earned_coc'].grid.get_field('coc_type').df.on_change = function(e) {
//             let row = e.row;
//             let cocType = row.doc.coc_type;
//             let holidayYearField = frm.fields_dict['employee_list_and_earned_coc'].grid.get_field('holiday_year'); // Corrected line

//             console.log("COC Type Changed:", cocType);
//             console.log("Holiday Year Field (on_change):", holidayYearField);

//             if (cocType === 'Holiday') {
//                 holidayYearField.df.disabled = 0; // Enabled
//             } else {
//                 holidayYearField.df.disabled = 1; // Disabled
//             }
//             frm.fields_dict['employee_list_and_earned_coc'].grid.refresh_field('holiday_year');
//         };

//         //Initial load check for all rows.
//         frm.doc.employee_list_and_earned_coc.forEach(row => {
//             let cocType = row.coc_type;
//             let holidayYearField = frm.fields_dict['employee_list_and_earned_coc'].grid.get_field('holiday_year'); // Corrected line

//             console.log("Initial COC Type:", cocType);
//             console.log("Holiday Year Field (initial):", holidayYearField);

//             if (cocType === 'Holiday') {
//                 holidayYearField.df.disabled = 0; // Enabled
//             } else {
//                 holidayYearField.df.disabled = 1; // Disabled
//             }
//         });
//         frm.fields_dict['employee_list_and_earned_coc'].grid.refresh_field('holiday_year');
//     },
// });


// frappe.ui.form.on("Compensatory Overtime Credits", {
//     refresh: function(frm) {
//         set_creator_name(frm);
//     },
// });

// function set_creator_name(frm) {
//     if (frm.doc.owner) {
//         console.log("Fetching creator name for owner: ", frm.doc.owner);
//         frappe.call({
//             method: 'frappe.client.get',
//             args: {
//                 doctype: 'User',
//                 name: frm.doc.owner
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     console.log("Creator name fetched: ", r.message.full_name);
//                     frm.set_value('created_by', r.message.full_name);
//                 } else {
//                     console.log("No response message");
//                 }
//             }
//         });
//     } else {
//         console.log("No owner found in document");
//     }}

// frappe.ui.form.on('Compensatory Overtime Credits', {
//     employee_list_and_earned_coc: {
//         expiry_date: function(frm, cdt, cdn) {
//             var row = frm.get_doc(cdt, cdn);
//             if (row.expiry_date) {
//                 frm.call({
//                     doc: frm.doc,
//                     method: 'set_manually_expiry_date',
//                     args: {
//                         row: row
//                     }
//                 });
//             }
//         }
//     }
// });

frappe.ui.form.on('Compensatory Overtime Credits', {
    refresh: function(frm) {
        set_creator_name(frm);
    },
    employee_list_and_earned_coc: {
        expiry_date: function(frm, cdt, cdn) {
            var row = frm.get_doc(cdt, cdn);
            if (row.expiry_date) {
                frm.call({
                    doc: frm.doc,
                    method: 'set_manually_expiry_date',
                    args: {
                        row: row
                    }
                });
            }
        },
        date_of_coc_earned: function(frm, cdt, cdn) {
            var row = frm.get_doc(cdt, cdn);
            row["__expiry_date_set_manually"] = false;
            frm.refresh_field("employee_list_and_earned_coc"); // Refresh child table
        }
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
    }}