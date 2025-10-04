# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import frappe.utils # Required for frappe.utils.get_url
from frappe import _
from frappe.utils.nestedset import NestedSet
import requests

class Task(NestedSet):
    def before_save(self):
        frappe.log_error(f"Task: before_save for {self.name} (is_new: {self.is_new()})", "Task Lifecycle")
        doc_before_save = self.get_doc_before_save()

        # Feature: Only Projects Managers can change status to 'Completed'
        # And validate that a parent task cannot be completed if it has incomplete child tasks.
        if self.status == 'Completed' and (not doc_before_save or doc_before_save.status != 'Completed'):
            frappe.log_error(f"Task: {self.name} status changing to 'Completed'. Checking permissions.", "Task Completion Flow")
            current_user_roles = frappe.get_roles(frappe.session.user)
            is_projects_manager = 'Projects Manager' in current_user_roles

            can_complete_task = is_projects_manager

            frappe.log_error(f"Task: User '{frappe.session.user}' can complete: {can_complete_task} (Is PM: {is_projects_manager})", "Task Completion Validation")

            if not can_complete_task:
                frappe.log_error(f"Task: User '{frappe.session.user}' attempted to complete {self.name} without 'Projects Manager' role.", "Permission Denied")
                frappe.throw(_("You do not have authority to change the Status to Completed."))

            # Check for incomplete child tasks if it's a group task
            if self.is_group: # Only group tasks have children
                incomplete_child_tasks = frappe.get_list(
                    "Task",
                    filters={
                        "parent_task": self.name,
                        "status": ["!=", "Completed"]
                    },
                    fields=["name", "subject", "status"]
                )

                if incomplete_child_tasks:
                    frappe.log_error(f"Task: {self.name} has {len(incomplete_child_tasks)} incomplete child tasks. Blocking completion.", "Incomplete Children")
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
                else:
                    frappe.log_error(f"Task: {self.name} has no incomplete child tasks. Proceeding with completion.", "Child Task Check Success")

        elif self.status == 'Open' and doc_before_save and doc_before_save.status != 'Open':
            frappe.log_error(f"Task: {self.name} status changed to 'Open'.", "Status Change Info")
            pass # No special action needed when status changes to 'Open'

        # Calculate its own progress if it's a group task and being saved.
        # This catches direct saves of group tasks where children might have been added/removed.
        if self.is_group:
            frappe.log_error(f"Task: {self.name} is a group task. Calculating its own progress in before_save.", "Progress Calculation Trigger")
            self.calculate_and_set_progress() # Sets self.progress
        else:
            frappe.log_error(f"Task: {self.name} is NOT a group task. Skipping its own progress calculation in before_save.", "Progress Calculation Skipped")

    def after_save(self):
        frappe.log_error(f"Task: after_save for {self.name} (is_new: {self.is_new()})", "Task Lifecycle")
        doc_before_save = self.get_doc_before_save()

        current_parent_task = self.parent_task
        old_parent_task = doc_before_save.parent_task if doc_before_save else None

        frappe.log_error(f"Task: {self.name} - current_parent: {current_parent_task}, old_parent: {old_parent_task}", "Parent Change Detection")

        # Scenario A: This task is a child task that was created, updated, or its parent changed.
        # This will trigger an update for its parent (and potentially old parent).

        # 1. New child task created with a parent
        if self.is_new() and current_parent_task:
            frappe.log_error(f"Task: After Save - New child {self.name}. Triggering parent '{current_parent_task}' progress update.", "Child Task Created Flow")
            self.update_parent_progress(current_parent_task)

            # --- NEW LOGGING: Child Added ---
            # Call the new whitelisted function to create a log without status change
            frappe.call(
                "nex.projects.doctype.task_logs.task_logs.create_task_log_without_status_update",
                task_id=current_parent_task,
                log_description=f"Child Task Added: '{self.subject}' ({self.name})."
            )
            frappe.log_error(f"Task: Logged 'Child Task Added' for parent {current_parent_task}", "Child Added Log")

        # 2. Child task's parent has changed
        elif current_parent_task and old_parent_task and old_parent_task != current_parent_task:
            frappe.log_error(f"Task: After Save - {self.name} parent changed from '{old_parent_task}' to '{current_parent_task}'.", "Parent Task Changed Flow")
            self.update_parent_progress(current_parent_task) # Update new parent
            self.update_parent_progress(old_parent_task) # Update old parent

            # --- NEW LOGGING: Child Added to New Parent ---
            frappe.call(
                "nex.projects.doctype.task_logs.task_logs.create_task_log_without_status_update",
                task_id=current_parent_task,
                log_description=f"Child Task Added: '{self.subject}' ({self.name})."
            )
            frappe.log_error(f"Task: Logged 'Child Task Added' for new parent {current_parent_task}", "Child Added Log on Parent Change")

            # --- NEW LOGGING: Child Removed from Old Parent ---
            frappe.call(
                "nex.projects.doctype.task_logs.task_logs.create_task_log_without_status_update",
                task_id=old_parent_task,
                log_description=f"Child Task Removed: '{self.subject}' ({self.name})."
            )
            frappe.log_error(f"Task: Logged 'Child Task Removed' for old parent {old_parent_task}", "Child Removed Log on Parent Change")

        # 3. Existing child task updated (and still has the same parent) - triggered by status change
        elif current_parent_task and doc_before_save and old_parent_task == current_parent_task and self.status != doc_before_save.status:
            frappe.log_error(f"Task: After Save - Existing child {self.name} status updated. Triggering parent '{current_parent_task}' progress update.", "Existing Child Task Status Update Flow")
            self.update_parent_progress(current_parent_task)

        # Scenario B: This task IS a group task and its own progress needs to be broadcasted.
        # This is for when child tasks are added/removed *via the child table on this parent's form*,
        # or if it's a newly created group task.
        if self.is_group:
            frappe.log_error(f"Task: After Save - Group task {self.name} processed. Publishing its progress: {self.progress:.2f}%", "Group Task Publish Flow")
            frappe.publish_realtime(
                "task_progress_update", # Event name
                message={
                    "doctype": "Task",
                    "name": self.name,
                    "progress": self.progress
                },
                user=frappe.session.user, # Only send to the current user (if logged in and active)
                after_commit=True # Ensure event is published only after DB transaction is committed
            )
            frappe.log_error(f"Task: After Save for {self.name} completed. (Group task, published self-progress)", "After Save End")
        else:
            frappe.log_error(f"Task: After Save for {self.name} completed. (Not a group task, no self-publishing)", "After Save End")


    def update_parent_progress(self, parent_task_name):
        """
        Updates the progress of a given parent task based on its children's statuses.
        Publishes a real-time event for UI update.
        """
        if parent_task_name:
            frappe.log_error(f"Task: Attempting to update progress for parent: {parent_task_name}", "Update Parent Progress Function")
            try:
                parent_doc = frappe.get_doc("Task", parent_task_name)
                # Ensure it's a group task before calculating child-based progress
                if parent_doc.is_group:
                    parent_doc.calculate_and_set_progress()
                    parent_doc.save(ignore_permissions=True, ignore_validate=True) # Save the parent with updated progress
                    # Removed: frappe.db.commit() # Let Frappe handle transaction commit

                    # Publish a real-time event to update the client-side form if it's open
                    frappe.publish_realtime(
                        "task_progress_update", # Event name
                        message={
                            "doctype": "Task",
                            "name": parent_task_name,
                            "progress": parent_doc.progress # Send the updated progress value
                        },
                        user=frappe.session.user, # Only send to the current user (if logged in and active)
                        after_commit=True # Ensure event is published only after DB transaction is committed
                    )
                    frappe.log_error(f"Task: Published realtime event for parent {parent_task_name} progress update.", "Realtime Event")
                else:
                    frappe.log_error(f"Task: Parent {parent_task_name} is not a group task. Skipping progress calculation.", "Parent Not Group Task")

            except Exception as e:
                error_message = f"Task: Error updating parent {parent_task_name} progress for {self.name}: {str(e)}"
                frappe.log_error(error_message, "Parent Task Progress Update Error")

    def before_insert(self):
        """
        Sets 'authorized' and 'status' for new tasks based on the creator's role.
        Notifies Projects Managers if a Project User creates an unauthorized task.
        """
        frappe.log_error(f"Task: Entering before_insert hook for {self.name}.", "Before Insert Hook")
        if not self.authorized:
            creator_roles = frappe.get_roles(self.owner)
            is_projects_manager = 'Projects Manager' in creator_roles
            frappe.log_error(f"Task: {self.name}: Creator '{self.owner}'. Is PM? {is_projects_manager}", "Before Insert Auth Check")

            if is_projects_manager:
                self.authorized = 1
                self.status = 'Open' # Default status for new authorized tasks
                frappe.log_error(f"Task: {self.name} automatically authorized by {self.owner}.", "Auto Authorization")
            else:
                is_project_user = 'Project User' in creator_roles
                frappe.log_error(f"Task: {self.name}: Is creator a Project User (and not PM)? {is_project_user}", "Before Insert Auth Check")

                if is_project_user:
                    manager_users = frappe.get_users_by_role("Projects Manager")
                    if manager_users:
                        frappe.log_error(f"Task: {self.name}: Found {len(manager_users)} PMs for notification.", "Notification Check")
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
                                notification_type='Alert',
                            )
                            frappe.log_error(f"Task: Notification sent to '{manager_user_email}' for {self.name}.", "Notification Sent")
                        frappe.log_error(f"Task: Notification process completed for {self.name}.", "Notification Process End")
                    else:
                        frappe.log_error(f"Task: {self.name}: No active PMs found to send notification.", "No Managers Found")
                else:
                    frappe.log_error(f"Task: {self.name}: Creator '{self.owner}' is neither PM nor Project User. Task will remain unauthorized.", "No Auth/Project User")
        else:
            frappe.log_error(f"Task: {self.name}: Task already authorized.", "Already Authorized")

    @frappe.whitelist()
    def authorize_task_button_action(self):
        """
        Method to set the 'authorized' checkbox to true.
        This method will be called by the 'Authorize' button.
        """
        frappe.log_error(f"Task: authorize_task_button_action called for {self.name}", "Whitelist Call")
        if "Projects Manager" in frappe.get_roles(frappe.session.user):
            if not self.authorized:
                self.authorized = 1
                self.save() # Triggers after_save
                # Log authorization change using the new system log function
                frappe.call(
                    "nex.projects.doctype.task_logs.task_logs.create_task_log_without_status_update",
                    task_id=self.name,
                    log_description=f"Task authorization changed by system. Authorized by {frappe.session.user_fullname}."
                )
                frappe.log_error(f"Task: {self.name} authorized via button.", "Authorization Success")
            else:
                frappe.log_error(f"Task: {self.name} already authorized.", "Authorization Skipped")
        else:
            frappe.log_error(f"Task: User '{frappe.session.user}' attempted to authorize {self.name} without 'Projects Manager' role.", "Permission Denied")
            frappe.throw(_("You do not have permission to authorize this task."))

    @frappe.whitelist()
    def unauthorize_task_button_action(self):
        """
        Method to set the 'authorized' checkbox to false.
        This method will be called by the the 'Unauthorize' button.
        """
        frappe.log_error(f"Task: unauthorize_task_button_action called for {self.name}", "Whitelist Call")
        if "Projects Manager" in frappe.get_roles(frappe.session.user):
            if self.authorized:
                self.authorized = 0
                self.db_update() # Use db_update to save without triggering full hooks if no other changes are intended
                # Log unauthorization change using the new system log function
                frappe.call(
                    "nex.projects.doctype.task_logs.task_logs.create_task_log_without_status_update",
                    task_id=self.name,
                    log_description=f"Task authorization changed by system. Unauthorized by {frappe.session.user_fullname}."
                )
                frappe.log_error(f"Task: {self.name} unauthorized via button.", "Unauthorization Success")
            else:
                frappe.log_error(f"Task: {self.name} already unauthorized.", "Unauthorization Skipped")
        else:
            frappe.log_error(f"Task: User '{frappe.session.user}' attempted to unauthorize {self.name} without 'Projects Manager' role.", "Permission Denied")
            frappe.throw(_("You do not have permission to unauthorize this task."))

    def calculate_and_set_progress(self):
        """
        Calculates the progress of a group task based on its child tasks.
        Sets the 'progress' field of the current task.
        """
        frappe.log_error(f"Task: calculate_and_set_progress called for {self.name}", "Progress Calculation Method")
        if not self.is_group:
            frappe.log_error(f"Task: {self.name}: Not a group task, skipping progress calculation.", "Progress Calculation Skipped")
            return

        child_tasks = frappe.get_list(
            "Task",
            filters={"parent_task": self.name},
            fields=["name", "status"]
        )
        frappe.log_error(f"Task: {self.name}: Found {len(child_tasks)} child tasks.", "Progress Calculation Data Fetch")

        if not child_tasks:
            self.progress = 0.0
            frappe.log_error(f"Task: {self.name}: No child tasks, progress set to 0.", "Progress Calculation Zero")
            return

        total_children = len(child_tasks)
        completed_children = sum(1 for t in child_tasks if t.status == "Completed")

        if total_children > 0:
            self.progress = (completed_children / total_children) * 100
        else:
            self.progress = 0.0

        frappe.log_error(f"Task: {self.name}: Progress calculated: {self.progress:.2f}% ({completed_children}/{total_children} completed).", "Progress Calculation Success")

@frappe.whitelist()
def get_user_full_name(user_id):
    """
    Fetches the full name of a user from the server-side.
    This method is whitelisted so it can be called from client-side JS.
    It runs with server-side permissions, allowing access to User doctype data.
    """
    if not user_id:
        frappe.log_error("Task: get_user_full_name called with no user_id.", "Whitelist Call")
        return None

    full_name = frappe.db.get_value("User", user_id, "full_name")
    frappe.log_error(f"Task: get_user_full_name for '{user_id}' returned '{full_name}'.", "Whitelist Call Result")
    return full_name

def on_doctype_update():
    frappe.db.add_index("Task", ["lft", "rgt"])


@frappe.whitelist()
def get_ai_task_summary(task_name):
    """
    Uses locally installed Ollama (running on http://localhost:11434) to summarize the Task and its Task Logs.
    Returns a summary string in HTML bullet-point format for easy viewing.
    """

    if not task_name:
        frappe.throw(_("Task name is required."))

    # Fetch the task document
    task = frappe.get_doc("Task", task_name)
    # Fetch related task logs (assuming doctype Task Logs with field task_id)
    logs = frappe.get_all(
        "Task Logs",
        filters={"task_id": task_name},
        fields=["creation", "log_description"],
        order_by="creation asc"
    )

    # Prepare context for the AI model
    task_info = (
        f"Task: {task.subject}\n"
        f"Status: {task.status}\n"
        f"Progress: {getattr(task, 'progress', '')}%\n"
        f"Description: {task.get('description', '')}\n"
    )
    logs_info = "\n".join([f"{l['creation']}: {l['log_description']}" for l in logs])
    prompt = (
        "Summarize the following task and its activity logs for a project manager. "
        "Present the summary as HTML bullet points, using ':' after each field name. "
        "First, list Task Info (Subject, Status, Progress, Description), each as a bullet. "
        "Then, under 'Task Logs:', list each log as a bullet with date and description. "
        "If there are no logs, show a bullet: 'No logs available'. "
        "Do not include any text outside the bullet list.\n\n"
        f"{task_info}\nTask Logs:\n{logs_info}"
    )

    ollama_url = "http://127.0.0.1:11434/api/generate"

    payload = {
        "model": "llama3.2:1b",
        "prompt": prompt,
        "stream": False
    }

    try:
        response = requests.post(ollama_url, json=payload, timeout=60)
        try:
            response.raise_for_status()
        except requests.HTTPError as http_err:
            try:
                error_detail = response.json().get("error") or response.text
            except Exception:
                error_detail = response.text
            frappe.log_error(f"Ollama API HTTP error: {str(http_err)} | Detail: {error_detail}", "get_ai_task_summary")
            summary = _("AI summary service returned an error: {0}").format(error_detail)
            return summary
        data = response.json()
        summary = data.get("response") or data.get("message") or _("No summary generated.")
    except Exception as e:
        frappe.log_error(f"Ollama API error: {str(e)}", "get_ai_task_summary")
        summary = _("AI summary service is currently unavailable. Please try again later.")

    return summary
