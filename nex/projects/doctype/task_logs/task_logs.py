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
                latest_sequence = int(latest_name.split("-LOG-")[1])
                new_sequence = latest_sequence + 1
            except (IndexError, ValueError):
                new_sequence = 1

        self.name = f"{task_id}-LOG-{new_sequence:03d}"

    def validate(self):
        """
        Validates the Task Log document before saving.
        """
        # Ensure log_description is not empty if it's required
        if not self.log_description:
            frappe.throw(_("Log Description is required."))

    def on_submit(self):
        """
        Updates the status of the associated Task when the Task Log is submitted.
        This version checks for a special 'System Log' status or specific description keywords
        to prevent status updates for auto-generated logs (like child added/removed).
        """
        frappe.log_error(f"Task Log {self.name}: Entering on_submit hook.", "Task Log On Submit Hook")
        
        # Define statuses or description keywords that indicate a system-generated log
        # that should NOT change the parent Task's status.
        SYSTEM_LOG_STATUSES = ["System Log"] # This status MUST exist in your Task Logs DocType's 'status' field options
        SYSTEM_LOG_DESCRIPTION_KEYWORDS = ["Child Task Added:", "Child Task Removed:", "Task authorization changed by system."]

        is_system_log = False
        if self.status in SYSTEM_LOG_STATUSES:
            is_system_log = True
        else:
            for keyword in SYSTEM_LOG_DESCRIPTION_KEYWORDS:
                if keyword in self.log_description:
                    is_system_log = True
                    break

        if self.task_id and self.status and not is_system_log:
            try:
                task_doc = frappe.get_doc("Task", self.task_id)
                # Only update if the status is genuinely different to avoid unnecessary saves/hooks
                if task_doc.status != self.status:
                    task_doc.status = self.status
                    task_doc.save(ignore_permissions=False) # This will trigger Task's after_save for progress update
                    frappe.log_error(f"Task Log {self.name}: Parent Task {self.task_id} status updated to '{self.status}' via Task's save method.", "Task Log On Submit Success")
                else:
                    frappe.log_error(f"Task Log {self.name}: Task {self.task_id} status already '{self.status}'. No change needed.", "Task Status No Change")
            except Exception as e:
                error_message = f"Task Log {self.name}: Failed to update parent Task {self.task_id} status: {e}"
                frappe.log_error(error_message, "Task Log On Submit Error")
                frappe.throw(_(error_message))
        elif is_system_log:
            frappe.log_error(f"Task Log {self.name}: System log detected. Skipping parent Task status update.", "System Log Skipped Status Update")
        else:
            frappe.log_error(f"Task Log {self.name}: No task_id or status, or already a system log. No status update for parent.", "No Update Condition Met")

# --- NEW WHITELISTED METHOD: For creating logs without status update ---
@frappe.whitelist()
def create_task_log_without_status_update(task_id, log_description):
    """
    Creates a Task Log entry without triggering a status update on the associated Task.
    This is useful for system-generated logs like child task additions/removals, or authorization changes.
    It uses a neutral 'System Log' status which is then ignored by the on_submit hook.
    """
    if not task_id or not log_description:
        frappe.throw(_("Task ID and Log Description are required to create a system log."))

    try:
        new_log = frappe.get_doc({
            "doctype": "Task Logs",
            "task_id": task_id,
            "log_description": log_description,
            "status": "System Log", # Use a specific status to mark it as a system log (must exist in Task Logs options)
            "log_date": frappe.utils.nowdate(),
            "log_time": frappe.utils.now_time(),
            "log_created_by": frappe.session.user # Logs created by the current user
        })
        # Insert and submit the log. The on_submit hook will check for "System Log" status
        # and prevent the parent task's status from changing.
        new_log.insert(ignore_permissions=True, ignore_hooks=True) # Ignore hooks to prevent recursive calls if Task Logs had other hooks
        new_log.submit() # Submit to set docstatus
        frappe.db.commit() # Ensure the log is committed immediately
        frappe.log_error(f"Task Log (System): Created for Task {task_id}: {log_description}", "System Log Created Successfully")
        return new_log.name
    except Exception as e:
        frappe.log_error(f"Task Log (System): Failed to create system log for Task {task_id}: {e}", "System Log Creation Error")
        frappe.throw(_(f"Failed to create system task log: {e}"))