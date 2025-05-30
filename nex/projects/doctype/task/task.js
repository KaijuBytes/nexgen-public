// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// Global flag to prevent multiple Task Log dialogs from opening
let taskLogDialogInstance = null;
let addLogButtonElement = null; // Reference to the "Add Log" button element

frappe.ui.form.on("Task", {
    refresh: function(frm) {
        console.log("TASK JS: Task form refresh triggered for doc:", frm.doc.name); // Debugging log

        setCreatorAndModifierNames(frm);
        setupTooltips(frm);

        frm.trigger('create_icon');
        frm.trigger('add_child_task_button'); // Trigger the new function for the child task button

        const isProjectsManager = frappe.user_roles.includes('Projects Manager');
        const isAuthorized = frm.doc.authorized;
        const isNotAuthorized = !frm.doc.authorized;

        console.log("TASK JS: Is Projects Manager:", isProjectsManager);
        console.log("TASK JS: Is Task Authorized:", isAuthorized);
        console.log("TASK JS: Is Task Not Authorized:", isNotAuthorized);

        if (isProjectsManager && isNotAuthorized) {
            console.log("TASK JS: Condition met: Attempting to add Authorize button to form.");
            frm.add_custom_button(__('Authorize'), function() {
                console.log("TASK JS: Authorize button clicked on form. Showing first authorization dialog.");
                showFirstAuthDialog(frm);
            }).css({"background-color": "#FFCCCC", "color": "#000000"});
        } else {
            console.log("TASK JS: Condition not met: Removing Authorize button from form.");
            frm.remove_custom_button(__('Authorize'));
        }

        if (isProjectsManager && isAuthorized) {
            console.log("TASK JS: Condition met: Adding Unauthorize button to form.");
            frm.add_custom_button(__('Unauthorize'), function() {
                console.log("TASK JS: Unauthorize button clicked on form. Showing unauthorize dialog.");
                showUnauthorizeDialog(frm);
            });
        } else {
            console.log("TASK JS: Condition not met: Removing Unauthorize button from form.");
            frm.remove_custom_button(__('Unauthorize'));
        }

        frm.remove_custom_button(__('Authorization Actions'), __('Actions'));

        if (isProjectsManager && frm.doc.status !== 'Completed' && frm.doc.authorized) {
            console.log("TASK JS: Condition met: Adding 'Complete' button to form.");
            frm.add_custom_button(__('Complete'), function() {
                console.log("TASK JS: Complete button clicked. Showing confirmation dialog.");

                // --- NEW VALIDATION FOR COMPLETE BUTTON ---
                let missingFields = [];

                if (!frm.doc.expected_start_date) {
                    missingFields.push(__('Expected Start Date'));
                }
                if (!frm.doc.expected_end_date) {
                    missingFields.push(__('Expected End Date'));
                }
                // Check if priority is empty or explicitly "-"
                if (!frm.doc.priority || frm.doc.priority === '-') {
                    missingFields.push(__('Priority'));
                }
                if (!frm.doc.assignment_type) {
                    missingFields.push(__('Assignment Type'));
                }

                if (missingFields.length > 0) {
                    const message = __("The following fields must be set before completing the task: {0}", [missingFields.join(", ")]);
                    frappe.throw(message);
                    return; // Stop execution if validation fails
                }

                frappe.confirm(
                    __("Are you sure you want to mark this task as Completed and create a log entry?"),
                    () => {
                        console.log("TASK JS: User confirmed 'Complete'. Calling openCustomTaskLogDialog with pre-filled 'Completed' status and description.");
                        openCustomTaskLogDialog(
                            frm,
                            'Completed',
                            __('Task completed by ') + frappe.session.user_fullname + '.'
                        );
                    },
                    () => {
                        console.log("TASK JS: 'Complete' action cancelled by user.");
                        frappe.msgprint(__("Action cancelled."));
                    }
                );
            }).css({"background-color": "#CCFFCC", "color": "#000000"});
        } else {
            console.log("TASK JS: Condition not met: Removing 'Complete' button from form.");
            frm.remove_custom_button(__('Complete'));
        }

        let statusField = frm.get_field('status');

        if (statusField && statusField.df) {
            if (!statusField.df._original_options) {
                if (typeof statusField.df.options === 'string') {
                    statusField.df._original_options = statusField.df.options.split('\n').filter(Boolean);
                } else {
                    statusField.df._original_options = [...statusField.df.options];
                }
                statusField.df._original_options = statusField.df._original_options.map(option => option === 'Pending' ? 'Pending Review' : option);
                console.log("TASK JS: Stored original status options:", statusField.df._original_options);
            }

            let newOptions;
            if (isProjectsManager && frm.doc.authorized) {
                newOptions = [...statusField.df._original_options];
                console.log("TASK JS: Showing all status options (Projects Manager and Authorized).");
            } else {
                newOptions = statusField.df._original_options.filter(option => option !== 'Completed');
                console.log("TASK JS: Hiding 'Completed' option in status dropdown (not Projects Manager or not Authorized). New options:", newOptions);
            }

            frm.set_df_property('status', 'options', newOptions.join('\n'));
            frm.refresh_field('status');
        } else {
            console.warn("TASK JS: Status field or its definition not found, cannot modify dropdown options.");
        }

        if (frm.doc.is_group) {
            console.log("TASK JS: Task is a group task, rendering progress bar. Current progress:", frm.doc.progress);
            frm.set_df_property('progress', 'hidden', 0);
            let progressField = frm.get_field('progress');
            if (progressField) {
                progressField.$wrapper.find('.progress-bar-container').remove();

                let progress = frm.doc.progress || 0;
                let progressColor = 'lightblue';

                if (progress === 100) {
                    progressColor = 'green';
                } else if (progress > 0) {
                    progressColor = 'orange';
                }

                progressField.$wrapper.append(`
                    <div class="progress-bar-container" style="margin-top: 10px;">
                        <div class="progress" style="height: 20px; background-color: #e9ecef;">
                            <div class="progress-bar" role="progressbar"
                                style="width: ${progress}%; background-color: ${progressColor};"
                                aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                                ${progress.toFixed(0)}%
                            </div>
                        </div>
                    </div>
                `);
            }
        } else {
            console.log("TASK JS: Task is not a group task, hiding progress field.");
            frm.set_df_property('progress', 'hidden', 1);
        }
    },

    create_icon: function(frm) {
        console.log("TASK JS: create_icon function called.");
        frm.remove_custom_button(__('Add Log'));

        addLogButtonElement = frm.add_custom_button(__("Add Log"), function() {
            console.log("TASK JS: Add Log button clicked. Opening custom Task Log dialog.");

            let missingFields = [];

            if (!frm.doc.expected_start_date) {
                missingFields.push(__('Expected Start Date'));
            }
            if (!frm.doc.expected_end_date) {
                missingFields.push(__('Expected End Date'));
            }
            // Modified condition to check if priority is empty or explicitly "-"
            if (!frm.doc.priority || frm.doc.priority === '-') {
                missingFields.push(__('Priority'));
            }
            if (!frm.doc.assignment_type) {
                missingFields.push(__('Assignment Type'));
            }

            if (missingFields.length > 0) {
                const message = __("The following fields must be set before creating a log entry: {0}", [missingFields.join(", ")]);
                frappe.throw(message);
                return; // Stop execution if validation fails
            }

            openCustomTaskLogDialog(frm);
        });
    },

    // New function to add the "Add Child Task" button and its logic
    add_child_task_button: function(frm) {
        console.log("TASK JS: add_child_task_button function called.");
        frm.remove_custom_button(__('Add Child Task')); // Ensure button is not duplicated

        frm.add_custom_button(__("Add Child Task"), function() {
            console.log("TASK JS: Add Child Task button clicked.");

            frappe.confirm(
                __("Are you sure you want to add a child task to this task?"),
                function() { // If confirmed
                    console.log("TASK JS: User confirmed adding child task.");
                    // Check if the current task is a group task
                    if (!frm.doc.is_group) {
                        frm.set_value('is_group', 1);
                        return;
                    }

                    // Open a new Task form with parent_task pre-filled
                    frappe.new_doc('Task', {
                        parent_task: frm.doc.name
                    });
                    console.log(`TASK JS: New child task form opened for parent: ${frm.doc.name}`);
                },
                function() { // If cancelled
                    console.log("TASK JS: User cancelled adding child task.");
                }
            );
        });
    },

    parent_task: function(frm) {
        console.log("TASK JS: parent_task field changed. Current parent:", frm.doc.parent_task);
    },

    is_group: function(frm) {
        console.log("TASK JS: is_group field changed. New value:", frm.doc.is_group);
        frm.refresh();
        frm.save(); // Added form save here
        console.log("TASK JS: Task saved after is_group change.");
    }
});

function showFirstAuthDialog(frm) {
    console.log("TASK JS: Showing first authorization dialog.");
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
            dialog.hide();
            console.log("TASK JS: First auth dialog hidden, showing second auth dialog.");
            showSecondAuthDialog(frm);
        },
        secondary_action_label: __('Do Not Authorize'),
        secondary_action: function() {
            console.log("TASK JS: User chose 'Do Not Authorize' in first dialog. Setting status to 'Cancelled' and Unauthorized.");
            frm.set_value('status', 'Cancelled');
            frm.set_value('authorized', 0);
            frm.save(null, null, () => {
                console.log("TASK JS: Save callback for 'Do Not Authorize' action triggered.");
                frappe.msgprint(__("The task status has been changed to Cancelled and it is Unauthorized."));
            });
            dialog.hide();
        },
        on_hide: function() {
            console.log("TASK JS: First authorization dialog dismissed.");
        }
    });
    dialog.show();
}

function showSecondAuthDialog(frm) {
    console.log("TASK JS: Showing second authorization dialog.");
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
            console.log("TASK JS: User confirmed 'Yes' for authorization. Calling server method.");
            frm.call({
                method: "nex.projects.doctype.task.task.authorize_task_button_action",
                doc: frm.doc,
                callback: function(r) {
                    if (r.exc) {
                        console.error("TASK JS: Error from server (authorize_task_button_action):", r.exc);
                        frappe.show_alert({
                            message: __('Error authorizing task: ') + r.exc,
                            indicator: 'red'
                        }, 5);
                    } else {
                        console.log("TASK JS: Authorization successful. Reloading doc.");
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
            console.log("TASK JS: User chose 'No' for authorization in second dialog.");
            frappe.msgprint(__("Authorization action cancelled."));
            dialog.hide();
        },
        on_hide: function() {
            console.log("TASK JS: Second authorization dialog dismissed.");
        }
    });
    dialog.show();
}

function showUnauthorizeDialog(frm) {
    console.log("TASK JS: Showing unauthorize dialog.");
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
            console.log("TASK JS: User confirmed 'Yes' for unauthorization. Calling server method.");
            frm.call({
                method: "nex.projects.doctype.task.task.unauthorize_task_button_action",
                doc: frm.doc,
                callback: function(r) {
                    if (r.exc) {
                        console.error("TASK JS: Error from server (unauthorize_task_button_action):", r.exc);
                        frappe.show_alert({
                            message: __('Error unauthorizing task: ') + r.exc,
                            indicator: 'red'
                        }, 5);
                    } else {
                        console.log("TASK JS: Unauthorization successful. Reloading doc.");
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
            console.log("TASK JS: User cancelled unauthorization.");
            frappe.msgprint(__("Unauthorization cancelled."));
            dialog.hide();
        },
        on_hide: function() {
            console.log("TASK JS: Unauthorization dialog dismissed.");
        }
    });
    dialog.show();
}

function openCustomTaskLogDialog(frm, prefillStatus = null, prefillDescription = null) {
    console.log("TASK JS: openCustomTaskLogDialog called. Prefill Status:", prefillStatus, "Prefill Description:", prefillDescription);

    if (taskLogDialogInstance) {
        console.warn("TASK JS: Task Log dialog is already open. Preventing new dialog from opening.");
        return;
    }

    if (addLogButtonElement) {
        addLogButtonElement.attr('disabled', true);
        addLogButtonElement.addClass('disabled');
        console.log("TASK JS: 'Add Log' button disabled.");
    }

    const hasManagerRole = frappe.user_roles.includes("Projects Manager");
    console.log("TASK JS: User has Projects Manager role:", hasManagerRole);

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
            console.log("TASK JS: Custom Task Log dialog: Create Log button clicked. Values:", values);

            if (!values.task_id || !values.status || !values.log_description) {
                frappe.show_alert({
                    message: __('Please fill all required fields.'),
                    indicator: 'orange'
                }, 3);
                console.warn("TASK JS: Required fields for Task Log not filled.");
                return;
            }

            if (addLogButtonElement) {
                addLogButtonElement.attr('disabled', true);
                addLogButtonElement.addClass('disabled');
                console.log("TASK JS: 'Add Log' button re-disabled during AJAX call.");
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
                        log_created_by: frappe.session.user
                    }
                },
                callback: function(r) {
                    if (r.message) {
                        console.log("TASK JS: Task Log created and submitted successfully:", r.message.name);
                        frappe.show_alert({
                            message: __('Task Log ') + r.message.name + __(' created and submitted successfully!'),
                            indicator: 'green'
                        }, 5);
                        taskLogDialogInstance.hide();
                        frm.reload_doc(); // Reload the parent Task form after log creation
                    } else if (r.exc) {
                        console.error("TASK JS: Error creating Task Log:", r.exc);
                        // The error message from the server can be very long due to the traceback
                        // Limit what we display in the alert
                        let error_msg = __('Error creating Task Log. Please check server logs.');
                        if (r._server_messages) {
                            try {
                                let server_messages = JSON.parse(r._server_messages);
                                if (Array.isArray(server_messages) && server_messages.length > 0) {
                                    // Try to find a more readable part of the message
                                    let first_message = JSON.parse(server_messages[0]).message;
                                    // Look for the specific length exceeded error message
                                    const match = first_message.match(/'Title' \((.*?)\) will get truncated/);
                                    if (match && match[1]) {
                                        error_msg = __('Error in log title: ') + match[1].substring(0, 100) + '...'; // Truncate further
                                    } else {
                                        error_msg = first_message.substring(0, 200) + '...'; // General truncation
                                    }
                                }
                            } catch (e) {
                                console.error("TASK JS: Failed to parse server messages for display:", e);
                            }
                        }
                        frappe.show_alert({
                            message: error_msg,
                            indicator: 'red'
                        }, 10); // Show for longer as it's an error
                    }
                },
                error: function(r) {
                    console.error("TASK JS: Network or server error creating Task Log:", r);
                    frappe.show_alert({
                        message: __('Network or server error while creating Task Log.'),
                        indicator: 'red'
                    }, 5);
                },
                always: function() {
                    console.log("TASK JS: AJAX call for Task Log insert finished. Re-enabling 'Add Log' button.");
                    if (addLogButtonElement) {
                        addLogButtonElement.attr('disabled', false);
                        addLogButtonElement.removeClass('disabled');
                    }
                }
            });
        },
        on_hide: function() {
            console.log("TASK JS: Task Log dialog hidden. Clearing global instance and re-enabling button.");
            taskLogDialogInstance = null;
            if (addLogButtonElement) {
                addLogButtonElement.attr('disabled', false);
                addLogButtonElement.removeClass('disabled');
            }
        }
    });
    taskLogDialogInstance.show();
}

function setCreatorAndModifierNames(frm) {
    console.log("TASK JS: Setting Creator and Modifier Names.");
    fetchUserName(frm, frm.doc.owner, 'created_by', "Creator");
    fetchUserName(frm, frm.doc.modified_by, 'last_modified_by', "Modifier");
}

function fetchUserName(frm, userName, fieldName, logPrefix) {
    if (userName) {
        console.log(`TASK JS: Fetching ${logPrefix} name via server method for: `, userName);
        frappe.call({
            method: 'nex.projects.doctype.task.task.get_user_full_name',
            args: { user_id: userName },
            callback: function(r) {
                if (r.message !== undefined && r.message !== null) {
                    console.log(`TASK JS: ${logPrefix} name fetched: `, r.message);
                    frm.set_value(fieldName, r.message);
                    // Removed auto-save here, it's generally not a good practice for display fields
                    // if (!frm.doc.__islocal && frm.is_dirty()) { // This condition likely incorrect for this use case
                    //     console.log(`TASK JS: Auto-saving form after setting ${fieldName} for existing document.`);
                    //     frm.save();
                    // }
                } else {
                    console.log(`TASK JS: No ${logPrefix.toLowerCase()} full name found via server, or error. Falling back to ID.`);
                    frm.set_value(fieldName, userName);
                }
            },
            error: function(r) {
                console.error(`TASK JS: Error fetching ${logPrefix} name via server method:`, r);
                frm.set_value(fieldName, userName);
            }
        });
    } else {
        console.log(`TASK JS: No ${logPrefix.toLowerCase()} found in document.`);
        frm.set_value(fieldName, "");
    }
}

function setupTooltips(frm) {
    if (frm.wrapper) {
        $(frm.wrapper).find('[data-tooltip]').tooltip('dispose');

        let icons = $(frm.wrapper).find('[data-tooltip]');
        icons.each(function(){
            $(this).tooltip({
                title: $(this).data('tooltip'),
                placement: 'top'
            });
        });
        console.log("TASK JS: Tooltips set up.");
    }
}
