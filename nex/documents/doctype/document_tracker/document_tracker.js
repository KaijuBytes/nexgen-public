// // Copyright (c) 2025, Lanz Martinez and contributors
// // For license information, please see license.txt

// frappe.ui.form.on("Document Tracker", {
//     refresh: function(frm) {
//         setCreatorAndModifierNames(frm);
//         setupTooltips(frm);
//         frm.trigger('create_icon'); // Trigger the create_icon function
//     },
//     create_icon: function(frm) {
//         frm.add_custom_button(__("Add Log"), function() {
//         //     alert('custom button')
//         // }).css({"color":"white", "background-color": "#0033cc", "font-weight": "800"});
//             frappe.new_doc('Document Tracker Logs', {
//                 dt_control_number: frm.doc.name
//             });
//         });
//         frm.add_custom_button(__("Add to Task"), function() {
//             //     alert('custom button')
//             // }).css({"color":"white", "background-color": "#0033cc", "font-weight": "800"});
//                 frappe.new_doc('Task', {
//                     subject: frm.doc.title,
//                     priority: frm.doc.priority,
//                     task_description: frm.doc.description,
//                     doctracker_reference: frm.doc.name,
//                 });
//             });
//     },
//     validate: function (frm) {
// 		frm.set_value("time_created", frappe.datetime.now_time());
// 		frm.set_value("date_created", frappe.datetime.nowdate());
// 	},
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
//     if (frm.wrapper) { //check if frm.wrapper exists.
//         let icons = $(frm.wrapper).find('[data-tooltip]'); //wrap frm.wrapper in jquery.
//         icons.each(function(){
//             $(this).tooltip({
//                 title: $(this).data('tooltip'),
//                 placement: 'top'
//             });
//         });
//     }
// }

// frappe.ui.form.on('Document Tracker', {
//     attachment_method: function(frm) {
//         var attachmentMethod = frm.doc.attachment_method;

//         if (attachmentMethod === "Group") {
//             frm.set_df_property("single_documents_or_records", "hidden", 1);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 0);
//             if (frm.doc.single_documents_or_records && frm.doc.single_documents_or_records.length > 0) {
//                 frm.doc.single_documents_or_records = []; // Clear single_documents_or_records
//                 frm.refresh_field("single_documents_or_records"); // Refresh the field
//             }
//         } else if (attachmentMethod === "Single") {
//             frm.set_df_property("single_documents_or_records", "hidden", 0);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 1);
//             if (frm.doc.group_of_documents_or_records && frm.doc.group_of_documents_or_records.length > 0) {
//                 frm.doc.group_of_documents_or_records = []; // Clear group_of_documents_or_records
//                 frm.refresh_field("group_of_documents_or_records"); // Refresh the field
//             }

//         } else if (attachmentMethod === "Both") {
//             frm.set_df_property("single_documents_or_records", "hidden", 0);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 0);
//         } else {
//             frm.set_df_property("single_documents_or_records", "hidden", 0);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 0);
//         }
//     },
//     onload: function(frm) {
//         var attachmentMethod = frm.doc.attachment_method;

//         if (attachmentMethod === "Group") {
//             frm.set_df_property("single_documents_or_records", "hidden", 1);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 0);
//         } else if (attachmentMethod === "Single") {
//             frm.set_df_property("single_documents_or_records", "hidden", 0);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 1);
//         } else if (attachmentMethod === "Both") {
//             frm.set_df_property("single_documents_or_records", "hidden", 0);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 0);
//         } else {
//             frm.set_df_property("single_documents_or_records", "hidden", 0);
//             frm.set_df_property("group_of_documents_or_records", "hidden", 0);
//         }
//     }
// });


// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

frappe.ui.form.on("Document Tracker", {
	refresh: function(frm) {
		setCreatorAndModifierNames(frm);
		setupTooltips(frm);
		frm.trigger('create_icon'); // Trigger the create_icon function
	},
	// create_icon: function(frm) {
	// 	frm.add_custom_button(__("Add Log"), function() {
	// 		frappe.call({
	// 			method: 'nex.documents.doctype.document_tracker.document_tracker.create_document_tracker_log',
	// 			args: {
	// 				dt_control_number: frm.doc.name
	// 			},
	// 			callback: function(r) {
	// 				if (r.message) {
	// 					frappe.msgprint(r.message);
	// 					frm.reload(); // Optionally reload the Document Tracker
	// 				}
	// 			}
	// 		});
	// 	});
	// 	frm.add_custom_button(__("Add to Task"), function() {
	// 		frappe.call({
	// 			method: 'nex.documents.doctype.document_tracker.document_tracker.create_task_from_tracker',
	// 			args: {
	// 				title: frm.doc.title,
	// 				description: frm.doc.description,
	// 				doctracker_reference: frm.doc.name
	// 			},
	// 			callback: function(r) {
	// 				if (r.message) {
	// 					frappe.msgprint(r.message);
	// 					// Optionally show the created task
	// 					frappe.set_route('Task', r.message.name);
	// 				}
	// 			}
	// 		});
	// 	});
	// },
    create_icon: function(frm) {
        // frm.add_custom_button(__("Add Log"), function() {
        //     frappe.call({
        //         method: 'nex.documents.doctype.document_tracker.document_tracker.create_document_tracker_log',
        //         args: {
        //             dt_control_number: frm.doc.name
        //         },
        //         callback: function(r) {
        //             if (r.message) {
        //                 frappe.msgprint(r.message);
        //                 frm.reload(); // Optionally reload the Document Tracker
        //             }
        //         }
        //     });
        // });
        frm.add_custom_button(__("Add Log"), function() {
        //     alert('custom button')
        // }).css({"color":"white", "background-color": "#0033cc", "font-weight": "800"});
            frappe.new_doc('Document Tracker Logs', {
                dt_control_number: frm.doc.name
            });
        });
        frm.add_custom_button(__("Add to Task"), function() {
            frappe.call({
                method: 'nex.documents.doctype.document_tracker.document_tracker.create_task_from_tracker',
                args: {
                    title: frm.doc.title,
                    priority: frm.doc.priority,
                    task_description: frm.doc.description,
                    doctracker_reference: frm.doc.name
                },
                callback: function(r) {
                    if (r) { // Check if r has a value (meaning an existing task was found and returned None)
                        if (typeof r === 'string' && r.startsWith("A Task already exists")) {
                            frappe.msgprint(r);
                            // Optionally navigate to the existing task. You might need to fetch the task ID from the message.
                            // This is a basic example and might need adjustment based on your exact message.
                            const taskIdMatch = r.match(/Task ID: (.*)/);
                            if (taskIdMatch && taskIdMatch[1]) {
                                frappe.set_route('Task', taskIdMatch[1]);
                            }
                        } else if (r.message) { // New task was created
                            frappe.msgprint(r.message);
                            frappe.set_route('Task', r.message.name);
                        }
                    } else {
                        // Handle cases where the server-side function returned None (existing task)
                        // The frappe.msgprint on the server should handle the user feedback.
                    }
                }
            });
        });
    },
	validate: function (frm) {
		frm.set_value("time_created", frappe.datetime.now_time());
		frm.set_value("date_created", frappe.datetime.nowdate());
	},
	attachment_method: function(frm) {
		handleAttachmentMethodDisplay(frm);
	},
	onload: function(frm) {
		handleAttachmentMethodDisplay(frm);
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

function handleAttachmentMethodDisplay(frm) {
	var attachmentMethod = frm.doc.attachment_method;

	frm.set_df_property("single_documents_or_records", "hidden", attachmentMethod !== "Single" && attachmentMethod !== "Both" ? 1 : 0);
	frm.set_df_property("group_of_documents_or_records", "hidden", attachmentMethod !== "Group" && attachmentMethod !== "Both" ? 1 : 0);

	if (attachmentMethod === "Group" && frm.doc.single_documents_or_records && frm.doc.single_documents_or_records.length > 0) {
		frm.doc.single_documents_or_records = [];
		frm.refresh_field("single_documents_or_records");
	} else if (attachmentMethod === "Single" && frm.doc.group_of_documents_or_records && frm.doc.group_of_documents_or_records.length > 0) {
		frm.doc.group_of_documents_or_records = [];
		frm.refresh_field("group_of_documents_or_records");
	}
}