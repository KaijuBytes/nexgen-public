# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

from frappe import _
import frappe
from frappe.model.document import Document
import frappe.utils # Required for frappe.utils.get_url

class Task(Document):
    def before_save(self):
        """
        Validate that a parent task cannot be completed if it has incomplete child tasks.
        Restrict that ONLY users with the 'Projects Manager' role can change the status to 'Completed' (from any previous status).
        This hook runs just before the document is saved (inserted or updated).
        """
        doc_before_save = self.get_doc_before_save() # Get the document's state before the current save operation
        
        # Feature: Only Projects Managers can change status to 'Completed'
        # This check should only run if the status is genuinely changing TO 'Completed'
        # (i.e., it wasn't 'Completed' before, or it's a new document being set to 'Completed')
        if self.status == 'Completed' and (not doc_before_save or doc_before_save.status != 'Completed'):
            current_user_roles = frappe.get_roles(frappe.session.user)
            is_projects_manager = 'Projects Manager' in current_user_roles
            
            # A user can complete the task ONLY if they are a Projects Manager
            can_complete_task = is_projects_manager 

            # Log message for debugging in the Error Log (internal)
            frappe.log_error(f"Task {self.name}: Status change to '{self.status}' by '{frappe.session.user}'. PM: {is_projects_manager}, Can Complete: {can_complete_task}", "Task Status Change Validation")

            if not can_complete_task: # If not a PM, throw an error
                # User-facing error message
                frappe.throw(_("You do not have authority to change the Status to Completed."))

            # Feature: Validation for incomplete child tasks (only applies if attempting to complete parent)
            incomplete_child_tasks = frappe.get_list(
                "Task",
                filters={
                    "parent_task": self.name,
                    "status": ["!=", "Completed"]
                },
                fields=["name", "subject", "status"]
            )

            if incomplete_child_tasks:
                linked_tasks_html = []
                for t in incomplete_child_tasks:
                    task_url = frappe.utils.get_url(f"/app/task/{t.name}")
                    linked_tasks_html.append(f"- <a href='{task_url}'>{t.subject} ({t.name})</a> [Status: {t.status}]")

                formatted_task_list = "<br>".join(linked_tasks_html)
                frappe.throw(
                    msg=_("Cannot complete Task '{0}' because it has the following incomplete child tasks:<br>{1}").format(
                        self.subject, formatted_task_list
                    ),
                    title=_("Validation Error")
                )
            
            # The logic to create and submit Task Logs when status is changed to 'Completed'
            # by a Projects Manager was previously here but has been removed to prevent deadlocks.
            # This action is now handled entirely on the client-side via JavaScript when
            # the "Complete" button is clicked, and the TaskLogs.on_submit hook updates the Task status.

        elif self.status == 'Open' and doc_before_save and doc_before_save.status != 'Open':
            # This is a specific check for when a task is moved to 'Open' status
            # No specific restrictions on setting to 'Open' from other statuses here.
            pass


    def before_insert(self):
        """
        Automatically authorize the Task if its creator (owner) has the 'Projects Manager' role.
        Also, notify Project Managers if a non-manager Project User creates a task that needs authorization.
        """
        frappe.log_error(f"Task {self.name}: Entering before_insert hook.")
        frappe.log_error(f"Task {self.name}: Current authorized status: {self.authorized}")

        # This block only applies if the task is not yet authorized (e.g., on initial creation)
        if not self.authorized:
            creator_roles = frappe.get_roles(self.owner)
            is_projects_manager = 'Projects Manager' in creator_roles

            frappe.log_error(f"Task {self.name}: Creator '{self.owner}'. Is PM? {is_projects_manager}")

            if is_projects_manager:
                self.authorized = 1
                self.status = 'Open' # Tasks created by PM are authorized and start as 'Open'
                frappe.log_error(f"Task {self.name} automatically authorized by {self.owner} upon creation.")
            else:
                is_project_user = 'Project User' in creator_roles
                
                frappe.log_error(f"Task {self.name}: Is creator a Project User (and not PM)? {is_project_user}")

                if is_project_user:
                    manager_users = frappe.get_users_by_role("Projects Manager")
                    
                    frappe.log_error(f"Task {self.name}: Found {len(manager_users)} Project Manager users for notification.")

                    if manager_users:
                        creator_full_name = frappe.db.get_value('User', self.owner, 'full_name') or self.owner
                        notification_subject = _("Task Needs Authorization: {0}").format(self.subject)
                        notification_message = _("Task '{0}' ({1}) was created by '{2}' (a Project User) and requires authorization. Please review and authorize the task.").format(
                            self.subject,
                            self.name,
                            creator_full_name
                        )
                        task_url = frappe.utils.get_url(f"/app/task/{self.name}")
                        notification_message += f"<br><a href='{task_url}'>{_('Go to Task')}</a>"
                        
                        for manager_user_email in manager_users:
                            frappe.send_notification(
                                recipients=[manager_user_email], 
                                doctype=self.doctype,
                                name=self.name,
                                subject=notification_subject,
                                message=notification_message,
                                notification_type='Alert', # Ensures it appears in alerts
                            )
                            frappe.log_error(f"Task {self.name}: Notification sent to '{manager_user_email}'.")
                        frappe.log_error(f"Task {self.name}: Notification process completed.")
                    else:
                        frappe.log_error(f"Task {self.name}: No active Project Manager users found to send notification.")
                else:
                    frappe.log_error(f"Task {self.name}: Creator '{self.owner}' is neither Project Manager nor Project User. No notification required.")
        else:
            frappe.log_error(f"Task {self.name}: Task was already authorized (skipped notification logic).")

    @frappe.whitelist()
    def authorize_task_button_action(self):
        """
        Method to set the 'authorized' checkbox to true.
        This method will be called by the 'Authorize' button.
        """
        if "Projects Manager" in frappe.get_roles(frappe.session.user):
            if not self.authorized:
                self.authorized = 1
                # self.status = 'Completed' # This line no longer auto-completes the task
                self.save() # This triggers the before_save hook for validation
            else:
                pass # Already authorized
        else:
            frappe.throw(_("You do not have permission to authorize this task."))

    @frappe.whitelist()
    def unauthorize_task_button_action(self):
        """
        Method to set the 'authorized' checkbox to false.
        This method will be called by the the 'Unauthorize' button.
        """
        if "Projects Manager" in frappe.get_roles(frappe.session.user):
            if self.authorized:
                self.authorized = 0
                # When unauthorizing, consider what status it should revert to.
                # For now, just unauthorize without changing status.
                # If you want to change status (e.g., to 'Open' or 'Cancelled'), add:
                # self.status = 'Open' # or 'Cancelled'
                self.db_update() # Use db_update to save without triggering full hooks if no other changes
            else:
                pass # Already unauthorized
        else:
            frappe.throw(_("You do not have permission to unauthorize this task."))

@frappe.whitelist()
def get_user_full_name(user_id):
    """
    Fetches the full name of a user from the server-side.
    This method is whitelisted so it can be called from client-side JS.
    It runs with server-side permissions, allowing access to User doctype data.
    """
    if not user_id:
        return None

    full_name = frappe.db.get_value("User", user_id, "full_name")
    return full_name
