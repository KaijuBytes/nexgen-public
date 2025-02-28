// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Asset", {
// 	refresh(frm) {

// 	},

// frappe.ui.form.on("Asset", {
//     asset_classification: function(frm) {
//         // Filter Asset Category based on selected Asset Classification
//         frm.set_query('asset_category', function() {
//             return {
//                 filters: {
//                     'asset_classification': frm.doc.asset_classification
//                 }
//             };
//         });

//         frm.set_value('asset_category', null); // Clear Asset Category if classification changes
//         frm.set_value('asset_name', null); // Clear Asset Name if classification changes
//     },

//     brand: function(frm) {
//         updateAssetName(frm);
//     },

//     model: function(frm) {
//         updateAssetName(frm);
//     },

//     asset_items: { // asset_items is the name of your child table
//         item_brand: function(frm, cdt, cdn) {
//             updateChildItemName(frm, cdt, cdn);
//         },
//         item_model: function(frm, cdt, cdn) {
//             updateChildItemName(frm, cdt, cdn);
//         }
//     }
// });

// function updateAssetName(frm) {
//     if (frm.doc.brand && frm.doc.model) {
//         frm.set_value('asset_name', frm.doc.brand + " " + frm.doc.model);
//     } else {
//         frm.set_value('asset_name', null); // Clear if brand or model is missing
//     }
// }

// function updateChildItemName(frm, cdt, cdn) {
//     let child = frm.get_doc(cdt, cdn);
//     if (child.item_brand && child.item_model) {
//         frm.set_value(cdn, {
//             'item_name': child.item_brand + " " + child.item_model
//         });
//     } else {
//         frm.set_value(cdn, {
//             'item_name': null
//         });
//     }
// }

frappe.ui.form.on("Asset", {
    asset_classification: function(frm) {
        // Filter Asset Category based on selected Asset Classification
        frm.set_query('asset_category', function() {
            return {
                filters: {
                    'asset_classification': frm.doc.asset_classification
                }
            };
        });

        frm.set_value('asset_category', null); // Clear Asset Category if classification changes
        // frm.set_value('asset_name', null); // Clear Asset Name if classification changes
    },

    brand: function(frm) {
        updateAssetName(frm);
    },

    model: function(frm) {
        updateAssetName(frm);
    },
});

function updateAssetName(frm) {
    if (frm.doc.brand && frm.doc.model) {
        frm.set_value('asset_name', frm.doc.brand + " " + frm.doc.model);
    } else {
        frm.set_value('asset_name', null); // Clear if brand or model is missing
    }
}

frappe.ui.form.on('Asset', {
    length: function(frm) {
        calculate_dimension(frm);
    },
    width: function(frm) {
        calculate_dimension(frm);
    },
    height: function(frm) {
        calculate_dimension(frm);
    }
});

function calculate_dimension(frm) {
    if (frm.doc.length && frm.doc.width && frm.doc.height) {
        frm.set_value('dimension', frm.doc.length * frm.doc.width * frm.doc.height);
    } else {
        frm.set_value('dimension', 0); // Or clear the field or set to null.
    }
}