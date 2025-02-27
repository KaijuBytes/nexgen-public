// // Copyright (c) 2025, Lanz Martinez and contributors
// // For license information, please see license.txt

// // frappe.ui.form.on("Gatepass", {
// // 	refresh(frm) {

// // 	},
// // });
// frappe.ui.form.on("Gatepass", {
//     refresh: function(frm) {
//         let showDetails = frm.doc.purpose === "Transfer to DICT" || frm.doc.purpose === "Others";
//         frm.toggle_display("purpose_details", showDetails);
//         frm.set_df_property("purpose_details", "reqd", showDetails);
//     },
//     purpose: function(frm) {
//         let showDetails = frm.doc.purpose === "Transfer to DICT" || frm.doc.purpose === "Others";
//         frm.toggle_display("purpose_details", showDetails);
//         frm.set_df_property("purpose_details", "reqd", showDetails);
//     }
// });

// frappe.ui.form.on('Gatepass', {
//     validate: function(frm) {
//         let items = frm.doc.gatepass_items || [];
//         let seen = new Set();
//         let duplicates = [];
//         let uniqueItems = [];

//         for (let item of items) {
//             if (item.serial_number) {
//                 if (seen.has(item.serial_number)) {
//                     duplicates.push(item);
//                 } else {
//                     seen.add(item.serial_number);
//                     uniqueItems.push(item);
//                 }
//             } else {
//                 let isBlank = true;
//                 for (let key in item) {
//                     if (key !== 'name' && key !== 'parent' && key !== 'parentfield' && key !== 'parenttype' && item[key]) {
//                         isBlank = false;
//                         break;
//                     }
//                 }
//                 if (!isBlank) {
//                     uniqueItems.push(item);
//                 }
//             }
//         }

//         if (duplicates.length > 0) {
//             frm.doc.gatepass_items = uniqueItems;
//             frm.refresh_field('gatepass_items');
//             frappe.msgprint(__("Duplicate serial numbers removed from the table."));
//         } else if(items.length != uniqueItems.length){
//             frm.doc.gatepass_items = uniqueItems;
//             frm.refresh_field('gatepass_items');
//             frappe.msgprint(__("Blank rows removed from the table."));
//         }
//     }
// });

// frappe.ui.form.on('Gatepass', {
//     refresh: function(frm) {
//         updateUniqueItemCount(frm);
//     },
//     gatepass_items: function(frm) {
//         updateUniqueItemCount(frm);
//     }
// });

// function updateUniqueItemCount(frm) {
//     let items = frm.doc.gatepass_items || [];
//     let uniqueItems = new Set(); // Use a Set to store unique item names

//     items.forEach(item => {
//         if (item.item_name) { // Check if item_name exists
//             uniqueItems.add(item.item_name);
//         }
//     });

//     frm.set_value('total_items', uniqueItems.size);
// }

// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

frappe.ui.form.on("Gatepass", {
    refresh: function(frm) {
        let showDetails = frm.doc.purpose === "Transfer to DICT" || frm.doc.purpose === "Others";
        frm.toggle_display("purpose_details", showDetails);
        frm.set_df_property("purpose_details", "reqd", showDetails);

        // Disable update button if docstatus is submitted
        if (frm.doc.docstatus === 1) {
            frm.disable_save();
        } else {
            frm.enable_save();
        }

        updateUniqueItemCount(frm); // Call your existing function
    },
    purpose: function(frm) {
        let showDetails = frm.doc.purpose === "Transfer to DICT" || frm.doc.purpose === "Others";
        frm.toggle_display("purpose_details", showDetails);
        frm.set_df_property("purpose_details", "reqd", showDetails);
    },
    docstatus: function(frm) {
        if (frm.doc.docstatus === 1) {
            frm.disable_save();
        } else {
            frm.enable_save();
        }
    },
    validate: function(frm) {
        let items = frm.doc.gatepass_items || [];
        let seen = new Set();
        let duplicates = [];
        let uniqueItems = [];

        for (let item of items) {
            if (item.serial_number) {
                if (seen.has(item.serial_number)) {
                    duplicates.push(item);
                } else {
                    seen.add(item.serial_number);
                    uniqueItems.push(item);
                }
            } else {
                let isBlank = true;
                for (let key in item) {
                    if (key !== 'name' && key !== 'parent' && key !== 'parentfield' && key !== 'parenttype' && item[key]) {
                        isBlank = false;
                        break;
                    }
                }
                if (!isBlank) {
                    uniqueItems.push(item);
                }
            }
        }

        if (duplicates.length > 0) {
            frm.doc.gatepass_items = uniqueItems;
            frm.refresh_field('gatepass_items');
            frappe.msgprint(__("Duplicate serial numbers removed from the table."));
        } else if (items.length != uniqueItems.length) {
            frm.doc.gatepass_items = uniqueItems;
            frm.refresh_field('gatepass_items');
            frappe.msgprint(__("Blank rows removed from the table."));
        }
    },
    gatepass_items: function(frm) {
        updateUniqueItemCount(frm);
    }
});

function updateUniqueItemCount(frm) {
    let items = frm.doc.gatepass_items || [];
    let uniqueItems = new Set(); // Use a Set to store unique item names

    items.forEach(item => {
        if (item.item_name) { // Check if item_name exists
            uniqueItems.add(item.item_name);
        }
    });

    frm.set_value('total_items', uniqueItems.size);
}