// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// Global flag to prevent multiple Task Log dialogs from opening
let taskLogDialogInstance = null;
let addLogButtonElement = null; // Reference to the "Add Log" button element

frappe.ui.form.on("Task", {
    refresh: function(frm) {
        console.log("Task form refresh triggered."); // Debugging log

        // Existing functions from your task_form.js
        setCreatorAndModifierNames(frm);
        setupTooltips(frm);

        // Always trigger the 'create_icon' function on refresh to manage the "Add Log" button
        // and ensure we get a reference to it.
        frm.trigger('create_icon');

        // --- Start of Authorize/Unauthorize Separate Button Logic with Dialogs ---
        const isProjectsManager = frappe.user_roles.includes('Projects Manager');
        const isAuthorized = frm.doc.authorized;
        const isNotAuthorized = !frm.doc.authorized;

        console.log("Is Projects Manager:", isProjectsManager);
        console.log("Is Task Authorized:", isAuthorized);
        console.log("Is Task Not Authorized:", isNotAuthorized);

        // Authorize Button Logic
        if (isProjectsManager && isNotAuthorized) {
            console.log("Condition met: Attempting to add Authorize button to form.");
            frm.add_custom_button(__('Authorize'), function() {
                console.log("Authorize button clicked on form. Showing first authorization dialog.");
                showFirstAuthDialog(frm); // Call function to show the first dialog
            }).css({"background-color": "#FFCCCC", "color": "#000000"}); // Styling for light red background
        } else {
            console.log("Condition not met: Removing Authorize button from form.");
            frm.remove_custom_button(__('Authorize'));
        }

        // Unauthorize Button Logic
        if (isProjectsManager && isAuthorized) {
            console.log("Condition met: Adding Unauthorize button to form.");
            frm.add_custom_button(__('Unauthorize'), function() {
                console.log("Unauthorize button clicked on form. Showing unauthorize dialog.");
                showUnauthorizeDialog(frm); // Call function to show the unauthorize dialog
            });
        } else {
            console.log("Condition not met: Removing Unauthorize button from form.");
            frm.remove_custom_button(__('Unauthorize'));
        }

        // Ensure "Authorization Actions" button is removed if it existed previously
        frm.remove_custom_button(__('Authorization Actions'), __('Actions'));
        // --- End of Authorize/Unauthorize Separate Button Logic with Dialogs ---

        // --- Start of New "Complete" Button Logic ---
        // Add a "Complete" button only if:
        // 1. The user is a Projects Manager.
        // 2. The task status is NOT already 'Completed'.
        // 3. The task IS authorized.
        if (isProjectsManager && frm.doc.status !== 'Completed' && frm.doc.authorized) {
            console.log("Condition met: Adding 'Complete' button to form.");
            frm.add_custom_button(__('Complete'), function() {
                console.log("Complete button clicked. Showing confirmation dialog.");
                frappe.confirm(
                    __("Are you sure you want to mark this task as Completed and create a log entry?"),
                    () => {
                        // On confirmation, directly open the Task Log dialog
                        // pre-filling the status and description.
                        // The Task Log's on_submit hook will then update the parent Task.
                        console.log("User confirmed 'Complete'. Calling openCustomTaskLogDialog with pre-filled 'Completed' status and description.");
                        openCustomTaskLogDialog(
                            frm,
                            'Completed', // Pre-fill status
                            __('Task completed by ') + frappe.session.user_fullname + '.' // Pre-fill description
                        );
                        // Show a message immediately that a log is being created.
                        // frappe.msgprint(__("Creating Task Log for 'Completed' status..."));
                    },
                    () => {
                        // On cancellation, do nothing
                        frappe.msgprint(__("Action cancelled."));
                    }
                );
            }).css({"background-color": "#CCFFCC", "color": "#000000"}); // Styling for light green background
        } else {
            console.log("Condition not met: Removing 'Complete' button from form.");
            frm.remove_custom_button(__('Complete'));
        }
        // --- End of New "Complete" Button Logic ---

        // --- Start of Hiding 'Completed' Status Option in Dropdown ---
        let statusField = frm.get_field('status');

        if (statusField && statusField.df) {
            // Store original options only once
            if (!statusField.df._original_options) {
                if (typeof statusField.df.options === 'string') {
                    statusField.df._original_options = statusField.df.options.split('\n').filter(Boolean);
                } else {
                    statusField.df._original_options = [...statusField.df.options];
                }
                // Also, replace "Pending" with "Pending Review" in the stored original options
                statusField.df._original_options = statusField.df._original_options.map(option => option === 'Pending' ? 'Pending Review' : option);
                console.log("Stored original options:", statusField.df._original_options);
            }

            let newOptions;
            // The 'Completed' option should only be available in the dropdown IF:
            // 1. The user IS a Projects Manager.
            // 2. AND the task IS authorized.
            // Otherwise, filter 'Completed' out of the dropdown.
            if (isProjectsManager && frm.doc.authorized) {
                newOptions = [...statusField.df._original_options]; // Show all options
                console.log("Showing all status options (Projects Manager and Authorized).");
            } else {
                newOptions = statusField.df._original_options.filter(option => option !== 'Completed');
                console.log("Hiding 'Completed' option in status dropdown (not Projects Manager or not Authorized). New options:", newOptions);
            }

            // Update the options for the select field
            frm.set_df_property('status', 'options', newOptions.join('\n'));
            frm.refresh_field('status'); // Refresh the field to apply the new options
        } else {
            console.warn("Status field or its definition not found, cannot modify dropdown options.");
        }
        // --- End of Hiding 'Completed' Status Option ---

        // --- Start of Ensuring 'Completed' Status Text Displays Correctly ---
        // This ensures the displayed value of the status field is always the actual status,
        // even if 'Completed' is hidden from the dropdown. Frappe handles display formatting
        // by default based on the field value, so no special formatter is needed here for display.
        // If frm.doc.status is 'Completed', it will show 'Completed'.
        // --- End of Ensuring 'Completed' Status Text Displays Correctly ---
    },

    // Function to add the "Add Log" button
    create_icon: function(frm) {
        // Remove existing button before adding to prevent duplicates on refresh
        frm.remove_custom_button(__('Add Log'));

        // Add the button and store a reference to its jQuery element
        addLogButtonElement = frm.add_custom_button(__("Add Log"), function() {
            console.log("Add Log button clicked. Opening custom Task Log dialog.");
            openCustomTaskLogDialog(frm); // Call the function to open the custom dialog
        });
    }
});

// --- Authorization Dialog Functions (unchanged from previous version) ---

function showFirstAuthDialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Authorize Task'),
        fields: [
            {
                fieldname: 'message',
                fieldtype: 'HTML',
                options: `<p>${__("Will you authorize this task?")}</p>`
            }
        ],
        size: 'small',
        primary_action_label: __('Authorize'),
        primary_action: function() {
            dialog.hide(); // Hide the first dialog
            showSecondAuthDialog(frm); // Show the second confirmation dialog
        },
        secondary_action_label: __('Do Not Authorize'),
        secondary_action: function() {
            console.log("User chose 'Do Not Authorize' in first dialog. Setting status to 'Cancelled' and Unauthorized.");
            frm.set_value('status', 'Cancelled'); // Change status to 'Cancelled'
            frm.set_value('authorized', 0); // Mark as unauthorized
            frm.save(null, null, () => {
                console.log("Save callback for 'Do Not Authorize' action triggered.");
                frappe.msgprint(__("The task status has been changed to Cancelled and it is Unauthorized."));
            });
            dialog.hide(); // Hide this dialog
        },
        on_hide: function() {
            console.log("First authorization dialog dismissed without explicit action.");
        }
    });
    dialog.show();
}

function showSecondAuthDialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Confirm Authorization'),
        fields: [
            {
                fieldname: 'message',
                fieldtype: 'HTML',
                options: `<p>${__("Are you sure you want to authorize this task?")}</p>`
            }
        ],
        size: 'small',
        primary_action_label: __('Yes, Authorize'),
        primary_action: function() {
            console.log("User confirmed 'Yes' for authorization. Calling server method.");
            frm.call({
                method: "nex.projects.doctype.task.task.authorize_task_button_action",
                doc: frm.doc,
                callback: function(r) {
                    if (r.exc) {
                        console.error("Error from server (authorize_task_button_action):", r.exc);
                        frappe.show_alert({
                            message: __('Error authorizing task: ') + r.exc,
                            indicator: 'red'
                        }, 5);
                    } else {
                        console.log("Authorization successful. Reloading doc.");
                        frappe.show_alert({
                            message: __("The task has been authorized successfully."),
                            indicator: 'green'
                        }, 5);
                        frm.reload_doc();
                    }
                }
            });
            dialog.hide();
        },
        secondary_action_label: __('No, Cancel'),
        secondary_action: function() {
            console.log("User chose 'No' for authorization in second dialog.");
            frappe.msgprint(__("Authorization action cancelled."));
            dialog.hide();
        },
        on_hide: function() {
            console.log("Second authorization dialog dismissed without explicit action.");
        }
    });
    dialog.show();
}

function showUnauthorizeDialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: __('Confirm Unauthorization'),
        fields: [
            {
                fieldname: 'message',
                fieldtype: 'HTML',
                options: `<p>${__("Are you sure you want to unauthorize this task?")}</p>`
            }
        ],
        size: 'small',
        primary_action_label: __('Yes, Unauthorize'),
        primary_action: function() {
            console.log("User confirmed 'Yes' for unauthorization. Calling server method.");
            frm.call({
                method: "nex.projects.doctype.task.task.unauthorize_task_button_action",
                doc: frm.doc,
                callback: function(r) {
                    if (r.exc) {
                        console.error("Error from server (unauthorize_task_button_action):", r.exc);
                        frappe.show_alert({
                            message: __('Error unauthorizing task: ') + r.exc,
                            indicator: 'red'
                        }, 5);
                    } else {
                        console.log("Unauthorization successful. Reloading doc.");
                        frappe.show_alert({
                            message: __("The task has been unauthorized."),
                            indicator: 'green'
                        }, 5);
                        frm.reload_doc();
                    }
                }
            });
            dialog.hide();
        },
        secondary_action_label: __('No, Cancel'),
        secondary_action: function() {
            console.log("User cancelled unauthorization.");
            frappe.msgprint(__("Unauthorization cancelled."));
            dialog.hide();
        },
        on_hide: function() {
            console.log("Unauthorization dialog dismissed without explicit action.");
        }
    });
    dialog.show();
}

// --- Task Log Dialog Function (MODIFIED) ---

/**
 * Opens a custom dialog for creating Task Logs.
 * Prevents multiple dialogs from opening.
 * @param {object} frm - The current Frappe form object.
 * @param {string} [prefillStatus=null] - Optional status to pre-fill in the dialog.
 * @param {string} [prefillDescription=null] - Optional description to pre-fill in the dialog.
 */
function openCustomTaskLogDialog(frm, prefillStatus = null, prefillDescription = null) {
    // If a dialog instance already exists, do nothing or explicitly hide the old one if needed,
    // but the primary action is to *prevent* creation of a new one.
    if (taskLogDialogInstance) {
        console.warn("Task Log dialog is already open. Preventing new dialog from opening.");
        // Optionally, bring the existing dialog to front if it exists
        // if (taskLogDialogInstance.wrapper) {
        //     taskLogDialogInstance.wrapper.find('.modal-content').focus();
        // }
        return; // Exit the function to prevent a new dialog
    }

    // Disable the "Add Log" button immediately to prevent rapid clicks
    if (addLogButtonElement) {
        addLogButtonElement.attr('disabled', true);
        addLogButtonElement.addClass('disabled'); // Add Frappe's disabled style
    }

    const hasManagerRole = frappe.user_roles.includes("Projects Manager");
    console.log("Opening custom Task Log dialog. User is Projects Manager:", hasManagerRole);

    taskLogDialogInstance = new frappe.ui.Dialog({
        title: __('New Task Log'),
        fields: [
            {
                label: __('Task ID'),
                fieldname: 'task_id',
                fieldtype: 'Link',
                options: 'Task',
                default: frm.doc.name,
                read_only: 1,
                reqd: 1
            },
            {
                fieldtype: 'Column Break'
            },
            {
                label: __('Date Created'),
                fieldname: 'date_created_display',
                fieldtype: 'Date',
                default: frappe.datetime.get_today(),
                read_only: 1
            },
            {
                label: __('Time Created'),
                fieldname: 'time_created_display',
                fieldtype: 'Time',
                default: frappe.datetime.get_time(frappe.datetime.now_datetime()),
                read_only: 1
            },
            {
                label: __('Created by'),
                fieldname: 'created_by_display',
                fieldtype: 'Data',
                default: frappe.session.user_fullname,
                read_only: 1
            },
            {
                fieldtype: 'Section Break',
                label: __('Log Details')
            },
            {
                label: __('Status'),
                fieldname: 'status',
                fieldtype: 'Select',
                // Options: Projects Manager can set 'Completed', others cannot via this dialog
                options: hasManagerRole ? 'Working\nPending Review\nCompleted\nCancelled' : 'Working\nPending Review\nCancelled',
                default: prefillStatus || 'Working',
                reqd: 1
            },
            {
                label: __('Log Description'),
                fieldname: 'log_description',
                fieldtype: 'Small Text',
                default: prefillDescription || '',
                reqd: 1
            }
        ],
        size: 'small',
        primary_action_label: __('Create Log'),
        primary_action: function(values) {
            console.log("Custom Task Log dialog: Create Log button clicked. Values:", values);

            if (!values.task_id || !values.status || !values.log_description) {
                frappe.show_alert({
                    message: __('Please fill all required fields.'),
                    indicator: 'orange'
                }, 3);
                return;
            }

            // Re-disable button during AJAX call to prevent double submission
            if (addLogButtonElement) {
                addLogButtonElement.attr('disabled', true);
                addLogButtonElement.addClass('disabled');
            }

            frappe.call({
                method: 'frappe.client.insert',
                args: {
                    doc: {
                        doctype: 'Task Logs',
                        task_id: values.task_id,
                        status: values.status,
                        log_description: values.log_description,
                        docstatus: 1, // Auto-submit

                        log_date: frappe.datetime.get_today(),
                        log_time: frappe.datetime.get_time(frappe.datetime.now_datetime()),
                        log_created_by: frappe.session.user // User ID for Link field
                    }
                },
                callback: function(r) {
                    if (r.message) {
                        console.log("Task Log created and submitted successfully:", r.message.name);
                        frappe.show_alert({
                            message: __('Task Log ') + r.message.name + __(' created and submitted successfully!'),
                            indicator: 'green'
                        }, 5);
                        taskLogDialogInstance.hide(); // Hide the dialog
                        frm.reload_doc(); // Reload the parent Task form after log creation
                    } else if (r.exc) {
                        console.error("Error creating Task Log:", r.exc);
                        frappe.show_alert({
                            message: __('Error creating Task Log. Check console for details.'),
                            indicator: 'red'
                        }, 5);
                    }
                },
                error: function(r) {
                    console.error("Network or server error creating Task Log:", r);
                    frappe.show_alert({
                        message: __('Network or server error while creating Task Log.'),
                        indicator: 'red'
                    }, 5);
                },
                always: function() {
                    // Re-enable the button regardless of success or failure
                    if (addLogButtonElement) {
                        addLogButtonElement.attr('disabled', false);
                        addLogButtonElement.removeClass('disabled');
                    }
                }
            });
        },
        on_hide: function() {
            console.log("Task Log dialog hidden. Clearing global instance and re-enabling button.");
            taskLogDialogInstance = null; // Clear the global instance when dialog is hidden
            if (addLogButtonElement) {
                addLogButtonElement.attr('disabled', false);
                addLogButtonElement.removeClass('disabled');
            }
        }
    });
    taskLogDialogInstance.show();
}

// --- Utility Functions (unchanged from previous version) ---

function setCreatorAndModifierNames(frm) {
    fetchUserName(frm, frm.doc.owner, 'created_by', "Creator");
    fetchUserName(frm, frm.doc.modified_by, 'last_modified_by', "Modifier");
}

function fetchUserName(frm, userName, fieldName, logPrefix) {
    if (userName) {
        console.log(`Fetching ${logPrefix} name via server method for: `, userName);
        frappe.call({
            method: 'nex.projects.doctype.task.task.get_user_full_name',
            args: { user_id: userName },
            callback: function(r) {
                if (r.message !== undefined && r.message !== null) {
                    console.log(`${logPrefix} name fetched: `, r.message);
                    frm.set_value(fieldName, r.message);
                    if (frm.doc.__islocal && frm.is_dirty()) {
                        console.log(`Auto-saving form after setting ${fieldName} for new document.`);
                        frm.save();
                    }
                } else {
                    console.log(`No ${logPrefix.toLowerCase()} full name found via server, or error. Falling back to ID.`);
                    frm.set_value(fieldName, userName);
                }
            },
            error: function(r) {
                console.error(`Error fetching ${logPrefix} name via server method:`, r);
                frm.set_value(fieldName, userName);
            }
        });
    } else {
        console.log(`No ${logPrefix.toLowerCase()} found in document.`);
        frm.set_value(fieldName, "");
    }
}

function setupTooltips(frm) {
    if (frm.wrapper) {
        // Destroy existing tooltips to prevent duplicates if refresh is called multiple times
        $(frm.wrapper).find('[data-tooltip]').tooltip('dispose');

        let icons = $(frm.wrapper).find('[data-tooltip]');
        icons.each(function(){
            $(this).tooltip({
                title: $(this).data('tooltip'),
                placement: 'top'
            });
        });
    }
}