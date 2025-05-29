# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class TaskLogs(Document):
    def autoname(self):
        """
        Generates a unique name for the Task Log based on its associated Task ID.
        Format: TASK-XXXX-XXXX-LOG-001
        """
        task_id = self.task_id
        if not task_id:
            # If task_id is not set, raise an error as it's crucial for naming
            frappe.throw(_("Task ID is required for Task Log naming."))

        latest_doc = frappe.db.sql(
            """
            SELECT name
            FROM "tabTask Logs"
            WHERE task_id = %s AND name LIKE %s
            ORDER BY name DESC
            LIMIT 1
            """,
            (task_id, f"%{task_id}-LOG-%"),
            as_dict=True,
        )

        new_sequence = 1
        if latest_doc:
            latest_name = latest_doc[0]["name"]
            try:
                # Extract the sequence number from the latest name
                latest_sequence = int(latest_name.split("-LOG-")[1])
                new_sequence = latest_sequence + 1
            except (IndexError, ValueError):
                # Fallback if parsing fails, start from 1
                new_sequence = 1

        self.name = f"{task_id}-LOG-{new_sequence:03d}"

    def validate(self):
        """
        Validates the Task Log document before saving.
        Role-based validation for 'Completed' status is now handled exclusively
        in the Task DocType's before_save hook.
        """
        # No specific role-based validation here anymore.
        # Any validation for setting Task status to 'Completed' will occur
        # when the parent Task document is updated by this Task Log's on_submit hook.
        pass

    def on_submit(self):
        """
        This hook runs when a Task Log document is submitted.
        It updates the parent Task's status based on the Task Log's status.
        The parent Task document is loaded, its status is set, and then saved
        to ensure its own hooks (like before_save) are triggered for validation.
        """
        if self.task_id:
            try:
                # Load the Task document
                task_doc = frappe.get_doc("Task", self.task_id)

                # Update the status
                task_doc.status = self.status

                # Save the Task document. This will trigger its own before_save/validate hooks.
                task_doc.save(ignore_permissions=False) # Keep ignore_permissions=False to respect Task's permissions/validation

                frappe.log_error(f"Task Log {self.name}: Parent Task {self.task_id} status updated to '{self.status}' via Task's save method.", "Task Log On Submit Success")
            except Exception as e:
                # If saving the Task fails (e.g., due to validation in Task's before_save),
                # the Task Log submission should ideally be rolled back or an error should be clearly shown.
                # In Frappe, if an exception is raised in an on_submit hook, the entire transaction is usually rolled back.
                error_message = f"Task Log {self.name}: Failed to update parent Task {self.task_id} status: {e}"
                frappe.log_error(error_message, "Task Log On Submit Error")
                # Re-raise the exception to prevent the Task Log from being submitted if the Task update fails.
                frappe.throw(_(error_message))

    # You can add other standard Frappe hooks here if needed, e.g.:
    # def before_insert(self):
    #     pass

    # def on_update(self):
    #     pass

    # def on_cancel(self):
    #     pass