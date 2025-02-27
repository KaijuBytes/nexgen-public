// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Document Tracker", {
// 	refresh(frm) {

// 	},
// // });
// frappe.ui.form.on("Document Tracker", {
//     refresh: function(frm) {
//         set_creator_and_modifier_names(frm);
//     }
// });

// function set_creator_and_modifier_names(frm) {
//     if (frm.doc.owner) {
//         console.log("Fetching creator and modifier names for owner: ", frm.doc.owner);
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
//                     console.log("No creator response message");
//                 }
//             }
//         });
//     } else {
//         console.log("No owner found in document");
//     }

//     if (frm.doc.modified_by) {
//         console.log("Fetching last modified by name: ", frm.doc.modified_by);
//         frappe.call({
//             method: 'frappe.client.get',
//             args: {
//                 doctype: 'User',
//                 name: frm.doc.modified_by
//             },
//             callback: function(r) {
//                 if (r.message) {
//                     console.log("Last modified by name fetched: ", r.message.full_name);
//                     frm.set_value('last_modified_by', r.message.full_name);
//                 } else {
//                     console.log("No modifier response message");
//                 }
//             }
//         });
//     } else {
//         console.log("No modified_by found in document");
//     }
// }

// frappe.ui.form.on('Document Tracker', {
//     refresh: function(frm) {
//         let icons = frm.wrapper.find('[data-tooltip]');
//         icons.each(function(){
//             $(this).tooltip({
//                 title: $(this).data('tooltip'),
//                 placement: 'top'
//             });
//         });
//     }
// });

// frappe.ui.form.on('Document Tracker', {
//     refresh: function(frm) {
//         frm.add_custom_button(__("Add Log"), function() {
//             frappe.new_doc('Document Tracker Logs', {
//                 dt_control_number: frm.doc.name
//             });
//         });
//     }
// });

// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Document Tracker", {
//     refresh: function(frm) {
//         setCreatorAndModifierNames(frm);
//         setupTooltips(frm);
//         addAddLogButton(frm);
//     }
// });

// function setCreatorAndModifierNames(frm) {
//     fetchUserName(frm, frm.doc.owner, 'created_by', "Creator");
//     fetchUserName(frm, frm.doc.modified_by, 'last_modified_by', "Modifier");
// }

// function fetchUserName(frm, userName, fieldName, logPrefix) {
//     if (userName) {
//         console.log(`Fetching ${logPrefix} name: `, userName);
//         frappe.call({
//             method: 'frappe.client.get',
//             args: { doctype: 'User', name: userName },
//             callback: function(r) {
//                 if (r.message) {
//                     console.log(`${logPrefix} name fetched: `, r.message.full_name);
//                     frm.set_value(fieldName, r.message.full_name);
//                 } else {
//                     console.log(`No ${logPrefix.toLowerCase()} response message`);
//                 }
//             }
//         });
//     } else {
//         console.log(`No ${logPrefix.toLowerCase()} found in document`);
//     }
// }

// function setupTooltips(frm) {
//     let icons = frm.wrapper.find('[data-tooltip]');
//     icons.each(function(){
//         $(this).tooltip({
//             title: $(this).data('tooltip'),
//             placement: 'top'
//         });
//     });
// }

// function addAddLogButton(frm) {
//     frm.page.set_primary_action(__("Add Log"), function() {
//         frappe.new_doc('Document Tracker Logs', {
//             dt_control_number: frm.doc.name
//         });
//     });
// }

// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

frappe.ui.form.on("Document Tracker", {
    refresh: function(frm) {
        setCreatorAndModifierNames(frm);
        setupTooltips(frm);
        frm.trigger('create_icon'); // Trigger the create_icon function
    },
    create_icon: function(frm) {
        frm.add_custom_button(__("Add Log"), function() {
        //     alert('custom button')
        // }).css({"color":"white", "background-color": "#0033cc", "font-weight": "800"});
            frappe.new_doc('Document Tracker Logs', {
                dt_control_number: frm.doc.name
            });
        });
    }
});

function setCreatorAndModifierNames(frm) {
    fetchUserName(frm, frm.doc.owner, 'created_by', "Creator");
    fetchUserName(frm, frm.doc.modified_by, 'last_modified_by', "Modifier");
}

function fetchUserName(frm, userName, fieldName, logPrefix) {
    if (userName) {
        console.log(`Fetching ${logPrefix} name: `, userName);
        frappe.call({
            method: 'frappe.client.get',
            args: { doctype: 'User', name: userName },
            callback: function(r) {
                if (r.message) {
                    console.log(`${logPrefix} name fetched: `, r.message.full_name);
                    frm.set_value(fieldName, r.message.full_name);
                } else {
                    console.log(`No ${logPrefix.toLowerCase()} response message`);
                }
            }
        });
    } else {
        console.log(`No ${logPrefix.toLowerCase()} found in document`);
    }
}

function setupTooltips(frm) {
    if (frm.wrapper) { //check if frm.wrapper exists.
        let icons = $(frm.wrapper).find('[data-tooltip]'); //wrap frm.wrapper in jquery.
        icons.each(function(){
            $(this).tooltip({
                title: $(this).data('tooltip'),
                placement: 'top'
            });
        });
    }
}
// frappe.ui.form.on('Document Tracker', {
//     attachment_method: function(frm) {
//         console.log("attachment_method changed"); // Add this line
//         frm.doc.attachment_method_on_change();
//     },
//     onload: function(frm){
//         console.log("Document loaded"); // Add this line
//         frm.doc.on_load();
//     }
// });

frappe.ui.form.on('Document Tracker', {
    attachment_method: function(frm) {
        var attachmentMethod = frm.doc.attachment_method;

        if (attachmentMethod === "Group") {
            frm.set_df_property("single_documents_or_records", "hidden", 1);
            frm.set_df_property("group_of_documents_or_records", "hidden", 0);
            if (frm.doc.single_documents_or_records && frm.doc.single_documents_or_records.length > 0) {
                frm.doc.single_documents_or_records = []; // Clear single_documents_or_records
                frm.refresh_field("single_documents_or_records"); // Refresh the field
            }
        } else if (attachmentMethod === "Single") {
            frm.set_df_property("single_documents_or_records", "hidden", 0);
            frm.set_df_property("group_of_documents_or_records", "hidden", 1);
            if (frm.doc.group_of_documents_or_records && frm.doc.group_of_documents_or_records.length > 0) {
                frm.doc.group_of_documents_or_records = []; // Clear group_of_documents_or_records
                frm.refresh_field("group_of_documents_or_records"); // Refresh the field
            }

        } else if (attachmentMethod === "Both") {
            frm.set_df_property("single_documents_or_records", "hidden", 0);
            frm.set_df_property("group_of_documents_or_records", "hidden", 0);
        } else {
            frm.set_df_property("single_documents_or_records", "hidden", 0);
            frm.set_df_property("group_of_documents_or_records", "hidden", 0);
        }
    },
    onload: function(frm) {
        var attachmentMethod = frm.doc.attachment_method;

        if (attachmentMethod === "Group") {
            frm.set_df_property("single_documents_or_records", "hidden", 1);
            frm.set_df_property("group_of_documents_or_records", "hidden", 0);
        } else if (attachmentMethod === "Single") {
            frm.set_df_property("single_documents_or_records", "hidden", 0);
            frm.set_df_property("group_of_documents_or_records", "hidden", 1);
        } else if (attachmentMethod === "Both") {
            frm.set_df_property("single_documents_or_records", "hidden", 0);
            frm.set_df_property("group_of_documents_or_records", "hidden", 0);
        } else {
            frm.set_df_property("single_documents_or_records", "hidden", 0);
            frm.set_df_property("group_of_documents_or_records", "hidden", 0);
        }
    }
});